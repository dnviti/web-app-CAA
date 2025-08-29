// Simple authentication test and repair utility
// This file will help diagnose and fix frontend auth issues

export class AuthDebugger {
  private static API_BASE = 'http://localhost:6542';

  static async clearAndTestAuth() {
    console.log('🔧 Starting authentication debug...');
    
    // Clear all storage
    localStorage.clear();
    console.log('✅ Cleared localStorage');
    
    // Test login
    const loginResult = await this.testLogin();
    if (!loginResult.success) {
      console.error('❌ Login failed:', loginResult.error);
      return false;
    }
    
    // Test authentication
    const authResult = await this.testAuth();
    if (!authResult.success) {
      console.error('❌ Auth verification failed:', authResult.error);
      return false;
    }
    
    // Test permissions
    const permResult = await this.testPermissions();
    if (!permResult.success) {
      console.error('❌ Permissions test failed:', permResult.error);
      return false;
    }
    
    console.log('✅ All authentication tests passed!');
    return true;
  }
  
  static async testLogin() {
    try {
      const response = await fetch(`${this.API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'admin',
          password: 'admin123'
        })
      });
      
      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}` };
      }
      
      const data = await response.json();
      
      if (data.token && data.refresh_token) {
        localStorage.setItem('jwt_token', data.token);
        localStorage.setItem('refresh_token', data.refresh_token);
        console.log('✅ Login successful, tokens stored');
        console.log('👤 User:', data.user.username, 'Role: checking...');
        return { success: true, user: data.user };
      }
      
      return { success: false, error: 'No tokens in response' };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  
  static async testAuth() {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
      return { success: false, error: 'No token found' };
    }
    
    try {
      const response = await fetch(`${this.API_BASE}/api/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}` };
      }
      
      const user = await response.json();
      console.log('✅ Auth verification successful');
      console.log('👤 Current user:', user.username);
      return { success: true, user };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  
  static async testPermissions() {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
      return { success: false, error: 'No token found' };
    }
    
    try {
      // Test adding a grid item (this requires grids:create permission)
      const response = await fetch(`${this.API_BASE}/api/grid/item`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          item: {
            text: 'Debug Test Item',
            type: 'text',
            color: '#ffffff',
            icon: null
          },
          parentCategory: 'main'
        })
      });
      
      if (response.status === 401) {
        return { success: false, error: 'Authentication failed - token invalid' };
      } else if (response.status === 403) {
        return { success: false, error: 'Permission denied - user lacks grids:create permission. Try logging in as admin or editor.' };
      } else if (response.ok) {
        console.log('✅ Grid item creation test successful');
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: `HTTP ${response.status}: ${errorData.error || 'Unknown error'}` };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  
  static logCurrentState() {
    const jwt = localStorage.getItem('jwt_token');
    const refresh = localStorage.getItem('refresh_token');
    
    console.log('🔍 Current Authentication State:');
    console.log('JWT Token:', jwt ? `Present (${jwt.length} chars)` : 'Missing');
    console.log('Refresh Token:', refresh ? `Present (${refresh.length} chars)` : 'Missing');
    
    if (jwt) {
      try {
        const payload = JSON.parse(atob(jwt.split('.')[1]));
        console.log('JWT Payload:', {
          user_id: payload.user_id,
          exp: new Date(payload.exp * 1000).toLocaleString(),
          iat: new Date(payload.iat * 1000).toLocaleString()
        });
      } catch (e) {
        console.log('JWT Token appears invalid');
      }
    }
  }
}

// Auto-run when included in browser
if (typeof window !== 'undefined') {
  (window as any).AuthDebugger = AuthDebugger;
  console.log('🔧 AuthDebugger loaded. Use AuthDebugger.clearAndTestAuth() to diagnose auth issues.');
}
