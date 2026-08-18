import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

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

document.addEventListener('DOMContentLoaded', () => {

    const ACCESS_PASSWORD = 'HOLA'; // Clave de acceso al panel
    const EMAILJS_PUBLIC_KEY = 'tR5np_5-KOijuN_TU';
    const EMAILJS_SERVICE_ID = 'service_ok9d87j';
    const EMAILJS_TEMPLATE_ID = 'template_bf66fuf';
    const COMPANY_EMAIL = 'info@therealescape.co';

    if (typeof emailjs !== 'undefined') {
        emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
    }

    // Elementos de Login
    const loginOverlay = document.getElementById('login-overlay');
    const loginForm = document.getElementById('login-form');
    const passwordInput = document.getElementById('password-input');
    const loginError = document.getElementById('login-error');
    const mainWrapper = document.querySelector('.wrapper');

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (passwordInput.value.trim() === ACCESS_PASSWORD) {
            loginOverlay.style.display = 'none';
            mainWrapper.style.display = 'block';
            startApp();
        } else {
            loginError.style.display = 'block';
            passwordInput.value = '';
        }
    });

    function startApp() {
        const form = document.getElementById('pre-reserva-form');
        const formTitleSection = document.getElementById('form-title-section');
        const formSection = document.getElementById('form-section');
        const confirmationSection = document.getElementById('confirmation-section');
        const loaderOverlay = document.getElementById('loader-overlay');
        const loaderText = document.getElementById('loader-text');
        const passengersContainer = document.getElementById('passengers-container');
        const addPassengerBtn = document.getElementById('add-passenger-btn');
        const downloadAndEmailBtn = document.getElementById('download-and-email-btn');
        const editBtn = document.getElementById('edit-btn');
        const newBtn = document.getElementById('new-btn');
        const emailStatus = document.getElementById('email-status');

        const docTypeSelect = document.getElementById('tipo-documento');
        const abonoGroup = document.getElementById('abono-group');
        const saldoGroup = document.getElementById('saldo-group');
        const submitBtn = document.getElementById('submit-btn');

        let passengerCount = 0;

        // Toggle Pre-Reserva vs Confirmación
        docTypeSelect.addEventListener('change', () => {
            const isConfirmation = docTypeSelect.value === 'confirmacion';
            abonoGroup.style.display = isConfirmation ? 'none' : 'block';
            saldoGroup.style.display = isConfirmation ? 'none' : 'block';
            document.getElementById('viaje-abono').required = !isConfirmation;
            submitBtn.textContent = isConfirmation ? 'Generar Confirmación de Reserva' : 'Generar Pre-Reserva de Viaje';
        });

        // Toggle Checklist Inputs
        const bindChecklist = (checkId, inputId) => {
            const chk = document.getElementById(checkId);
            const inp = document.getElementById(inputId);
            if (chk && inp) {
                chk.addEventListener('change', () => { inp.style.display = chk.checked ? 'block' : 'none'; });
            }
        };
        bindChecklist('check-vuelos', 'detail-vuelos');
        bindChecklist('check-hotel', 'detail-hotel');
        bindChecklist('check-traslados', 'detail-traslados');
        bindChecklist('check-tours', 'detail-tours');
        bindChecklist('check-seguro', 'detail-seguro');

        // Formateo de Dinero
        const formatMoney = (val) => Number(String(val).replace(/\D/g, "")).toLocaleString('es-CO');
        
        const bindMoneyInput = (elem) => {
            if (!elem) return;
            elem.addEventListener('input', (e) => {
                const clean = e.target.value.replace(/\D/g, "");
                e.target.value = clean ? Number(clean).toLocaleString('es-CO') : "";
                calculateBalance();
            });
        };

        const calculateBalance = () => {
            const total = parseInt(document.getElementById('viaje-valor-total').value.replace(/\./g, "")) || 0;
            const abono = parseInt(document.getElementById('viaje-abono').value.replace(/\./g, "")) || 0;
            const saldoElem = document.getElementById('viaje-saldo-pendiente');
            const saldo = total - abono;
            saldoElem.value = saldo >= 0 ? saldo.toLocaleString('es-CO') : "0";
        };

        bindMoneyInput(document.getElementById('viaje-valor-total'));
        bindMoneyInput(document.getElementById('viaje-abono'));

        // Cálculo de Noches
        const checkinInput = document.getElementById('viaje-checkin');
        const checkoutInput = document.getElementById('viaje-checkout');
        const nochesInput = document.getElementById('viaje-noches');

        const calculateNights = () => {
            if (checkinInput.value && checkoutInput.value) {
                const d1 = new Date(checkinInput.value + 'T00:00:00');
                const d2 = new Date(checkoutInput.value + 'T00:00:00');
                const diff = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
                nochesInput.value = diff > 0 ? `${diff} noche${diff > 1 ? 's' : ''}` : 'Fecha inválida';
            }
        };
        checkinInput.addEventListener('change', calculateNights);
        checkoutInput.addEventListener('change', calculateNights);

        // Añadir Acompañantes
        addPassengerBtn.addEventListener('click', () => {
            passengerCount++;
            const card = document.createElement('div');
            card.className = 'passenger-card';
            card.id = `pax-card-${passengerCount}`;
            card.innerHTML = `
                <div class="passenger-card-header">
                    <span>Acompañante ${passengerCount}</span>
                    <button type="button" class="remove-passenger-btn" data-id="${passengerCount}">&times;</button>
                </div>
                <div class="form-grid">
                    <div class="form-group full-width"><label>Nombre Completo</label><input type="text" id="pax-nombre-${passengerCount}" required></div>
                    <div class="form-group"><label>Cédula / Pasaporte</label><input type="text" id="pax-doc-${passengerCount}" required></div>
                    <div class="form-group"><label>Fecha de Nacimiento</label><input type="date" id="pax-nac-${passengerCount}" required></div>
                </div>
            `;
            passengersContainer.appendChild(card);
        });

        passengersContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-passenger-btn')) {
                const card = document.getElementById(`pax-card-${e.target.dataset.id}`);
                if (card) card.remove();
            }
        });

        function resetForm() {
            form.reset();
            passengersContainer.innerHTML = '';
            passengerCount = 0;
            const now = new Date();
            const num = `TRE-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
            document.getElementById('pre-reserva-numero').value = num;
        }

        const setLoader = (state, text = "Procesando...") => {
            loaderOverlay.style.display = state ? 'flex' : 'none';
            loaderText.textContent = text;
        };

        // Enviar Formulario y Mostrar Documento
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            setLoader(true, "Guardando Reserva...");

            const preReservaNum = document.getElementById('pre-reserva-numero').value;
            const isConfirmation = docTypeSelect.value === 'confirmacion';
            const total = document.getElementById('viaje-valor-total').value;
            const abono = isConfirmation ? total : document.getElementById('viaje-abono').value;
            const saldo = isConfirmation ? "0" : document.getElementById('viaje-saldo-pendiente').value;

            try {
                // Guardar en Firestore
                await setDoc(doc(db, "firmas_prereserva", preReservaNum), {
                    tipo_documento: docTypeSelect.value,
                    titular_nombre: document.getElementById('titular-nombre').value,
                    titular_email: document.getElementById('titular-email').value,
                    titular_documento: document.getElementById('titular-documento').value,
                    titular_telefono: document.getElementById('titular-telefono').value,
                    viaje_destino: document.getElementById('viaje-destino').value,
                    viaje_hotel: document.getElementById('viaje-hotel').value,
                    viaje_localizador: document.getElementById('viaje-localizador').value || 'POR ASIGNAR',
                    valor_total: total,
                    abono_realizado: abono,
                    saldo_pendiente: saldo,
                    fecha_creacion: new Date(),
                    terminos_aceptados: false,
                    firma_data_url: null
                });

                // Renderizar Vista Previa
                renderPreview(isConfirmation);

                formTitleSection.style.display = 'none';
                formSection.style.display = 'none';
                confirmationSection.style.display = 'block';
                window.scrollTo(0, 0);

            } catch (err) {
                console.error(err);
                alert("Error al conectar con la base de datos.");
            } finally {
                setLoader(false);
            }
        });

        function renderPreview(isConfirmation) {
            const num = document.getElementById('pre-reserva-numero').value;
            const loc = document.getElementById('viaje-localizador').value || 'POR ASIGNAR';
            
            document.getElementById('confirm-pill-text').textContent = isConfirmation ? 'Confirmación de Reserva' : 'Pre-Reserva de Viaje';
            document.getElementById('confirm-info-box').innerHTML = `
                <div style="display: flex; justify-content: space-between; flex-wrap: wrap;">
                    <span>Nº REGISTRO: <strong style="color:var(--c-primary);">${num}</strong></span>
                    <span>LOCALIZADOR: <strong style="color:var(--c-terracotta);">${loc}</strong></span>
                </div>
            `;

            document.getElementById('confirm-titular-grid').innerHTML = `
                <div class="form-group"><label>Nombre</label><p style="font-weight:700;">${document.getElementById('titular-nombre').value}</p></div>
                <div class="form-group"><label>Documento</label><p style="font-weight:700;">${document.getElementById('titular-documento').value}</p></div>
                <div class="form-group"><label>Email</label><p>${document.getElementById('titular-email').value}</p></div>
                <div class="form-group"><label>Teléfono</label><p>${document.getElementById('titular-telefono').value}</p></div>
            `;

            document.getElementById('confirm-viaje-grid').innerHTML = `
                <div class="form-group full-width"><label>Destino</label><p class="destination-highlight">${document.getElementById('viaje-destino').value}</p></div>
                <div class="form-group full-width"><label>Hotel</label><p class="hotel-highlight">${document.getElementById('viaje-hotel').value}</p></div>
                <div class="form-group"><label>Check-in</label><p>${document.getElementById('viaje-checkin').value}</p></div>
                <div class="form-group"><label>Check-out</label><p>${document.getElementById('viaje-checkout').value}</p></div>
                <div class="form-group"><label>Estadía</label><p>${document.getElementById('viaje-noches').value}</p></div>
                <div class="form-group"><label>Régimen</label><p>${document.getElementById('viaje-regimen').value}</p></div>
            `;

            // Pasajeros
            let paxHtml = `<div style="padding: 12px 18px; border-bottom: 1px solid var(--c-border); font-size: 13px;"><strong>1. ${document.getElementById('titular-nombre').value}</strong> (Titular) — Doc: ${document.getElementById('titular-documento').value}</div>`;
            const paxCards = passengersContainer.querySelectorAll('.passenger-card');
            paxCards.forEach((card, idx) => {
                const id = card.id.replace('pax-card-', '');
                paxHtml += `<div style="padding: 10px 18px; border-bottom: 1px solid var(--c-border); font-size: 13px;"><strong>${idx + 2}. ${document.getElementById(`pax-nombre-${id}`).value}</strong> — Doc: ${document.getElementById(`pax-doc-${id}`).value}</div>`;
            });
            document.getElementById('confirm-pasajeros-body').innerHTML = paxHtml;

            // Servicios
            const srvs = [
                { id: 'vuelos', label: 'Vuelos' }, { id: 'hotel', label: 'Hotel' },
                { id: 'traslados', label: 'Traslados' }, { id: 'tours', label: 'Tours' }, { id: 'seguro', label: 'Seguro' }
            ];
            let srvHtml = '';
            srvs.forEach(s => {
                const isChk = document.getElementById(`check-${s.id}`).checked;
                const txt = document.getElementById(`detail-${s.id}`).value;
                if (isChk) {
                    srvHtml += `<div style="padding: 6px 0; font-size: 13px;">✅ <strong>${s.label}:</strong> ${txt}</div>`;
                }
            });
            document.getElementById('confirm-services-list').innerHTML = srvHtml || '<p style="font-size:12px; color:gray;">Ninguno seleccionado.</p>';

            // Finanzas
            const total = document.getElementById('viaje-valor-total').value;
            const abono = isConfirmation ? total : document.getElementById('viaje-abono').value;
            const saldo = isConfirmation ? "0" : document.getElementById('viaje-saldo-pendiente').value;

            document.getElementById('confirm-finanzas-grid').innerHTML = `
                <div style="display:flex; justify-content:space-between; padding:6px 0; font-size:13px;"><span>Total Plan:</span><strong>$${total} COP</strong></div>
                <div style="display:flex; justify-content:space-between; padding:6px 0; font-size:13px;"><span>Abonado:</span><strong style="color:var(--c-primary);">$${abono} COP</strong></div>
                <div style="display:flex; justify-content:space-between; padding:8px 0; border-top:1px solid var(--c-border); font-size:15px; font-weight:800;"><span>Saldo Pendiente:</span><strong style="color:var(--c-terracotta);">$${saldo} COP</strong></div>
            `;

            // Firma box toggle
            document.getElementById('confirm-firma-box-section').style.display = isConfirmation ? 'none' : 'block';
            document.getElementById('remote-signature-url').textContent = `https://tre-reservas.web.app/firma.html?id=${num}`;
        }

        // Descargar PDF y Enviar Email
        downloadAndEmailBtn.addEventListener('click', async () => {
            downloadAndEmailBtn.disabled = true;
            setLoader(true, "Generando PDF y enviando notificación...");

            try {
                const num = document.getElementById('pre-reserva-numero').value;
                const isConfirmation = docTypeSelect.value === 'confirmacion';
                const voucherElem = document.getElementById('voucher-to-print');

                // 1. PDF
                const canvas = await html2canvas(voucherElem, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
                const pdf = new window.jspdf.jsPDF({ orientation: 'p', unit: 'pt', format: [canvas.width * 0.75, canvas.height * 0.75] });
                pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, canvas.width * 0.75, canvas.height * 0.75);
                pdf.save(`${isConfirmation ? 'Confirmacion' : 'PreReserva'}_TRE_${num}.pdf`);

                // 2. EmailJS
                let checklistText = '';
                ['vuelos', 'hotel', 'traslados', 'tours', 'seguro'].forEach(id => {
                    if (document.getElementById(`check-${id}`).checked) {
                        checklistText += `• ${id.toUpperCase()}: ${document.getElementById(`detail-${id}`).value}\n`;
                    }
                });

                let paxListText = `1. ${document.getElementById('titular-nombre').value} (Titular)`;
                passengersContainer.querySelectorAll('.passenger-card').forEach((c, i) => {
                    const id = c.id.replace('pax-card-', '');
                    paxListText += `\n${i + 2}. ${document.getElementById(`pax-nombre-${id}`).value}`;
                });

                await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
                    to_email: document.getElementById('titular-email').value,
                    to_name: document.getElementById('titular-nombre').value,
                    company_email: COMPANY_EMAIL,
                    pre_reserva_num: num,
                    tipo_documento: isConfirmation ? 'Confirmación de Reserva' : 'Pre-Reserva de Viaje',
                    destino: document.getElementById('viaje-destino').value,
                    hotel: document.getElementById('viaje-hotel').value,
                    checkin: document.getElementById('viaje-checkin').value,
                    checkout: document.getElementById('viaje-checkout').value,
                    localizador: document.getElementById('viaje-localizador').value || 'POR ASIGNAR',
                    total_plan: `$${document.getElementById('viaje-valor-total').value} COP`,
                    abono_realizado: `$${isConfirmation ? document.getElementById('viaje-valor-total').value : document.getElementById('viaje-abono').value} COP`,
                    saldo_pendiente: `$${isConfirmation ? '0' : document.getElementById('viaje-saldo-pendiente').value} COP`,
                    checklist_servicios: checklistText,
                    pasajeros: paxListText,
                    observaciones: document.getElementById('observaciones').value || 'Ninguna'
                });

                emailStatus.style.display = 'block';
                emailStatus.style.backgroundColor = 'rgba(32, 70, 40, 0.1)';
                emailStatus.style.color = '#204628';
                emailStatus.textContent = `✅ Documento descargado y correo enviado a ${document.getElementById('titular-email').value}`;

            } catch (err) {
                console.error(err);
                emailStatus.style.display = 'block';
                emailStatus.style.backgroundColor = '#ffeaea';
                emailStatus.style.color = '#e53e3e';
                emailStatus.textContent = `⚠️ PDF generado, pero hubo un detalle con el correo: ${err.message || 'Error de envío'}`;
            } finally {
                setLoader(false);
                downloadAndEmailBtn.disabled = false;
            }
        });

        editBtn.addEventListener('click', () => {
            confirmationSection.style.display = 'none';
            formTitleSection.style.display = 'block';
            formSection.style.display = 'block';
            window.scrollTo(0, 0);
        });

        newBtn.addEventListener('click', () => {
            confirmationSection.style.display = 'none';
            formTitleSection.style.display = 'block';
            formSection.style.display = 'block';
            resetForm();
            window.scrollTo(0, 0);
        });

        resetForm();
    }
});