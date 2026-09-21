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

// --- PERFILES DINÁMICOS ---
let configEma = { id: 'ema', user: 'emanuel', pass: '2026', name: 'Ema', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Emanuel&backgroundColor=b6e3f4' };
let configJuli = { id: 'juli', user: 'juliana', pass: '2026', name: 'Juli', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Juliana&backgroundColor=ffdfbf' };

let usuarioActualId = ''; 
let usuarioActualInfo = {};
let snapshotRecuerdosLocal = null;

// Sincronizar perfiles en tiempo real
db.collection('configuracion').doc('perfiles').onSnapshot(doc => {
    if(doc.exists) {
        const data = doc.data();
        if(data.ema) configEma = data.ema;
        if(data.juli) configJuli = data.juli;

        if(usuarioActualId === 'ema') {
            usuarioActualInfo = configEma;
            document.getElementById('user-avatar').src = configEma.avatar;
            document.getElementById('user-greeting').textContent = `¡Hola ${configEma.user}!`;
        } else if(usuarioActualId === 'juli') {
            usuarioActualInfo = configJuli;
            document.getElementById('user-avatar').src = configJuli.avatar;
            document.getElementById('user-greeting').textContent = `¡Hola ${configJuli.user}!`;
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
const navChat = document.getElementById('nav-chat'); 
const navGame = document.getElementById('nav-game'); 
const navIntimate = document.getElementById('nav-intimate');

const viewAdd = document.getElementById('view-add');
const viewGallery = document.getElementById('view-gallery');
const viewChat = document.getElementById('view-chat'); 
const viewGame = document.getElementById('view-game'); 
const viewIntimate = document.getElementById('view-intimate');

// ELEMENTOS DE CONFIGURACIÓN DE PERFIL
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
    toast.innerHTML = `<i class="ph ${icon}" style="font-size: 1.2rem; color: var(--primary-color);"></i> ${message}`;
    toastContainer.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 4000);
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
    
    document.getElementById('welcome-message').textContent = `¡Hola ${data.user}!`;
    document.getElementById('welcome-avatar').src = data.avatar;
    document.getElementById('user-greeting').textContent = `¡Hola ${data.user}!`;
    document.getElementById('user-avatar').src = data.avatar;

    loginContainer.classList.add('hidden');
    welcomeOverlay.classList.remove('oculto');
    
    setTimeout(() => {
        welcomeOverlay.classList.add('oculto');
        appContainer.classList.remove('hidden');
        document.getElementById('memory-date').value = new Date().toISOString().split('T')[0];
        inicializarListenersFirebase();
        navAdd.click(); 
    }, 3000);
}

logoutBtn.addEventListener('click', () => {
    appContainer.classList.add('hidden');
    loginContainer.classList.remove('hidden');
    usernameInput.value = ''; passwordInput.value = '';
    document.getElementById('login-error').textContent = '';
    document.body.classList.remove('sexy-theme');
    manejarMusica(false);
});

// --- MENÚ DE CONFIGURACIÓN DE PERFIL ---
if(profileBtn) {
    profileBtn.addEventListener('click', () => {
        settingsUser.value = usuarioActualInfo.user;
        settingsPass.value = usuarioActualInfo.pass;
        settingsAvatarPreview.src = usuarioActualInfo.avatar;
        newAvatarBase64 = usuarioActualInfo.avatar;
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
            name: usuarioActualInfo.name, avatar: newAvatarBase64
        };

        db.collection('configuracion').doc('perfiles').set(updateObj, { merge: true }).then(() => {
            showToast('Perfil actualizado con éxito', 'ph-check');
            settingsModal.classList.add('hidden');
            settingsSaveBtn.innerHTML = '<i class="ph ph-floppy-disk"></i> Guardar';
            settingsSaveBtn.disabled = false;
        }).catch(() => {
            showToast('Error de red al actualizar perfil', 'ph-warning');
            settingsSaveBtn.innerHTML = '<i class="ph ph-floppy-disk"></i> Guardar';
            settingsSaveBtn.disabled = false;
        });
    });
}

// --- AUDIO ---
function manejarMusica(reproducir) {
    const audio = document.getElementById('sexy-audio');
    if (!audio) return;
    reproducir ? audio.play().catch(()=>{}) : audio.pause();
}

// --- NAVEGACIÓN ---
navAdd.addEventListener('click', () => { activarPestana(navAdd, viewAdd); });
navGallery.addEventListener('click', () => { activarPestana(navGallery, viewGallery); });
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
    [navAdd, navGallery, navChat, navGame, navIntimate].forEach(btn => btn.classList.remove('active'));
    [viewAdd, viewGallery, viewChat, viewGame, viewIntimate].forEach(vista => vista.classList.add('hidden'));
    document.body.classList.remove('sexy-theme');
    manejarMusica(false);
    botonActivo.classList.add('active');
    vistaActiva.classList.remove('hidden');
}

// --- FIREBASE LISTENERS (BLINDADOS) ---
function inicializarListenersFirebase() {
    // 1. GALERÍA
    db.collection('recuerdos').orderBy('timestamp', 'desc').onSnapshot(snapshot => {
        snapshotRecuerdosLocal = snapshot; 
        cargarDatosGalerias();
    });

    // 2. CHAT
    db.collection('mensajes').orderBy('timestamp', 'asc').onSnapshot(snapshot => {
        const chatBox = document.getElementById('chat-box');
        chatBox.innerHTML = '';
        if (snapshot.empty) { chatBox.innerHTML = '<p style="text-align:center; color:var(--text-light); margin-top: 20px;">Este es su espacio. Déjale una nota linda... 💌</p>'; return; }

        snapshot.forEach(doc => {
            const msg = doc.data();
            const id = doc.id; // Necesitamos el ID para saber cuál borrar
            const msgDiv = document.createElement('div');
            msgDiv.className = msg.authorId === usuarioActualId ? 'chat-msg msg-sent' : 'chat-msg msg-received';
            msgDiv.innerHTML = `${msg.text || ''} <span class="msg-time">${msg.time || ''}</span>`;
            
            // --- LÓGICA DE MANTENER PRESIONADO (LONG PRESS) ---
            let pressTimer;
            const iniciarPresion = () => {
                // Si mantiene 700ms, se activa borrarMensaje
                pressTimer = setTimeout(() => {
                    borrarMensaje(id, msg.authorId);
                }, 700); 
            };
            const cancelarPresion = () => clearTimeout(pressTimer);

            // Eventos para celular (pantalla táctil)
            msgDiv.addEventListener('touchstart', iniciarPresion, {passive: true});
            msgDiv.addEventListener('touchend', cancelarPresion);
            msgDiv.addEventListener('touchmove', cancelarPresion);
            
            // Eventos para PC (mouse)
            msgDiv.addEventListener('mousedown', iniciarPresion);
            msgDiv.addEventListener('mouseup', cancelarPresion);
            msgDiv.addEventListener('mouseleave', cancelarPresion);
            
            // Evitar que salga el menú "copiar/pegar" del navegador al sostener
            msgDiv.addEventListener('contextmenu', e => e.preventDefault());

            chatBox.appendChild(msgDiv);
        });
        chatBox.scrollTop = chatBox.scrollHeight;
    });

    // 3. JUEGO
    db.collection('juego').doc('estadisticas').onSnapshot(doc => {
        const fechaHoy = new Date().toLocaleDateString('es-ES');
        if (!doc.exists || doc.data().fecha !== fechaHoy) {
            db.collection('juego').doc('estadisticas').set({ fecha: fechaHoy, ema: 0, juli: 0 }); return;
        }
        actualizarPantallaJuego(doc.data());
    });
}

function cargarDatosGalerias() {
    if(!snapshotRecuerdosLocal) return;
    
    const memFeed = document.getElementById('memories-feed');
    const intFeed = document.getElementById('intimate-feed');
    memFeed.innerHTML = ''; intFeed.innerHTML = '';
    let countNormales = 0; let countIntimos = 0;

    snapshotRecuerdosLocal.forEach(doc => {
        const recuerdo = doc.data(); const id = doc.id;
        
        let fechaFormateada = "Fecha no registrada";
        if (recuerdo.date) {
            try {
                const fechaObj = new Date(recuerdo.date + 'T00:00:00');
                fechaFormateada = fechaObj.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
            } catch(e) {}
        }

        let autorNombre = configEma.user;
        let autorImagen = configEma.avatar;

        if (recuerdo.authorId === 'juli' || (recuerdo.authorName && recuerdo.authorName.toLowerCase().includes('juli'))) {
            autorNombre = configJuli.user;
            autorImagen = configJuli.avatar;
        }

        // --- LÓGICA DE REACCIONES (LIKES) ---
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
                
                <!-- BOTÓN DE LIKE -->
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
}

// --- FOTOS Y CÁMARA (ALTA CALIDAD Y GIRO DE CÁMARA) ---
const fileUpload = document.getElementById('file-upload');
const photoPreviewContainer = document.getElementById('photo-preview-container');
const photoPreview = document.getElementById('photo-preview');
const photoActionsContainer = document.getElementById('photo-actions-container');

const startCameraBtn = document.getElementById('start-camera-btn');
const cameraInterface = document.getElementById('camera-interface');
const cameraStream = document.getElementById('camera-stream');
const captureBtn = document.getElementById('capture-btn');
const closeCameraBtn = document.getElementById('close-camera-btn');
const switchCameraBtn = document.getElementById('switch-camera-btn'); // Nuevo botón conectado
const cameraCanvas = document.getElementById('camera-canvas');

let videoStream = null;
let currentImageBase64 = '';
let currentFacingMode = 'environment'; // 'environment' = trasera, 'user' = frontal

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

fileUpload.addEventListener('change', (e) => {
    if (e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = ev => comprimirYMostrar(ev.target.result);
        reader.readAsDataURL(e.target.files[0]);
    }
});

// Función maestra para prender la cámara según el modo que le pidamos
async function encenderCamara(modo) {
    if (videoStream) {
        // Apagamos la cámara actual antes de cambiar a la otra
        videoStream.getTracks().forEach(track => track.stop());
    }
    try {
        videoStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: modo } });
        cameraStream.srcObject = videoStream;
    } catch (err) {
        showToast('No se pudo acceder a la cámara.', 'ph-warning');
    }
}

// Botón para abrir la cámara por primera vez
startCameraBtn.addEventListener('click', () => {
    photoActionsContainer.classList.add('hidden');
    cameraInterface.classList.remove('hidden');
    currentFacingMode = 'environment'; // Siempre arranca con la trasera por defecto
    encenderCamara(currentFacingMode);
});

// Botón para cambiar entre frontal y trasera
if (switchCameraBtn) {
    switchCameraBtn.addEventListener('click', () => {
        // Si está en trasera pasa a frontal, y viceversa
        currentFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
        encenderCamara(currentFacingMode);
    });
}

captureBtn.addEventListener('click', () => {
    cameraCanvas.width = cameraStream.videoWidth;
    cameraCanvas.height = cameraStream.videoHeight;
    // Si es cámara frontal, se voltea la imagen como un espejo para que no salga al revés
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

closeCameraBtn.addEventListener('click', () => {
    apagarCamara();
    photoActionsContainer.classList.remove('hidden');
});

function apagarCamara() {
    if (videoStream) videoStream.getTracks().forEach(track => track.stop());
    cameraInterface.classList.add('hidden');
}

// --- CHAT ---
function enviarMensaje() {
    const input = document.getElementById('chat-input');
    const texto = input.value.trim();
    if (!texto) return;

    const ahora = new Date();
    const hora = ahora.getHours().toString().padStart(2, '0') + ':' + ahora.getMinutes().toString().padStart(2, '0');

    db.collection('mensajes').add({
        text: texto, authorId: usuarioActualId, time: hora, timestamp: Date.now()
    }).then(() => { input.value = ''; });
}
document.getElementById('chat-send-btn').addEventListener('click', enviarMensaje);
document.getElementById('chat-input').addEventListener('keypress', (e) => { if (e.key === 'Enter') enviarMensaje(); });

// --- JUEGO ---
function configurarBotonesJuego() {
    const btnEma = document.getElementById('btn-tap-ema');
    const btnJuli = document.getElementById('btn-tap-juli');
    if (usuarioActualId === 'ema') {
        btnEma.disabled = false; btnEma.textContent = "Pulsar";
        btnJuli.disabled = true; btnJuli.textContent = "Bloqueado";
    } else {
        btnJuli.disabled = false; btnJuli.textContent = "Pulsar";
        btnEma.disabled = true; btnEma.textContent = "Bloqueado";
    }
}
function registrarTap(jugador) {
    if (jugador !== usuarioActualId) return;
    db.collection('juego').doc('estadisticas').update({ [jugador]: firebase.firestore.FieldValue.increment(1) });
}
document.getElementById('btn-tap-ema').addEventListener('click', () => registrarTap('ema'));
document.getElementById('btn-tap-juli').addEventListener('click', () => registrarTap('juli'));

function actualizarPantallaJuego(data) {
    document.getElementById('count-ema').textContent = data.ema || 0;
    document.getElementById('count-juli').textContent = data.juli || 0;
    const maxTaps = Math.max(20, data.ema || 0, data.juli || 0);
    document.getElementById('bar-ema').style.height = `${((data.ema || 0) / maxTaps) * 100}%`;
    document.getElementById('bar-juli').style.height = `${((data.juli || 0) / maxTaps) * 100}%`;
    const winText = document.getElementById('game-winner');
    if (data.ema > data.juli) winText.textContent = ` ¡${configEma ? configEma.user : 'Ema'} está amando más hoy!`;
    else if (data.juli > data.ema) winText.textContent = ` ¡${configJuli ? configJuli.user : 'Juli'} está amando más hoy!`;
    else if (data.ema === 0 && data.juli === 0) winText.textContent = "¡Empiecen a tocar!";
    else winText.textContent = " ¡Están empatados de amor!";
}

// --- VISOR DE FOTOS ---
const imageLightbox = document.getElementById('image-lightbox');
const lightboxImage = document.getElementById('lightbox-image');
function abrirLightbox(src) { lightboxImage.src = src; imageLightbox.classList.remove('hidden'); }
document.getElementById('close-lightbox-btn').addEventListener('click', () => { imageLightbox.classList.add('hidden'); setTimeout(() => { lightboxImage.src = ''; }, 300); });
imageLightbox.addEventListener('click', (e) => { if (e.target === imageLightbox) document.getElementById('close-lightbox-btn').click(); });

// --- FUNCIÓN PARA DAR/QUITAR LIKE EN TIEMPO REAL ---
function toggleLike(id) {
    let recuerdo = null;
    // Buscamos el recuerdo actual en nuestra memoria local
    snapshotRecuerdosLocal.forEach(doc => {
        if (doc.id === id) recuerdo = doc.data();
    });
    
    if (!recuerdo) return;

    const likesActuales = recuerdo.likes || [];
    const yaDioLike = likesActuales.includes(usuarioActualId);
    
    const recuerdoRef = db.collection('recuerdos').doc(id);

    // Si ya le había dado like, se lo quitamos; si no, se lo agregamos
    if (yaDioLike) {
        recuerdoRef.update({
            likes: firebase.firestore.FieldValue.arrayRemove(usuarioActualId)
        });
    } else {
        recuerdoRef.update({
            likes: firebase.firestore.FieldValue.arrayUnion(usuarioActualId)
        });
    }
}

// --- FUNCIÓN PARA BORRAR MENSAJE DEJANDO APRETADO ---
function borrarMensaje(idMensaje, authorId) {
    // Evitar que uno borre los mensajes del otro por accidente
    if (authorId !== usuarioActualId) {
        showToast("Solo puedes borrar tus propios mensajes", "ph-warning-circle");
        return;
    }

    // Usar la ventana de confirmación que ya existe en tu diseño
    showConfirm("¿Deseas eliminar este mensaje para ambos?", () => {
        db.collection('mensajes').doc(idMensaje).delete().then(() => {
            showToast("Mensaje borrado", "ph-trash");
        }).catch(() => {
            showToast("Error al borrar el mensaje", "ph-warning");
        });
    });
}