/* --- API Endpoints --- */
const API_HORARIOS = "https://opensheet.elk.sh/1Tdxx6a3nKK8JmQvL8BwVzJhbFalWcHEAgd07cmt9uG0/Horarios";
const API_SERVICIOS = "https://opensheet.elk.sh/1Tdxx6a3nKK8JmQvL8BwVzJhbFalWcHEAgd07cmt9uG0/Servicios";
const API_CONTACTO = "https://opensheet.elk.sh/1Tdxx6a3nKK8JmQvL8BwVzJhbFalWcHEAgd07cmt9uG0/Contacto";

/* --- DOM Selection --- */
const navBtns = document.querySelectorAll('.nav-btn');
const sections = document.querySelectorAll('.view-section');

const horariosContainer = document.querySelector('.horarios-section-wrapper');
const actividadesCarousel = document.getElementById('actividades-carousel');
const talleresCarousel = document.getElementById('talleres-carousel');
const daysTabs = document.getElementById('days-tabs');
const actividadesDots = document.getElementById('actividades-dots');
const talleresDots = document.getElementById('talleres-dots');

const serviciosContainer = document.getElementById('servicios-container');
const contactoContainer = document.getElementById('contacto-container');
const headerSlogan = document.getElementById('header-slogan');
const splashScreen = document.getElementById('splash-screen');
const particlesContainer = document.getElementById('particles-container');

// Global state for Horarios
let allHorariosData = [];
let currentDay = '';

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

    // Set current day (default)
    const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    currentDay = days[new Date().getDay()];

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

    // Create Overlay for expanded cards
    const overlay = document.createElement('div');
    overlay.className = 'card-overlay';
    overlay.id = 'card-overlay';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', closeExpandedCard);
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
   HORARIOS PREMIUM LOGIC
   ==================================================== */
async function fetchHorarios() {
    try {
        const response = await fetch(API_HORARIOS);
        allHorariosData = await response.json();
        renderHorariosTabs();
        renderHorarios();
    } catch (error) {
        console.error("Error fetching Horarios:", error);
        if (actividadesCarousel) actividadesCarousel.innerHTML = '<p class="error-msg">No se pudieron cargar los horarios.</p>';
    }
}

function renderHorariosTabs() {
    if (!daysTabs) return;
    daysTabs.innerHTML = '';
    DAY_ORDER.forEach(day => {
        const tab = document.createElement('div');
        tab.className = `day-tab ${day === currentDay ? 'active' : ''}`;
        tab.textContent = capitalize(day);
        tab.addEventListener('click', () => {
            currentDay = day;
            document.querySelectorAll('.day-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderHorarios();
        });
        daysTabs.appendChild(tab);
    });
}

function renderHorarios() {
    if (!actividadesCarousel || !talleresCarousel) return;

    // Detect column mapping
    const getTypeMapping = (item) => {
        if (item.Nombre && (item.Nombre.toLowerCase() === 'actividad' || item.Nombre.toLowerCase() === 'taller')) {
            return item.Nombre.toLowerCase();
        }
        if (item.Actividad) {
            if (item.Actividad.toLowerCase() === 'taller') return 'taller';
            return 'actividad';
        }
        return 'actividad';
    };

    const getNameMapping = (item) => {
        if (item.Nombre && (item.Nombre.toLowerCase() === 'actividad' || item.Nombre.toLowerCase() === 'taller')) {
            return item.Descripcion || item.Actividad || 'Sin nombre';
        }
        return item.Actividad || item.Descripcion || 'Sin nombre';
    };

    // Filter Actividades by current day
    const actividades = allHorariosData.filter(item => {
        const type = getTypeMapping(item);
        const itemDay = (item['Día'] || item.Dia || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace('miercoles', 'miércoles');
        return type === 'actividad' && itemDay === currentDay;
    });

    const talleres = allHorariosData.filter(item => getTypeMapping(item) === 'taller');

    renderCarousel(actividadesCarousel, actividades, actividadesDots, getNameMapping, '🧘');
    renderCarousel(talleresCarousel, talleres, talleresDots, getNameMapping, '✨');
}

function renderCarousel(container, items, dotsContainer, nameFn, defaultIcon) {
    container.innerHTML = '';
    dotsContainer.innerHTML = '';

    if (items.length === 0) {
        container.innerHTML = '<p class="error-msg">No hay actividades para este día.</p>';
        return;
    }

    items.forEach((item, index) => {
        const name = nameFn(item);
        const hora = item.Hora || item.Horario || '--:--';
        const fullDesc = item.Descripcion || item.Descripción || 'Experiencia de bienestar.';
        const shortDesc = fullDesc.length > 60 ? fullDesc.substring(0, 60) + '...' : fullDesc;
        const cupo = item.Cupos || item.Cupo || 'Abierto';
        const estado = item.Estado || 'Disponible';
        const tipo = item.Tipo || (defaultIcon === '🧘' ? 'Actividad' : 'Taller');
        
        const card = document.createElement('div');
        card.className = 'horario-card';
        card.innerHTML = `
            <div class="card-header">
                <h3 class="card-title">${name}</h3>
                <span class="card-category">${tipo}</span>
            </div>
            <p class="card-description-short">${shortDesc}</p>
            <div class="card-meta-row">
                <span class="card-badge badge-cupo">👤 ${cupo}</span>
                <span class="card-badge badge-estado">${estado}</span>
            </div>
            <div class="card-footer">
                <span class="card-time">${hora}</span>
                <span class="card-icon">${defaultIcon}</span>
            </div>
        `;

        card.addEventListener('click', () => {
            const details = [
                { label: 'Categoría', value: `${tipo} ${defaultIcon}` },
                { label: 'Horario', value: hora },
                { label: 'Duración', value: item.Duracion || item.Duración || '60 min' },
                { label: 'Cupo', value: cupo },
                { label: 'Estado', value: estado }
            ];
            if (item.Precio) details.push({ label: 'Inversión', value: `$${item.Precio}` });
            
            showExpandedCard(name, tipo, fullDesc, item.Imagen, details);
        });
        container.appendChild(card);

        const dot = document.createElement('div');
        dot.className = `dot ${index === 0 ? 'active' : ''}`;
        dotsContainer.appendChild(dot);
    });

    container.addEventListener('scroll', () => {
        const scrollIndex = Math.round(container.scrollLeft / (container.offsetWidth * 0.85));
        dotsContainer.querySelectorAll('.dot').forEach((d, i) => {
            d.classList.toggle('active', i === scrollIndex);
        });
    });
}

function showExpandedCard(title, subtitle, description, imagen, details) {
    const overlay = document.getElementById('card-overlay');
    const existing = document.getElementById('active-expanded-card');
    if (existing) existing.remove();

    const expanded = document.createElement('div');
    expanded.className = 'expanded-card';
    expanded.id = 'active-expanded-card';

    let detailsHTML = details.map(d => `
        <div class="detail-row">
            <span class="detail-label">${d.label}</span>
            <span class="detail-text">${d.value}</span>
        </div>
    `).join('');

    expanded.innerHTML = `
        <button class="close-btn" onclick="closeExpandedCard()">✕</button>
        <div class="expanded-header">
            <h2 class="expanded-title">${title}</h2>
            <span class="expanded-tag">${subtitle}</span>
        </div>
        ${imagen ? `<img src="${imagen}" style="width:100%; height:180px; object-fit:cover; border-radius:12px; margin-bottom:20px;" onerror="this.style.display='none'">` : ''}
        <div class="expanded-body">
            <div class="details-list">${detailsHTML}</div>
            <p class="long-description">${description}</p>
        </div>
    `;

    document.body.appendChild(expanded);
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeExpandedCard() {
    const expanded = document.getElementById('active-expanded-card');
    const overlay = document.getElementById('card-overlay');
    if (expanded) {
        expanded.style.animation = 'expandIn 0.3s ease-in reverse forwards';
        setTimeout(() => {
            expanded.remove();
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }, 300);
    }
}
window.closeExpandedCard = closeExpandedCard;

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
        serviciosContainer.innerHTML = '<p class="error-msg">No se pudieron cargar los servicios.</p>';
    }
}

function renderServicios(data) {
    serviciosContainer.innerHTML = '';
    data.forEach(item => {
        const fullDesc = item.Descripción || item.Descripcion || '';
        const shortDesc = fullDesc.length > 80 ? fullDesc.substring(0, 80) + '...' : fullDesc;
        
        const card = document.createElement('div');
        card.className = 'card fade-in';
        card.innerHTML = `
            <h2 class="card-title">${item.Nombre}</h2>
            <div class="card-content">
                <p class="card-description-short" style="margin-bottom:15px; color: #f4f4f4;">${shortDesc}</p>
                <div class="card-meta-row" style="margin-top:10px;">
                    <span style="color:var(--gold)">$${item.Precio || 'N/A'}</span>
                    <span style="color:var(--text-muted)">${item.Duración || item.Duracion || ''}</span>
                </div>
            </div>
        `;

        card.addEventListener('click', () => {
            const details = [
                { label: 'Duración', value: item.Duracion || item.Duración || 'N/A' },
                { label: 'Inversión', value: `$${item.Precio || 'N/A'}` }
            ];
            showExpandedCard(item.Nombre, 'Servicio Holístico', fullDesc, item.Imagen, details);
        });
        
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
