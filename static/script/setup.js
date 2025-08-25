// web-app CAA/public/script/setup.js

document.addEventListener('DOMContentLoaded', () => {
    const optionsContainer = document.getElementById('grid-options');
    const confirmBtn = document.getElementById('confirm-setup');
    let selectedOption = null;

    // --- FIX: Read credentials from URL to determine if this is a new registration ---
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get('username');
    const password = urlParams.get('password');
    const editorPassword = urlParams.get('editorPassword');
    const isNewUser = username && password && editorPassword;

    const gridOptions = [
        { id: 'simplified', name: 'Semplificata', description: 'Meno opzioni, ideale per chi si avvicina per la prima volta alla CAA.', icon: 'https://api.arasaac.org/api/pictograms/32434' },
        { id: 'default', name: 'Standard', description: 'Una selezione bilanciata di categorie e simboli per iniziare.', icon: 'https://api.arasaac.org/api/pictograms/32436' },
        { id: 'empty', name: 'Avanzata', description: 'Inizia da zero e costruisci la tua griglia personalizzata.', icon: 'https://api.arasaac.org/api/pictograms/3046' }
    ];

    gridOptions.forEach(option => {
        const optionEl = document.createElement('div');
        optionEl.className = 'grid-option';
        optionEl.dataset.gridId = option.id;
        optionEl.innerHTML = `
            <img src="${option.icon}" alt="${option.name}">
            <h3>${option.name}</h3>
            <p class="description">${option.description}</p>
        `;
        optionEl.addEventListener('click', () => {
            document.querySelectorAll('.grid-option').forEach(el => el.classList.remove('selected'));
            optionEl.classList.add('selected');
            selectedOption = option.id;
            confirmBtn.disabled = false;
        });
        optionsContainer.appendChild(optionEl);
    });

    confirmBtn.addEventListener('click', async () => {
        if (!selectedOption) return;

        // --- FIX: Logic is now split based on whether it's a new user or not ---
        if (isNewUser) {
            // New user registration and setup flow
            try {
                const response = await fetch(`${API_BASE_URL}/api/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username,
                        password,
                        editorPassword,
                        gridType: selectedOption
                    }),
                });

                if (response.status === 201) {
                    const { token, status } = await response.json(); // Get status from response
                    localStorage.setItem('jwt_token', token);
                    // FIX: Check the status here to set the first login flag
                    if (status === 'pending_setup') {
                        localStorage.setItem('isFirstLogin', 'true');
                    }
                    alert('Registrazione e configurazione completate! Verrai reindirizzato alla pagina principale.');
                    window.location.href = '/';
                } else {
                    const error = await response.json();
                    alert(`Errore di registrazione: ${error.message}`);
                }
            } catch (error) {
                console.error('Errore durante la registrazione e configurazione:', error);
                alert('Si è verificato un errore di rete. Riprova.');
            }
        } else {
            // This is the old flow for an existing, logged-in user changing their grid
            try {
                const token = localStorage.getItem('jwt_token');
                if (!token) {
                    alert('Errore di autenticazione. Effettua il login.');
                    window.location.href = '/login';
                    return;
                }

                const response = await fetch(`${API_BASE_URL}/api/setup`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ gridType: selectedOption }),
                });

                if (response.ok) {
                    alert('Configurazione aggiornata! Verrai reindirizzato alla pagina principale.');
                    window.location.href = '/';
                } else {
                    const errorText = await response.text();
                    let errorMessage = `Errore del server: ${response.status}`;
                    try {
                        const errorJson = JSON.parse(errorText);
                        if (errorJson.message) {
                            errorMessage = errorJson.message;
                        }
                    } catch (e) {
                        if (errorText && errorText.length < 100) {
                            errorMessage = errorText;
                        }
                    }
                    alert(`Errore durante la configurazione: ${errorMessage}`);
                }
            } catch (error) {
                console.error('Errore durante la configurazione:', error);
                alert('Si è verificato un errore di rete. Riprova.');
            }
        }
    });
});