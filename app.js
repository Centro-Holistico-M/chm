const API = {
    HORARIOS: 'https://opensheet.elk.sh/1Tdxx6a3nKK8JmQvL8BwVzJhbFalWcHEAgd07cmt9uG0/Horarios',
    SERVICIOS: 'https://opensheet.elk.sh/1Tdxx6a3nKK8JmQvL8BwVzJhbFalWcHEAgd07cmt9uG0/Servicios',
    CONTACTO: 'https://opensheet.elk.sh/1Tdxx6a3nKK8JmQvL8BwVzJhbFalWcHEAgd07cmt9uG0/Contacto',
    DESCODIFICACION: 'https://opensheet.elk.sh/1Tdxx6a3nKK8JmQvL8BwVzJhbFalWcHEAgd07cmt9uG0/Descodificacion'
};

const OPENAI_KEY_B64 = 'c2stcHJvai1vdEQ5WU9uNXVzWWVDamszdFNjaVYzd0hjTnRRQWJvZFpnSDJkNmFRLUZjVFpRZjZ1YW1KYlhQZFI4eFpYQlM0NW5oZVUtRGZuVDNCbGtGSjNFMDdPcDJvZzhUcDVKZVItM0Zhay1kM1ZtU19xZGd1Y1lTMzRoMXdvcWx4bjlQR2JnR2xJRi1nUnFYcEd5S3Y0TkdvdcOh';

function getOpenAIKey() {
    try {
        return atob(OPENAI_KEY_B64);
    } catch(e) {
        return window.OPENAI_API_KEY || '';
    }
}

const CACHE_DURATION = 300000; // 5 minutos
let cachedSlogan = '';
let cachedWhatsApp = '';

document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    initNavigation();
    loadTab('horarios');
    loadSlogan();
    loadWhatsApp();
    registerSW();
    
    // Ocultar splash después de la animación
    setTimeout(() => {
        const splash = document.getElementById('splash');
        if (splash) {
            splash.style.display = 'none';
        }
    }, 2600);
});

async function loadWhatsApp() {
    try {
        const data = await fetchAPI(API.CONTACTO, 'ch_contacto');
        if (data[0]?.WhatsApp) {
            cachedWhatsApp = data[0].WhatsApp.replace(/\D/g,'');
        }
    } catch(e) {}
}

function initParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    
    // Partículas especiales de entrada (más grandes)
    for (let i = 0; i < 12; i++) {
        setTimeout(() => createSpecialParticle(container), 200 + i * 120);
    }
    
    // Partículas normales (más partículas, más variety)
    for (let i = 0; i < 30; i++) {
        setTimeout(() => createParticle(container), 2000 + i * 200);
    }
    // Más partículas fluyendo constantemente
    setInterval(() => createParticle(container), 400);
}

function createSpecialParticle(container) {
    const p = document.createElement('div');
    p.className = 'special-particle';
    const size = Math.random() * 8 + 4;
    const duration = Math.random() * 2 + 2;
    p.style.cssText = `
        left:${Math.random() * 100}vw;
        animation:specialFloat ${duration}s ease-out forwards;
        width:${size}px;
        height:${size}px;
    `;
    container.appendChild(p);
    setTimeout(() => p.remove(), duration * 1000);
}

function createParticle(container) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 4 + 2;
    const duration = Math.random() * 12 + 8;
    const left = Math.random() * 100;
    const delay = Math.random() * 2;
    p.style.cssText = `
        left:${left}vw;
        animation-duration:${duration}s;
        animation-delay:${-delay}s;
        width:${size}px;
        height:${size}px;
    `;
    container.appendChild(p);
    setTimeout(() => p.remove(), (duration + delay) * 1000);
}

function initNavigation() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            document.getElementById(tab).classList.add('active');
            loadTab(tab);
        });
    });
}

async function loadTab(tab) {
    showLoading(true);
    try {
        if (tab === 'horarios') await loadHorarios();
        else if (tab === 'servicios') await loadServicios();
        else if (tab === 'descodificacion') await loadDescodificacion();
        else if (tab === 'contacto') await loadContacto();
    } catch (e) { console.error(e); }
    showLoading(false);
}

function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'flex' : 'none';
}

function getCache(key) {
    try {
        const c = localStorage.getItem(key);
        if (!c) return null;
        const { data, time } = JSON.parse(c);
        if (Date.now() - time < CACHE_DURATION) return data;
        localStorage.removeItem(key);
    } catch(e) {}
    return null;
}

function setCache(key, data) {
    try { localStorage.setItem(key, JSON.stringify({ data, time: Date.now() })); } catch(e) {}
}

async function fetchAPI(url, cacheKey) {
    if (cacheKey) {
        const cached = getCache(cacheKey);
        if (cached) return cached;
    }
    const res = await fetch(url);
    const data = await res.json();
    if (cacheKey) setCache(cacheKey, data);
    return data;
}

// ======================
// HORARIOS
// ======================
const todasActividadesGlobal = [];

function cambiarDia(dia) {
    document.querySelectorAll('.dia-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.dia === dia);
    });
    
    const container = document.getElementById('timeline-container');
    if (!container) return;
    
    const actividades = todasActividadesGlobal.filter(a => a.Dia === dia);
    
    if (actividades.length === 0) {
        container.innerHTML = `<p class="no-actividades">No hay actividades programadas para ${dia}</p>`;
        return;
    }
    
    // Ordenar: primero AM luego PM
    actividades.sort((a, b) => {
        const horaA = (a.Hora||'').toLowerCase();
        const horaB = (b.Hora||'').toLowerCase();
        const isAmA = horaA.includes('am');
        const isAmB = horaB.includes('am');
        if (isAmA && !isAmB) return -1;
        if (!isAmA && isAmB) return 1;
        return horaA.localeCompare(horaB);
    });
    
    const nombreDia = dia.charAt(0).toUpperCase() + dia.slice(1);
    let html = `<h4 class="timeline-dia">${nombreDia}</h4><div class="timeline">`;
    
    actividades.forEach(a => {
        const descLarga = a.DescripcionLarga || a.DescripcionCorta || '';
        const descCorta = a.DescripcionCorta || '';
        const colorClass = getColorCategoria(a.Categoria);
        const icono = getIconoCategoria(a.Categoria);
        const infoExtra = a.Cupo ? `<span class="cupo">Cupo: ${a.Cupo}</span>` : '';
        html += `<div class="timeline-card" data-titulo="${a.Nombre}" data-categoria="${a.Categoria||''}" data-desc="${descLarga}" data-duracion="${a.Duracion||''}" data-estado="${a.Estado||''}" data-hora="${a.Hora||''}" data-cupo="${a.Cupo||''}">
            <div class="timeline-hora"><span class="hora-icono">${icono}</span>${a.Hora||''}</div>
            <div class="timeline-content">
                <span class="categoria-tag ${colorClass}">${a.Categoria||'Actividad'}</span>
                <h3>${a.Nombre}</h3>
                ${descCorta ? `<p class="timeline-desc">${descCorta}</p>` : ''}
                <div class="timeline-badges"><span class="badge ${(a.Estado||'').toLowerCase().includes('no') ? 'nodisponible' : 'disponible'}">${a.Estado||'Disponible'}</span> ${infoExtra}</div>
            </div>
        </div>`;
    });
    html += '</div>';
    container.innerHTML = html;
    
    container.querySelectorAll('.timeline-card').forEach(card => {
        card.addEventListener('click', () => {
            showModal({
                titulo: card.dataset.titulo,
                categoria: card.dataset.categoria,
                descripcion: card.dataset.desc,
                duracion: card.dataset.duracion,
                estado: card.dataset.estado,
                hora: card.dataset.hora,
                cupo: card.dataset.cupo
            }, cachedWhatsApp);
        });
    });
}

function getColorCategoria(cat) {
    const c = (cat||'').toLowerCase();
    if (c.includes('yoga')) return 'yoga';
    if (c.includes('marcial') || c.includes('taekwondo')) return 'artes';
    if (c.includes('movimiento') || c.includes('danza')) return 'movimiento';
    if (c.includes('ritual')) return 'ritual';
    if (c.includes('terapia')) return 'terapia';
    if (c.includes('crecimiento') || c.includes('desarrollo')) return 'crecimiento';
    if (c.includes('lectura') || c.includes('libro')) return 'lectura';
    if (c.includes('expresión') || c.includes('teatro') || c.includes('expresion')) return 'expresion';
    if (c.includes('bienestar')) return 'bienestar';
    if (c.includes('taller')) return 'taller';
    if (c.includes('evento')) return 'evento';
    return 'default';
}

function getIconoCategoria(cat) {
    const c = (cat||'').toLowerCase();
    if (c.includes('yoga')) return '🧘';
    if (c.includes('marcial') || c.includes('taekwondo')) return '🥋';
    if (c.includes('movimiento') || c.includes('danza')) return '💃';
    if (c.includes('ritual')) return '✨';
    if (c.includes('terapia') || c.includes('ayurveda')) return '🌿';
    if (c.includes('crecimiento') || c.includes('lectura')) return '📚';
    if (c.includes('expresión') || c.includes('teatro')) return '🎭';
    if (c.includes('bienestar')) return '💫';
    return '🌀';
}

// ============================================
// CALENDARIO LUNAR Y ESTACIONES
// ============================================

// Dataset estructurado con fechas específicas para fases lunares y eventos solares (fechas correctas de timeanddate.com)
const EVENTS_DATA = [
    // Luna Nueva (primer día del mes correcto)
    { date: "2026-01-03", type: "new_moon", title: "Luna Nueva", icon: "🌑", short: "Nuevos inicios, establecer intenciones", description: "Momento de renovación y nuevos ciclos. Ideal para establecer intenciones, comenzar proyectos y limpiar lo viejo.", message: "Es momento de sembrar las semillas de tus deseos." },
    { date: "2026-02-01", type: "new_moon", title: "Luna Nueva", icon: "🌑", short: "Nuevos inicios, establecer intenciones", description: "Momento de renovación y nuevos ciclos.", message: "Visualiza lo que quieres crear este mes." },
    { date: "2026-03-03", type: "new_moon", title: "Luna Nueva", icon: "🌑", short: "Nuevos inicios, establecer intenciones", description: "Momento de renovación y nuevos ciclos.", message: "Un nuevo ciclo lunar te invita a comenzar." },
    { date: "2026-04-01", type: "new_moon", title: "Luna Nueva", icon: "🌑", short: "Nuevos inicios, establecer intenciones", description: "Momento de renovación y nuevos ciclos.", message: "Honra la energía de los nuevos beginnings." },
    { date: "2026-05-01", type: "new_moon", title: "Luna Nueva", icon: "🌑", short: "Nuevos inicios, establecer intenciones", description: "Momento de renovación y nuevos ciclos.", message: "Abre espacio para nueva energía." },
    { date: "2026-05-31", type: "new_moon", title: "Luna Nueva", icon: "🌑", short: "Nuevos inicios, establecer intenciones", description: "Momento de renovación y nuevos ciclos.", message: "Doble energía lunar este mes." },
    { date: "2026-06-29", type: "new_moon", title: "Luna Nueva", icon: "🌑", short: "Nuevos inicios, establecer intenciones", description: "Momento de renovación y nuevos ciclos.", message: "La oscuridad precede a la luz." },
    { date: "2026-07-29", type: "new_moon", title: "Luna Nueva", icon: "🌑", short: "Nuevos inicios, establecer intenciones", description: "Momento de renovación y nuevos ciclos.", message: "Todo comienza con una intención." },
    { date: "2026-08-27", type: "new_moon", title: "Luna Nueva", icon: "🌑", short: "Nuevos inicios, establecer intenciones", description: "Momento de renovación y nuevos ciclos.", message: "El universo te apoya." },
    { date: "2026-09-26", type: "new_moon", title: "Luna Nueva", icon: "🌑", short: "Nuevos inicios, establecer intenciones", description: "Momento de renovación y nuevos ciclos.", message: "Es momento de plantar semillas." },
    { date: "2026-10-25", type: "new_moon", title: "Luna Nueva", icon: "🌑", short: "Nuevos inicios, establecer intenciones", description: "Momento de renovación y nuevos ciclos.", message: "Lo que imagines puede manifestarse." },
    { date: "2026-11-24", type: "new_moon", title: "Luna Nueva", icon: "🌑", short: "Nuevos inicios, establecer intenciones", description: "Momento de renovación y nuevos ciclos.", message: "Un nuevo capítulo te espera." },
    { date: "2026-12-23", type: "new_moon", title: "Luna Nueva", icon: "🌑", short: "Nuevos inicios, establecer intenciones", description: "Momento de renovación y nuevos ciclos.", message: "Honra el ciclo que termina y comienza." },
    { date: "2026-12-30", type: "new_moon", title: "Luna Nueva", icon: "🌑", short: "Nuevos inicios, establecer intenciones", description: "Momento de renovación y nuevos ciclos.", message: "Cierra el año con nuevas intenciones." },
    
    // Cuarto Creciente
    { date: "2026-01-10", type: "first_quarter", title: "Cuarto Creciente", icon: "🌓", short: "Acción y decisión", description: "Fase de crecimiento. Es momento de actuar en tus intenciones.", message: "Es momento de actuar." },
    { date: "2026-02-09", type: "first_quarter", title: "Cuarto Creciente", icon: "🌓", short: "Acción y decisión", description: "Fase de crecimiento.", message: "El crecimiento requiere movimiento." },
    { date: "2026-03-11", type: "first_quarter", title: "Cuarto Creciente", icon: "🌓", short: "Acción y decisión", description: "Fase de crecimiento.", message: "Tus acciones dan forma a tu realidad." },
    { date: "2026-04-09", type: "first_quarter", title: "Cuarto Creciente", icon: "🌓", short: "Acción y decisión", description: "Fase de crecimiento.", message: "La energía aumenta." },
    { date: "2026-05-09", type: "first_quarter", title: "Cuarto Creciente", icon: "🌓", short: "Acción y decisión", description: "Fase de crecimiento.", message: "Decide y actúa." },
    { date: "2026-06-08", type: "first_quarter", title: "Cuarto Creciente", icon: "🌓", short: "Acción y decisión", description: "Fase de crecimiento.", message: "El momentum te lleva." },
    { date: "2026-07-07", type: "first_quarter", title: "Cuarto Creciente", icon: "🌓", short: "Acción y decisión", description: "Fase de crecimiento.", message: "Confía en tu capacidad." },
    { date: "2026-08-05", type: "first_quarter", title: "Cuarto Creciente", icon: "🌓", short: "Acción y decisión", description: "Fase de crecimiento.", message: "El momento de actuar es ahora." },
    { date: "2026-09-04", type: "first_quarter", title: "Cuarto Creciente", icon: "🌓", short: "Acción y decisión", description: "Fase de crecimiento.", message: "Construye sobre lo que began." },
    { date: "2026-10-03", type: "first_quarter", title: "Cuarto Creciente", icon: "🌓", short: "Acción y decisión", description: "Fase de crecimiento.", message: "El crecimiento se acelera." },
    { date: "2026-11-01", type: "first_quarter", title: "Cuarto Creciente", icon: "🌓", short: "Acción y decisión", description: "Fase de crecimiento.", message: "Tus decisiones importan." },
    { date: "2026-12-01", type: "first_quarter", title: "Cuarto Creciente", icon: "🌓", short: "Acción y decisión", description: "Fase de crecimiento.", message: "Avanza con determinación." },
    
    // Luna Llena
    { date: "2026-01-18", type: "full_moon", title: "Luna Llena", icon: "🌕", short: "Energía máxima, claridad y liberación", description: "Pico de energía. Ideal para cerrar ciclos y obtener claridad.", message: "Tu luz brilla más fuerte." },
    { date: "2026-02-17", type: "full_moon", title: "Luna Llena", icon: "🌕", short: "Energía máxima, claridad y liberación", description: "Pico de energía.", message: "Celebra lo que has logrado." },
    { date: "2026-03-18", type: "full_moon", title: "Luna Llena", icon: "🌕", short: "Energía máxima, claridad y liberación", description: "Pico de energía.", message: "La verdad se revela." },
    { date: "2026-04-17", type: "full_moon", title: "Luna Llena", icon: "🌕", short: "Energía máxima, claridad y liberación", description: "Pico de energía.", message: "Es momento de agradecer." },
    { date: "2026-05-16", type: "full_moon", title: "Luna Llena", icon: "🌕", short: "Energía máxima, claridad y liberación", description: "Pico de energía.", message: "Tu intuición está alta." },
    { date: "2026-06-14", type: "full_moon", title: "Luna Llena", icon: "🌕", short: "Energía máxima, claridad y liberación", description: "Pico de energía.", message: "Abunda en gratitud." },
    { date: "2026-07-14", type: "full_moon", title: "Luna Llena", icon: "🌕", short: "Energía máxima, claridad y liberación", description: "Pico de energía.", message: "La luz revela la verdad." },
    { date: "2026-08-12", type: "full_moon", title: "Luna Llena", icon: "🌕", short: "Energía máxima, claridad y liberación", description: "Pico de energía.", message: "Honra tu brillo interior." },
    { date: "2026-09-10", type: "full_moon", title: "Luna Llena", icon: "🌕", short: "Energía máxima, claridad y liberación", description: "Pico de energía.", message: "Equilibra dar y recibir." },
    { date: "2026-10-10", type: "full_moon", title: "Luna Llena", icon: "🌕", short: "Energía máxima, claridad y liberación", description: "Pico de energía.", message: "Tu propósito se clarifica." },
    { date: "2026-11-09", type: "full_moon", title: "Luna Llena", icon: "🌕", short: "Energía máxima, claridad y liberación", description: "Pico de energía.", message: "Libera lo que no te sirve." },
    { date: "2026-12-08", type: "full_moon", title: "Luna Llena", icon: "🌕", short: "Energía máxima, claridad y liberación", description: "Pico de energía.", message: "Celebra el año vivido." },
    
    // Cuarto Menguante
    { date: "2026-01-25", type: "last_quarter", title: "Cuarto Menguante", icon: "🌗", short: "Reflexión y liberación", description: "Fase de reflexión y soltar.", message: "Lo que sueltas crea espacio." },
    { date: "2026-02-24", type: "last_quarter", title: "Cuarto Menguante", icon: "🌗", short: "Reflexión y liberación", description: "Fase de reflexión.", message: "El soltar es amor propio." },
    { date: "2026-03-25", type: "last_quarter", title: "Cuarto Menguante", icon: "🌗", short: "Reflexión y liberación", description: "Fase de reflexión.", message: "Reflexiona antes de actuar." },
    { date: "2026-04-23", type: "last_quarter", title: "Cuarto Menguante", icon: "🌗", short: "Reflexión y liberación", description: "Fase de reflexión.", message: "Libera lo que te pesaa." },
    { date: "2026-05-23", type: "last_quarter", title: "Cuarto Menguante", icon: "🌗", short: "Reflexión y liberación", description: "Fase de reflexión.", message: "Permítete descansar." },
    { date: "2026-06-21", type: "last_quarter", title: "Cuarto Menguante", icon: "🌗", short: "Reflexión y liberación", description: "Fase de reflexión.", message: "El silencio interne tiene respuestas." },
    { date: "2026-07-21", type: "last_quarter", title: "Cuarto Menguante", icon: "🌗", short: "Reflexión y liberación", description: "Fase de reflexión.", message: "Honra tu transformación." },
    { date: "2026-08-19", type: "last_quarter", title: "Cuarto Menguante", icon: "🌗", short: "Reflexión y liberación", description: "Fase de reflexión.", message: "Lo que sanas hoy es libre." },
    { date: "2026-09-18", type: "last_quarter", title: "Cuarto Menguante", icon: "🌗", short: "Reflexión y liberación", description: "Fase de reflexión.", message: "Perdona y libera." },
    { date: "2026-10-18", type: "last_quarter", title: "Cuarto Menguante", icon: "🌗", short: "Reflexión y liberación", description: "Fase de reflexión.", message: "La liberación trae paz." },
    { date: "2026-11-17", type: "last_quarter", title: "Cuarto Menguante", icon: "🌗", short: "Reflexión y liberación", description: "Fase de reflexión.", message: "Suelta con gratitud." },
    { date: "2026-12-16", type: "last_quarter", title: "Cuarto Menguante", icon: "🌗", short: "Reflexión y liberación", description: "Fase de reflexión.", message: "Lo que sueñas puede realizarse." },
    
    // Eventos Solares
    { date: "2026-03-20", type: "equinox", title: "Equinoccio de Primavera", icon: "🌅", short: "Equilibrio y transición", description: "Equilibrio entre día y noche. Inicio de la primavera.", message: "Luz y oscuridad en armonía." },
    { date: "2026-06-21", type: "solstice", title: "Solsticio de Verano", icon: "☀️", short: "Punto de máxima luz", description: "Día más largo. Máxima expresión de luz.", message: "Tu luz brilla al máximo." },
    { date: "2026-09-22", type: "equinox", title: "Equinoccio de Otoño", icon: "🌅", short: "Equilibrio y transición", description: "Equilibrio entre día y noche. Inicio del otoño.", message: "Honra los frutos de tu trabajo." },
    { date: "2026-12-21", type: "solstice", title: "Solsticio de Invierno", icon: "❄️", short: "Renovación desde la oscuridad", description: "Noche más larga. La luz renace.", message: "En la oscuridad nace la nueva luz." }
];

// Iconos por categoría
const CATEGORY_ICONS = {
    'Yoga': '🧘',
    'Movimiento': '💃',
    'Artes Marciales': '🥋',
    'Cultura y Conocimiento': '📚',
    'Terapia Holística': '🌿',
    'Arte terapia': '🎨',
    'Arte': '🖼️',
    'Estacional': '🌸',
    'Taller': '🔧',
    'Ritual': '🕯️',
    'Terapia': '💚',
    'Bienestar': '✨',
    'Infantil Recreativo': '🧒'
};

function getIconByCategory(categoria) {
    const cat = categoria?.trim() || '';
    return CATEGORY_ICONS[cat] || '📌';
}

// Obtener estación del año
function getEstacion(dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    // Invierno: 21 dic - 20 mar
    if ((month === 12 && day >= 21) || (month === 1) || (month === 2) || (month === 3 && day <= 20)) {
        return 'invierno';
    }
    // Primavera: 21 mar - 20 jun
    if ((month === 3 && day >= 21) || (month === 4) || (month === 5) || (month === 6 && day <= 20)) {
        return 'primavera';
    }
    // Verano: 21 jun - 21 sep
    if ((month === 6 && day >= 21) || (month === 7) || (month === 8) || (month === 9 && day <= 21)) {
        return 'verano';
    }
    // Otoño: 22 sep - 20 dic
    return 'otono';
}

const EVENT_MAP = {};

function getEventsForDate(dateStr) {
    return EVENT_MAP[dateStr] || [];
}

function getEventForDate(dateStr) {
    const events = EVENT_MAP[dateStr];
    return events ? events[0] : null;
}

function formatDate(dateStr) {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const [year, month, day] = dateStr.split('-');
    return `${parseInt(day)} de ${meses[parseInt(month) - 1]} de ${year}`;
}

function showEventModal(dateStr, eventData) {
    let event;
    if (eventData) {
        try {
            event = typeof eventData === 'string' ? JSON.parse(decodeURIComponent(eventData)) : eventData;
        } catch(e) {
            event = getEventForDate(dateStr);
        }
    } else {
        event = getEventForDate(dateStr);
    }
    if (!event) return;
    
    const isGoogleSheetEvent = event.isGoogleSheetEvent;
    
    const existing = document.getElementById('event-modal');
    if (existing) existing.remove();
    
    let modalContent = '';
    if (isGoogleSheetEvent) {
        const estadoClass = (event.Estado||'').toLowerCase().includes('no') ? 'nodisponible' : 'disponible';
        modalContent = `
            <div class="event-modal-icon">${event.icon}</div>
            <h3 class="event-modal-title">${event.title}</h3>
            <p class="event-modal-date">${event.date} ${event.Hora||''}</p>
            <p class="event-modal-desc">${event.description}</p>
            <div class="event-modal-badges">
                <span class="badge evento">${event.tipo}</span>
                <span class="badge ${estadoClass}">${event.Estado||'Disponible'}</span>
            </div>
            ${event.Cupo ? `<p class="event-modal-cupo">Cupo: ${event.Cupo}</p>` : ''}
        `;
    } else {
        modalContent = `
            <div class="event-modal-icon">${event.icon}</div>
            <h3 class="event-modal-title">${event.title}</h3>
            <p class="event-modal-date">${formatDate(event.date)}</p>
            <p class="event-modal-desc">${event.description}</p>
            <div class="event-modal-message">
                <span class="event-modal-message-label">✨ Mensaje energetico</span>
                <p>${event.message}</p>
            </div>
        `;
    }
    
    const modal = document.createElement('div');
    modal.id = 'event-modal';
    modal.className = 'event-modal-overlay';
    modal.innerHTML = `
        <div class="event-modal-content">
            <button class="event-modal-close" onclick="closeEventModal()">✕</button>
            ${modalContent}
        </div>
    `;
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeEventModal();
    });
    
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);
}

function closeEventModal() {
    const modal = document.getElementById('event-modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    }
}

window.showEventModal = showEventModal;
window.closeEventModal = closeEventModal;

function initCalendario() {
    EVENTS_DATA.forEach(event => {
        if (!EVENT_MAP[event.date]) {
            EVENT_MAP[event.date] = [];
        }
        EVENT_MAP[event.date].push(event);
    });
}

function renderCalendario(year, month) {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const currentDate = new Date();
    const isCurrentMonth = year === currentDate.getFullYear() && month === currentDate.getMonth();
    
    let html = `
        <div class="calendario-widget">
            <div class="calendario-header">
                <button class="cal-nav-btn" onclick="navegarMes(${year}, ${month - 1})">◀</button>
                <span class="cal-mes">${meses[month]} ${year}</span>
                <button class="cal-nav-btn" onclick="navegarMes(${year}, ${month + 1})">▶</button>
            </div>
            ${!isCurrentMonth ? '<button class="cal-hoy-btn" onclick="irAHoy()">Hoy</button>' : ''}
            <div class="cal-dias-header">`;
    
    diasSemana.forEach(d => { html += `<span>${d}</span>`; });
    html += '</div><div class="cal-dias">';
    
    for (let i = 0; i < firstDay; i++) {
        html += '<span class="cal-vacio"></span>';
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const events = getEventsForDate(dateStr);
        const estacion = getEstacion(dateStr);
        
        // Verificar si es el día de hoy
        const isHoy = year === currentDate.getFullYear() && month === currentDate.getMonth() && day === currentDate.getDate();
        
        let diaClase = 'cal-dia';
        if (isHoy) diaClase += ' cal-dia-hoy';
        if (estacion) diaClase += ` cal-estacion-${estacion}`;
        
        let eventIcon = '';
        if (events.length > 0) {
            events.forEach(event => {
                const title = event.short || event.title || event.Nombre || '';
                const eventData = encodeURIComponent(JSON.stringify(event));
                eventIcon += `<span class="cal-icon" title="${title}" onclick="showEventModal('${event.date}', decodeURIComponent('${eventData}'))" style="cursor:pointer;">${event.icon}</span>`;
            });
        }
        
        html += `<span class="${diaClase}">${day}${eventIcon}</span>`;
    }
    
    html += '</div></div>';
    return html;
}

function navegarMes(year, month) {
    if (month < 0) { month = 11; year--; }
    if (month > 11) { month = 0; year++; }
    
    const container = document.getElementById('calendario-container');
    if (container) {
        container.innerHTML = renderCalendario(year, month);
    } else {
        document.querySelectorAll('.calendario-widget').forEach(el => {
            el.outerHTML = renderCalendario(year, month);
        });
    }
}

function irAHoy() {
    const now = new Date();
    navegarMes(now.getFullYear(), now.getMonth());
}

window.renderCalendario = renderCalendario;
window.navegarMes = navegarMes;
window.irAHoy = irAHoy;

initCalendario();

async function loadHorarios() {
    const container = document.getElementById('horarios-container');
    const horarios = await fetchAPI(API.HORARIOS, 'ch_horarios');
    const servicios = await fetchAPI(API.SERVICIOS, 'ch_servicios');
    
    const diasSemana = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
    const diasCorto = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    
    todasActividadesGlobal.length = 0;
    
    if (horarios && horarios.length > 0) {
        horarios.forEach(row => {
            if (!row.Nombre) return;
            
            const tieneFecha = row.Fecha && row.Fecha.trim();
            const esEventoOTaller = row.Tipo === 'Evento' || row.Tipo === 'Taller';
            
            if (!tieneFecha && !esEventoOTaller) {
                const horas = (row.Hora||'').split(/\s+/).filter(h => h);
                const dia = (row.Dia||'').toLowerCase();
                
                horas.forEach(hora => {
                    if (dia && hora) {
                        todasActividadesGlobal.push({
                            Nombre: row.Nombre,
                            Dia: dia,
                            Hora: hora,
                            Categoria: row.Categoria || 'Actividad',
                            Estado: row.Estado || 'Disponible',
                            Duracion: row.Duracion || '',
                            Cupo: row.Cupo || '',
                            DescripcionCorta: row.DescripcionCorta || '',
                            DescripcionLarga: row.DescripcionLarga || ''
                        });
                    }
                });
            }
        });
    }
    
    // Generar HTML - mostrar cada día con sus horarios directamente
    let html = '<h3 class="section-subtitle">📅 Horario Semanal</h3>';
    html += '<div class="horario-semana">';
    
    diasSemana.forEach((dia, idx) => {
        const actividadesDia = todasActividadesGlobal.filter(a => a.Dia === dia);
        
        html += `<div class="dia-bloque">
            <div class="dia-header">${diasCorto[idx]}</div>
            <div class="dia-actividades">`;
        
        if (actividadesDia.length === 0) {
            if (dia === 'domingo') {
                html += `<span class="sin-actividad mensaje-domingo">Hoy es domingo… lo demás puede esperar.</span>`;
            } else {
                html += `<span class="sin-actividad">-</span>`;
            }
        } else {
            actividadesDia.forEach((a, i) => {
                html += `<div class="actividad-item">
                    <span class="actividad-hora">${a.Hora}</span>
                    <span class="actividad-nombre">${a.Nombre}</span>
                </div>`;
                if (i < actividadesDia.length - 1) {
                    html += `<span class="actividad-separator">|</span>`;
                }
            });
        }
        
        html += `</div></div>`;
    });
    html += '</div>';
    
    // Servicios
    if (servicios && servicios.length) {
        html += '<h3 class="section-subtitle">💆 Servicios</h3>';
        html += '<div class="cards-grid cards-horizontal">';
        servicios.forEach(s => {
            const descLarga = s['Descripcion larga'] || s.DescripcionLarga || s['Descripcion corta'] || s.DescripcionCorta || '';
            const estadoClass = (s.Estado||'').toLowerCase().includes('no') ? 'nodisponible' : 'disponible';
            const infoExtra = s.Cupo ? `<span class="cupo">Cupo: ${s.Cupo}</span>` : '';
            html += `<div class="card" data-titulo="${s.Nombre}" data-categoria="${s.Categoria||s.Categoría||''}" data-desc="${descLarga}" data-precio="${s.Precio||''}" data-duracion="${s.Duracion||s.Duración||''}" data-estado="${s.Estado||''}" data-cupo="${s.Cupo||''}" data-tipo="servicio">
                <span class="badge ${estadoClass}">${s.Estado||'Disponible'}</span>
                <h3 class="card-title">${s.Nombre}</h3>
                <span class="categoria">${s.Categoria||s.Categoría||''}</span>
                <p>${s['Descripcion corta']||s.DescripcionCorta||''}</p>
                <div class="card-footer">
                    <span>${s.Duracion||s.Duración||''}</span>
                    ${infoExtra}
                </div>
            </div>`;
        });
        html += '</div>';
    }
    
    container.innerHTML = html || '<p class="error">No hay horarios disponibles</p>';
    
    container.querySelectorAll('.card').forEach(card => {
        card.addEventListener('click', () => {
            showModal({
                titulo: card.dataset.titulo,
                categoria: card.dataset.categoria,
                descripcion: card.dataset.desc,
                precio: card.dataset.precio,
                duracion: card.dataset.duracion,
                estado: card.dataset.estado,
                fecha: card.dataset.fecha,
                hora: card.dataset.hora,
                tipo: card.dataset.tipo,
                cupo: card.dataset.cupo
            }, cachedWhatsApp);
        });
    });
}

function showModal(datos, waNumero) {
    const m = document.createElement('div');
    m.className = 'modal-overlay active';
    
    const badgeClass = (datos.estado||'').toLowerCase().includes('no') ? 'nodisponible' : 'disponible';
    const waMsg = encodeURIComponent(`Hola! Me interesa: ${datos.titulo}${datos.precio ? ` - $${datos.precio}` : ''}`);
    
    let infoHtml = '';
    if (datos.categoria) infoHtml += `<p><span class="label">Categoría</span><span class="value">${datos.categoria}</span></p>`;
    if (datos.duracion) infoHtml += `<p><span class="label">Duración</span><span class="value">${datos.duracion}</span></p>`;
    if (datos.precio) infoHtml += `<p><span class="label">Precio</span><span class="value">$${datos.precio}</span></p>`;
    if (datos.fecha) infoHtml += `<p><span class="label">Fecha</span><span class="value">${datos.fecha}</span></p>`;
    if (datos.hora) infoHtml += `<p><span class="label">Hora</span><span class="value">${datos.hora}</span></p>`;
    if (datos.cupo) infoHtml += `<p><span class="label">Cupo</span><span class="value">${datos.cupo}</span></p>`;
    
    const waButton = waNumero && waNumero.length > 0 
        ? `<a href="https://wa.me/${waNumero}?text=${waMsg}" target="_blank" class="share-btn wa-btn">💬 Contactar por WhatsApp</a>`
        : `<p class="wa-fallback">WhatsApp no disponible. Puedes contactarnos en la sección Contacto.</p>`;
    
    m.innerHTML = `
        <div class="modal-content">
            <button class="modal-close">&times;</button>
            ${datos.estado ? `<span class="badge ${badgeClass}">${datos.estado}</span>` : ''}
            <h2 class="modal-title">${datos.titulo}</h2>
            ${infoHtml ? `<div class="modal-info">${infoHtml}</div>` : ''}
            <p class="modal-desc">${datos.descripcion || 'Sin descripción disponible.'}</p>
            <div class="modal-buttons">
                ${waButton}
            </div>
        </div>
    `;
    
    document.body.appendChild(m);
    
    m.querySelector('.modal-close').addEventListener('click', () => m.remove());
    m.addEventListener('click', (e) => { if (e.target === m) m.remove(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') m.remove(); });
}

function registerSW() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('images/sw.js').catch(console.error);
    }
}

// ======================
// SERVICIOS
// ======================
async function loadServicios() {
    const container = document.getElementById('servicios-container');
    const horarios = await fetchAPI(API.HORARIOS, 'ch_horarios');
    
    // Cargar eventos de Google Sheets al calendario
    if (horarios && horarios.length > 0) {
        horarios.forEach(row => {
            if (!row.Nombre) return;
            
            const tieneFecha = row.Fecha && row.Fecha.trim();
            const esEventoOTaller = row.Tipo === 'Evento' || row.Tipo === 'Taller';
            
            if (tieneFecha || esEventoOTaller) {
                const fecha = row.Fecha || '';
                if (fecha) {
                    // Convertir fecha DD/MM/YYYY a YYYY-MM-DD
                    const fechaParts = fecha.split('/');
                    let fechaISO = fecha;
                    if (fechaParts.length === 3) {
                        fechaISO = `${fechaParts[2]}-${fechaParts[1].padStart(2,'0')}-${fechaParts[0].padStart(2,'0')}`;
                    }
                    
                    const tipo = row.Tipo || 'Evento';
                    const categoria = row.Categoria || '';
                    const icono = getIconByCategory(categoria);
                    const eventGoogleSheet = {
                        isGoogleSheetEvent: true,
                        date: fechaISO,
                        icon: icono,
                        title: row.Nombre,
                        description: row.DescripcionCorta || row.DescripcionLarga || '',
                        tipo: tipo,
                        Hora: row.Hora || '',
                        Categoria: row.Categoria || '',
                        Estado: row.Estado || 'Disponible',
                        Cupo: row.Cupo || ''
                    };
                    
                    if (!EVENT_MAP[fechaISO]) {
                        EVENT_MAP[fechaISO] = [];
                    }
                    EVENT_MAP[fechaISO].push(eventGoogleSheet);
                }
            }
        });
    }
    
    const now = new Date();
    let html = '<div id="calendario-container">' + renderCalendario(now.getFullYear(), now.getMonth()) + '</div>';
    
    // Talleres y Eventos
    let eventos = [];
    if (horarios && horarios.length > 0) {
        horarios.forEach(row => {
            if (!row.Nombre) return;
            
            const tieneFecha = row.Fecha && row.Fecha.trim();
            const esEventoOTaller = row.Tipo === 'Evento' || row.Tipo === 'Taller';
            
            if (tieneFecha || esEventoOTaller) {
                eventos.push({
                    Nombre: row.Nombre,
                    Tipo: row.Tipo || 'Evento',
                    Fecha: row.Fecha || '',
                    Hora: row.Hora || '',
                    Categoria: row.Categoria || '',
                    Estado: row.Estado || 'Disponible',
                    Duracion: row.Duracion || '',
                    Precio: row.Precio || '',
                    Cupo: row.Cupo || '',
                    DescripcionCorta: row.DescripcionCorta || '',
                    DescripcionLarga: row.DescripcionLarga || ''
                });
            }
        });
    }
    
    if (eventos.length) {
        html += '<h3 class="section-subtitle">📚 Talleres y Eventos</h3>';
        html += '<div class="cards-grid cards-horizontal">';
        eventos.forEach(t => {
            const descLarga = t.DescripcionLarga || t.DescripcionCorta || '';
            const estadoClass = (t.Estado||'').toLowerCase().includes('no') ? 'nodisponible' : 'disponible';
            const infoExtra = t.Cupo ? `<span class="cupo">Cupo: ${t.Cupo}</span>` : '';
            const tipoMostrar = t.Tipo && t.Categoria ? `${t.Tipo} · ${t.Categoria}` : (t.Categoria || t.Tipo || 'Evento');
            html += `<div class="card" data-titulo="${t.Nombre}" data-categoria="${t.Categoria||''}" data-desc="${descLarga}" data-precio="${t.Precio||''}" data-duracion="${t.Duracion||''}" data-estado="${t.Estado||''}" data-fecha="${t.Fecha||''}" data-hora="${t.Hora||''}" data-cupo="${t.Cupo||''}" data-tipo="taller">
                <span class="badge evento">✨ ${tipoMostrar}</span>
                <h3>${t.Nombre}</h3>
                <span class="categoria">${t.Fecha||''} ${t.Hora||''}</span>
                ${infoExtra}
                <span class="badge ${estadoClass}" style="margin-top:4px">${t.Estado||'Disponible'}</span>
                <p>${t.DescripcionCorta||''}</p>
            </div>`;
        });
        html += '</div>';
    }
    
    container.innerHTML = html || '<p class="error">No hay eventos disponibles</p>';
    
    container.querySelectorAll('.card').forEach(card => {
        card.addEventListener('click', () => {
            showModal({
                titulo: card.dataset.titulo,
                categoria: card.dataset.categoria,
                descripcion: card.dataset.desc,
                precio: card.dataset.precio,
                duracion: card.dataset.duracion,
                estado: card.dataset.estado,
                fecha: card.dataset.fecha,
                hora: card.dataset.hora,
                tipo: card.dataset.tipo,
                cupo: card.dataset.cupo
            }, cachedWhatsApp);
        });
    });
}

// ======================
// CONTACTO / CONOCETE
// ======================
async function loadConocete() {
    const container = document.getElementById('conocete-container');
    
    await loadDescodData();
    
    const data = await fetchAPI(API.CONTACTO, 'ch_contacto');
    if (!data.length) {
        container.innerHTML = '<p class="error">No hay información de contacto</p>';
        return;
    }

    const c = data[0];
    cachedWhatsApp = (c.WhatsApp||'').replace(/\D/g,'');
    const wa = cachedWhatsApp;
    
    let redes = '';
    if (c.Instagram) redes += `<a href="${c.Instagram}" target="_blank" title="Instagram" class="social-link"><svg class="social-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg><span class="nombre-red">Instagram</span></a>`;
    if (c.Facebook) redes += `<a href="${c.Facebook}" target="_blank" title="Facebook" class="social-link"><svg class="social-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg><span class="nombre-red">Facebook</span></a>`;
    if (c.YouTube || c.Youtube) redes += `<a href="${c.YouTube || c.Youtube}" target="_blank" title="YouTube" class="social-link"><svg class="social-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg><span class="nombre-red">YouTube</span></a>`;
    if (wa) redes += `<a href="https://wa.me/${wa}" target="_blank" title="WhatsApp" class="social-link"><svg class="social-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg><span class="nombre-red">WhatsApp</span></a>`;

    container.innerHTML = `
        <div class="contacto-card">
            <div class="contacto-icono-grande">🧘</div>
            <h2>Centro Holístico M</h2>
            
            <div class="contacto-grid">
                ${(c.Direccion||c.Dirección) ? `<div class="contacto-item">
                    <div class="icono">📍</div>
                    <div class="detalle">
                        <strong>Dirección</strong>
                        <span>${c.Direccion||c.Dirección}</span>
                    </div>
                </div>` : ''}
                
                ${(c.Ciudad || c.Estado) ? `<div class="contacto-item">
                    <div class="icono">🏙️</div>
                    <div class="detalle">
                        <strong>Ubicación</strong>
                        <span>${[c.Ciudad, c.Estado].filter(Boolean).join(', ')}</span>
                    </div>
                </div>` : ''}
                
                ${c.Telefono||c.Teléfono ? `<div class="contacto-item">
                    <div class="icono">📞</div>
                    <div class="detalle">
                        <strong>Teléfono</strong>
                        <a href="tel:${c.Telefono||c.Teléfono}">${c.Telefono||c.Teléfono}</a>
                    </div>
                </div>` : ''}
                
                ${c.Email ? `<div class="contacto-item">
                    <div class="icono">✉️</div>
                    <div class="detalle">
                        <strong>Email</strong>
                        <a href="mailto:${c.Email}">${c.Email}</a>
                    </div>
                </div>` : ''}
                
                ${c.Horario ? `<div class="contacto-item">
                    <div class="icono">🕰️</div>
                    <div class="detalle">
                        <strong>Horario</strong>
                        <span>${c.Horario}</span>
                    </div>
                </div>` : ''}
            </div>
            
            ${c.GoogleMaps ? `<a href="${c.GoogleMaps}" target="_blank" class="contacto-mapa-btn">
                🗺️ Ver ubicación en mapa
            </a>` : ''}
            
            ${redes ? `<p class="contacto-titulo-sección">Síguenos</p>
            <div class="redes-sociales">${redes}</div>` : ''}
            
            <div class="descodificacion-consulta">
                <h3 class="section-subtitle">🔍 Descodificación</h3>
                <p class="descodificacion-desc">Ingresa un síntoma para explorar su significado emocional</p>
                <input type="text" id="sintoma-input" class="sintoma-input" placeholder="Ej: dolor de cabeza, ansiedad, fatiga..." />
                <button class="sintoma-buscar-btn" onclick="buscarSintoma()">Buscar</button>
                <div id="sintoma-resultado" class="sintoma-resultado"></div>
            </div>
        </div>
    `;
}

window.buscarSintoma = buscarSintoma;

async function loadSlogan() {
    const el = document.getElementById('slogan');
    if (!el) return;
    if (cachedSlogan) {
        el.textContent = cachedSlogan;
        el.classList.add('visible');
        return;
    }
    try {
        const data = await fetchAPI(API.CONTACTO, 'ch_contacto');
        if (data[0]?.Slogan) {
            cachedSlogan = data[0].Slogan;
            el.textContent = cachedSlogan;
            el.classList.add('visible');
        }
    } catch(e) {}
}

// ============================================
// DESCODIFICACIÓN - Sistema Híbrido
// ============================================
let sintomasIndex = [];
let sintomasData = [];
let cachedInterpretacion = {};

function normalizarTexto(texto) {
    if (!texto) return '';
    return texto.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .trim();
}

async function loadDescodData() {
    if (sintomasData.length > 0) return;
    
    const data = await fetchAPI(API.DESCODIFICACION, 'ch_descodificacion');
    if (data && data.length > 0) {
        sintomasData = data;
        sintomasData.forEach(item => {
            if (item.sintoma && item.zona) {
                const sintomasArray = item.sintoma.split(',').map(s => normalizarTexto(s.trim()));
                sintomasArray.forEach(sintoma => {
                    if (sintoma) {
                        sintomasIndex.push({
                            sintoma: sintoma,
                            zona: item.zona || '',
                            subzona: item.subzona || '',
                            conflicto: item.conflicto || '',
                            emocion: item.emocion || '',
                            palabras_clave: item.palabras_clave || '',
                            recomendacion: item.recomendacion || '',
                            intensidad: item.intensidad || ''
                        });
                    }
                });
            }
        });
    }
}

async function interpretarConIA(datosSintoma) {
    const cacheKey = `${datosSintoma.sintoma}-${datosSintoma.zona}`;
    if (cachedInterpretacion[cacheKey]) {
        return cachedInterpretacion[cacheKey];
    }

    const prompt = `Eres un especialista en descodificación emocional y biológica del cuerpo humano. El cuerpo no miente nunca - cada síntoma es un mensaje.

Datos del síntoma:
- Síntoma: ${datosSintoma.sintoma}
- Zona: ${datosSintoma.zona}
- Subzona: ${datosSintoma.subzona}
- Conflicto: ${datosSintoma.conflicto}
- Emoción: ${datosSintoma.emocion}
- Palabras clave: ${datosSintoma.palabras_clave}
- Intensidad: ${datosSintoma.intensidad}

Tu misión es transformar estos datos en un mensaje profundo, personal y transformador. El cuerpo le está hablando DIRECTAMENTE al usuario.

Responde en este formato exacto (cada línea en una línea nueva):

MENSAJE CLAVE: [Una frase poderosa que hit directo al alma]
EXPLICACIÓN: [2-3 oraciones explicando la conexión cuerpo-emoción]
MENSAJE DEL CUERPO: [Qué está intentando decir el cuerpo y por qué existe este síntoma]
ACCIÓN CONSCIENTE: [Qué debe hacer el usuario a partir de hoy]
RECOMENDACIÓN: [${datosSintoma.recomendacion || ' productos naturales como aceites esenciales, infusiones, suplementación'}]

IMPORTANTE:
- No menciones que eres una IA
- Hazlo sentir como si el cuerpo le hablara directamente
- No seas clínico ni repetitivo con los datos
- Profundo, revelador, directo
- Máximo 150 palabras en total`;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getOpenAIKey()}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 500,
                temperature: 0.7
            })
        });

        const result = await response.json();
        const interpretacion = result.choices?.[0]?.message?.content || '';
        cachedInterpretacion[cacheKey] = interpretacion;
        return interpretacion;
    } catch (e) {
        console.error('Error IA:', e);
        return null;
    }
}

function parseInterpretacion(texto) {
    if (!texto) return {};
    const lineas = texto.split('\n');
    const resultado = {};
    lineas.forEach(linea => {
        if (linea.includes(':')) {
            const [key, ...value] = linea.split(':');
            resultado[key.trim().toLowerCase()] = value.join(':').trim();
        }
    });
    return resultado;
}

async function loadDescodificacion() {
    const container = document.getElementById('descodificacion-container');
    
    await loadDescodData();
    
    const zonasSet = new Set();
    sintomasIndex.forEach(item => {
        if (item.zona) zonasSet.add(item.zona);
    });
    const zonas = Array.from(zonasSet).sort();
    
    const iconosZonas = {
        'cabeza': '🧠', 'cara': '😊', 'ojos': '👁️', 'oidos': '👂', 'boca': '👄',
        'cuello': '🔗', 'hombros': '💪', 'pecho': '❤️', 'corazón': '💗',
        'pulmones': '🫁', 'estómago': '🫃', 'hígado': '🫘', 'intestinos': '🌀',
        'útero': '🌸', 'próstata': '🔵', 'vejiga': '💧', 'riñones': '🫘',
        'piel': '🩹', 'articulaciones': '🦴', 'músculos': '💪', 'extremidades': '🦶'
    };
    
    let html = `
        <div class="desc-page">
            <h2 class="desc-title">🔮 Descodificación</h2>
            <p class="desc-subtitle">Tu cuerpo es un mapa de emociones</p>
            
            <div class="desc-buscar">
                <input type="text" id="desc-input" class="desc-input" placeholder="¿Qué sientes?" />
                <button class="desc-btn" onclick="buscarDescEnPagina()">Interpretar</button>
            </div>
            
            <div id="desc-resultado-pagina"></div>
            
            <p class="desc-instruccion">O explora por zona del cuerpo:</p>
            
            <div class="desc-zonas-grid">
    `;
    
    zonas.forEach(zona => {
        const count = sintomasIndex.filter(s => s.zona === zona).length;
        const icono = iconosZonas[zona.toLowerCase()] || '🔘';
        html += `
            <div class="desc-zona-card" onclick="mostrarSubzonas('${zona}')">
                <span class="desc-zona-icono">${icono}</span>
                <span class="desc-zona-nombre">${zona}</span>
                <span class="desc-zona-count">${count} síntomas</span>
            </div>
        `;
    });
    
    html += `
            </div>
            <p class="desc-nota">Esto no es un diagnóstico médico. Es una lectura emocional.</p>
        </div>
    `;
    
    container.innerHTML = html;
    
    document.getElementById('desc-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') buscarDescEnPagina();
    });
}

async function loadContacto() {
    const container = document.getElementById('descodificacion-container');
    
    await loadDescodData();
    
    const data = await fetchAPI(API.CONTACTO, 'ch_contacto');
    if (!data.length) {
        container.innerHTML = '<p class="error">No hay información de contacto</p>';
        return;
    }

    const c = data[0];
    cachedWhatsApp = (c.WhatsApp||'').replace(/\D/g,'');
    const wa = cachedWhatsApp;
    
    let redes = '';
    if (c.Instagram) redes += `<a href="${c.Instagram}" target="_blank" title="Instagram" class="social-link"><svg class="social-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg><span class="nombre-red">Instagram</span></a>`;
    if (c.Facebook) redes += `<a href="${c.Facebook}" target="_blank" title="Facebook" class="social-link"><svg class="social-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg><span class="nombre-red">Facebook</span></a>`;
    if (c.YouTube || c.Youtube) redes += `<a href="${c.YouTube || c.Youtube}" target="_blank" title="YouTube" class="social-link"><svg class="social-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg><span class="nombre-red">YouTube</span></a>`;
    if (wa) redes += `<a href="https://wa.me/${wa}" target="_blank" title="WhatsApp" class="social-link"><svg class="social-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg><span class="nombre-red">WhatsApp</span></a>`;

    container.innerHTML = `
        <div class="contacto-card">
            <div class="contacto-icono-grande">🧘</div>
            <h2>Centro Holístico M</h2>
            
            <div class="contacto-grid">
                ${(c.Direccion||c.Dirección) ? `<div class="contacto-item">
                    <div class="icono">📍</div>
                    <div class="detalle">
                        <strong>Dirección</strong>
                        <span>${c.Direccion||c.Dirección}</span>
                    </div>
                </div>` : ''}
                
                ${(c.Ciudad || c.Estado) ? `<div class="contacto-item">
                    <div class="icono">🏙️</div>
                    <div class="detalle">
                        <strong>Ubicación</strong>
                        <span>${[c.Ciudad, c.Estado].filter(Boolean).join(', ')}</span>
                    </div>
                </div>` : ''}
                
                ${c.Telefono||c.Teléfono ? `<div class="contacto-item">
                    <div class="icono">📞</div>
                    <div class="detalle">
                        <strong>Teléfono</strong>
                        <a href="tel:${c.Telefono||c.Teléfono}">${c.Telefono||c.Teléfono}</a>
                    </div>
                </div>` : ''}
                
                ${c.Email ? `<div class="contacto-item">
                    <div class="icono">✉️</div>
                    <div class="detalle">
                        <strong>Email</strong>
                        <a href="mailto:${c.Email}">${c.Email}</a>
                    </div>
                </div>` : ''}
                
                ${c.Horario ? `<div class="contacto-item">
                    <div class="icono">🕰️</div>
                    <div class="detalle">
                        <strong>Horario</strong>
                        <span>${c.Horario}</span>
                    </div>
                </div>` : ''}
            </div>
            
            ${c.GoogleMaps ? `<a href="${c.GoogleMaps}" target="_blank" class="contacto-mapa-btn">
                🗺️ Ver ubicación en mapa
            </a>` : ''}
            
            ${redes ? `<p class="contacto-titulo-sección">Síguenos</p>
            <div class="redes-sociales">${redes}</div>` : ''}
            
            <div class="descodificacion-consulta">
                <h3 class="section-subtitle">🔍 Descodificación</h3>
                <p class="descodificacion-desc">Ingresa un síntoma para explorar su significado emocional</p>
                <input type="text" id="sintoma-input" class="sintoma-input" placeholder="Ej: dolor de cabeza, ansiedad, fatiga..." />
                <button class="sintoma-buscar-btn" id="btn-buscar-sintoma">Interpretar</button>
                <div id="sintoma-resultado" class="sintoma-resultado"></div>
            </div>
        </div>
    `;
    
    document.getElementById('btn-buscar-sintoma').addEventListener('click', buscarSintoma);
    document.getElementById('sintoma-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') buscarSintoma();
    });
}

async function buscarDescEnPagina() {
    const input = document.getElementById('desc-input');
    const resultado = document.getElementById('desc-resultado-pagina');
    const termino = normalizarTexto(input.value);
    
    if (!termino) {
        resultado.innerHTML = '<p class="desc-error">¿Qué estás sintiendo?</p>';
        return;
    }
    
    showLoading(true);
    await loadDescodData();
    
    const resultados = sintomasIndex.filter(item => item.sintoma.includes(termino));
    
    if (resultados.length > 0) {
        const r = resultados[0];
        const interpretacion = await interpretarConIA(r);
        
        if (interpretacion) {
            const parsed = parseInterpretacion(interpretacion);
            resultado.innerHTML = `
                <div class="desc-card">
                    <h3>${r.sintoma}</h3>
                    <p class="desc-zona-info">📍 ${r.zona} ${r.subzona ? '› ' + r.subzona : ''}</p>
                    
                    ${parsed['mensaje clave'] ? `<p class="desc-mensaje-clave">"${parsed['mensaje clave']}"</p>` : ''}
                    
                    ${parsed['explicación'] ? `<p class="desc-explicacion">${parsed['explicación']}</p>` : ''}
                    
                    ${parsed['mensaje del cuerpo'] ? `<div class="desc-seccion">
                        <span class="desc-seccion-icono">🧬</span>
                        <p>${parsed['mensaje del cuerpo']}</p>
                    </div>` : ''}
                    
                    ${parsed['acción consciente'] ? `<div class="desc-seccion">
                        <span class="desc-seccion-icono">✨</span>
                        <p>${parsed['acción consciente']}</p>
                    </div>` : ''}
                    
                    ${parsed['recomendación'] ? `<div class="desc-recomendacion">
                        <span class="desc-seccion-icono">🌿</span>
                        <p>${parsed['recomendación']}</p>
                    </div>` : ''}
                </div>
            `;
        } else {
            resultado.innerHTML = `
                <div class="desc-card">
                    <h3>${r.sintoma}</h3>
                    <p class="desc-zona-info">📍 ${r.zona}</p>
                    <p><strong>Conflicto:</strong> ${r.conflicto}</p>
                    <p><strong>Emoción:</strong> ${r.emocion}</p>
                    <p><strong>Recomendación:</strong> ${r.recomendacion}</p>
                </div>
            `;
        }
    } else {
        resultado.innerHTML = `
            <div class="desc-no-encontrado">
                <p>No encontramos "${input.value}" en nuestro mapa corporal.</p>
                <p class="desc-sugerencia">Prueba con otras palabras: dolor, tensión, fatiga, ansiedad...</p>
            </div>
        `;
    }
    
    showLoading(false);
}

function mostrarSubzonas(zona) {
    const container = document.getElementById('descodificacion-container');
    const subzonasSet = new Set();
    sintomasIndex.filter(s => s.zona === zona).forEach(s => {
        if (s.subzona) subzonasSet.add(s.subzona);
    });
    const subzonas = Array.from(subzonasSet);
    
    let html = `
        <div class="desc-nav-back" onclick="loadDescodificacion()">
            <span>←</span> Volver
        </div>
        <h3 class="desc-level-title">📍 ${zona}</h3>
        <div class="desc-zonas-grid">
    `;
    
    subzonas.forEach(subzona => {
        const count = sintomasIndex.filter(s => s.zona === zona && s.subzona === subzona).length;
        html += `
            <div class="desc-zona-card" onclick="mostrarSintomas('${zona}', '${subzona}')">
                <span class="desc-zona-nombre">${subzona}</span>
                <span class="desc-zona-count">${count} síntomas</span>
            </div>
        `;
    });
    
    // Si no hay subzonas, mostrar todos los síntomas de la zona
    if (subzonas.length === 0) {
        const sintomas = sintomasIndex.filter(s => s.zona === zona);
        sintomas.forEach(s => {
            html += `
                <div class="desc-zona-card" onclick="mostrarDetalleSintoma('${encodeURIComponent(JSON.stringify(s))}')">
                    <span class="desc-zona-nombre">${s.sintoma}</span>
                </div>
            `;
        });
    }
    
    html += '</div>';
    container.innerHTML = html;
}

function mostrarSintomas(zona, subzona) {
    const container = document.getElementById('descodificacion-container');
    const sintomas = sintomasIndex.filter(s => s.zona === zona && s.subzona === subzona);
    
    let html = `
        <div class="desc-nav-back" onclick="mostrarSubzonas('${zona}')">
            <span>←</span> ${zona}
        </div>
        <h3 class="desc-level-title">📍 ${zona} › ${subzona}</h3>
        <div class="desc-zonas-grid">
    `;
    
    sintomas.forEach(s => {
        html += `
            <div class="desc-zona-card" onclick="mostrarDetalleSintoma('${encodeURIComponent(JSON.stringify(s))}')">
                <span class="desc-zona-nombre">${s.sintoma}</span>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

async function mostrarDetalleSintoma(sintomaJson) {
    const s = JSON.parse(decodeURIComponent(sintomaJson));
    const container = document.getElementById('descodificacion-container');
    
    showLoading(true);
    const interpretacion = await interpretarConIA(s);
    showLoading(false);
    
    if (interpretacion) {
        const parsed = parseInterpretacion(interpretacion);
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.innerHTML = `
            <div class="modal-content">
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
                <div class="desc-card desc-card-full">
                    <h3>${s.sintoma}</h3>
                    <p class="desc-zona-info">📍 ${s.zona} ${s.subzona ? '› ' + s.subzona : ''}</p>
                    
                    ${parsed['mensaje clave'] ? `<p class="desc-mensaje-clave">"${parsed['mensaje clave']}"</p>` : ''}
                    ${parsed['explicación'] ? `<p class="desc-explicacion">${parsed['explicación']}</p>` : ''}
                    ${parsed['mensaje del cuerpo'] ? `<div class="desc-seccion"><span class="desc-seccion-icono">🧬</span><p>${parsed['mensaje del cuerpo']}</p></div>` : ''}
                    ${parsed['acción consciente'] ? `<div class="desc-seccion"><span class="desc-seccion-icono">✨</span><p>${parsed['acción consciente']}</p></div>` : ''}
                    ${parsed['recomendación'] ? `<div class="desc-recomendacion"><span class="desc-seccion-icono">🌿</span><p>${parsed['recomendación']}</p></div>` : ''}
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    }
}

window.buscarDescEnPagina = buscarDescEnPagina;
window.mostrarSubzonas = mostrarSubzonas;
window.mostrarSintomas = mostrarSintomas;
window.mostrarDetalleSintoma = mostrarDetalleSintoma;

// Actualizar búsqueda en Contacto para usar IA
async function buscarSintoma() {
    const input = document.getElementById('sintoma-input');
    const resultado = document.getElementById('sintoma-resultado');
    const termino = normalizarTexto(input.value);
    
    if (!termino) {
        resultado.innerHTML = '<p class="error-buscar">¿Qué estás sintiendo?</p>';
        return;
    }
    
    showLoading(true);
    await loadDescodData();
    
    const resultados = sintomasIndex.filter(item => item.sintoma.includes(termino));
    
    if (resultados.length > 0) {
        const r = resultados[0];
        const interpretacion = await interpretarConIA(r);
        
        if (interpretacion) {
            const parsed = parseInterpretacion(interpretacion);
            resultado.innerHTML = `
                <div class="sintoma-card">
                    <h4>${r.sintoma}</h4>
                    <p class="desc-zona-info">📍 ${r.zona}</p>
                    ${parsed['mensaje clave'] ? `<p class="desc-mensaje-clave">"${parsed['mensaje clave']}"</p>` : ''}
                    ${parsed['explicación'] ? `<p class="desc-explicacion-corto">${parsed['explicación']}</p>` : ''}
                    <div class="desc-botones">
                        <button class="desc-btn-small" onclick="abrirModalInterpretacion('${encodeURIComponent(JSON.stringify(r))}')">Ver más</button>
                        <button class="desc-btn-small desc-btn-outline" onclick="irADescodificacion()">Explorar</button>
                    </div>
                </div>
            `;
        }
    } else {
        resultado.innerHTML = `
            <div class="no-encontrado">
                <p>No encontramos "${input.value}" en nuestro mapa corporal.</p>
                <p class="sugerencia">Prueba: dolor, cabeza, estómago, ansiedad...</p>
            </div>
        `;
    }
    
    showLoading(false);
}

async function abrirModalInterpretacion(sintomaJson) {
    const s = JSON.parse(decodeURIComponent(sintomaJson));
    const interpretacion = await interpretarConIA(s);
    
    if (!interpretacion) return;
    
    const parsed = parseInterpretacion(interpretacion);
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.innerHTML = `
        <div class="modal-content">
            <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
            <div class="desc-card">
                <h3>${s.sintoma}</h3>
                <p class="desc-zona-info">📍 ${s.zona} ${s.subzona ? '› ' + s.subzona : ''}</p>
                
                ${parsed['mensaje clave'] ? `<p class="desc-mensaje-clave">"${parsed['mensaje clave']}"</p>` : ''}
                ${parsed['explicación'] ? `<p class="desc-explicacion">${parsed['explicación']}</p>` : ''}
                ${parsed['mensaje del cuerpo'] ? `<div class="desc-seccion"><span class="desc-seccion-icono">🧬</span><p>${parsed['mensaje del cuerpo']}</p></div>` : ''}
                ${parsed['acción consciente'] ? `<div class="desc-seccion"><span class="desc-seccion-icono">✨</span><p>${parsed['acción consciente']}</p></div>` : ''}
                ${parsed['recomendación'] ? `<div class="desc-recomendacion"><span class="desc-seccion-icono">🌿</span><p>${parsed['recomendación']}</p></div>` : ''}
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
}

function irADescodificacion() {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelector('[data-tab="descodificacion"]').classList.add('active');
    document.getElementById('descodificacion').classList.add('active');
    loadDescodificacion();
}

window.buscarSintoma = buscarSintoma;
window.abrirModalInterpretacion = abrirModalInterpretacion;
window.irADescodificacion = irADescodificacion;


