import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getFirestore, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCXrk3VAxS5ZOJnAVBHv0PXpqCmloGHrHY",
    authDomain: "tranquillum-tre.firebaseapp.com",
    projectId: "tranquillum-tre",
    storageBucket: "tranquillum-tre.firebasestorage.app",
    messagingSenderId: "1066281709860",
    appId: "1:1066281709860:web:4dfa140c9bd42e116183b1"
};

const appFirebase = initializeApp(firebaseConfig);
const db = getFirestore(appFirebase);

document.addEventListener('DOMContentLoaded', async () => {
    const loaderOverlay = document.getElementById('loader-overlay');
    const mainContent = document.getElementById('main-content');
    const infoBox = document.getElementById('info-box');
    const formSection = document.getElementById('firma-section');
    const alreadySignedSection = document.getElementById('already-signed-section');
    const form = document.getElementById('firma-form');
    const submitBtn = document.getElementById('submit-btn');
    const firmaStatus = document.getElementById('firma-status');
    const termsCheckbox = document.getElementById('terms-checkbox');

    // Canvas & Trazo
    const canvas = document.getElementById('signature-canvas');
    const ctx = canvas.getContext('2d');
    const placeholder = document.getElementById('signature-placeholder');
    const clearBtn = document.getElementById('clear-signature-btn');

    let isDrawing = false;
    let hasSigned = false;
    let strokeCount = 0;

    // Extraer ID de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const reservaId = urlParams.get('id');

    if (!reservaId) {
        showError("Enlace incompleto: No se especificó el ID de la reserva.");
        return;
    }

    let preReservaData = null;

    try {
        const docRef = doc(db, "firmas_prereserva", reservaId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            showError("No se encontró el registro de viaje solicitado.");
            return;
        }

        preReservaData = docSnap.data();

        // Mostrar datos en pantalla
        infoBox.innerHTML = `
            <div style="font-size: 13px; line-height: 1.6;">
                <p>Nº Registro: <strong style="color:var(--c-primary);">${reservaId}</strong></p>
                <p>Titular: <strong>${preReservaData.titular_nombre}</strong> (Doc: ${preReservaData.titular_documento || 'N/A'})</p>
                <p>Destino: <strong class="destination-highlight" style="font-size:15px;">${preReservaData.viaje_destino}</strong></p>
                <p>Hotel: <strong>${preReservaData.viaje_hotel}</strong></p>
            </div>
        `;

        if (preReservaData.terminos_aceptados && preReservaData.firma_data_url) {
            showAlreadySigned(preReservaData);
        } else {
            showForm();
        }

    } catch (err) {
        console.error(err);
        showError("Error de conexión al cargar la información del viaje.");
    }

    function showForm() {
        loaderOverlay.style.display = 'none';
        mainContent.style.display = 'block';
        formSection.style.display = 'block';
        alreadySignedSection.style.display = 'none';
        initCanvasResolution();
    }

    function showAlreadySigned(data) {
        loaderOverlay.style.display = 'none';
        mainContent.style.display = 'block';
        formSection.style.display = 'none';
        alreadySignedSection.style.display = 'block';

        document.getElementById('intro-text').style.display = 'none';
        document.getElementById('saved-signature-img').src = data.firma_data_url;
        document.getElementById('saved-signature-name').textContent = data.titular_nombre;

        let dateStr = "Fecha confirmada";
        if (data.fecha_firma) {
            const d = data.fecha_firma.toDate ? data.fecha_firma.toDate() : new Date(data.fecha_firma);
            dateStr = d.toLocaleString('es-CO');
        }
        document.getElementById('saved-signature-date').textContent = `Firmado el: ${dateStr}`;
    }

    function showError(msg) {
        loaderOverlay.style.display = 'none';
        mainContent.style.display = 'block';
        document.getElementById('form-title-section').innerHTML = `
            <div style="text-align:center; padding: 40px 10px;">
                <h2 style="color:var(--c-error); font-family: 'Montserrat', sans-serif;">Enlace No Válido</h2>
                <p style="margin-top: 10px; color: var(--c-gray); font-size: 14px;">${msg}</p>
            </div>
        `;
        formSection.style.display = 'none';
    }

    // =============================================
    // MOTOR DE CANVAS RETINA / 4K
    // =============================================
    function initCanvasResolution() {
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        const rect = canvas.parentElement.getBoundingClientRect();

        canvas.width = rect.width * ratio;
        canvas.height = 200 * ratio;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `200px`;

        ctx.scale(ratio, ratio);
        ctx.strokeStyle = '#28220d';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }

    function getCoords(e) {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    function startPosition(e) {
        e.preventDefault();
        isDrawing = true;
        hasSigned = true;
        strokeCount++;
        placeholder.style.display = 'none';
        const pos = getCoords(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
    }

    function draw(e) {
        if (!isDrawing) return;
        e.preventDefault();
        const pos = getCoords(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
    }

    function endPosition(e) {
        if (!isDrawing) return;
        e.preventDefault();
        isDrawing = false;
    }

    // Listeners Táctiles y Mouse
    canvas.addEventListener('mousedown', startPosition);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', endPosition);
    canvas.addEventListener('mouseleave', endPosition);

    canvas.addEventListener('touchstart', startPosition, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', endPosition, { passive: false });

    clearBtn.addEventListener('click', () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        hasSigned = false;
        strokeCount = 0;
        placeholder.style.display = 'flex';
        initCanvasResolution();
    });

    window.addEventListener('resize', initCanvasResolution);

    // =============================================
    // GUARDAR FIRMA
    // =============================================
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!termsCheckbox.checked) {
            alert("Debes marcar la casilla aceptando los Términos y Condiciones.");
            return;
        }

        if (!hasSigned || strokeCount < 3) {
            alert("Por favor estampa tu firma en el recuadro antes de continuar.");
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = "Procesando firma...";

        try {
            const signatureData = canvas.toDataURL('image/png');
            const docRef = doc(db, "firmas_prereserva", reservaId);
            
            const payload = {
                terminos_aceptados: true,
                firma_data_url: signatureData,
                fecha_firma: new Date()
            };

            await updateDoc(docRef, payload);

            showAlreadySigned({ ...preReservaData, ...payload });

        } catch (err) {
            console.error(err);
            firmaStatus.style.display = 'block';
            firmaStatus.style.color = 'var(--c-error)';
            firmaStatus.textContent = "Hubo un error al guardar tu firma. Intenta nuevamente.";
            submitBtn.disabled = false;
            submitBtn.textContent = "Aceptar y Enviar Firma Oficial";
        }
    });

});