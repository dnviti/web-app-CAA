document.addEventListener('DOMContentLoaded', () => {
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const editorPasswordInput = document.getElementById('editorPassword');
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');

    const handleLogin = async () => {
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        if (!username || !password) {
            alert('Per favore, inserisci username e password.');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            if (response.ok) {
                const { token, status } = await response.json();
                localStorage.setItem('jwt_token', token);
                // If the user's status is 'pending_setup', it's their first login.
                if (status === 'pending_setup') {
                    localStorage.setItem('isFirstLogin', 'true');
                }
                window.location.href = '/'; // Redirect to the main app
            } else {
                const error = await response.json();
                alert(`Errore di accesso: ${error.message}`);
            }
        } catch (error) {
            console.error('Errore durante il login:', error);
            alert('Si è verificato un errore di rete. Riprova.');
        }
    };

    const handleRegister = async () => {
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        const editorPassword = editorPasswordInput ? editorPasswordInput.value.trim() : null;

        if (!username || !password || !editorPassword) {
            alert('Per favore, inserisci username, password e editor password.');
            return;
        }
        window.location.href = `/setup?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&editorPassword=${encodeURIComponent(editorPassword)}`;
    };

    if (loginBtn) {
        loginBtn.addEventListener('click', handleLogin);
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleLogin();
        });
    }

    if (registerBtn) {
        registerBtn.addEventListener('click', handleRegister);
         passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleRegister();
        });
    }
});