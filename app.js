// --- CONFIGURACIÓN DE FIREBASE ---
const firebaseConfig = {
    apiKey: "AIzaSyBa5AEMbfIEFdSONsoHWymMjibUOSoH9Ds",
    authDomain: "diario-juli-y-ema.firebaseapp.com",
    projectId: "diario-juli-y-ema",
    storageBucket: "diario-juli-y-ema.firebasestorage.app",
    messagingSenderId: "853812519488",
    appId: "1:853812519488:web:ea2bc0da4626b5fa29b5a5",
    measurementId: "G-B3L508XTRZ"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// --- PERFILES DINÁMICOS Y RASTREO DE NOTIFICACIONES ---
let configEma = { id: 'ema', user: 'emanuel', pass: '2026', name: 'Ema', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Emanuel&backgroundColor=b6e3f4', coins: 0, lastNormalDate: '', lastSecretDate: '', lastSeen: { gallery: 0, secret: 0, surprises: 0, chat: 0 } };
let configJuli = { id: 'juli', user: 'juliana', pass: '2026', name: 'Juli', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Juliana&backgroundColor=ffdfbf', coins: 0, lastNormalDate: '', lastSecretDate: '', lastSeen: { gallery: 0, secret: 0, surprises: 0, chat: 0 } };

let usuarioActualId = ''; 
let usuarioActualInfo = {};
let snapshotRecuerdosLocal = null;

db.collection('configuracion').doc('perfiles').onSnapshot(doc => {
    if(doc.exists) {
        const data = doc.data();
        if(data.ema) configEma = data.ema;
        if(data.juli) configJuli = data.juli;

        if(usuarioActualId === 'ema') {
            usuarioActualInfo = configEma;
            document.getElementById('user-avatar').src = configEma.avatar;
            document.getElementById('user-greeting').textContent = `¡Hola ${configEma.user}!`;
            document.getElementById('settings-coins').textContent = configEma.coins || 0;
            if(document.getElementById('surprises-coins-display')) document.getElementById('surprises-coins-display').textContent = configEma.coins || 0;
        } else if(usuarioActualId === 'juli') {
            usuarioActualInfo = configJuli;
            document.getElementById('user-avatar').src = configJuli.avatar;
            document.getElementById('user-greeting').textContent = `¡Hola ${configJuli.user}!`;
            document.getElementById('settings-coins').textContent = configJuli.coins || 0;
            if(document.getElementById('surprises-coins-display')) document.getElementById('surprises-coins-display').textContent = configJuli.coins || 0;
        }
        
        const gameAvatarEma = document.getElementById('game-avatar-ema');
        const gameNameEma = document.getElementById('game-name-ema');
        const gameAvatarJuli = document.getElementById('game-avatar-juli');
        const gameNameJuli = document.getElementById('game-name-juli');
        if(gameAvatarEma) { gameAvatarEma.src = configEma.avatar; gameNameEma.textContent = configEma.user; }
        if(gameAvatarJuli) { gameAvatarJuli.src = configJuli.avatar; gameNameJuli.textContent = configJuli.user; }
        
        if(!document.getElementById('app-container').classList.contains('hidden')) {
            cargarDatosGalerias();
        }
    } else {
        db.collection('configuracion').doc('perfiles').set({ ema: configEma, juli: configJuli });
    }
});

// --- FUNCIONES DE NOTIFICACIÓN ---
function marcarVisto(tab) {
    if (!usuarioActualId || !usuarioActualInfo) return;
    if (!usuarioActualInfo.lastSeen) usuarioActualInfo.lastSeen = { gallery: 0, secret: 0, surprises: 0, chat: 0 };
    
    const now = Date.now();
    if (usuarioActualInfo.lastSeen[tab] > now - 5000) return;
    
    usuarioActualInfo.lastSeen[tab] = now;
    const dot = document.getElementById(`dot-${tab}`);
    if(dot) dot.classList.add('hidden');
    
    const updateObj = {};
    updateObj[usuarioActualId] = usuarioActualInfo;
    db.collection('configuracion').doc('perfiles').set(updateObj, { merge: true });
}

// --- ELEMENTOS DE LA PÁGINA ---
const loginContainer = document.getElementById('login-container');
const appContainer = document.getElementById('app-container');
const welcomeOverlay = document.getElementById('welcome-overlay');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');

const navAdd = document.getElementById('nav-add');
const navGallery = document.getElementById('nav-gallery');
const navSurprises = document.getElementById('nav-surprises'); 
const navChat = document.getElementById('nav-chat'); 
const navGame = document.getElementById('nav-game'); 
const navIntimate = document.getElementById('nav-intimate');

const viewAdd = document.getElementById('view-add');
const viewGallery = document.getElementById('view-gallery');
const viewSurprises = document.getElementById('view-surprises'); 
const viewChat = document.getElementById('view-chat'); 
const viewGame = document.getElementById('view-game'); 
const viewIntimate = document.getElementById('view-intimate');

const profileBtn = document.getElementById('profile-btn');
const settingsModal = document.getElementById('settings-modal');
const settingsSaveBtn = document.getElementById('settings-save');
const settingsCancelBtn = document.getElementById('settings-cancel');
const settingsUser = document.getElementById('settings-user');
const settingsPass = document.getElementById('settings-pass');
const settingsAvatarUpload = document.getElementById('settings-avatar-upload');
const settingsAvatarPreview = document.getElementById('settings-avatar-preview');
let newAvatarBase64 = '';

const toastContainer = document.getElementById('toast-container');
const customConfirm = document.getElementById('custom-confirm');
let confirmCallback = null;

function showToast(message, icon = "ph-info") {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="ph ${icon}" style="font-size: 1.2rem; color: var(--primary-color);"></i> <span>${message}</span>`;
    toastContainer.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 400); }, 4000);
}

function showConfirm(message, callback) {
    document.getElementById('confirm-message').textContent = message;
    customConfirm.classList.remove('hidden');
    confirmCallback = callback;
}

document.getElementById('confirm-no').addEventListener('click', () => { customConfirm.classList.add('hidden'); confirmCallback = null; });
document.getElementById('confirm-yes').addEventListener('click', () => { customConfirm.classList.add('hidden'); if (confirmCallback) confirmCallback(); });

// --- LÓGICA DE INICIO DE SESIÓN ---
loginBtn.addEventListener('click', () => {
    const inputUser = usernameInput.value.trim().toLowerCase();
    const inputPass = passwordInput.value.trim();

    if (inputUser === configEma.user.toLowerCase() && inputPass === configEma.pass) {
        iniciarSesion('ema', configEma);
    } else if (inputUser === configJuli.user.toLowerCase() && inputPass === configJuli.pass) {
        iniciarSesion('juli', configJuli);
    } else {
        document.getElementById('login-error').textContent = 'Usuario o contraseña incorrectos.';
    }
});

function iniciarSesion(id, data) {
    usuarioActualId = id;
    usuarioActualInfo = data;
    if(!usuarioActualInfo.lastSeen) usuarioActualInfo.lastSeen = { gallery: 0, secret: 0, surprises: 0, chat: 0 };
    
    document.getElementById('welcome-message').textContent = `¡Hola ${data.user}!`;
    document.getElementById('welcome-avatar').src = data.avatar;
    document.getElementById('user-greeting').textContent = `¡Hola ${data.user}!`;
    document.getElementById('user-avatar').src = data.avatar;
    document.getElementById('settings-coins').textContent = data.coins || 0;
    if(document.getElementById('surprises-coins-display')) document.getElementById('surprises-coins-display').textContent = data.coins || 0;

    loginContainer.classList.add('hidden');
    welcomeOverlay.classList.remove('oculto');
    
    setTimeout(() => {
        welcomeOverlay.classList.add('oculto');
        appContainer.classList.remove('hidden');
        document.getElementById('memory-date').value = new Date().toISOString().split('T')[0];
        inicializarListenersFirebase();
        navAdd.click(); 
        
        setTimeout(() => {
            let nuevas = [];
            if (!document.getElementById('dot-gallery').classList.contains('hidden')) nuevas.push('fotos');
            if (!document.getElementById('dot-surprises').classList.contains('hidden')) nuevas.push('sorpresas');
            if (!document.getElementById('dot-chat').classList.contains('hidden')) nuevas.push('notas');
            if (!document.getElementById('dot-secret').classList.contains('hidden')) nuevas.push('secretos');

            if (nuevas.length > 0) {
                const nombrePareja = usuarioActualId === 'ema' ? (configJuli ? configJuli.user : 'Juli') : (configEma ? configEma.user : 'Ema');
                showToast(`¡Tienes ${nuevas.join(', ')} nuevas de ${nombrePareja}! 👀`, 'ph-bell-ringing');
            }
            
            // Un segundo después de las alertas, lanzamos la Recompensa Diaria
            setTimeout(() => {
                procesarRecompensaDiaria();
            }, 1000);

        }, 1500);

    }, 3000);
}

// --- LÓGICA DE LA RECOMPENSA DIARIA Y RACHAS ---

window.abrirRacha = function() {
    // Cerramos el modal de configuración para que no se encimen
    document.getElementById('settings-modal').classList.add('hidden');
    window.procesarRecompensaDiaria(true); // Lo abrimos indicando que es MODO VISTA
};

window.procesarRecompensaDiaria = function(modoVista = false) {
    const recompensas = [1, 2, 2, 3, 3, 5, 10]; 
    
    const getFechaLocalStr = (d) => {
        return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    };

    const hoyObj = new Date();
    const hoyStr = getFechaLocalStr(hoyObj);
    
    let racha = usuarioActualInfo.loginStreak || 0;
    let ultimoLogin = usuarioActualInfo.lastLoginDate || '';

    if (!modoVista) {
        if (ultimoLogin === hoyStr) return; 

        const ayerObj = new Date();
        ayerObj.setDate(hoyObj.getDate() - 1);
        const ayerStr = getFechaLocalStr(ayerObj);

        if (ultimoLogin === ayerStr) {
            racha++;
            if (racha > 7) racha = 1; 
        } else {
            racha = 1;
        }
    } else {
        if (racha === 0) racha = 1;
    }

    const yaCobroHoy = (ultimoLogin === hoyStr);
    const grid = document.getElementById('reward-grid');
    
    if(grid) {
        grid.innerHTML = '';
        for(let i=1; i<=7; i++) {
            const div = document.createElement('div');
            div.className = 'reward-day';
            
            let icon = '<i class="ph ph-coins" style="font-size:1.4rem; color:#f39c12;"></i>';
            
            if (i < racha || (i === racha && yaCobroHoy)) {
                div.classList.add('claimed');
                icon = '<i class="ph ph-check-circle" style="font-size:1.4rem; color:#2ecc71;"></i>';
            } else if (i === racha && !yaCobroHoy) {
                div.classList.add('current');
                icon = '<i class="ph ph-gift" style="font-size:1.5rem; color:var(--primary-hover);"></i>';
            }
            
            div.innerHTML = `<span>Día ${i}</span>${icon}<span>+${recompensas[i-1]}</span>`;
            grid.appendChild(div);
        }
        
        const modal = document.getElementById('daily-reward-modal');
        const btn = document.getElementById('claim-reward-btn');
        modal.classList.remove('hidden');
        
        if (modoVista && yaCobroHoy) {
            btn.innerHTML = '<i class="ph ph-check-square-offset"></i> Ya cobraste hoy (Cerrar)';
            btn.style.backgroundColor = '#2ecc71'; 
            btn.onclick = () => {
                modal.classList.add('hidden');
                btn.style.backgroundColor = ''; 
            };
        } else {
            btn.innerHTML = '<i class="ph ph-hand-coins"></i> ¡Reclamar Monedas!';
            btn.style.backgroundColor = '';
            
            btn.onclick = () => {
                modal.classList.add('hidden');
                
                if (!yaCobroHoy) {
                    const monedasGanadas = recompensas[racha - 1];
                    const nuevasMonedas = (usuarioActualInfo.coins || 0) + monedasGanadas;
                    
                    usuarioActualInfo.coins = nuevasMonedas;
                    usuarioActualInfo.loginStreak = racha;
                    usuarioActualInfo.lastLoginDate = hoyStr;
                    
                    document.getElementById('settings-coins').textContent = nuevasMonedas;
                    if(document.getElementById('surprises-coins-display')) {
                        document.getElementById('surprises-coins-display').textContent = nuevasMonedas;
                    }

                    const updateObj = {};
                    updateObj[usuarioActualId] = usuarioActualInfo;
                    db.collection('configuracion').doc('perfiles').set(updateObj, { merge: true }).then(() => {
                        showToast(`¡Racha de ${racha} días! Ganaste ${monedasGanadas} 🪙`, 'ph-fire');
                    });
                }
            };
        }
    }
};

logoutBtn.addEventListener('click', () => {
    appContainer.classList.add('hidden');
    loginContainer.classList.remove('hidden');
    usernameInput.value = ''; passwordInput.value = '';
    document.getElementById('login-error').textContent = '';
    document.body.classList.remove('sexy-theme');
    manejarMusica(false);
});

// --- MENÚ DE CONFIGURACIÓN ---
if(profileBtn) {
    profileBtn.addEventListener('click', () => {
        settingsUser.value = usuarioActualInfo.user;
        settingsPass.value = usuarioActualInfo.pass;
        settingsAvatarPreview.src = usuarioActualInfo.avatar;
        newAvatarBase64 = usuarioActualInfo.avatar;
        document.getElementById('settings-coins').textContent = usuarioActualInfo.coins || 0;
        settingsModal.classList.remove('hidden');
    });

    settingsCancelBtn.addEventListener('click', () => { settingsModal.classList.add('hidden'); });

    settingsAvatarUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            settingsAvatarPreview.style.opacity = '0.4';
            settingsSaveBtn.disabled = true;
            const reader = new FileReader();
            reader.onload = function(event) {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = 250; canvas.height = 250;
                    const ctx = canvas.getContext('2d');
                    const size = Math.min(img.width, img.height);
                    ctx.drawImage(img, (img.width - size) / 2, (img.height - size) / 2, size, size, 0, 0, 250, 250);
                    newAvatarBase64 = canvas.toDataURL('image/jpeg', 0.85);
                    settingsAvatarPreview.src = newAvatarBase64;
                    settingsAvatarPreview.style.opacity = '1';
                    settingsSaveBtn.disabled = false;
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    settingsSaveBtn.addEventListener('click', () => {
        const newUser = settingsUser.value.trim();
        const newPass = settingsPass.value.trim();
        if(!newUser || !newPass) { showToast('Debes poner usuario y contraseña', 'ph-warning'); return; }

        settingsSaveBtn.innerHTML = "Guardando...";
        settingsSaveBtn.disabled = true;

        const updateObj = {};
        updateObj[usuarioActualId] = {
            id: usuarioActualId, user: newUser, pass: newPass,
            name: usuarioActualInfo.name, avatar: newAvatarBase64,
            coins: usuarioActualInfo.coins || 0,
            lastNormalDate: usuarioActualInfo.lastNormalDate || '',
            lastSecretDate: usuarioActualInfo.lastSecretDate || '',
            lastSeen: usuarioActualInfo.lastSeen || { gallery: 0, secret: 0, surprises: 0, chat: 0 }
        };

        db.collection('configuracion').doc('perfiles').set(updateObj, { merge: true }).then(() => {
            showToast('Perfil actualizado con éxito', 'ph-check');
            settingsModal.classList.add('hidden');
            settingsSaveBtn.innerHTML = '<i class="ph ph-floppy-disk"></i> Guardar';
            settingsSaveBtn.disabled = false;
        }).catch(() => {
            showToast('Error al actualizar perfil', 'ph-warning');
            settingsSaveBtn.innerHTML = '<i class="ph ph-floppy-disk"></i> Guardar';
            settingsSaveBtn.disabled = false;
        });
    });
}

function manejarMusica(reproducir) {
    const audio = document.getElementById('sexy-audio');
    if (!audio) return;
    reproducir ? audio.play().catch(()=>{}) : audio.pause();
}

// --- NAVEGACIÓN ---
navAdd.addEventListener('click', () => { activarPestana(navAdd, viewAdd); });
navGallery.addEventListener('click', () => { activarPestana(navGallery, viewGallery); });
navSurprises.addEventListener('click', () => { activarPestana(navSurprises, viewSurprises); });
navChat.addEventListener('click', () => { activarPestana(navChat, viewChat); setTimeout(() => document.getElementById('chat-box').scrollTop = document.getElementById('chat-box').scrollHeight, 100); }); 
navGame.addEventListener('click', () => { activarPestana(navGame, viewGame); configurarBotonesJuego(); });
navIntimate.addEventListener('click', () => {
    activarPestana(navIntimate, viewIntimate);
    document.body.classList.add('sexy-theme');
    document.getElementById('intimate-warning').classList.remove('hidden');
    document.getElementById('intimate-feed').classList.add('hidden');
    manejarMusica(true);
});

document.getElementById('intimate-next-btn').addEventListener('click', () => {
    document.getElementById('intimate-warning').classList.add('hidden');
    document.getElementById('intimate-feed').classList.remove('hidden');
    manejarMusica(true);
});

function activarPestana(botonActivo, vistaActiva) {
    [navAdd, navGallery, navSurprises, navChat, navGame, navIntimate].forEach(btn => btn.classList.remove('active'));
    [viewAdd, viewGallery, viewSurprises, viewChat, viewGame, viewIntimate].forEach(vista => vista.classList.add('hidden'));
    document.body.classList.remove('sexy-theme');
    manejarMusica(false);
    botonActivo.classList.add('active');
    vistaActiva.classList.remove('hidden');

    if (botonActivo === navGallery) marcarVisto('gallery');
    if (botonActivo === navIntimate) marcarVisto('secret');
    if (botonActivo === navSurprises) marcarVisto('surprises');
    if (botonActivo === navChat) marcarVisto('chat');
}

// --- FIREBASE LISTENERS (CHAT, GALERIA, SORPRESAS) ---
function inicializarListenersFirebase() {
    // 1. GALERIA
    db.collection('recuerdos').orderBy('timestamp', 'desc').onSnapshot(snapshot => {
        snapshotRecuerdosLocal = snapshot; 
        cargarDatosGalerias();
    });

    // 2. CHAT
    db.collection('mensajes').orderBy('timestamp', 'asc').onSnapshot(snapshot => {
        const chatBox = document.getElementById('chat-box');
        if(!chatBox) return;
        
        chatBox.innerHTML = '';
        if (snapshot.empty) { chatBox.innerHTML = '<p style="text-align:center; color:var(--text-light); margin-top: 20px;">Este es su espacio. Déjale una nota linda... 💌</p>'; return; }

        let latestChatTime = 0;

        snapshot.forEach(doc => {
            const msg = doc.data();
            const id = doc.id;
            const msgDiv = document.createElement('div');
            msgDiv.className = msg.authorId === usuarioActualId ? 'chat-msg msg-sent' : 'chat-msg msg-received';
            msgDiv.innerHTML = `${msg.text || ''} <span class="msg-time">${msg.time || ''}</span>`;
            
            if (msg.authorId !== usuarioActualId && msg.timestamp > latestChatTime) {
                latestChatTime = msg.timestamp;
            }

            let pressTimer;
            const iniciarPresion = () => { pressTimer = setTimeout(() => { borrarMensaje(id, msg.authorId); }, 700); };
            const cancelarPresion = () => clearTimeout(pressTimer);

            msgDiv.addEventListener('touchstart', iniciarPresion, {passive: true});
            msgDiv.addEventListener('touchend', cancelarPresion);
            msgDiv.addEventListener('touchmove', cancelarPresion);
            msgDiv.addEventListener('mousedown', iniciarPresion);
            msgDiv.addEventListener('mouseup', cancelarPresion);
            msgDiv.addEventListener('mouseleave', cancelarPresion);
            msgDiv.addEventListener('contextmenu', e => e.preventDefault());

            chatBox.appendChild(msgDiv);
        });
        
        setTimeout(() => { chatBox.scrollTop = chatBox.scrollHeight; }, 100);

        const seen = usuarioActualInfo.lastSeen || {};
        if (latestChatTime > (seen.chat || 0) && !navChat.classList.contains('active')) {
            const dot = document.getElementById('dot-chat');
            if(dot) dot.classList.remove('hidden');
        } else {
            const dot = document.getElementById('dot-chat');
            if(dot) dot.classList.add('hidden');
        }
    });

    // 3. JUEGO BATALLA
    db.collection('juego').doc('estadisticas').onSnapshot(doc => {
        const fechaHoy = new Date().toLocaleDateString('es-ES');
        if (!doc.exists || doc.data().fecha !== fechaHoy) {
            db.collection('juego').doc('estadisticas').set({ fecha: fechaHoy, ema: 0, juli: 0 }); return;
        }
        actualizarPantallaJuego(doc.data());
    });

    // 4. TIENDA Y SORPRESAS
    db.collection('sorpresas').orderBy('timestamp', 'desc').onSnapshot(snapshot => {
        const feedBuy = document.getElementById('surprises-feed-buy');
        const feedCreated = document.getElementById('surprises-feed-created');
        const feedRedeemed = document.getElementById('surprises-feed-redeemed');
        
        if(!feedBuy || !feedCreated || !feedRedeemed) return;

        feedBuy.innerHTML = ''; feedCreated.innerHTML = ''; feedRedeemed.innerHTML = '';

        let latestSurpriseTime = 0;
        const nombrePareja = usuarioActualId === 'ema' ? (configJuli ? configJuli.user : 'Juli') : (configEma ? configEma.user : 'Ema');

        snapshot.forEach(doc => {
            const sorpresa = doc.data();
            const card = document.createElement('div');
            card.className = 'coupon-card';

            if (sorpresa.status === 'redeemed') {
                if (sorpresa.redeemedBy === usuarioActualId) {
                    card.innerHTML = `
                        <div class="store-item-icon" style="filter: grayscale(0.8);">🎟️</div>
                        <div class="coupon-info">
                            <h4 style="text-decoration: line-through; color: #95a5a6;">${sorpresa.title}</h4>
                            <p style="margin:0; font-size: 0.8rem; color: #27ae60;">¡Lo reclamaste!</p>
                        </div>
                    `;
                } else {
                    if (sorpresa.redeemedAt > latestSurpriseTime) latestSurpriseTime = sorpresa.redeemedAt;
                    card.innerHTML = `
                        <div class="store-item-icon">🚨</div>
                        <div class="coupon-info">
                            <h4>${sorpresa.title}</h4>
                            <p style="margin:0; font-size: 0.8rem; color: #e74c3c; font-weight:bold;">¡${nombrePareja} lo cobró!</p>
                        </div>
                        <div class="coupon-actions" style="width: 100%;">
                            <button class="btn-buy" style="background: linear-gradient(to bottom, #2ecc71, #27ae60); box-shadow: 0 5px 0 #219a52, 0 6px 10px rgba(0,0,0,0.2); font-size: 0.85rem;" onclick="borrarSorpresa('${doc.id}')">Cumplido ✔️</button>
                        </div>
                    `;
                }
                feedRedeemed.appendChild(card);
                return; 
            }
            
            if (sorpresa.status === 'available') {
                if (sorpresa.creatorId !== usuarioActualId) {
                    if (sorpresa.timestamp > latestSurpriseTime) latestSurpriseTime = sorpresa.timestamp;
                    card.innerHTML = `
                        <div class="store-item-icon"></div>
                        <div class="coupon-info">
                            <h4>${sorpresa.title}</h4>
                        </div>
                        <div class="coupon-actions" style="width: 100%;">
                            <button class="btn-buy" onclick="canjearSorpresa('${doc.id}', ${sorpresa.cost})">
                                ${sorpresa.cost} <i class="ph ph-coins"></i>
                            </button>
                        </div>
                    `;
                    feedBuy.appendChild(card);
                } else {
                    card.innerHTML = `
                        <div class="store-item-icon" style="filter: grayscale(0.5);"></div>
                        <div class="coupon-info">
                            <h4>${sorpresa.title}</h4>
                            <p style="margin:0; font-size: 0.85rem; color: #7f8c8d; font-weight: bold;">Vale: ${sorpresa.cost} 🪙</p>
                        </div>
                        <div class="coupon-actions" style="width: 100%;">
                            <button class="btn-delete-item" onclick="borrarSorpresa('${doc.id}')"><i class="ph ph-trash"></i> Quitar</button>
                        </div>
                    `;
                    feedCreated.appendChild(card);
                }
            }
        });

        if(feedBuy.children.length === 0) feedBuy.innerHTML = '<p style="text-align:center; color:var(--text-light); font-style:italic; margin-top:10px; grid-column: 1 / -1;">Aun sin recompensas</p>';
        if(feedCreated.children.length === 0) feedCreated.innerHTML = '<p style="text-align:center; color:var(--text-light); font-style:italic; margin-top:10px; grid-column: 1 / -1;">No has creado sorpresas para tu pareja.</p>';
        if(feedRedeemed.children.length === 0) feedRedeemed.innerHTML = '<p style="text-align:center; color:var(--text-light); font-style:italic; margin-top:10px; grid-column: 1 / -1;">No hay deudas pendientes.</p>';

        const seen = usuarioActualInfo.lastSeen || {};
        if (latestSurpriseTime > (seen.surprises || 0) && !navSurprises.classList.contains('active')) {
            const dot = document.getElementById('dot-surprises');
            if(dot) dot.classList.remove('hidden');
        } else {
            const dot = document.getElementById('dot-surprises');
            if(dot) dot.classList.add('hidden');
        }
    });
}

function cargarDatosGalerias() {
    if(!snapshotRecuerdosLocal) return;
    
    const memFeed = document.getElementById('memories-feed');
    const intFeed = document.getElementById('intimate-feed');
    if(!memFeed || !intFeed) return;
    
    memFeed.innerHTML = ''; intFeed.innerHTML = '';
    let countNormales = 0; let countIntimos = 0;
    
    let latestGalleryTime = 0;
    let latestSecretTime = 0;

    snapshotRecuerdosLocal.forEach(doc => {
        const recuerdo = doc.data(); const id = doc.id;
        
        if (recuerdo.authorId !== usuarioActualId) {
            if (recuerdo.isIntimate && recuerdo.timestamp > latestSecretTime) latestSecretTime = recuerdo.timestamp;
            if (!recuerdo.isIntimate && recuerdo.timestamp > latestGalleryTime) latestGalleryTime = recuerdo.timestamp;
        }

        let fechaFormateada = "Fecha no registrada";
        if (recuerdo.date) {
            try {
                const fechaObj = new Date(recuerdo.date + 'T00:00:00');
                fechaFormateada = fechaObj.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
            } catch(e) {}
        }

        let autorNombre = recuerdo.authorName || 'Usuario';
        let autorImagen = recuerdo.authorAvatar || '';

        if (recuerdo.authorId === 'juli') {
            autorNombre = configJuli.user;
            autorImagen = configJuli.avatar;
        } else if (recuerdo.authorId === 'ema') {
            autorNombre = configEma.user;
            autorImagen = configEma.avatar;
        }

        let likes = recuerdo.likes || [];
        let haDadoLike = likes.includes(usuarioActualId);
        let textoLikes = "Dar amor";
        
        if (likes.length === 2) {
            textoLikes = "¡A los dos les encanta! ❤️";
        } else if (likes.length === 1) {
            textoLikes = (likes[0] === 'ema') ? `A ${configEma.user} le encanta` : `A ${configJuli.user} le encanta`;
        }

        const card = document.createElement('div');
        card.className = 'memory-card';
        card.innerHTML = `
            <div class="memory-image-container">
                <img src="${recuerdo.image}" class="memory-image" onclick="abrirLightbox('${recuerdo.image}')">
                <button class="delete-btn" onclick="borrarRecuerdo('${id}')"><i class="ph ph-trash"></i></button>
                <div class="author-bubble" title="Subido por ${autorNombre}">
                    <img src="${autorImagen}">
                </div>
            </div>
            <div class="memory-content">
                <div class="memory-date">${fechaFormateada}</div>
                <div class="memory-text">${recuerdo.desc || ''}</div>
                <div class="memory-actions">
                    <button class="like-btn ${haDadoLike ? 'liked' : ''}" onclick="toggleLike('${id}')">
                        <i class="ph ${haDadoLike ? 'ph-heart-fill' : 'ph-heart'}"></i>
                        <span>${textoLikes}</span>
                    </button>
                </div>
            </div>
        `;
        if (recuerdo.isIntimate) { intFeed.appendChild(card); countIntimos++; } 
        else { memFeed.appendChild(card); countNormales++; }
    });

    if (countNormales === 0) memFeed.innerHTML = '<p style="text-align:center; color:var(--text-light); font-style:italic; margin-top:30px;">Aún no hay recuerdos normales.</p>';
    if (countIntimos === 0) intFeed.innerHTML = '<p style="text-align:center; color:var(--text-light); font-style:italic; margin-top:30px;">Aún no hay nada en el álbum secreto...</p>';

    const seen = usuarioActualInfo.lastSeen || {};
    if (latestGalleryTime > (seen.gallery || 0) && !navGallery.classList.contains('active')) {
        const dot = document.getElementById('dot-gallery');
        if(dot) dot.classList.remove('hidden');
    } else {
        const dot = document.getElementById('dot-gallery');
        if(dot) dot.classList.add('hidden');
    }
    
    if (latestSecretTime > (seen.secret || 0) && !navIntimate.classList.contains('active')) {
        const dot = document.getElementById('dot-secret');
        if(dot) dot.classList.remove('hidden');
    } else {
        const dot = document.getElementById('dot-secret');
        if(dot) dot.classList.add('hidden');
    }
}

// --- FOTOS Y CÁMARA ---
const fileUpload = document.getElementById('file-upload');
const photoPreviewContainer = document.getElementById('photo-preview-container');
const photoPreview = document.getElementById('photo-preview');
const photoActionsContainer = document.getElementById('photo-actions-container');
const startCameraBtn = document.getElementById('start-camera-btn');
const cameraInterface = document.getElementById('camera-interface');
const cameraStream = document.getElementById('camera-stream');
const captureBtn = document.getElementById('capture-btn');
const closeCameraBtn = document.getElementById('close-camera-btn');
const switchCameraBtn = document.getElementById('switch-camera-btn'); 
const cameraCanvas = document.getElementById('camera-canvas');

let videoStream = null;
let currentImageBase64 = '';
let currentFacingMode = 'environment';

function comprimirYMostrar(imgSource) {
    const img = new Image();
    img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1080; 
        let scale = 1;
        if(img.width > MAX_WIDTH) { scale = MAX_WIDTH / img.width; }
        canvas.width = img.width * scale; 
        canvas.height = img.height * scale;
        
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        currentImageBase64 = canvas.toDataURL('image/jpeg', 0.85);
        photoPreview.src = currentImageBase64;
        photoPreviewContainer.classList.remove('hidden');
        photoActionsContainer.classList.add('hidden');
    };
    img.src = imgSource;
}

if(fileUpload) {
    fileUpload.addEventListener('change', (e) => {
        if (e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = ev => comprimirYMostrar(ev.target.result);
            reader.readAsDataURL(e.target.files[0]);
        }
    });
}

async function encenderCamara(modo) {
    if (videoStream) { videoStream.getTracks().forEach(track => track.stop()); }
    try {
        videoStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: modo } });
        cameraStream.srcObject = videoStream;
    } catch (err) {
        showToast('No se pudo acceder a la cámara.', 'ph-warning');
    }
}

if(startCameraBtn) {
    startCameraBtn.addEventListener('click', () => {
        photoActionsContainer.classList.add('hidden');
        cameraInterface.classList.remove('hidden');
        currentFacingMode = 'environment';
        encenderCamara(currentFacingMode);
    });
}

if (switchCameraBtn) {
    switchCameraBtn.addEventListener('click', () => {
        currentFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
        encenderCamara(currentFacingMode);
    });
}

if(captureBtn) {
    captureBtn.addEventListener('click', () => {
        cameraCanvas.width = cameraStream.videoWidth;
        cameraCanvas.height = cameraStream.videoHeight;
        const ctx = cameraCanvas.getContext('2d');
        
        if (currentFacingMode === 'user') {
            ctx.translate(cameraCanvas.width, 0);
            ctx.scale(-1, 1);
        }
        
        ctx.drawImage(cameraStream, 0, 0, cameraCanvas.width, cameraCanvas.height);
        const rawData = cameraCanvas.toDataURL('image/jpeg', 1.0);
        apagarCamara();
        comprimirYMostrar(rawData);
    });
}

if(closeCameraBtn) {
    closeCameraBtn.addEventListener('click', () => {
        apagarCamara();
        photoActionsContainer.classList.remove('hidden');
    });
}

function apagarCamara() {
    if (videoStream) videoStream.getTracks().forEach(track => track.stop());
    cameraInterface.classList.add('hidden');
}

const removePhotoBtn = document.getElementById('remove-photo-btn');
if(removePhotoBtn) {
    removePhotoBtn.addEventListener('click', () => {
        currentImageBase64 = ''; photoPreview.src = ''; fileUpload.value = '';
        photoPreviewContainer.classList.add('hidden');
        photoActionsContainer.classList.remove('hidden');
    });
}

// --- SUBIR RECUERDO Y GANAR MONEDAS ---
const saveMemoryBtn = document.getElementById('save-memory-btn');
if(saveMemoryBtn) {
    saveMemoryBtn.addEventListener('click', () => {
        const date = document.getElementById('memory-date').value;
        const desc = document.getElementById('memory-desc').value.trim();
        const isIntimate = document.getElementById('memory-is-intimate').checked;

        if (!date || !desc || !currentImageBase64) { showToast('Completa la fecha, descripción y foto.', 'ph-warning'); return; }

        saveMemoryBtn.disabled = true;
        saveMemoryBtn.innerHTML = 'Subiendo a la nube... ⏳';

        db.collection('recuerdos').add({
            date: date, desc: desc, image: currentImageBase64,
            authorName: usuarioActualInfo.user || usuarioActualId, 
            authorAvatar: usuarioActualInfo.avatar || '',
            authorId: usuarioActualId, 
            isIntimate: isIntimate, 
            timestamp: Date.now()
        }).then(() => {
            document.getElementById('memory-desc').value = '';
            document.getElementById('memory-is-intimate').checked = false;
            document.getElementById('remove-photo-btn').click(); 
            
            saveMemoryBtn.disabled = false;
            saveMemoryBtn.innerHTML = 'Guardar recuerdo';
            showToast('Recuerdo subido a la nube ☁️', 'ph-check-circle');
            isIntimate ? navIntimate.click() : navGallery.click();

            const hoy = new Date().toLocaleDateString('es-ES');
            let updateProfile = false;
            let monedasGanadas = 0;
            let nuevasMonedas = usuarioActualInfo.coins || 0;

            if (isIntimate) {
                if (usuarioActualInfo.lastSecretDate !== hoy) {
                    nuevasMonedas += 5;
                    usuarioActualInfo.lastSecretDate = hoy;
                    monedasGanadas = 5;
                    updateProfile = true;
                }
            } else {
                if (usuarioActualInfo.lastNormalDate !== hoy) {
                    nuevasMonedas += 2;
                    usuarioActualInfo.lastNormalDate = hoy;
                    monedasGanadas = 2;
                    updateProfile = true;
                }
            }

            if (updateProfile) {
                usuarioActualInfo.coins = nuevasMonedas;
                const updateObj = {};
                updateObj[usuarioActualId] = usuarioActualInfo;
                db.collection('configuracion').doc('perfiles').set(updateObj, { merge: true });
                
                setTimeout(() => { showToast(`¡Ganaste ${monedasGanadas} monedas hoy! 🪙`, 'ph-coins'); }, 1500);
            }

        }).catch((error) => {
            saveMemoryBtn.disabled = false;
            saveMemoryBtn.innerHTML = 'Guardar recuerdo';
            showToast('Error al subir.', 'ph-warning');
        });
    });
}

function borrarRecuerdo(id) {
    showConfirm("¿Eliminar esta foto permanentemente para ambos?", () => {
        db.collection('recuerdos').doc(id).delete().then(() => showToast("Foto eliminada", "ph-trash"));
    });
}

function toggleLike(id) {
    let recuerdo = null;
    snapshotRecuerdosLocal.forEach(doc => { if (doc.id === id) recuerdo = doc.data(); });
    if (!recuerdo) return;

    const likesActuales = recuerdo.likes || [];
    const yaDioLike = likesActuales.includes(usuarioActualId);
    const recuerdoRef = db.collection('recuerdos').doc(id);

    if (yaDioLike) {
        recuerdoRef.update({ likes: firebase.firestore.FieldValue.arrayRemove(usuarioActualId) });
    } else {
        recuerdoRef.update({ likes: firebase.firestore.FieldValue.arrayUnion(usuarioActualId) });
    }
}

// --- CREAR, BORRAR Y DESPLEGAR SORPRESAS ---
const toggleSurpriseBtn = document.getElementById('toggle-create-surprise-btn');
const surpriseForm = document.getElementById('create-surprise-form');
const cancelSurpriseBtn = document.getElementById('cancel-surprise-btn');
const createSurpriseBtn = document.getElementById('create-surprise-btn');

// Lógica del botón Crear Sorpresa
if(toggleSurpriseBtn) {
    toggleSurpriseBtn.addEventListener('click', () => {
        surpriseForm.classList.remove('hidden');
        toggleSurpriseBtn.classList.add('hidden');
    });
}
if(cancelSurpriseBtn) {
    cancelSurpriseBtn.addEventListener('click', () => {
        surpriseForm.classList.add('hidden');
        toggleSurpriseBtn.classList.remove('hidden');
    });
}

// Lógica del botón Reclamados (Deudas)
const toggleRedeemedBtn = document.getElementById('toggle-redeemed-btn');
const redeemedContainer = document.getElementById('redeemed-container');

if(toggleRedeemedBtn && redeemedContainer) {
    toggleRedeemedBtn.addEventListener('click', () => {
        redeemedContainer.classList.toggle('hidden');
        if(redeemedContainer.classList.contains('hidden')) {
            toggleRedeemedBtn.innerHTML = '<i class="ph ph-check-square-offset"></i> Ver reclamados (Deudas)';
        } else {
            toggleRedeemedBtn.innerHTML = '<i class="ph ph-caret-up"></i> Ocultar reclamados';
        }
    });
}

// Lógica del botón Creadas por ti
const toggleCreatedBtn = document.getElementById('toggle-created-btn');
const createdContainer = document.getElementById('created-container');

if(toggleCreatedBtn && createdContainer) {
    toggleCreatedBtn.addEventListener('click', () => {
        createdContainer.classList.toggle('hidden');
        if(createdContainer.classList.contains('hidden')) {
            toggleCreatedBtn.innerHTML = '<i class="ph ph-tag"></i> Ver creadas por ti';
        } else {
            toggleCreatedBtn.innerHTML = '<i class="ph ph-caret-up"></i> Ocultar creadas por ti';
        }
    });
}

// Guardar nueva sorpresa en la nube
if(createSurpriseBtn) {
    createSurpriseBtn.addEventListener('click', () => {
        const desc = document.getElementById('surprise-desc').value.trim();
        const cost = parseInt(document.getElementById('surprise-cost').value);

        if(!desc || isNaN(cost) || cost <= 0) {
            showToast('Escribe qué es y ponle un precio válido', 'ph-warning');
            return;
        }

        createSurpriseBtn.disabled = true;
        createSurpriseBtn.innerHTML = 'Subiendo... ⏳';

        db.collection('sorpresas').add({
            title: desc,
            cost: cost,
            creatorId: usuarioActualId,
            status: 'available',
            timestamp: Date.now()
        }).then(() => {
            document.getElementById('surprise-desc').value = '';
            document.getElementById('surprise-cost').value = '';
            showToast('¡Sorpresa subida a la tienda!', 'ph-gift');
            
            surpriseForm.classList.add('hidden');
            toggleSurpriseBtn.classList.remove('hidden');
            
            createSurpriseBtn.disabled = false;
            createSurpriseBtn.innerHTML = 'Guardar';
        }).catch(() => {
            showToast('Error al crear', 'ph-warning');
            createSurpriseBtn.disabled = false;
            createSurpriseBtn.innerHTML = 'Guardar';
        });
    });
}

window.canjearSorpresa = function(id, cost) {
    if (usuarioActualInfo.coins < cost) {
        showToast(`Te faltan ${cost - (usuarioActualInfo.coins||0)} monedas `, 'ph-warning-circle');
        return;
    }

    showConfirm(`¿Pagar ${cost} monedas por esta sorpresa?`, () => {
        const nuevasMonedas = (usuarioActualInfo.coins || 0) - cost;
        const updateObj = {};
        usuarioActualInfo.coins = nuevasMonedas;
        updateObj[usuarioActualId] = usuarioActualInfo;

        db.collection('configuracion').doc('perfiles').set(updateObj, { merge: true }).then(() => {
            return db.collection('sorpresas').doc(id).update({
                status: 'redeemed',
                redeemedBy: usuarioActualId,
                redeemedAt: Date.now()
            });
        }).then(() => {
            showToast('¡Canjeado! Tómale captura y cóbrala 🎉', 'ph-confetti');
        }).catch(() => showToast('Error al canjear', 'ph-warning'));
    });
};

window.borrarSorpresa = function(id) {
    showConfirm('¿Eliminar esta sorpresa?', () => {
        db.collection('sorpresas').doc(id).delete().then(() => showToast('Sorpresa eliminada', 'ph-trash'));
    });
};

// --- CHAT Y MENSAJES (¡CORREGIDO Y CONECTADO!) ---
function borrarMensaje(idMensaje, authorId) {
    if (authorId !== usuarioActualId) {
        showToast("Solo puedes borrar tus propios mensajes", "ph-warning-circle");
        return;
    }
    showConfirm("¿Deseas eliminar este mensaje para ambos?", () => {
        db.collection('mensajes').doc(idMensaje).delete()
            .then(() => showToast("Mensaje borrado", "ph-trash"))
            .catch(() => showToast("Error al borrar", "ph-warning"));
    });
}

window.enviarMensaje = function() {
    const input = document.getElementById('chat-input');
    const btnSend = document.getElementById('chat-send-btn');
    if (!input || !btnSend) return;

    const texto = input.value.trim();
    if (!texto) return;

    btnSend.disabled = true;

    const ahora = new Date();
    const hora = ahora.getHours().toString().padStart(2, '0') + ':' + ahora.getMinutes().toString().padStart(2, '0');

    db.collection('mensajes').add({
        text: texto, 
        authorId: usuarioActualId, 
        time: hora, 
        timestamp: Date.now()
    }).then(() => { 
        input.value = ''; 
        btnSend.disabled = false;
        const chatBox = document.getElementById('chat-box');
        if(chatBox) chatBox.scrollTop = chatBox.scrollHeight;
    }).catch((error) => {
        showToast("Error al enviar la nota", "ph-warning");
        btnSend.disabled = false;
    });
};

const chatSendBtn = document.getElementById('chat-send-btn');
const chatInput = document.getElementById('chat-input');

if (chatSendBtn) chatSendBtn.onclick = window.enviarMensaje;
if (chatInput) {
    chatInput.onkeypress = function(e) {
        if (e.key === 'Enter') {
            e.preventDefault(); // Evita el salto de línea en celulares
            window.enviarMensaje();
        }
    };
}

// --- LÓGICA DE LA BATALLA ---
function configurarBotonesJuego() {
    const btnEma = document.getElementById('btn-tap-ema');
    const btnJuli = document.getElementById('btn-tap-juli');
    if(!btnEma || !btnJuli) return;

    if (usuarioActualId === 'ema') {
        btnEma.disabled = false; btnEma.textContent = "Pulsar";
        btnJuli.disabled = true; btnJuli.textContent = "Bloqueado ";
    } else {
        btnJuli.disabled = false; btnJuli.textContent = "Pulsar";
        btnEma.disabled = true; btnEma.textContent = "Bloqueado 🔒";
    }
}

function registrarTap(jugador) {
    if (jugador !== usuarioActualId) return;
    db.collection('juego').doc('estadisticas').update({ [jugador]: firebase.firestore.FieldValue.increment(1) });
}

const btnTapEma = document.getElementById('btn-tap-ema');
const btnTapJuli = document.getElementById('btn-tap-juli');
if(btnTapEma) btnTapEma.addEventListener('click', () => registrarTap('ema'));
if(btnTapJuli) btnTapJuli.addEventListener('click', () => registrarTap('juli'));

function actualizarPantallaJuego(data) {
    const countEma = document.getElementById('count-ema');
    const countJuli = document.getElementById('count-juli');
    const barEma = document.getElementById('bar-ema');
    const barJuli = document.getElementById('bar-juli');
    const winText = document.getElementById('game-winner');
    
    if(!countEma || !countJuli || !barEma || !barJuli || !winText) return;

    countEma.textContent = data.ema || 0;
    countJuli.textContent = data.juli || 0;
    
    const maxTaps = Math.max(20, data.ema || 0, data.juli || 0);
    barEma.style.height = `${((data.ema || 0) / maxTaps) * 100}%`;
    barJuli.style.height = `${((data.juli || 0) / maxTaps) * 100}%`;
    
    if (data.ema > data.juli) winText.textContent = ` ¡${configEma ? configEma.user : 'Ema'} está amando más hoy!`;
    else if (data.juli > data.ema) winText.textContent = ` ¡${configJuli ? configJuli.user : 'Juli'} está amando más hoy!`;
    else if (data.ema === 0 && data.juli === 0) winText.textContent = "¡Empiecen a tocar!";
    else winText.textContent = " ¡Están empatados de amor!";
}

// --- VISOR DE FOTOS LIGHTBOX ---
const imageLightbox = document.getElementById('image-lightbox');
const lightboxImage = document.getElementById('lightbox-image');
const closeLightboxBtn = document.getElementById('close-lightbox-btn');

window.abrirLightbox = function(src) { 
    if(lightboxImage && imageLightbox) {
        lightboxImage.src = src; 
        imageLightbox.classList.remove('hidden'); 
    }
};

if(closeLightboxBtn) {
    closeLightboxBtn.addEventListener('click', () => { 
        imageLightbox.classList.add('hidden'); 
        setTimeout(() => { lightboxImage.src = ''; }, 300); 
    });
}
if(imageLightbox) {
    imageLightbox.addEventListener('click', (e) => { 
        if (e.target === imageLightbox) closeLightboxBtn.click(); 
    });
}