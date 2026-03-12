/* --- API Endpoints --- */
const API_HORARIOS = "https://opensheet.elk.sh/1Tdxx6a3nKK8JmQvL8BwVzJhbFalWcHEAgd07cmt9uG0/Horarios";
const API_SERVICIOS = "https://opensheet.elk.sh/1Tdxx6a3nKK8JmQvL8BwVzJhbFalWcHEAgd07cmt9uG0/Servicios";
const API_CONTACTO = "https://opensheet.elk.sh/1Tdxx6a3nKK8JmQvL8BwVzJhbFalWcHEAgd07cmt9uG0/Contacto";

/* --- DOM Selection --- */
const navBtns = document.querySelectorAll('.nav-btn');
const sections = document.querySelectorAll('.view-section');

const horariosContainer = document.getElementById('horarios-container');
const serviciosContainer = document.getElementById('servicios-container');
const contactoContainer = document.getElementById('contacto-container');
const headerSlogan = document.getElementById('header-slogan');
const splashScreen = document.getElementById('splash-screen');
const particlesContainer = document.getElementById('particles-container');

/* --- Service Worker Registration --- */
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('images/sw.js')
            .then(reg => console.log('Service Worker registrado con éxito.', reg))
            .catch(err => console.error('Fallo en el registro del Service Worker:', err));
    });
}

/* --- Initialization --- */
document.addEventListener('DOMContentLoaded', () => {
    // Splash Screen Logic
    if (splashScreen) {
        setTimeout(() => {
            splashScreen.style.opacity = '0';
            splashScreen.style.visibility = 'hidden';
            setTimeout(() => splashScreen.remove(), 800);
        }, 1500);
    }

    // Init Particles
    initParticles();

    // Navigation
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            switchSection(targetId);
            navBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    switchSection('horarios');

    // Fetch all data
    fetchHorarios();
    fetchServicios();
    fetchContacto();
});

/* --- Tab Navigation Logic (Cross-fade) --- */
function switchSection(targetId) {
    const fadeDuration = 400;
    sections.forEach(section => {
        if (section.classList.contains('active') && section.id !== targetId) {
            section.classList.remove('active');
            setTimeout(() => section.classList.add('hidden'), fadeDuration);
        }
    });
    setTimeout(() => {
        sections.forEach(section => {
            if (section.id === targetId) {
                section.classList.remove('hidden');
                setTimeout(() => section.classList.add('active'), 50);
            }
        });
    }, fadeDuration);
}

/* --- Particle Generator --- */
function initParticles() {
    if (!particlesContainer) return;
    const maxParticles = 25;
    setInterval(() => {
        if (particlesContainer.childElementCount < maxParticles) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            const size = Math.random() * 3 + 1;
            const left = Math.random() * 100;
            const duration = Math.random() * 8 + 6;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.left = `${left}vw`;
            particle.style.top = '100vh';
            particle.style.animationDuration = `${duration}s`;
            particlesContainer.appendChild(particle);
            setTimeout(() => { if (particle.parentNode) particle.remove(); }, duration * 1000);
        }
    }, 800);
}

/* --- Utility: Capitalize first letter --- */
function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/* --- Day ordering helper --- */
const DAY_ORDER = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
function dayIndex(day) {
    return DAY_ORDER.indexOf((day || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace('miercoles', 'miércoles'));
}

/* ====================================================
   HORARIOS
   ==================================================== */
async function fetchHorarios() {
    try {
        const response = await fetch(API_HORARIOS);
        const data = await response.json();
        renderHorarios(data);
    } catch (error) {
        console.error("Error fetching Horarios:", error);
        horariosContainer.innerHTML = '<p class="error-msg">No se pudieron cargar los horarios en este momento.</p>';
    }
}

function renderHorarios(data) {
    horariosContainer.innerHTML = '';

    // Detect column mapping: the API may use "Nombre" or "Actividad" for the type field
    // and "Descripcion" or "Actividad" for the actual activity name
    const getType = (item) => {
        // "Nombre" column holds "Actividad" or "Taller"
        if (item.Nombre && (item.Nombre.toLowerCase() === 'actividad' || item.Nombre.toLowerCase() === 'taller')) {
            return item.Nombre.toLowerCase();
        }
        // Fallback: "Actividad" column may hold "Taller" or the activity name directly
        if (item.Actividad) {
            if (item.Actividad.toLowerCase() === 'taller') return 'taller';
            return 'actividad';
        }
        return 'actividad';
    };

    const getName = (item) => {
        const type = getType(item);
        // If type comes from "Nombre" column, the real name is in "Descripcion"
        if (item.Nombre && (item.Nombre.toLowerCase() === 'actividad' || item.Nombre.toLowerCase() === 'taller')) {
            return item.Descripcion || item.Actividad || 'Sin nombre';
        }
        // Otherwise, the name is in "Actividad" directly
        return item.Actividad || item.Descripcion || 'Sin nombre';
    };

    const actividades = data.filter(item => getType(item) === 'actividad');
    const talleres = data.filter(item => getType(item) === 'taller');

    // ─── ACTIVIDADES SEMANALES ───
    if (actividades.length > 0) {
        const section = document.createElement('div');
        section.className = 'horarios-group fade-in';
        section.innerHTML = `
            <div class="group-header">
                <span class="group-icon">🧘</span>
                <h2 class="group-title">Actividades Semanales</h2>
            </div>
        `;

        // Group by activity name
        const grouped = {};
        actividades.forEach(item => {
            const name = getName(item);
            if (!grouped[name]) grouped[name] = [];
            grouped[name].push(item);
        });

        const cardsGrid = document.createElement('div');
        cardsGrid.className = 'actividades-grid';

        Object.keys(grouped).forEach(actName => {
            const items = grouped[actName];
            // Sort by day order, then by time
            items.sort((a, b) => {
                const dA = dayIndex(a['Día'] || a.Dia || '');
                const dB = dayIndex(b['Día'] || b.Dia || '');
                if (dA !== dB) return dA - dB;
                return (a.Hora || '').localeCompare(b.Hora || '');
            });

            const card = document.createElement('div');
            card.className = 'act-card';

            let rows = '';
            items.forEach(item => {
                const dia = capitalize(item['Día'] || item.Dia || '');
                const hora = item.Hora || item.Horario || '--:--';
                const cupos = item.Cupos || '';
                const estado = item.Estado || '';
                rows += `
                    <tr>
                        <td class="day-cell">${dia}</td>
                        <td class="time-cell">${hora}</td>
                        <td class="cupos-cell">${cupos}</td>
                    </tr>`;
            });

            card.innerHTML = `
                <div class="act-card-header">
                    <h3 class="act-name">${actName}</h3>
                </div>
                <div class="act-card-body">
                    <table class="schedule-table">
                        <thead>
                            <tr>
                                <th>Día</th>
                                <th>Hora</th>
                                <th>Cupos</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
            `;
            cardsGrid.appendChild(card);
        });

        section.appendChild(cardsGrid);
        horariosContainer.appendChild(section);
    }

    // ─── TALLERES ESPECIALES ───
    if (talleres.length > 0) {
        const section = document.createElement('div');
        section.className = 'horarios-group fade-in';
        section.innerHTML = `
            <div class="group-header">
                <span class="group-icon">✨</span>
                <h2 class="group-title">Talleres Especiales</h2>
            </div>
        `;

        // Sort talleres by date
        talleres.sort((a, b) => {
            const parseDate = (str) => {
                if (!str) return new Date(9999, 0);
                const parts = str.split('/');
                if (parts.length === 3) return new Date(parts[2], parts[1] - 1, parts[0]);
                return new Date(9999, 0);
            };
            return parseDate(a.Fecha) - parseDate(b.Fecha);
        });

        const cardsGrid = document.createElement('div');
        cardsGrid.className = 'talleres-grid';

        talleres.forEach(item => {
            const nombre = getName(item);
            const fecha = item.Fecha || '';
            const dia = capitalize(item['Día'] || item.Dia || '');
            const hora = item.Hora || item.Horario || '--:--';
            const cupos = item.Cupos || '';
            const estado = item.Estado || '';

            // Parse date for nice display
            let fechaDisplay = fecha;
            if (fecha) {
                const parts = fecha.split('/');
                if (parts.length === 3) {
                    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                    fechaDisplay = `${parseInt(parts[0])} ${months[parseInt(parts[1]) - 1]} ${parts[2]}`;
                }
            }

            const card = document.createElement('div');
            card.className = 'taller-card';

            card.innerHTML = `
                <div class="taller-card-accent"></div>
                <h3 class="taller-name">${nombre}</h3>
                <div class="taller-info">
                    ${fechaDisplay ? `<div class="taller-meta"><span class="meta-icon">📅</span><span class="meta-text">${fechaDisplay}</span></div>` : ''}
                    ${dia ? `<div class="taller-meta"><span class="meta-icon">📆</span><span class="meta-text">${dia}</span></div>` : ''}
                    <div class="taller-meta"><span class="meta-icon">🕐</span><span class="meta-text">${hora}</span></div>
                    ${cupos ? `<div class="taller-meta"><span class="meta-icon">👥</span><span class="meta-text">${cupos} cupos</span></div>` : ''}
                </div>
                ${estado ? `<span class="taller-badge">${estado}</span>` : ''}
            `;
            cardsGrid.appendChild(card);
        });

        section.appendChild(cardsGrid);
        horariosContainer.appendChild(section);
    }
}

/* ====================================================
   SERVICIOS
   ==================================================== */
async function fetchServicios() {
    try {
        const response = await fetch(API_SERVICIOS);
        const data = await response.json();
        renderServicios(data);
    } catch (error) {
        console.error("Error fetching Servicios:", error);
        serviciosContainer.innerHTML = '<p class="error-msg">No se pudieron cargar los servicios en este momento.</p>';
    }
}

function renderServicios(data) {
    serviciosContainer.innerHTML = '';
    data.forEach(item => {
        const card = document.createElement('div');
        card.className = 'card fade-in';
        card.innerHTML = `
            <h2 class="card-title">${item.Nombre}</h2>
            <div class="card-content">
                <p style="margin-bottom:15px; font-style: italic; color: #f4f4f4;">${item.Descripción || item.Descripcion || ''}</p>
                <strong>Duración:</strong> ${item.Duración || item.Duracion || 'N/A'}<br>
                <strong style="color:var(--gold)">Inversión:</strong> $${item.Precio || 'N/A'}
            </div>
        `;
        serviciosContainer.appendChild(card);
    });
}

/* ====================================================
   CONTACTO (also loads slogan into header)
   ==================================================== */
async function fetchContacto() {
    try {
        const response = await fetch(API_CONTACTO);
        const data = await response.json();
        if (data && data.length > 0) {
            // Inject slogan into header
            if (headerSlogan && data[0].Slogan) {
                headerSlogan.textContent = data[0].Slogan;
                headerSlogan.style.opacity = '1';
            }
            renderContacto(data[0]);
        }
    } catch (error) {
        console.error("Error fetching Contacto:", error);
        contactoContainer.innerHTML = '<p class="error-msg">No se pudo cargar la información de contacto.</p>';
    }
}

function renderContacto(info) {
    contactoContainer.innerHTML = '';
    const whatsappClean = (info.WhatsApp || '').replace(/\D/g, '');
    const card = document.createElement('div');
    card.className = 'card fade-in';

    card.innerHTML = `
        <h2 class="card-title">Comunícate Conmigo</h2>
        <div class="card-content" style="text-align: left; padding: 0 5%;">
            <p style="text-align: center; margin-bottom: 25px; color: #f4f4f4;">Inicia tu proceso de sanación.</p>
            
            <p style="margin-bottom: 12px;"><strong>📍 Dirección:</strong> ${info.Dirección || info.Direccion}</p>
            <p style="margin-bottom: 12px;"><strong>📞 Teléfono:</strong> <a href="tel:${info.Teléfono || info.Telefono}" style="color:var(--text-light); text-decoration:none;">${info.Teléfono || info.Telefono}</a></p>
            <p style="margin-bottom: 12px;"><strong>✉️ Email:</strong> <a href="mailto:${info.Email || info.Correo}" style="color:var(--gold); text-decoration:none;">${info.Email || info.Correo}</a></p>
            <p style="margin-bottom: 30px;"><strong>🕰️ Horario:</strong> ${info.Horario}</p>

            <div style="text-align: center;">
                <a href="https://wa.me/${whatsappClean}" target="_blank" class="contact-btn">WhatsApp Directo</a>
            </div>
        </div>
    `;
    contactoContainer.appendChild(card);
}
