document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    let currentUser = null;
    let isAdmin = false;

    // --- DOM Elements ---
    const loginOverlay = document.getElementById('loginOverlay');
    const loginIdentifierInput = document.getElementById('loginIdentifier');
    const loginPasswordInput = document.getElementById('loginPassword');
    const loginButton = document.getElementById('loginButton');
    const registerUsernameInput = document.getElementById('registerUsername');
    const registerEmailInput = document.getElementById('registerEmail');
    const registerPasswordInput = document.getElementById('registerPassword');
    const registerConfirmPasswordInput = document.getElementById('registerConfirmPassword');
    const registerButton = document.getElementById('registerButton');
    const userInfo = document.getElementById('userInfo');
    const logoutButton = document.getElementById('logoutButton');
    const userList = document.getElementById('userList');
    const chatMessages = document.getElementById('chatMessages');
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const adminPanelBtn = document.getElementById('adminPanelBtn');
    const adminPanelModal = document.getElementById('adminPanelModal');
    const closeAdminPanel = document.getElementById('closeAdminPanel');
    const userSelect = document.getElementById('userSelect');
    const adminGold = document.getElementById('adminGold');
    const adminHolz = document.getElementById('adminHolz');
    const adminErz = document.getElementById('adminErz');
    const adminKristall = document.getElementById('adminKristall');
    const adminGames = document.getElementById('adminGames');
    const saveAdminChanges = document.getElementById('saveAdminChanges');
    const adminNewPassword = document.getElementById('adminNewPassword');
    const resetPasswordBtn = document.getElementById('resetPasswordBtn');
    const deleteUserBtn = document.getElementById('deleteUserBtn');
    const tabLinks = document.querySelectorAll('.tab-link');

    // --- Tabbed Form ---
    function openTab(evt, tabName) {
        const tabContents = document.getElementsByClassName('tab-content');
        for (let i = 0; i < tabContents.length; i++) {
            tabContents[i].style.display = 'none';
        }
        const currentTabLinks = document.getElementsByClassName('tab-link');
        for (let i = 0; i < currentTabLinks.length; i++) {
            currentTabLinks[i].className = currentTabLinks[i].className.replace(' active', '');
        }
        document.getElementById(tabName).style.display = 'block';
        if(evt && evt.currentTarget) {
            evt.currentTarget.className += ' active';
        }
    }

    tabLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            const tabName = event.currentTarget.getAttribute('data-tab');
            openTab(event, tabName);
        });
    });

    // --- Authentication ---
    function login() {
        const identifier = loginIdentifierInput.value.trim();
        const password = loginPasswordInput.value;
        if (!identifier || !password) {
            alert('Benutzername/Email und Passwort sind erforderlich.');
            return;
        }
        socket.emit('login', { identifier, password });
    }

    function register() {
        const username = registerUsernameInput.value.trim();
        const email = registerEmailInput.value.trim();
        const password = registerPasswordInput.value;
        const confirmPassword = registerConfirmPasswordInput.value;
        if (!username || !email || !password || !confirmPassword) {
            alert('Alle Felder sind für die Registrierung erforderlich.');
            return;
        }
        if (password !== confirmPassword) {
            alert('Die Passwörter stimmen nicht überein.');
            return;
        }
        socket.emit('register', { username, email, password });
    }

    loginButton.addEventListener('click', login);
    loginPasswordInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') login(); });
    registerButton.addEventListener('click', register);
    registerConfirmPasswordInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') register(); });

    socket.on('login success', (data) => {
        currentUser = data.username;
        isAdmin = data.isAdmin;
        loginOverlay.style.display = 'none';
        userInfo.textContent = `Angemeldet als: ${currentUser}`;
        logoutButton.style.display = 'block';
        messageInput.disabled = false;
        sendButton.disabled = false;
        if (isAdmin) {
            adminPanelBtn.style.display = 'block';
        }
    });

    socket.on('login failed', ({ message }) => { alert(`Login fehlgeschlagen: ${message}`); });

    socket.on('register success', () => {
        alert('Registrierung erfolgreich! Du kannst dich jetzt einloggen.');
        const loginTabButton = document.querySelector('.tab-link[data-tab="login"]');
        if (loginTabButton) {
            openTab({ currentTarget: loginTabButton }, 'login');
        }
        loginIdentifierInput.value = registerUsernameInput.value;
        registerUsernameInput.value = '';
        registerEmailInput.value = '';
        registerPasswordInput.value = '';
        registerConfirmPasswordInput.value = '';
        loginPasswordInput.focus();
    });

    socket.on('register failed', ({ message }) => { alert(`Registrierung fehlgeschlagen: ${message}`); });

    // --- Logout ---
    function logout() {
        socket.emit('logout');
        currentUser = null;
        isAdmin = false;
        userInfo.textContent = 'Nicht eingeloggt';
        loginOverlay.style.display = 'flex';
        messageInput.disabled = true;
        sendButton.disabled = true;
        logoutButton.style.display = 'none';
        adminPanelBtn.style.display = 'none';
        chatMessages.innerHTML = '';
        userList.innerHTML = '';
    }
    logoutButton.addEventListener('click', logout);

    // --- Chat & User List ---
    function sendMessage() {
        const text = messageInput.value.trim();
        if (text && currentUser) {
            socket.emit('chat message', { text });
            addMessage({ user: currentUser, text }, true);
            messageInput.value = '';
        }
    }

    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });

    function addMessage(message, isSent = false) {
        const time = new Date(message.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const messageElement = document.createElement('div');
        messageElement.className = `message ${isSent ? 'sent' : 'received'} ${message.user === 'System' ? 'system-message' : ''}`;
        messageElement.innerHTML = `<div class="sender">${message.user}</div><div class="text">${message.text}</div><div class="time">${time}</div>`;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    socket.on('chat message', (message) => { if (message.user !== currentUser) addMessage(message); });
    socket.on('user list', (users) => {
        userList.innerHTML = '';
        users.forEach(user => {
            const userElement = document.createElement('li');
            userElement.textContent = user;
            if (user === currentUser) userElement.style.fontWeight = 'bold';
            userList.appendChild(userElement);
        });
    });
    
    // --- Admin Panel Logic ---
    if (adminPanelBtn) {
        adminPanelBtn.addEventListener('click', () => {
            socket.emit('admin:get-all-users');
            adminPanelModal.style.display = 'flex';
        });
    }

    if(closeAdminPanel) {
        closeAdminPanel.addEventListener('click', () => { adminPanelModal.style.display = 'none'; });
    }
    

    socket.on('admin:all-users', (users) => {
        userSelect.innerHTML = '<option value="">--Select a user--</option>';
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.username;
            option.textContent = `${user.username} (${user.email})`;
            userSelect.appendChild(option);
        });
    });

    userSelect.addEventListener('change', () => {
        const selectedUser = userSelect.value;
        if (selectedUser) {
            socket.emit('admin:get-user-data', selectedUser, (user) => {
                if (user && !user.error) {
                    adminGold.value = user.resources.gold || 0;
                    adminHolz.value = user.resources.holz || 0;
                    adminErz.value = user.resources.erz || 0;
                    adminKristall.value = user.resources.kristall || 0;
                }
            });
        }
    });
    
    saveAdminChanges.addEventListener('click', () => {
        const targetUsername = userSelect.value;
        if (!targetUsername) return alert('Please select a user.');
        const resources = {
            gold: parseInt(adminGold.value, 10),
            holz: parseInt(adminHolz.value, 10),
            erz: parseInt(adminErz.value, 10),
            kristall: parseInt(adminKristall.value, 10)
        };
        socket.emit('admin:update-resources', { targetUsername, resources });
        alert('User resources updated.');
    });

    resetPasswordBtn.addEventListener('click', () => {
        const targetUsername = userSelect.value;
        const newPassword = adminNewPassword.value;
        if (!targetUsername) return alert('Please select a user.');
        if (!newPassword || newPassword.length < 4) return alert('Please enter a new password (min 4 characters).');
        if (confirm(`Reset password for ${targetUsername}?`)) {
            socket.emit('admin:reset-password', { targetUsername, newPassword });
            adminNewPassword.value = '';
            alert('Password reset request sent.');
        }
    });

    deleteUserBtn.addEventListener('click', () => {
        const targetUsername = userSelect.value;
        if (!targetUsername) return alert('Please select a user.');
        if (confirm(`Are you sure you want to PERMANENTLY DELETE ${targetUsername}? This cannot be undone.`)) {
            socket.emit('admin:delete-user', { targetUsername });
            alert('Delete user request sent.');
            adminPanelModal.style.display = 'none';
        }
    });
    
    // --- Global Notifications & Error Handling ---
    socket.on('disconnect', () => { addMessage({ user: 'System', text: 'Verbindung zum Server verloren.' }); });
    socket.on('force logout', () => {
        alert('This account has been logged in from another location.');
        logout();
    });
});
