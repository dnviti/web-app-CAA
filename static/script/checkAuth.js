// This script should be included in the <head> of any page that requires authentication.

(function() {
    const token = localStorage.getItem('jwt_token');

    // Simple token check: does it exist?
    // A more robust check would verify the token with the server or check its expiration.
    if (!token) {
        // If no token, redirect to login page.
        // Make sure the current page is not the login or register page to avoid a redirect loop.
        if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
            window.location.href = '/login';
        }
    }
})();

function getDecodedToken() {
    const token = localStorage.getItem('jwt_token');
    if (!token) return null;
    try {
        // Decode the payload of the JWT
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error("Failed to decode token:", e);
        return null;
    }
}
