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
    if(splashScreen) {
        setTimeout(() => {
            splashScreen.style.opacity = '0';
            splashScreen.style.visibility = 'hidden';
            setTimeout(() => splashScreen.remove(), 800);
        }, 1500);
    }

    // Init Particles
    initParticles();

    // Escuchar clicks de los botones de navegación
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            switchSection(targetId);
            
            navBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // Iniciar con la sección "horarios" visible
    switchSection('horarios');

    // Inyectar datos de la API globalmente
    fetchHorarios();
    fetchServicios();
    fetchContacto();
});

/* --- Tab Navigation Logic (Cross-fade) --- */
function switchSection(targetId) {
    const fadeDuration = 400; // ms

    sections.forEach(section => {
        if (section.classList.contains('active') && section.id !== targetId) {
            // Fade out current section
            section.classList.remove('active');
            setTimeout(() => {
                section.classList.add('hidden');
            }, fadeDuration);
        }
    });

    // Fade in new section
    setTimeout(() => {
        sections.forEach(section => {
            if (section.id === targetId) {
                section.classList.remove('hidden');
                // Allow display: block to apply before fading in
                setTimeout(() => section.classList.add('active'), 50);
            }
        });
    }, fadeDuration);
}

/* --- Particle Generator --- */
function initParticles() {
    if(!particlesContainer) return;
    const maxParticles = 25;
    
    setInterval(() => {
        if(particlesContainer.childElementCount < maxParticles) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            // Random properties
            const size = Math.random() * 3 + 1; // 1px - 4px
            const left = Math.random() * 100; // 0% - 100%
            const duration = Math.random() * 8 + 6; // 6s - 14s
            
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.left = `${left}vw`;
            particle.style.top = '100vh';
            particle.style.animationDuration = `${duration}s`;
            
            particlesContainer.appendChild(particle);
            
            // Cleanup
            setTimeout(() => {
                if(particle.parentNode) particle.remove();
            }, duration * 1000);
        }
    }, 800);
}

/* --- Fetches from Google Sheets APIs --- */

// Horarios
async function fetchHorarios() {
    try {
        const response = await fetch(API_HORARIOS);
        const data = await response.json();
        renderHorarios(data);
    } catch (error) {
        console.error("Error fetching Horarios:", error);
        horariosContainer.innerHTML = '<p class="card-content">No se pudieron cargar los horarios en este momento.</p>';
    }
}

function renderHorarios(data) {
    horariosContainer.innerHTML = '';

    // Separate regular activities from talleres
    const actividades = data.filter(item => (item.Actividad || '').toLowerCase() !== 'taller');
    const talleres = data.filter(item => (item.Actividad || '').toLowerCase() === 'taller');

    // --- Group: Actividades Semanales ---
    if (actividades.length > 0) {
        const actHeader = document.createElement('h2');
        actHeader.className = 'group-title fade-in';
        actHeader.textContent = 'Actividades Semanales';
        horariosContainer.appendChild(actHeader);

        // Group activities by name
        const grouped = {};
        actividades.forEach(item => {
            const name = item.Actividad || 'Actividad';
            if (!grouped[name]) grouped[name] = [];
            grouped[name].push(item);
        });

        Object.keys(grouped).forEach(actName => {
            const card = document.createElement('div');
            card.className = 'card fade-in actividad-card';

            const desc = grouped[actName][0].Descripcion || '';

            let scheduleRows = '';
            grouped[actName].forEach(item => {
                const dia = item['Día'] || item.Dia || '';
                const hora = item.Hora || item.Horario || '--:--';
                const cupos = item.Cupos || '';
                scheduleRows += `
                    <tr>
                        <td>${dia}</td>
                        <td>${hora}</td>
                        <td>${cupos ? cupos + ' cupos' : ''}</td>
                    </tr>`;
            });

            card.innerHTML = `
                <h2 class="card-title">${actName}</h2>
                ${desc ? `<p class="card-subtitle">${desc}</p>` : ''}
                <table class="schedule-table">
                    <thead>
                        <tr>
                            <th>Día</th>
                            <th>Hora</th>
                            <th>Cupos</th>
                        </tr>
                    </thead>
                    <tbody>${scheduleRows}</tbody>
                </table>
            `;
            horariosContainer.appendChild(card);
        });
    }

    // --- Group: Talleres Especiales ---
    if (talleres.length > 0) {
        const tallerHeader = document.createElement('h2');
        tallerHeader.className = 'group-title fade-in';
        tallerHeader.textContent = 'Talleres Especiales';
        horariosContainer.appendChild(tallerHeader);

        talleres.forEach(item => {
            const card = document.createElement('div');
            card.className = 'card fade-in taller-card';

            const nombre = item.Descripcion || 'Taller';
            const fecha = item.Fecha || '';
            const hora = item.Hora || item.Horario || '--:--';
            const cupos = item.Cupos || '';
            const estado = item.Estado || '';

            card.innerHTML = `
                <h2 class="card-title">${nombre}</h2>
                <div class="taller-details">
                    ${fecha ? `<p class="taller-date">📅 ${fecha}</p>` : ''}
                    <p class="taller-time">🕐 ${hora}</p>
                    ${cupos ? `<p class="taller-cupos">${cupos} cupos disponibles</p>` : ''}
                    ${estado ? `<span class="taller-badge">${estado}</span>` : ''}
                </div>
            `;
            horariosContainer.appendChild(card);
        });
    }
}

// Servicios
async function fetchServicios() {
    try {
        const response = await fetch(API_SERVICIOS);
        const data = await response.json();
        renderServicios(data);
    } catch (error) {
        console.error("Error fetching Servicios:", error);
        serviciosContainer.innerHTML = '<p class="card-content">No se pudieron cargar los servicios en este momento.</p>';
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

// Contacto
async function fetchContacto() {
    try {
        const response = await fetch(API_CONTACTO);
        const data = await response.json();
        if(data && data.length > 0) renderContacto(data[0]);
    } catch (error) {
        console.error("Error fetching Contacto:", error);
        contactoContainer.innerHTML = '<p class="card-content">No se pudo cargar la información de contacto.</p>';
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
