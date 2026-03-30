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
    
    // Establecer botón Horarios como activo al inicio
    document.querySelector('.nav-btn[data-tab="horarios"]').classList.add('active');
    
    // Fusionar logo después de la animación (3s)
    setTimeout(() => {
        const splash = document.getElementById('splash');
        if (splash) {
            splash.style.display = 'none';
        }
        // El logo ya está en posición, agregar clase para efecto pulso continuo
        const fusionLogo = document.getElementById('fusion-logo');
        if (fusionLogo) {
            fusionLogo.classList.add('fused');
        }
    }, 3000);
    
    // Crear partículas del splash
    initSplashParticles();
});

function initSplashParticles() {
    const container = document.getElementById('splash-particles');
    if (!container) return;
    
    for (let i = 0; i < 12; i++) {
        const p = document.createElement('div');
        p.className = 'splash-particle';
        p.style.left = Math.random() * 100 + '%';
        p.style.top = 60 + Math.random() * 30 + '%';
        p.style.animationDelay = Math.random() * 2 + 's';
        p.style.width = (Math.random() * 4 + 2) + 'px';
        p.style.height = p.style.width;
        container.appendChild(p);
    }
}

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
            // Ocultar Section M y todos los tab-content
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active', 'hidden'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
            document.getElementById(tab).classList.remove('hidden');
            document.getElementById(tab).classList.add('active');
            // Ocultar Section M si está visible
            const seccionM = document.getElementById('seccion-m');
            if (seccionM) seccionM.classList.add('hidden');
            loadTab(tab);
        });
    });
}

async function loadTab(tab) {
    showLoading(true);
    try {
        if (tab === 'horarios') await loadHorarios();
        else if (tab === 'servicios') await loadServicios();
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
        </div>
    `;
}

window.buscarSintoma = buscarSintoma;

async function loadSlogan() {
    const el = document.getElementById('slogan');
    if (!el) return;
    
    // If we have cached slogan, use it immediately
    if (cachedSlogan) {
        el.textContent = cachedSlogan;
        el.classList.add('visible');
        return;
    }
    
    try {
        const data = await fetchAPI(API.CONTACTO, 'ch_contacto');
        if (data && data.length > 0 && data[0].Slogan) {
            cachedSlogan = data[0].Slogan.trim();
            // Only set if we actually have content
            if (cachedSlogan) {
                el.textContent = cachedSlogan;
                el.classList.add('visible');
                return;
            }
        }
    } catch(e) {
        console.warn('Could not load slogan from API:', e);
    }
    
    // Fallback: set a default slogan to ensure visibility
    el.textContent = "Centro Holístico M";
    el.classList.add('visible');
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

async function loadDescodData(force=false) {
    if (!force && sintomasData.length > 0) return;
    
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

// ============================================
// DESCODIFICACIÓN GUIADA - Experience
// ============================================

// Estado global
let descodEstado = {
    step: 0,
    sintoma: '',
    resultados: [],
    indiceActual: 0,
    intentosNoResuena: 0
};

async function loadDescodificacion() {
    const container = document.getElementById('descodificacion-container');
    await loadDescodData();
    renderDescodPaso0(container);
}

function renderDescodPaso0(container) {
    descodEstado.step = 0;
    descodEstado.intentosNoResuena = 0;
    descodEstado.indiceActual = 0;
    
    container.innerHTML = `
        <div class="descod-container descod-fade">
            <div class="descod-paso">
                <p class="descod-frase">No llegaste aquí por casualidad</p>
                <div class="descod-botones">
                    <button class="descod-btn" onclick="renderDescodPaso1()">Explorar mi síntoma</button>
                    <button class="descod-btn-outline" onclick="renderModoExploracion()">Explorar manualmente</button>
                </div>
                <div class="descod-botones" style="margin-top:6px;">
                    <button class="descod-btn-outline" onclick="actualizarDescodDatos()">Actualizar datos</button>
                </div>
            </div>
        </div>
    `;
}

function renderDescodPaso1() {
    const container = document.getElementById('descodificacion-container');
    descodEstado.step = 1;
    descodEstado.intentosNoResuena = 0;
    descodEstado.indiceActual = 0;
    
    container.innerHTML = `
        <div class="descod-container descod-fade">
            <div class="descod-paso">
                <p class="descod-pregunta">¿Qué sientes?</p>
                <input type="text" id="descod-input" class="descod-input" placeholder="Ej: dolor de cabeza, ansiedad..." />
                <button class="descod-btn" onclick="buscarSintomaGuiado()">Escuchar</button>
            </div>
        </div>
    `;
    
    document.getElementById('descod-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') buscarSintomaGuiado();
    });
}

function buscarSintomaGuiado() {
    const input = document.getElementById('descod-input');
    const termino = normalizarTexto(input.value);
    
    if (!termino || termino.length < 2) {
        alert('Por favor escribe qué sientes');
        return;
    }
    
    const terminos = termino.split(' ').filter(t => t.length > 2);
    const resultados = sintomasIndex.filter(item => {
        const textoBusqueda = `${item.sintoma} ${item.zona} ${item.subzona} ${item.emocion}`.toLowerCase();
        return terminos.some(t => textoBusqueda.includes(t));
    });
    
    if (resultados.length === 0) {
        alert('No encontramos ese síntoma. Prueba con otras palabras');
        return;
    }
    
    descodEstado.resultados = resultados;
    descodEstado.indiceActual = 0;
    descodEstado.sintoma = termino;
    
    renderDescodPaso2();
}

function renderDescodPaso2() {
    const container = document.getElementById('descodificacion-container');
    descodEstado.step = 2;
    
    const r = descodEstado.resultados[descodEstado.indiceActual];
    
    container.innerHTML = `
        <div class="descod-container descod-fade">
            <div class="descod-paso">
                <p class="descod-sintoma">${r.sintoma}</p>
                <p class="descod-frase-sub">No es casualidad que estés sintiendo esto</p>
                <p class="descod-frase-sub">El cuerpo ya habló… ahora escúchalo</p>
                <button class="descod-btn" onclick="renderDescodPaso3()">Continuar</button>
            </div>
        </div>
    `;
}

function renderDescodPaso3() {
    const container = document.getElementById('descodificacion-container');
    descodEstado.step = 3;
    
    const r = descodEstado.resultados[descodEstado.indiceActual];
    
    container.innerHTML = `
        <div class="descod-container descod-fade">
            <div class="descod-paso">
                <p class="descod-label">Conflicto</p>
                <p class="descod-texto">${r.conflicto}</p>
                <p class="descod-frase-sub">Observa sin juzgar… solo siente si hay algo ahí</p>
                <div class="descod-botones">
                    <button class="descod-btn" onclick="renderDescodPaso4()">Esto me resuena</button>
                    <button class="descod-btn-outline" onclick="siguienteResultado()">No me resuena</button>
                </div>
            </div>
        </div>
    `;
}

function siguienteResultado() {
    descodEstado.intentosNoResuena++;
    
    if (descodEstado.intentosNoResuena >= 3) {
        renderNoMatch();
        return;
    }
    
    descodEstado.indiceActual = (descodEstado.indiceActual + 1) % descodEstado.resultados.length;
    renderDescodPaso3();
}

function renderNoMatch() {
    const container = document.getElementById('descodificacion-container');
    
    container.innerHTML = `
        <div class="descod-container descod-fade">
            <div class="descod-paso">
                <p class="descod-frase">Tal vez esto no se trata de encontrar la respuesta… sino de observarte un poco más</p>
                <div class="descod-botones">
                    <button class="descod-btn" onclick="renderDescodPaso1()">Intentar de nuevo</button>
                    <button class="descod-btn-outline" onclick="renderModoExploracion()">Explorar manualmente</button>
                </div>
            </div>
        </div>
    `;
}

function renderDescodPaso4() {
    const container = document.getElementById('descodificacion-container');
    descodEstado.step = 4;
    
    const r = descodEstado.resultados[descodEstado.indiceActual];
    
    container.innerHTML = `
        <div class="descod-container descod-fade">
            <div class="descod-paso">
                <p class="descod-label">Emoción</p>
                <p class="descod-texto">${r.emocion}</p>
                <button class="descod-btn" onclick="renderDescodPaso5()">Continuar</button>
            </div>
        </div>
    `;
}

function renderDescodPaso5() {
    const container = document.getElementById('descodificacion-container');
    descodEstado.step = 5;
    
    const r = descodEstado.resultados[descodEstado.indiceActual];
    const palabras = r.palabras_clave ? r.palabras_clave.split(',').map(p => p.trim()) : [];
    
    let palabrasHtml = '';
    if (palabras.length > 0 && palabras[0]) {
        palabrasHtml = `
            <div class="descod-palabras">
                ${palabras.map(p => `<span class="descod-palabra">${p}</span>`).join('')}
            </div>
        `;
    }
    
    container.innerHTML = `
        <div class="descod-container descod-fade">
            <div class="descod-paso">
                <p class="descod-label">Patrón</p>
                ${palabrasHtml}
                <p class="descod-pregunta-italic">¿Qué estás intentando evitar?</p>
                <input type="text" id="descod-input-evitar" class="descod-input" placeholder="Escribe si lo sientes... (opcional)" />
                <button class="descod-btn" onclick="renderDescodPaso6()">Continuar</button>
            </div>
        </div>
    `;
    
    document.getElementById('descod-input-evitar').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') renderDescodPaso6();
    });
}

function renderDescodPaso6() {
    const container = document.getElementById('descodificacion-container');
    descodEstado.step = 6;
    
    const r = descodEstado.resultados[descodEstado.indiceActual];
    
    container.innerHTML = `
        <div class="descod-container descod-fade">
            <div class="descod-paso">
                <p class="descod-label">Recomendación</p>
                <p class="descod-texto">${r.recomendacion}</p>
                <p class="descod-mensaje-final">Tu cuerpo no es el problema… es el mensaje</p>
                <div class="descod-botones">
                    <button class="descod-btn" onclick="renderDescodPaso1()">Explorar otro síntoma</button>
                    <button class="descod-btn-outline" onclick="renderGuardarProceso()">Guardar proceso</button>
                </div>
            </div>
        </div>
    `;
}

function renderGuardarProceso() {
    const container = document.getElementById('descodificacion-container');
    
    container.innerHTML = `
        <div class="descod-container descod-fade">
            <div class="descod-paso">
                <p class="descod-frase">Esto que viste… es tuyo ahora</p>
                <button class="descod-btn" onclick="renderDescodPaso0()">Cerrar</button>
            </div>
        </div>
    `;
}

function actualizarDescodDatos() {
  // Reset in-memory caches to fetch fresh data
  sintomasIndex = [];
  sintomasData = [];
  // Force reload
  loadDescodData(true).then(() => {
    const container = document.getElementById('descodificacion-container');
    if (container) {
      const note = document.createElement('div');
      note.className = 'desc-nota';
      note.style.color = 'var(--gold)';
      note.textContent = 'Datos actualizados';
      container.appendChild(note);
      setTimeout(() => note.remove(), 1700);
    }
  }).catch((e) => {
    console.error('Error actualizando datos', e);
  });
}

function renderModoExploracion() {
    const container = document.getElementById('descodificacion-container');
    
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
        <div class="descod-container">
            <div class="descod-paso">
                <p class="descod-pregunta">¿Qué sientes?</p>
                <input type="text" id="desc-input-manual" class="descod-input" placeholder="Ej: dolor de cabeza..." />
                <button class="descod-btn" onclick="buscarDescEnPaginaManual()">Buscar</button>
            </div>
            <div id="descod-resultado-manual"></div>
            <p class="descod-label">O explora por zona:</p>
            <div class="descod-zonas-grid">
    `;
    
    zonas.forEach(zona => {
        const count = sintomasIndex.filter(s => s.zona === zona).length;
        const icono = iconosZonas[zona.toLowerCase()] || '🔘';
        html += `
            <div class="descod-zona-card" onclick="mostrarSubzonasDescod('${zona}')">
                <span>${icono}</span>
                <span>${zona}</span>
                <span class="descod-count">${count}</span>
            </div>
        `;
    });
    
    html += `
            </div>
            <button class="descod-btn-outline" onclick="renderDescodPaso0()" style="margin-top:16px;">← Volver</button>
        </div>
    `;
    
    container.innerHTML = html;
}

function buscarDescEnPaginaManual() {
    const input = document.getElementById('desc-input-manual');
    const resultado = document.getElementById('descod-resultado-manual');
    const termino = normalizarTexto(input.value);
    
    if (!termino) {
        resultado.innerHTML = '<p class="descod-error">¿Qué sientes?</p>';
        return;
    }
    
    const terminos = termino.split(' ').filter(t => t.length > 2);
    const resultados = sintomasIndex.filter(item => {
        const textoBusqueda = `${item.sintoma} ${item.zona} ${item.subzona} ${item.emocion}`.toLowerCase();
        return terminos.some(t => textoBusqueda.includes(t));
    });
    
    if (resultados.length > 0) {
        const r = resultados[0];
        resultado.innerHTML = `
            <div class="descod-resultado-card">
                <p class="descod-sintoma">${r.sintoma}</p>
                <p class="descod-zona">📍 ${r.zona}</p>
                <p><strong>Conflicto:</strong> ${r.conflicto}</p>
                <p><strong>Emoción:</strong> ${r.emocion}</p>
                <p><strong>Recomendación:</strong> ${r.recomendacion}</p>
            </div>
        `;
    } else {
        resultado.innerHTML = '<p class="descod-error">No encontrado. Prueba con otras palabras.</p>';
    }
}

function mostrarSubzonasDescod(zona) {
    const container = document.getElementById('descodificacion-container');
    
    const subzonasSet = new Set();
    sintomasIndex.filter(s => s.zona === zona).forEach(s => {
        if (s.subzona) subzonasSet.add(s.subzona);
    });
    const subzonas = Array.from(subzonasSet);
    
    let html = `
        <div class="descod-container">
            <button class="descod-btn-outline" onclick="renderModoExploracion()" style="margin-bottom:16px;">← Volver</button>
            <p class="descod-label">${zona}</p>
            <div class="descod-zonas-grid">
    `;
    
    subzonas.forEach(subzona => {
        html += `
            <div class="descod-zona-card" onclick="mostrarSintomasDescod('${zona}', '${subzona}')">
                <span>${subzona}</span>
            </div>
        `;
    });
    
    html += '</div></div>';
    container.innerHTML = html;
}

function mostrarSintomasDescod(zona, subzona) {
    const container = document.getElementById('descodificacion-container');
    const sintomas = sintomasIndex.filter(s => s.zona === zona && s.subzona === subzona);
    
    let html = `
        <div class="descod-container">
            <button class="descod-btn-outline" onclick="mostrarSubzonasDescod('${zona}')" style="margin-bottom:16px;">← Volver</button>
            <p class="descod-label">${zona} › ${subzona}</p>
            <div class="descod-zonas-grid">
    `;
    
    sintomas.forEach(s => {
        html += `
            <div class="descod-zona-card" onclick="mostrarDetalleSintomaDescod('${encodeURIComponent(JSON.stringify(s))}')">
                <span>${s.sintoma}</span>
            </div>
        `;
    });
    
    html += '</div></div>';
    container.innerHTML = html;
}

function mostrarDetalleSintomaDescod(sintomaJson) {
    const s = JSON.parse(decodeURIComponent(sintomaJson));
    const container = document.getElementById('descodificacion-container');
    
    container.innerHTML = `
        <div class="descod-container">
            <button class="descod-btn-outline" onclick="mostrarSintomasDescod('${s.zona}', '${s.subzona}')" style="margin-bottom:16px;">← Volver</button>
            <div class="descod-resultado-card">
                <p class="descod-sintoma">${s.sintoma}</p>
                <p class="descod-zona">📍 ${s.zona} › ${s.subzona}</p>
                <p><strong>Conflicto:</strong> ${s.conflicto}</p>
                <p><strong>Emoción:</strong> ${s.emocion}</p>
                ${s.palabras_clave ? `<p><strong>Patrón:</strong> ${s.palabras_clave}</p>` : ''}
                <p><strong>Recomendación:</strong> ${s.recomendacion}</p>
            </div>
        </div>
    `;
}

// Funciones helper para onclick en HTML
window.renderDescodPaso0 = renderDescodPaso0;
window.renderDescodPaso1 = renderDescodPaso1;
window.renderModoExploracion = renderModoExploracion;
window.buscarSintomaGuiado = buscarSintomaGuiado;
window.renderDescodPaso2 = renderDescodPaso2;
window.renderDescodPaso3 = renderDescodPaso3;
window.renderDescodPaso4 = renderDescodPaso4;
window.renderDescodPaso5 = renderDescodPaso5;
window.renderDescodPaso6 = renderDescodPaso6;
window.siguienteResultado = siguienteResultado;
window.buscarDescEnPaginaManual = buscarDescEnPaginaManual;
window.mostrarSubzonasDescod = mostrarSubzonasDescod;
window.mostrarSintomasDescod = mostrarSintomasDescod;
window.mostrarDetalleSintomaDescod = mostrarDetalleSintomaDescod;

async function loadContacto() {
    const container = document.getElementById('contacto-container');
    
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
        </div>
    `;
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
    
    // Buscar en cualquier campo (sintoma, zona, subzona, emocion)
    const terminos = termino.split(' ').filter(t => t.length > 2);
    const resultados = sintomasIndex.filter(item => {
        const textoBusqueda = `${item.sintoma} ${item.zona} ${item.subzona} ${item.emocion} ${item.conflicto}`.toLowerCase();
        return terminos.some(t => textoBusqueda.includes(t));
    });
    
    if (resultados.length > 0) {
        const r = resultados[0];
        
        // Intentar IA primero
        let interpretacion = null;
        try {
            interpretacion = await interpretarConIA(r);
        } catch(e) {
            console.log('IA no disponible, mostrando datos base');
        }
        
        if (interpretacion && interpretacion.trim()) {
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
            // Fallback: mostrar datos de Google Sheets
            resultado.innerHTML = `
                <div class="desc-card">
                    <h3>${r.sintoma}</h3>
                    <p class="desc-zona-info">📍 ${r.zona} ${r.subzona ? '› ' + r.subzona : ''}</p>
                    
                    <div class="desc-seccion">
                        <span class="desc-seccion-icono">💭</span>
                        <p><strong>Conflicto:</strong> ${r.conflicto || 'No disponible'}</p>
                    </div>
                    
                    <div class="desc-seccion">
                        <span class="desc-seccion-icono">❤️</span>
                        <p><strong>Emoción:</strong> ${r.emocion || 'No disponible'}</p>
                    </div>
                    
                    ${r.palabras_clave ? `<div class="desc-seccion">
                        <span class="desc-seccion-icono">🔑</span>
                        <p><strong>Palabras clave:</strong> ${r.palabras_clave}</p>
                    </div>` : ''}
                    
                    ${r.recomendacion ? `<div class="desc-recomendacion">
                        <span class="desc-seccion-icono">🌿</span>
                        <p>${r.recomendacion}</p>
                    </div>` : ''}
                </div>
            `;
        }
    } else {
        resultado.innerHTML = `
            <div class="desc-no-encontrado">
                <p>No encontramos "${input.value}" en nuestro mapa corporal.</p>
                <p class="desc-sugerencia">Prueba con otras palabras: dolor, cabeza, estómago, ansiedad...</p>
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
    
    // Buscar en cualquier campo
    const terminos = termino.split(' ').filter(t => t.length > 2);
    const resultados = sintomasIndex.filter(item => {
        const textoBusqueda = `${item.sintoma} ${item.zona} ${item.subzona} ${item.emocion} ${item.conflicto}`.toLowerCase();
        return terminos.some(t => textoBusqueda.includes(t));
    });
    
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

function irASeccionM() {
    console.debug('[CHM] Accediendo a Section M vía logo');
    // Resetear nav
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    // Ocultar todos los tab-content
    document.querySelectorAll('.tab-content').forEach(c => {
        c.classList.remove('active');
        c.classList.add('hidden');
    });
    // Mostrar Section M
    const seccionM = document.getElementById('seccion-m');
    if (seccionM) {
        seccionM.classList.remove('hidden');
        seccionM.classList.add('active');
    }
    // Cargar contenido de Section M
    cargarSeccionM();
}

async function cargarSeccionM() {
    const contenedor = document.getElementById('seccion-m-contenedor');
    if (!contenedor) return;
    
    // Evitar recargar si ya tiene contenido
    if (contenedor.querySelector('.miniapps-grid')) return;
    
    contenedor.innerHTML = `
        <div class="seccion-m-header">
            <h2>Sección M</h2>
            <p>Explora nuestras herramientas de bienestar</p>
        </div>
        
        <div class="miniapps-grid">
            <!-- Miniapp Descodificación -->
            <div class="miniapp-card" onclick="abrirMiniapp('descodificacion')">
                <div class="miniapp-icon">🧠</div>
                <div class="miniapp-titulo">Decodificación</div>
                <div class="miniapp-descripcion">
                    Entiende el mensaje detrás de tus síntomas
                </div>
            </div>
            
            <!-- Miniapp Yoga -->
            <div class="miniapp-card" onclick="abrirMiniapp('yoga')">
                <div class="miniapp-icon">🧘</div>
                <div class="miniapp-titulo">Yoga Terapéutico</div>
                <div class="miniapp-descripcion">
                    Clases diarias basado en fase lunar
                </div>
            </div>
            
            <!-- Miniapp Living Light -->
            <div class="miniapp-card" onclick="abrirMiniapp('living-light')">
                <div class="miniapp-icon">💎</div>
                <div class="miniapp-titulo">Living Light</div>
                <div class="miniapp-descripcion">
                    Análisis lingüístico y energético
                </div>
            </div>
        </div>
    `;
}

function abrirMiniapp(tipo) {
    console.debug('[CHM] Abriendo miniapp:', tipo);
    // Ocultar Section M
    const seccionM = document.getElementById('seccion-m');
    if (seccionM) {
        seccionM.classList.remove('active');
        seccionM.classList.add('hidden');
    }
    // Mostrar el miniapp seleccionado
    const miniappSeccion = document.getElementById(tipo);
    if (miniappSeccion) {
        miniappSeccion.classList.remove('hidden');
        miniappSeccion.classList.add('active');
    }
    // Cargar contenido específico del miniapp
    switch(tipo) {
        case 'descodificacion':
            loadDescodificacion();
            break;
        case 'yoga':
            loadYoga();
            break;
        case 'living-light':
            // loadLivingLight(); // Pendiente implementación
            break;
    }
}

function volverASeccionM() {
    console.debug('[CHM] Regresando a Section M');
    // Ocultar todos los tab-content
    document.querySelectorAll('.tab-content').forEach(c => {
        c.classList.remove('active');
        c.classList.add('hidden');
    });
    // Mostrar Section M
    const seccionM = document.getElementById('seccion-m');
    if (seccionM) {
        seccionM.classList.remove('hidden');
        seccionM.classList.add('active');
    }
}

// ============================================
// YOGA MINIAPP - Sistema de generación de clases
// ============================================

// ============================================
// BASE DE DATOS DE POSTURAS DE YOGA
// ============================================
// Estructura modular para facilitar futura integración con fuentes externas
// Si se reemplaza esta sección, mantener la misma estructura de objetos

let posturaDB = [
    {
        nombre: "Postura del Niño",
        sanskrit: "Balasana",
        tipo: ["flexibilidad", "relajación"],
        fase_lunar_adecuada: ["luna_nueva", "luna_llena", "luna_menguante"],
        intencion_alineada: ["soltar", "equilibrar"],
        duracion_estimada_seg: 60,
        // Nuevos campos para diferenciación Vinyasa/Hatha
        complejidad: 1, // 1-5 (1=muy fácil, 5=muy complejo)
        nivel_intensidad: 1, // 1-5 (1=muy suave, 5=muy intenso)
        duracion_vinyasa: 15, // segundos en flujo vinyasa
        duracion_hatha: 60, // segundos en práctica estática
        adecuada_vinyasa: true, // ¿Es adecuada para flujo vinyasa?
        adecuada_hatha: true, // ¿Es adecuada para práctica estática?
        instrucciones_clave: [
            "Rodillas separadas ancho de caderas",
            "Glúteos hacia talones",
            "Frontal hacia el suelo",
            "Brazos extendidos o a los lados",
            "Respiración profunda en espalda"
        ],
        contraindicaciones: ["lesión de rodilla grave"],
        beneficios: ["alivia ansiedad", "estira espalda baja", "calma mente"],
        transicion_desde: {
            "Perro Abajo": "Lleva las rodillas al suelo y siéntate sobre los talones"
        },
        transicion_hacia: {
            "Gato-Vaca": "Desde Postura del Niño, inhala y lleva las manos al frente, arriba de la cabeza"
        },
        puntos_clave_instructor: [
            "Mantener respiración profunda y lenta",
            "Ajustar separación de rodillas según comodidad",
            "Permitir que la espalda se redondee naturalmente"
        ]
    },
    {
        nombre: "Gato-Vaca",
        sanskrit: "Marjaryasana-Bitilasana",
        tipo: ["flexibilidad", "movilidad"],
        fase_lunar_adecuada: ["luna_nueva", "media_luna_creciente", "luna_menguante"],
        intencion_alineada: ["activar", "soltar", "equilibrar"],
        duracion_estimada_seg: 45,
        complejidad: 1,
        nivel_intensidad: 2,
        duracion_vinyasa: 20,
        duracion_hatha: 45,
        adecuada_vinyasa: true,
        adecuada_hatha: true,
        instrucciones_clave: [
            "Manos bajo hombros, rodillas bajo caderas",
            "Inhala: arquea espalda, pecho al frente",
            "Exhala: redondea espalda, mentón al pecho",
            "Movimiento fluido con respiración"
        ],
        contraindicaciones: ["lesión de muñeca"],
        beneficios: ["moviliza columna", "masajea órganos abdominales", "sincroniza respiración"],
        transicion_desde: {
            "Postura del Niño": "Levanta el torso y lleva las manos al frente"
        },
        transicion_hacia: {
            "Perro Abajo": "Desde Gato-Vaca, levanta caderas hacia arriba y atrás"
        },
        puntos_clave_instructor: [
            "Iniciar movimiento desde coxis hasta cabeza",
            "Movimiento fluido, no brusco",
            "Mantener muñecas alineadas"
        ]
    },
    {
        nombre: "Perro Abajo",
        sanskrit: "Adho Mukha Svanasana",
        tipo: ["fuerza", "flexibilidad", "equilibrio"],
        fase_lunar_adecuada: ["cuarto_creciente", "luna_llena", "cuarto_menguante"],
        intencion_alineada: ["activar", "enfocar", "abrir"],
        duracion_estimada_seg: 60,
        complejidad: 2,
        nivel_intensidad: 3,
        duracion_vinyasa: 15,
        duracion_hatha: 60,
        adecuada_vinyasa: true,
        adecuada_hatha: true,
        instrucciones_clave: [
            "Manos a ancho de hombros, pies a ancho de caderas",
            "Levanta caderas hacia arriba y atrás",
            "Presiona suelo con manos, alarga columna",
            "Talones intentando llegar al suelo"
        ],
        contraindicaciones: ["hipertensión", "glaucoma", "lesión de hombro"],
        beneficios: ["fortalece brazos y piernas", "estira espalda y piernas", "energiza"],
        transicion_desde: {
            "Gato-Vaca": "Levanta caderas hacia arriba y atrás",
            "Postura del Niño": "Levanta caderas, llevando el peso hacia adelante"
        },
        transicion_hacia: {
            "Guerrero I": "Lleva un pie al frente entre las manos"
        },
        puntos_clave_instructor: [
            "Presionar fuerte contra el suelo con las manos",
            "Mantener espalda recta, no redondear",
            "Relajar cuello, mirar hacia ombligo"
        ]
    },
    {
        nombre: "Guerrero I",
        sanskrit: "Virabhadrasana I",
        tipo: ["fuerza", "equilibrio"],
        fase_lunar_adecuada: ["cuarto_creciente", "luna_llena"],
        intencion_alineada: ["activar", "enfocar"],
        duracion_estimada_seg: 60,
        complejidad: 3,
        nivel_intensidad: 4,
        duracion_vinyasa: 20,
        duracion_hatha: 60,
        adecuada_vinyasa: true,
        adecuada_hatha: true,
        instrucciones_clave: [
            "Pie delantero flexionado 90°, pie trasero a 45°",
            "Cadera abierta hacia el lado",
            "Brazos extendidos hacia el techo",
            "Mirada hacia arriba o al frente"
        ],
        contraindicaciones: ["lesión de rodilla o cadera"],
        beneficios: ["fortalece piernas", "mejora equilibrio", "abre caderas"],
        transicion_desde: {
            "Perro Abajo": "Lleva el pie derecho entre las manos, levanta el torso"
        },
        transicion_hacia: {
            "Guerrero II": "Abre brazos y cadera hacia el lado"
        },
        puntos_clave_instructor: [
            "Mantener rodilla delantera alineada con tobillo",
            "Hundir talón trasero para estabilidad",
            "Levantar pecho, alargar columna"
        ]
    },
    {
        nombre: "Guerrero II",
        sanskrit: "Virabhadrasana II",
        tipo: ["fuerza", "equilibrio"],
        fase_lunar_adecuada: ["cuarto_creciente", "luna_llena"],
        intencion_alineada: ["activar", "enfocar", "equilibrar"],
        duracion_estimada_seg: 60,
        complejidad: 3,
        nivel_intensidad: 4,
        duracion_vinyasa: 20,
        duracion_hatha: 60,
        adecuada_vinyasa: true,
        adecuada_hatha: true,
        instrucciones_clave: [
            "Pie delantero flexionado 90°, pie trasero a 45°",
            "Cadera abierta hacia el lado",
            "Brazos extendidos paralelos al suelo",
            "Mirada sobre la mano delantera"
        ],
        contraindicaciones: ["lesión de rodilla o cadera"],
        beneficios: ["fortalece piernas", "mejora equilibrio", "abre caderas"],
        transicion_desde: {
            "Guerrero I": "Abre brazos y cadera hacia el lado"
        },
        transicion_hacia: {
            "Postura del Triángulo": "Endereza pierna delantera y desliza mano hacia pantorrilla"
        },
        puntos_clave_instructor: [
            "Mantener rodilla delantera alineada con tobillo",
            "Espalda recta, no inclinarse",
            "Hundir ambos talones para estabilidad"
        ]
    },
    {
        nombre: "Postura del Triángulo",
        sanskrit: "Trikonasana",
        tipo: ["flexibilidad", "equilibrio"],
        fase_lunar_adecuada: ["media_luna_creciente", "cuarto_creciente"],
        intencion_alineada: ["abrir", "enfocar"],
        duracion_estimada_seg: 60,
        complejidad: 3,
        nivel_intensidad: 3,
        duracion_vinyasa: 25,
        duracion_hatha: 60,
        adecuada_vinyasa: true,
        adecuada_hatha: true,
        instrucciones_clave: [
            "Piernas separadas ampliamente",
            "Pie delantero 90°, pie trasero 45°",
            "Extiende brazos y baja mano a pantorrilla",
            "Extiende brazo superior al techo"
        ],
        contraindicaciones: ["lesión de cuello o espalda baja"],
        beneficios: ["estira lados del torso", "abre caderas", "fortalece piernas"],
        transicion_desde: {
            "Guerrero II": "Endereza pierna delantera y baja mano"
        },
        transicion_hacia: {
            "Árbol": "Levanta pierna trasera y coloca pie en interior del muslo"
        },
        puntos_clave_instructor: [
            "Mantener ambos lados del torso igual de largos",
            "Girar desde caderas, no espalda baja",
            "Mirada hacia mano superior o al frente"
        ]
    },
    {
        nombre: "Postura del Árbol",
        sanskrit: "Vrksasana",
        tipo: ["equilibrio"],
        fase_lunar_adecuada: ["luna_nueva", "cuarto_creciente", "luna_llena"],
        intencion_alineada: ["enfocar", "equilibrar"],
        duracion_estimada_seg: 45,
        complejidad: 4,
        nivel_intensidad: 3,
        duracion_vinyasa: 15,
        duracion_hatha: 45,
        adecuada_vinyasa: true,
        adecuada_hatha: true,
        instrucciones_clave: [
            "Peso en pierna derecha",
            "Pie izquierdo en interior del muslo derecho",
            "Manos en posición de oración o hacia arriba",
            "Mirada fija en un punto"
        ],
        contraindicaciones: ["dolor de rodilla"],
        beneficios: ["mejora equilibrio", "fortalece piernas", "mejora concentración"],
        transicion_desde: {
            "Postura del Triángulo": "Levanta pierna trasera y coloca pie en muslo"
        },
        transicion_hacia: {
            "Savasana": "Baja pierna y acuéstate boca arriba"
        },
        puntos_clave_instructor: [
            "Encontrar punto de equilibrio antes de levantar pie",
            "Mantener caderas niveladas",
            "Presionar pie contra muslo, no al revés"
        ]
    },
    {
        nombre: "Savasana",
        sanskrit: "Savasana",
        tipo: ["relajación"],
        fase_lunar_adecuada: ["luna_nueva", "media_luna_creciente", "cuarto_creciente", "luna_gibosa_creciente", "luna_llena", "luna_gibosa_menguante", "cuarto_menguante", "luna_menguante"],
        intencion_alineada: ["soltar", "equilibrar"],
        duracion_estimada_seg: 180,
        complejidad: 1,
        nivel_intensidad: 1,
        duracion_vinyasa: 60,
        duracion_hatha: 180,
        adecuada_vinyasa: true,
        adecuada_hatha: true,
        instrucciones_clave: [
            "Acuéstate boca arriba",
            "Piernas ligeramente separadas",
            "Brazos a los lados, palmas hacia arriba",
            "Cierra ojos y relaja todo el cuerpo"
        ],
        contraindicaciones: ["embarazo avanzado"],
        beneficios: ["relajación profunda", "reduce estrés", "integra práctica"],
        transicion_desde: {
            "Postura del Árbol": "Baja pierna y acuéstate boca arriba",
            "Postura del Niño": "Gírate y acuéstate boca arriba"
        },
        transicion_hacia: {},
        puntos_clave_instructor: [
            "Guiar relajación progresiva",
            "Mantener voz suave y lenta",
            "Dar tiempo suficiente para relajación"
        ]
    },
    // Posturas adicionales para completar flujos
    {
        nombre: "Tadasana",
        sanskrit: "Tadasana",
        tipo: ["equilibrio", "postura_base"],
        fase_lunar_adecuada: ["luna_nueva", "media_luna_creciente", "cuarto_creciente", "luna_llena"],
        intencion_alineada: ["equilibrar", "enfocar"],
        duracion_estimada_seg: 30,
        complejidad: 1,
        nivel_intensidad: 1,
        duracion_vinyasa: 10,
        duracion_hatha: 30,
        adecuada_vinyasa: true,
        adecuada_hatha: true,
        instrucciones_clave: [
            "Pies juntos o ligeramente separados",
            "Distribuir peso uniformemente",
            "Columna erguida, hombros relajados",
            "Brazos a los lados, palmas hacia adelante"
        ],
        contraindicaciones: [],
        beneficios: ["mejora postura", "aumenta conciencia corporal", "base para otras posturas"],
        transicion_desde: {},
        transicion_hacia: {
            "Urdhva Hastasana": "Inhala y eleva brazos hacia el techo"
        },
        puntos_clave_instructor: [
            "Base sólida y estable",
            "Consciencia de alineación",
            "Preparación para movimiento"
        ]
    },
    {
        nombre: "Urdhva Hastasana",
        sanskrit: "Urdhva Hastasana",
        tipo: ["flexibilidad", "respiración"],
        fase_lunar_adecuada: ["media_luna_creciente", "cuarto_creciente"],
        intencion_alineada: ["activar", "abrir"],
        duracion_estimada_seg: 15,
        complejidad: 1,
        nivel_intensidad: 2,
        duracion_vinyasa: 8,
        duracion_hatha: 15,
        adecuada_vinyasa: true,
        adecuada_hatha: true,
        instrucciones_clave: [
            "Desde Tadasana, inhala y eleva brazos",
            "Palmas frente a frente o unidas",
            "Hombros relajados, lejos de orejas",
            "Ligeramente hacia atrás para abrir pecho"
        ],
        contraindicaciones: ["lesión de hombro"],
        beneficios: ["abre pecho y hombros", "estira laterales", "energiza"],
        transicion_desde: {
            "Tadasana": "Inhala y eleva brazos"
        },
        transicion_hacia: {
            "Uttanasana": "Exhala y flexiona hacia adelante desde caderas"
        },
        puntos_clave_instructor: [
            "Movimiento con inhalación",
            "Mantener hombros abajo",
            "Extensión completa de columna"
        ]
    },
    {
        nombre: "Uttanasana",
        sanskrit: "Uttanasana",
        tipo: ["flexibilidad"],
        fase_lunar_adecuada: ["luna_nueva", "media_luna_creciente", "cuarto_menguante", "luna_menguante"],
        intencion_alineada: ["soltar", "abrir"],
        duracion_estimada_seg: 30,
        complejidad: 2,
        nivel_intensidad: 2,
        duracion_vinyasa: 8,
        duracion_hatha: 30,
        adecuada_vinyasa: true,
        adecuada_hatha: true,
        instrucciones_clave: [
            "Flexión desde caderas, no espalda baja",
            "Rodillas pueden estar ligeramente flexionadas",
            "Cabeza cuelga relajada",
            "Manos en el suelo, espinillas o codos"
        ],
        contraindicaciones: ["lesión de espalda baja", "hipertensión"],
        beneficios: ["estira cadena posterior", "calma sistema nervioso", "alivia estrés"],
        transicion_desde: {
            "Urdhva Hastasana": "Exhala y flexiona hacia adelante"
        },
        transicion_hacia: {
            "Ardha Uttanasana": "Inhala y levanta torso a mitad de camino"
        },
        puntos_clave_instructor: [
            "Peso en metatarsos, no talones",
            "Estirar desde caderas, no redondear espalda",
            "Rodillas pueden flexionarse si necesario"
        ]
    },
    {
        nombre: "Ardha Uttanasana",
        sanskrit: "Ardha Uttanasana",
        tipo: ["flexibilidad", "preparación"],
        fase_lunar_adecuada: ["luna_nueva", "media_luna_creciente", "cuarto_creciente"],
        intencion_alineada: ["activar", "enfocar"],
        duracion_estimada_seg: 10,
        complejidad: 1,
        nivel_intensidad: 2,
        duracion_vinyasa: 5,
        duracion_hatha: 10,
        adecuada_vinyasa: true,
        adecuada_hatha: true,
        instrucciones_clave: [
            "Desde Uttanasana, inhala y levanta torso a mitad",
            "Espalda plana, paralela al suelo",
            "Manos en espinillas o suelo",
            "Mirada al frente o ligeramente arriba"
        ],
        contraindicaciones: ["lesión de espalda baja"],
        beneficios: ["fortalece espalda", "prepara para Chaturanga", "estira isquiotibiales"],
        transicion_desde: {
            "Uttanasana": "Inhala y levanta torso a mitad"
        },
        transicion_hacia: {
            "Chaturanga": "Exhala, manos en suelo, salta o camina atrás"
        },
        puntos_clave_instructor: [
            "Espalda plana, no redondeada",
            "Hombros alejados de orejas",
            "Preparación para transición"
        ]
    },
    {
        nombre: "Chaturanga Dandasana",
        sanskrit: "Chaturanga Dandasana",
        tipo: ["fuerza"],
        fase_lunar_adecuada: ["cuarto_creciente", "luna_llena"],
        intencion_alineada: ["activar", "enfocar"],
        duracion_estimada_seg: 10,
        complejidad: 4,
        nivel_intensidad: 5,
        duracion_vinyasa: 5,
        duracion_hatha: 10,
        adecuada_vinyasa: true,
        adecuada_hatha: false, // Demasiado intenso para Hatha estático
        instrucciones_clave: [
            "Desde plancha, bajar a 90° en codos",
            "Codos pegados a costillas",
            "Cuerpo en línea recta",
            "Mirada al frente, ligeramente hacia abajo"
        ],
        contraindicaciones: ["lesión de hombro", "embarazo"],
        beneficios: ["fortalece brazos, hombros y core", "prepara para inversiones"],
        transicion_desde: {
            "Ardha Uttanasana": "Manos en suelo, salta o camina atrás a plancha"
        },
        transicion_hacia: {
            "Urdhva Mukha Svanasana": "Inhala, rodillas al suelo, arquea espalda"
        },
        puntos_clave_instructor: [
            "Modificar con rodillas en suelo si necesario",
            "No bajar más de 90° en codos",
            "Mantener core activado"
        ]
    },
    {
        nombre: "Urdhva Mukha Svanasana",
        sanskrit: "Urdhva Mukha Svanasana",
        tipo: ["flexibilidad", "fuerza"],
        fase_lunar_adecuada: ["cuarto_creciente", "luna_llena"],
        intencion_alineada: ["activar", "abrir"],
        duracion_estimada_seg: 10,
        complejidad: 3,
        nivel_intensidad: 4,
        duracion_vinyasa: 5,
        duracion_hatha: 10,
        adecuada_vinyasa: true,
        adecuada_hatha: false,
        instrucciones_clave: [
            "Desde Chaturanga, inhala y arquea espalda",
            "Brazos extendidos, hombros abajo",
            "Muslos y rodillas levantados del suelo",
            "Pecho abierto, mirada hacia arriba"
        ],
        contraindicaciones: ["lesión de espalda baja", "síndrome del túnel carpiano"],
        beneficios: ["abre pecho y hombros", "fortalece brazos", "estira abdomen"],
        transicion_desde: {
            "Chaturanga": "Inhala y arquea espalda, rodillas pueden estar en suelo"
        },
        transicion_hacia: {
            "Adho Mukha Svanasana": "Exhala, levanta caderas a Perro Abajo"
        },
        puntos_clave_instructor: [
            "Hombros abajo, alejados de orejas",
            "Core activado para proteger espalda baja",
            "Modificación: rodillas en suelo"
        ]
    },
    {
        nombre: "Utkatasana",
        sanskrit: "Utkatasana",
        tipo: ["fuerza", "equilibrio"],
        fase_lunar_adecuada: ["cuarto_creciente", "luna_llena"],
        intencion_alineada: ["activar", "enfocar"],
        duracion_estimada_seg: 20,
        complejidad: 2,
        nivel_intensidad: 4,
        duracion_vinyasa: 10,
        duracion_hatha: 20,
        adecuada_vinyasa: true,
        adecuada_hatha: true,
        instrucciones_clave: [
            "Pies juntos o ligeramente separados",
            "Flexiona rodillas como si sentarte en silla",
            "Brazos extendidos hacia arriba",
            "Peso en talones, pecho elevado"
        ],
        contraindicaciones: ["lesión de rodilla", "dolor lumbar"],
        beneficios: ["fortalece piernas", "tonifica core", "aumenta calor corporal"],
        transicion_desde: {
            "Tadasana": "Inhala, eleva brazos, exhala y flexiona rodillas"
        },
        transicion_hacia: {
            "Uttanasana": "Exhala y flexiona hacia adelante desde caderas"
        },
        puntos_clave_instructor: [
            "Rodillas no sobrepasan dedos de pies",
            "Pecho elevado, espalda no redondeada",
            "Intensidad ajustable: más o menos flexión"
        ]
    },
    {
        nombre: "Virabhadrasana III",
        sanskrit: "Virabhadrasana III",
        tipo: ["equilibrio", "fuerza"],
        fase_lunar_adecuada: ["cuarto_creciente", "luna_llena"],
        intencion_alineada: ["enfocar", "activar"],
        duracion_estimada_seg: 20,
        complejidad: 4,
        nivel_intensidad: 4,
        duracion_vinyasa: 10,
        duracion_hatha: 20,
        adecuada_vinyasa: true,
        adecuada_hatha: true,
        instrucciones_clave: [
            "Desde Guerrero I, transfere peso a pierna delantera",
            "Levanta pierna trasera, cuerpo paralelo al suelo",
            "Brazos extendidos al frente o a los lados",
            "Mirada fija en un punto"
        ],
        contraindicaciones: ["lesión de rodilla", "problemas de equilibrio"],
        beneficios: ["fortalece piernas y core", "mejora equilibrio", "tonifica"],
        transicion_desde: {
            "Guerrero I": "Inclina torso adelante, levanta pierna trasera"
        },
        transicion_hacia: {
            "Adho Mukha Svanasana": "Baja pierna, manos al suelo, Perro Abajo"
        },
        puntos_clave_instructor: [
            "Modificación: manos en bloques",
            "Caderas niveladas, no rotar",
            "Core activado para estabilidad"
        ]
    },
    {
        nombre: "Ardha Chandrasana",
        sanskrit: "Ardha Chandrasana",
        tipo: ["equilibrio", "flexibilidad"],
        fase_lunar_adecuada: ["media_luna_creciente", "luna_llena"],
        intencion_alineada: ["abrir", "enfocar"],
        duracion_estimada_seg: 20,
        complejidad: 4,
        nivel_intensidad: 3,
        duracion_vinyasa: 10,
        duracion_hatha: 20,
        adecuada_vinyasa: true,
        adecuada_hatha: true,
        instrucciones_clave: [
            "Desde Triángulo, flexiona rodilla delantera",
            "Mano en suelo, levanta pierna trasera",
            "Brazo superior extendido hacia arriba",
            "Cuerpo forma T lateral"
        ],
        contraindicaciones: ["lesión de cadera", "problemas de equilibrio"],
        beneficios: ["abre caderas", "fortalece pierna de soporte", "mejora equilibrio"],
        transicion_desde: {
            "Postura del Triángulo": "Flexiona rodilla delantera, mano en suelo"
        },
        transicion_hacia: {
            "Postura del Triángulo": "Baja pierna trasera, regresa a Triángulo"
        },
        puntos_clave_instructor: [
            "Modificación: mano en bloque o pared",
            "Cadera superior sobre inferior",
            "Pierna de soporte ligeramente flexionada"
        ]
    },
    {
        nombre: "Plancha",
        sanskrit: "Phalakasana",
        tipo: ["fuerza", "core"],
        fase_lunar_adecuada: ["cuarto_creciente", "luna_llena"],
        intencion_alineada: ["activar", "enfocar"],
        duracion_estimada_seg: 30,
        complejidad: 2,
        nivel_intensidad: 4,
        duracion_vinyasa: 10,
        duracion_hatha: 30,
        adecuada_vinyasa: true,
        adecuada_hatha: true,
        instrucciones_clave: [
            "Manos bajo hombros, brazos extendidos",
            "Cuerpo en línea recta de cabeza a talones",
            "Core activado, glúteos tensados",
            "Mirada al suelo, cuello neutro"
        ],
        contraindicaciones: ["síndrome del túnel carpiano", "embarazo avanzado"],
        beneficios: ["fortalece core completo", "tonifica brazos", "prepara para Chaturanga"],
        transicion_desde: {
            "Adho Mukha Svanasana": "Inclina cuerpo adelante hasta plancha"
        },
        transicion_hacia: {
            "Chaturanga": "Exhala y baja a Chaturanga",
            "Adho Mukha Svanasana": "Levanta caderas a Perro Abajo"
        },
        puntos_clave_instructor: [
            "Modificación: rodillas en suelo",
            "No hundir caderas ni elevarlas demasiado",
            "Hombros alineados con muñecas"
        ]
    },
    {
        nombre: "Postura de la Esfinge",
        sanskrit: "Salamba Bhujangasana",
        tipo: ["flexibilidad", "apertura"],
        fase_lunar_adecuada: ["luna_nueva", "media_luna_creciente", "luna_menguante"],
        intencion_alineada: ["abrir", "soltar"],
        duracion_estimada_seg: 30,
        complejidad: 2,
        nivel_intensidad: 2,
        duracion_vinyasa: 15,
        duracion_hatha: 30,
        adecuada_vinyasa: true,
        adecuada_hatha: true,
        instrucciones_clave: [
            "Acostado boca abajo, antebrazos en suelo",
            "Codos bajo hombros",
            "Inhala y eleva pecho suavemente",
            "Hombros relajados, lejos de orejas"
        ],
        contraindicaciones: ["lesión de espalda baja", "embarazo"],
        beneficios: ["suave extensión de columna", "abre pecho", "fortalece espalda baja"],
        transicion_desde: {
            "Postura del Niño": "Gira y acuéstate boca abajo"
        },
        transicion_hacia: {
            "Postura del Niño": "Lleva glúteos a talones, brazos extendidos"
        },
        puntos_clave_instructor: [
            "Extensión suave, no forzar",
            "Codos firmes, presionar antebrazos",
            "Core ligeramente activado para proteger espalda"
        ]
    },
    {
        nombre: "Postura del Puente",
        sanskrit: "Setu Bandhasana",
        tipo: ["flexibilidad", "fuerza"],
        fase_lunar_adecuada: ["luna_nueva", "cuarto_menguante", "luna_menguante"],
        intencion_alineada: ["abrir", "equilibrar"],
        duracion_estimada_seg: 30,
        complejidad: 2,
        nivel_intensidad: 3,
        duracion_vinyasa: 15,
        duracion_hatha: 30,
        adecuada_vinyasa: true,
        adecuada_hatha: true,
        instrucciones_clave: [
            "Acostado boca arriba, rodillas flexionadas",
            "Pies a ancho de caderas, cerca de glúteos",
            "Inhala y eleva caderas",
            "Manos entrelazadas bajo espalda, brazos presionados al suelo"
        ],
        contraindicaciones: ["lesión de cuello", "embarazo"],
        beneficios: ["abre pecho y hombros", "fortalece glúteos", "estira columna"],
        transicion_desde: {
            "Savasana": "Flexiona rodillas, prepara para puente"
        },
        transicion_hacia: {
            "Savasana": "Baja caderas lentamente, relaja"
        },
        puntos_clave_instructor: [
            "Rodillas alineadas, no se caen hacia afuera",
            "Barbilla ligeramente alejada del pecho",
            "Intensidad: elevar más o menos caderas"
        ]
    },
    {
        nombre: "Torsión Espinal Supina",
        sanskrit: "Supta Matsyendrasana",
        tipo: ["flexibilidad", "torsión"],
        fase_lunar_adecuada: ["luna_nueva", "cuarto_menguante", "luna_menguante"],
        intencion_alineada: ["soltar", "equilibrar"],
        duracion_estimada_seg: 30,
        complejidad: 1,
        nivel_intensidad: 2,
        duracion_vinyasa: 15,
        duracion_hatha: 30,
        adecuada_vinyasa: true,
        adecuada_hatha: true,
        instrucciones_clave: [
            "Acostado boca arriba, abraza una rodilla al pecho",
            "Deja caer rodilla al lado opuesto",
            "Brazos en T, mirada al lado opuesto",
            "Hombros pegados al suelo"
        ],
        contraindicaciones: ["embarazo", "lesión de espalda baja"],
        beneficios: ["libera tensión lumbar", "masajea órganos abdominales", "calma mente"],
        transicion_desde: {
            "Savasana": "Flexiona rodilla, prepárate para torsión"
        },
        transicion_hacia: {
            "Savasana": "Regresa a centro, cambia de lado"
        },
        puntos_clave_instructor: [
            "Torsión suave, no forzar",
            "Respirar profundamente en cada exhalación",
            "Ambos hombros en el suelo"
        ]
    }
];

// ============================================
// SECUENCIAS PREDEFINIDAS PARA VINYASA
// ============================================
// Bloques reutilizables para generación dinámica
// Cada secuencia es un array de nombres de posturas

const SECUENCIAS_VINYASA = {
    // Sun Salutation A - Variaciones
    sun_salutation_a_suave: [
        "Tadasana",
        "Urdhva Hastasana",
        "Uttanasana",
        "Ardha Uttanasana",
        "Plancha", // Versión suave en lugar de Chaturanga
        "Postura de la Esfinge", // Versión suave en lugar de Upward Dog
        "Adho Mukha Svanasana"
    ],
    
    sun_salutation_a_intensa: [
        "Tadasana",
        "Urdhva Hastasana",
        "Uttanasana",
        "Ardha Uttanasana",
        "Chaturanga Dandasana",
        "Urdhva Mukha Svanasana",
        "Adho Mukha Svanasana"
    ],
    
    // Sun Salutation B - Variaciones
    sun_salutation_b: [
        "Tadasana",
        "Utkatasana",
        "Uttanasana",
        "Ardha Uttanasana",
        "Chaturanga Dandasana",
        "Urdhva Mukha Svanasana",
        "Adho Mukha Svanasana",
        "Guerrero I",
        "Chaturanga Dandasana",
        "Urdhva Mukha Svanasana",
        "Adho Mukha Svanasana",
        "Guerrero I" // Otro lado implícito
    ],
    
    // Secuencia de Guerreros
    secuencia_guerreros: [
        "Adho Mukha Svanasana",
        "Guerrero I",
        "Guerrero II",
        "Guerrero III",
        "Adho Mukha Svanasana"
    ],
    
    // Secuencia de equilibrio
    secuencia_equilibrio: [
        "Postura del Triángulo",
        "Ardha Chandrasana",
        "Postura del Árbol",
        "Guerrero III"
    ],
    
    // Secuencia de apertura de cadera
    secuencia_apertura_cadera: [
        "Guerrero II",
        "Postura del Triángulo",
        "Ardha Chandrasana",
        "Guerrero II" // Simetría
    ],
    
    // Secuencia de cierre (flexiones y torsiones)
    secuencia_cierre: [
        "Postura de la Esfinge",
        "Postura del Puente",
        "Torsión Espinal Supina",
        "Savasana"
    ]
};

// ============================================
// FUNCIONES DE UTILIDAD PARA GENERACIÓN
// ============================================

// Calcular duración automática si no está definida
function calcularDuracionAutomatica(postura, tipoClase) {
    // Base: 10 segundos
    let base = 10;
    
    // Ajustar por complejidad (1-5)
    const complejidad = postura.complejidad || 3;
    base += complejidad * 2; // +2-10 segundos
    
    // Ajustar por intensidad (1-5)
    const intensidad = postura.nivel_intensidad || 3;
    base += intensidad * 1.5; // +1.5-7.5 segundos
    
    // Ajustar por tipo de clase
    if (tipoClase === 'vinyasa') {
        // Vinyasa: más dinámico, menos tiempo por postura
        return Math.max(5, Math.min(20, Math.round(base * 0.7)));
    } else {
        // Hatha: más estático, más tiempo por postura
        return Math.max(20, Math.min(90, Math.round(base * 1.5)));
    }
}

// Obtener postura por nombre
function obtenerPosturaPorNombre(nombre) {
    return posturaDB.find(p => p.nombre === nombre);
}

// Filtrar posturas por tipo de clase
function filtrarPosturasPorTipoClase(tipoClase) {
    return posturaDB.filter(p => {
        if (tipoClase === 'vinyasa') {
            return p.adecuada_vinyasa !== false;
        } else {
            return p.adecuada_hatha !== false;
        }
    });
}

// ============================================
// GENERADOR DE CLASES VINYASA
// ============================================

function generarClaseVinyasa(duracion, intention) {
    console.debug('[Yoga] Generando clase Vinyasa:', { duracion, intention });
    
    // 1. Seleccionar intensidad basada en duración
    const intensidad = duracion <= 10 ? 'suave' : (duracion <= 20 ? 'moderada' : 'intensa');
    
    // 2. Seleccionar secuencia base según intención e intensidad
    let secuenciaBase = [];
    
    switch (intention) {
        case 'activar':
            secuenciaBase = intensidad === 'suave' 
                ? [...SECUENCIAS_VINYASA.sun_salutation_a_suave]
                : [...SECUENCIAS_VINYASA.sun_salutation_a_intensa];
            break;
        case 'enfocar':
            secuenciaBase = [...SECUENCIAS_VINYASA.secuencia_equilibrio];
            break;
        case 'abrir':
            secuenciaBase = [...SECUENCIAS_VINYASA.secuencia_apertura_cadera];
            break;
        case 'soltar':
            secuenciaBase = [...SECUENCIAS_VINYASA.secuencia_cierre];
            break;
        default:
            secuenciaBase = [...SECUENCIAS_VINYASA.sun_salutation_a_suave];
    }
    
    // 3. Calcular número de repeticiones según duración
    // Cada secuencia dura aproximadamente 3-5 minutos
    const repeticiones = Math.max(1, Math.ceil(duracion / 4));
    
    // 4. Generar flujo con variaciones
    const flujoCompleto = [];
    
    for (let i = 0; i < repeticiones; i++) {
        // Copiar secuencia base
        let secuencia = [...secuenciaBase];
        
        // Insertar posturas adicionales aleatoriamente (no en la primera repetición)
        if (i > 0 && Math.random() > 0.6) {
            const posturasExtra = filtrarPosturasPorTipoClase('vinyasa')
                .filter(p => !secuencia.includes(p.nombre));
            
            if (posturasExtra.length > 0) {
                const posturaAleatoria = posturasExtra[Math.floor(Math.random() * posturasExtra.length)];
                const posicion = Math.floor(Math.random() * (secuencia.length - 2)) + 1;
                secuencia.splice(posicion, 0, posturaAleatoria.nombre);
            }
        }
        
        // Añadir postura de pico en la penúltima repetición
        if (i === repeticiones - 2 && intensidad !== 'suave') {
            const posturasPico = ['Guerrero III', 'Ardha Chandrasana', 'Chaturanga Dandasana'];
            const posturaPico = posturasPico[Math.floor(Math.random() * posturasPico.length)];
            secuencia.splice(Math.floor(secuencia.length / 2), 0, posturaPico);
        }
        
        // Añadir secuencia al flujo completo
        flujoCompleto.push(...secuencia);
    }
    
    // 5. Asignar tiempos y transiciones
    const flujoFinal = flujoCompleto.map((nombrePostura, indice) => {
        const postura = obtenerPosturaPorNombre(nombrePostura);
        if (!postura) return null;
        
        // Calcular duración
        let duracionSeg = postura.duracion_vinyasa || 
            calcularDuracionAutomatica(postura, 'vinyasa');
        
        // Ajustar según intensidad
        if (intensidad === 'suave') duracionSeg *= 1.2;
        if (intensidad === 'intensa') duracionSeg *= 0.8;
        
        // Generar transición
        let transicion = '';
        if (indice < flujoCompleto.length - 1) {
            const siguiente = flujoCompleto[indice + 1];
            transicion = generarTransicionVinyasa(nombrePostura, siguiente);
        }
        
        return {
            postura: postura.nombre,
            duracion: `${Math.round(duracionSeg / 4)} respiraciones`,
            guia: postura.instrucciones_clave[0] || "Mantén flujo continuo",
            transicion: transicion,
            tipo: 'vinyasa'
        };
    }).filter(Boolean);
    
    return {
        tipo: 'vinyasa',
        duracion: duracion,
        flujo: flujoFinal,
        ritmo: intensidad === 'suave' ? 'fluido-suave' : (intensidad === 'intensa' ? 'fluido-dinámico' : 'fluido'),
        respiracion: "inhala-eleva, exhala-flexiona",
        intensidad: intensidad
    };
}

// Generar transiciones para Vinyasa
function generarTransicionVinyasa(actual, siguiente) {
    const posturaActual = obtenerPosturaPorNombre(actual);
    const posturaSiguiente = obtenerPosturaPorNombre(siguiente);
    
    if (!posturaActual || !posturaSiguiente) {
        return `Transición a ${siguiente}`;
    }
    
    // Usar transiciones definidas si existen
    if (posturaActual.transicion_hacia && posturaActual.transicion_hacia[siguiente]) {
        return posturaActual.transicion_hacia[siguiente];
    }
    
    // Transiciones genéricas basadas en tipos
    const tiposActual = posturaActual.tipo || [];
    const tiposSiguiente = posturaSiguiente.tipo || [];
    
    if (tiposActual.includes('equilibrio') && tiposSiguiente.includes('equilibrio')) {
        return "Mantén concentración mientras transicionas";
    }
    
    if (actual === 'Adho Mukha Svanasana' && siguiente.includes('Guerrero')) {
        return "Lleva el pie al frente entre las manos";
    }
    
    if (actual.includes('Guerrero') && siguiente === 'Adho Mukha Svanasana') {
        return "Manos al suelo, salta o camina atrás";
    }
    
    // Transición por defecto
    return `Conecta con tu respiración y fluye hacia ${siguiente}`;
}

// ============================================
// GENERADOR DE CLASES HATHA
// ============================================

function generarClaseHatha(duracion, intention) {
    console.debug('[Yoga] Generando clase Hatha:', { duracion, intention });
    
    // 1. Distribuir tiempo por categorías según intención
    const distribucion = calcularDistribucionHatha(duracion, intention);
    
    // 2. Seleccionar posturas por categoría
    const flujo = [];
    
    // Apertura (respiración y posturas suaves)
    flujo.push(...seleccionarPosturasPorCategoriaHatha('respiración', distribucion.apertura));
    
    // Cuerpo principal (categorías según intención)
    Object.entries(distribucion.cuerpo).forEach(([categoria, minutos]) => {
        flujo.push(...seleccionarPosturasPorCategoriaHatha(categoria, minutos));
    });
    
    // Cierre (relajación)
    flujo.push(...seleccionarPosturasPorCategoriaHatha('relajación', distribucion.cierre));
    
    // 3. Ordenar lógicamente (suelo → pie → suelo)
    const flujoOrdenado = ordenarPosturasHatha(flujo);
    
    // 4. Asignar tiempos y transiciones
    const flujoFinal = flujoOrdenado.map((postura, indice) => {
        // Calcular duración
        let duracionSeg = postura.duracion_hatha || 
            calcularDuracionAutomatica(postura, 'hatha');
        
        // Ajustar según intención
        if (intention === 'soltar') duracionSeg *= 1.2;
        if (intention === 'activar') duracionSeg *= 0.9;
        
        // Generar transición
        let transicion = '';
        if (indice < flujoOrdenado.length - 1) {
            const siguiente = flujoOrdenado[indice + 1];
            transicion = generarTransicionHatha(postura.nombre, siguiente.nombre);
        }
        
        return {
            postura: postura.nombre,
            duracion: `${Math.round(duracionSeg / 6)} respiraciones profundas`,
            guia: postura.instrucciones_clave[1] || postura.instrucciones_clave[0] || "Mantén postura con respiración consciente",
            transicion: transicion,
            puntos_clave: postura.puntos_clave_instructor || [],
            tipo: 'hatha'
        };
    });
    
    return {
        tipo: 'hatha',
        duracion: duracion,
        flujo: flujoFinal,
        ritmo: 'lento-meditativo',
        respiracion: "5-8 respiraciones profundas por postura",
        intention: intention
    };
}

// Calcular distribución de tiempo para Hatha
function calcularDistribucionHatha(duracion, intention) {
    // Distribución base
    let distribucion = {
        apertura: Math.max(2, Math.floor(duracion * 0.1)), // 10% para apertura
        cuerpo: {},
        cierre: Math.max(3, Math.floor(duracion * 0.15)) // 15% para cierre
    };
    
    // Distribución del cuerpo según intención
    const tiempoCuerpo = duracion - distribucion.apertura - distribucion.cierre;
    
    switch (intention) {
        case 'activar':
            distribucion.cuerpo = {
                fuerza: Math.floor(tiempoCuerpo * 0.4), // 40%
                equilibrio: Math.floor(tiempoCuerpo * 0.3), // 30%
                flexibilidad: Math.floor(tiempoCuerpo * 0.3) // 30%
            };
            break;
        case 'soltar':
            distribucion.cuerpo = {
                flexibilidad: Math.floor(tiempoCuerpo * 0.5), // 50%
                torsión: Math.floor(tiempoCuerpo * 0.3), // 30%
                relajación: Math.floor(tiempoCuerpo * 0.2) // 20%
            };
            break;
        case 'enfocar':
            distribucion.cuerpo = {
                equilibrio: Math.floor(tiempoCuerpo * 0.4), // 40%
                fuerza: Math.floor(tiempoCuerpo * 0.3), // 30%
                flexibilidad: Math.floor(tiempoCuerpo * 0.3) // 30%
            };
            break;
        case 'abrir':
            distribucion.cuerpo = {
                flexibilidad: Math.floor(tiempoCuerpo * 0.5), // 50%
                apertura: Math.floor(tiempoCuerpo * 0.3), // 30%
                torsión: Math.floor(tiempoCuerpo * 0.2) // 20%
            };
            break;
        default: // equilibrar
            distribucion.cuerpo = {
                fuerza: Math.floor(tiempoCuerpo * 0.25),
                flexibilidad: Math.floor(tiempoCuerpo * 0.25),
                equilibrio: Math.floor(tiempoCuerpo * 0.25),
                torsión: Math.floor(tiempoCuerpo * 0.25)
            };
    }
    
    return distribucion;
}

// Seleccionar posturas por categoría para Hatha
function seleccionarPosturasPorCategoriaHatha(categoria, minutos) {
    const posturasAdecuadas = posturaDB.filter(p => {
        if (categoria === 'respiración') {
            return p.tipo.includes('relajación') || p.tipo.includes('respiración');
        }
        if (categoria === 'relajación') {
            return p.tipo.includes('relajación');
        }
        return p.tipo.some(t => t.includes(categoria));
    });
    
    if (posturasAdecuadas.length === 0) return [];
    
    // Seleccionar posturas según tiempo disponible
    const tiempoTotalSeg = minutos * 60;
    const posturasSeleccionadas = [];
    let tiempoUsado = 0;
    
    // Mezclar aleatoriamente
    const posturasMezcladas = [...posturasAdecuadas].sort(() => Math.random() - 0.5);
    
    for (const postura of posturasMezcladas) {
        const duracion = postura.duracion_hatha || 
            calcularDuracionAutomatica(postura, 'hatha');
        
        if (tiempoUsado + duracion <= tiempoTotalSeg) {
            posturasSeleccionadas.push(postura);
            tiempoUsado += duracion;
        }
        
        // Limitar a máximo 4 posturas por categoría
        if (posturasSeleccionadas.length >= 4) break;
    }
    
    return posturasSeleccionadas;
}

// Ordenar posturas para Hatha (suelo → pie → suelo)
function ordenarPosturasHatha(posturas) {
    const posturasSuelo = posturas.filter(p => 
        p.nombre.includes('Savasana') || 
        p.nombre.includes('Niño') || 
        p.nombre.includes('Puente') || 
        p.nombre.includes('Torsión') ||
        p.nombre.includes('Esfinge')
    );
    
    const posturasPie = posturas.filter(p => 
        p.nombre.includes('Guerrero') || 
        p.nombre.includes('Árbol') || 
        p.nombre.includes('Triángulo') ||
        p.nombre.includes('Media Luna') ||
        p.nombre.includes('Utkatasana')
    );
    
    const posturasMixtas = posturas.filter(p => 
        !posturasSuelo.includes(p) && !posturasPie.includes(p)
    );
    
    // Orden: suelo → pie → suelo
    return [...posturasSuelo.slice(0, 2), ...posturasPie, ...posturasMixtas, ...posturasSuelo.slice(2)];
}

// Generar transiciones para Hatha
function generarTransicionHatha(actual, siguiente) {
    const posturaActual = obtenerPosturaPorNombre(actual);
    const posturaSiguiente = obtenerPosturaPorNombre(siguiente);
    
    if (!posturaActual || !posturaSiguiente) {
        return `Prepárate para ${siguiente}`;
    }
    
    // Usar transiciones definidas si existen
    if (posturaActual.transicion_hacia && posturaActual.transicion_hacia[siguiente]) {
        return posturaActual.transicion_hacia[siguiente];
    }
    
    // Transiciones genéricas para Hatha
    if (posturaActual.tipo.includes('relajación') && posturaSiguiente.tipo.includes('fuerza')) {
        return "Levántate lentamente y prepárate para más movimiento";
    }
    
    if (posturaActual.tipo.includes('fuerza') && posturaSiguiente.tipo.includes('flexibilidad')) {
        return "Desde la postura anterior, busca apertura y suavidad";
    }
    
    if (posturaActual.tipo.includes('equilibrio') && posturaSiguiente.tipo.includes('equilibrio')) {
        return "Mantén la concentración mientras transicionas";
    }
    
    // Transición por defecto para Hatha
    return "Respira profundamente y prepárate para la siguiente postura";
}

// ============================================
// FUNCIÓN PRINCIPAL DE GENERACIÓN (HÍBRIDA)
// ============================================

function generarClaseYogaGuiada(duracion, intention, tipoForzado = null) {
    // Obtener tipo de preferencia guardada
    const preferenciaGuardada = localStorage.getItem('yoga_tipo_preferido');
    
    // Determinar tipo de clase
    let tipoClase;
    if (tipoForzado && tipoForzado !== 'automatico') {
        tipoClase = tipoForzado;
        // Guardar preferencia si es manual
        localStorage.setItem('yoga_tipo_preferido', tipoForzado);
    } else if (preferenciaGuardada && preferenciaGuardada !== 'automatico') {
        tipoClase = preferenciaGuardada;
    } else {
        // Modo automático: basado en fase lunar
        const fase = obtenerFaseLunarHoy();
        const caracteristicas = FASE_LUNAR_MAP[fase] || FASE_LUNAR_MAP['luna_nueva'];
        tipoClase = caracteristicas.tipo.toLowerCase().includes('vinyasa') ? 'vinyasa' : 'hatha';
    }
    
    // Generar según tipo
    let clase;
    if (tipoClase === 'vinyasa') {
        clase = generarClaseVinyasa(duracion, intention);
    } else {
        clase = generarClaseHatha(duracion, intention);
    }
    
    // Añadir información de tipo
    clase.tipo_seleccionado = tipoClase;
    clase.tipo_manual = tipoForzado && tipoForzado !== 'automatico';
    
    return clase;
}

// Constantes del sistema Yoga
const FASE_LUNAR_MAP = {
    'luna_nueva': { 
        tipo: 'Hatha', 
        intensidad: 'suave', 
        ritmo: 'lento', 
        enfoque: 'introspección, siembra de intenciones' 
    },
    'media_luna_creciente': { 
        tipo: 'Vinyasa', 
        intensidad: 'suave-moderada', 
        ritmo: 'fluido', 
        enfoque: 'expansión, crecimiento' 
    },
    'cuarto_creciente': { 
        tipo: 'Vinyasa', 
        intensidad: 'moderada', 
        ritmo: 'dinámico', 
        enfoque: 'acción, superación de obstáculos' 
    },
    'luna_gibosa_creciente': { 
        tipo: 'Vinyasa', 
        intensidad: 'moderada-alta', 
        ritmo: 'fluido-poderoso', 
        enfoque: 'refinamiento, preparación' 
    },
    'luna_llena': { 
        tipo: 'Hatha', 
        intensidad: 'intensa', 
        ritmo: 'sostenido', 
        enfoque: 'manifestación, liberación, iluminación' 
    },
    'luna_gibosa_menguante': { 
        tipo: 'Hatha/Vinyasa mixto', 
        intensidad: 'moderada', 
        ritmo: 'introspectivo', 
        enfoque: 'gratitud, compartición' 
    },
    'cuarto_menguante': { 
        tipo: 'Hatha', 
        intensidad: 'suave-moderada', 
        ritmo: 'lento', 
        enfoque: 'liberación, cierre de ciclos' 
    },
    'luna_menguante': { 
        tipo: 'Hatha', 
        intensidad: 'suave', 
        ritmo: 'muy lento', 
        enfoque: 'descanso, regeneración' 
    }
};

const INTENCIONES_DIARIAS = [
    'activar',      // energía, despertar, motivación
    'soltar',       // liberación, rendición, fluir
    'enfocar',      // concentración, claridad, precisión
    'abrir',        // expansión, receptividad, vulnerabilidad
    'equilibrar'    // estabilidad, armonía, neutralidad
];

// Historial para control de repetición
let yogaHistorial = {
    fechas: [],
    posturasRecientes: [],
    secuenciasRecientes: []
};

// Cargar historial de localStorage al inicio
function cargarHistorialYoga() {
    try {
        const data = localStorage.getItem('yoga_historial');
        if (data) yogaHistorial = JSON.parse(data);
    } catch(e) {
        console.warn('Error cargando historial de yoga:', e);
    }
}

// Guardar historial en localStorage
function guardarHistorialYoga() {
    try {
        localStorage.setItem('yoga_historial', JSON.stringify(yogaHistorial));
    } catch(e) {
        console.warn('Error guardando historial de yoga:', e);
    }
}

// Obtener fase lunar actual (simplificado - se puede mejorar)
function obtenerFaseLunarHoy() {
    const hoy = new Date();
    // Usar eventos lunares predefinidos si están disponibles
    if (typeof EVENTS_DATA !== 'undefined') {
        const evento = EVENTS_DATA.find(ev => ev.date === hoy.toISOString().split('T')[0]);
        if (evento) {
            const map = {
                'new_moon': 'luna_nueva',
                'first_quarter': 'cuarto_creciente',
                'full_moon': 'luna_llena',
                'last_quarter': 'cuarto_menguante'
            };
            return map[evento.type] || 'luna_nueva';
        }
    }
    // Fallback: ciclo lunar aproximado (29.5 días)
    const diaDelMes = hoy.getDate();
    if (diaDelMes <= 2) return 'luna_nueva';
    if (diaDelMes <= 9) return 'media_luna_creciente';
    if (diaDelMes <= 15) return 'cuarto_creciente';
    if (diaDelMes <= 22) return 'luna_llena';
    if (diaDelMes <= 25) return 'cuarto_menguante';
    return 'luna_menguante';
}

// Obtener intención diaria aleatoria
function obtenerIntencionDiaria() {
    // Usar fecha como seed para consistencia diaria
    const hoy = new Date().toDateString();
    const hash = Array.from(hoy).reduce((hash, char) => ((hash << 5) - hash) + char.charCodeAt(0), 0);
    const index = Math.abs(hash) % INTENCIONES_DIARIAS.length;
    return INTENCIONES_DIARIAS[index];
}

// Generar mensaje del día
function generarMensajeDia(fase, intention) {
    const mensajes = {
        'luna_nueva': {
            activar: "Empieza con movimientos suaves para despertar el cuerpo sin forzar",
            soltar: "En cada exhalación, imagina liberar tensión de hombros y mandíbula",
            enfocar: "Mantén una mirada suave fija en un punto para mejorar la concentración",
            abrir: "Abre ligeramente el pecho en cada inhalación para mejorar la respiración",
            equilibrar: "Distribuye tu peso igualmente entre ambos pies antes de moverte"
        },
        'luna_llena': {
            activar: "Aprovecha esta energía para mantener posturas fuertes con respiración estable",
            soltar: "En cada postura, busca el punto donde el esfuerzo se convierte en liberación",
            enfocar: "Enfócate en la alineación precisa de cada articulación",
            abrir: "Expande tu conciencia más allá del cuerpo físico en cada exhalación",
            equilibrar: "Encuentra la sutileza entre esfuerzo y entrega en posturas de equilibrio"
        },
        'default': {
            activar: "Mueve tu cuerpo con energía consciente",
            soltar: "Permite que la tensión se disuelva en cada respiración",
            enfocar: "Lleva tu atención al momento presente",
            abrir: "Expande tu respiración y tu corazón",
            equilibrar: "Encuentra tu centro de gravedad y de paz"
        }
    };
    
    return mensajes[fase]?.[intention] || mensajes.default[intention] || 
           `Hoy la ${fase} te invita a ${intention} con consciencia`;
}

// Filtrar posturas adecuadas
function filtrarPosturasAdecuadas(fase, intention) {
    return posturaDB.filter(p => 
        p.fase_lunar_adecuada.includes(fase) &&
        p.intencion_alineada.includes(intention) &&
        !yogaHistorial.posturasRecientes.includes(p.nombre)
    );
}

// Seleccionar posturas variadas
function seleccionarPosturasVariadas(posturas, cantidad) {
    if (posturas.length <= cantidad) return posturas;
    // Mezclar y tomar las primeras 'cantidad'
    const mezcladas = [...posturas].sort(() => Math.random() - 0.5);
    return mezcladas.slice(0, cantidad);
}

// Generar transición contextual
function generarTransicion(actual, siguiente) {
    if (actual && siguiente && actual.transicion_hacia?.[siguiente.nombre]) {
        return actual.transicion_hacia[siguiente.nombre];
    }
    if (siguiente && actual && siguiente.transicion_desde?.[actual.nombre]) {
        return siguiente.transicion_desde[actual.nombre];
    }
    // Transiciones genéricas por tipo de cambio
    const tiposActual = actual?.tipo || [];
    const tiposSiguiente = siguiente?.tipo || [];
    
    if (tiposActual.includes('relajación') && tiposSiguiente.includes('fuerza')) {
        return "Levántate lentamente y prepárate para más movimiento";
    }
    if (tiposActual.includes('fuerza') && tiposSiguiente.includes('flexibilidad')) {
        return "Desde la postura anterior, busca apertura y suavidad";
    }
    if (tiposActual.includes('equilibrio') && tiposSiguiente.includes('equilibrio')) {
        return "Mantén la concentración mientras transicionas";
    }
    return `Transición suave a ${siguiente?.nombre || 'siguiente postura'}`;
}

// Calcular estructura por duración
function calcularEstructuraPorDuracion(duracionMinutos) {
    const estructura = {
        10: { inicio: 1, calentamiento: 2, flujoPrincipal: 4, posturasClave: 2, cierre: 1 },
        20: { inicio: 2, calentamiento: 3, flujoPrincipal: 8, posturasClave: 4, cierre: 3 },
        30: { inicio: 3, calentamiento: 4, flujoPrincipal: 12, posturasClave: 6, cierre: 5 }
    };
    return estructura[duracionMinutos] || estructura[20];
}

// Generar clase yoga guiada
function generarClaseYogaGuiada(duracionSeleccionada = 20) {
    const fase = obtenerFaseLunarHoy();
    const intention = obtenerIntencionDiaria();
    const caracteristicas = FASE_LUNAR_MAP[fase] || FASE_LUNAR_MAP['luna_nueva'];
    
    // Filtrar posturas adecuadas
    const posturasAdecuadas = filtrarPosturasAdecuadas(fase, intention);
    
    // Generar mensaje del día
    const mensajeDia = generarMensajeDia(fase, intention);
    
    // Estructura de tiempo
    const estructura = calcularEstructuraPorDuracion(duracionSeleccionada);
    
    // Construir flujo guiado
    const flujo = [];
    
    // INICIO (respiración)
    flujo.push({
        tipo: "inicio",
        instrucciones: [
            "Siéntate cómodamente, columna erguida",
            "Cierra ojos, lleva atención a la respiración",
            "Inhala profundo por nariz, exhala completamente",
            `Hoy: ${mensajeDia}`
        ]
    });
    
    // CALENTAMIENTO
    if (posturasAdecuadas.length > 0) {
        const calentamientoPosturas = seleccionarPosturasVariadas(
            posturasAdecuadas.filter(p => p.tipo.includes('flexibilidad') || p.tipo.includes('movilidad')),
            estructura.calentamiento
        );
        
        if (calentamientoPosturas.length > 0) {
            flujo.push({
                tipo: "calentamiento",
                pasos: calentamientoPosturas.map((p, i) => ({
                    postura: p.nombre,
                    duracion: `${Math.max(3, Math.round(p.duracion_estimada_seg / 20))} respiraciones`,
                    guia: p.instrucciones_clave[0] || "Mantén respiración consciente"
                }))
            });
        }
    }
    
    // FLUJO PRINCIPAL
    const flujoPosturas = seleccionarPosturasVariadas(
        posturasAdecuadas.filter(p => p.tipo.includes('fuerza') || p.tipo.includes('equilibrio')),
        estructura.flujoPrincipal
    );
    
    if (flujoPosturas.length > 0) {
        const flujoSteps = [];
        flujoPosturas.forEach((postura, i) => {
            // Añadir postura
            flujoSteps.push({
                postura: postura.nombre,
                duracion: `${Math.max(3, Math.round(postura.duracion_estimada_seg / 15))} respiraciones`,
                guia: postura.instrucciones_clave[0] || "Mantén postura con respiración estable"
            });
            
            // Añadir transición si no es la última
            if (i < flujoPosturas.length - 1) {
                const siguiente = flujoPosturas[i + 1];
                flujoSteps.push({
                    transicion: generarTransicion(postura, siguiente)
                });
            }
        });
        
        flujo.push({
            tipo: "flujo",
            pasos: flujoSteps
        });
    }
    
    // POSTURAS CLAVE
    const posturasClave = seleccionarPosturasVariadas(
        posturasAdecuadas.filter(p => p.tipo.includes('flexibilidad') || p.tipo.includes('relajación')),
        estructura.posturasClave
    );
    
    if (posturasClave.length > 0) {
        flujo.push({
            tipo: "posturas_clave",
            pasos: posturasClave.map(p => ({
                postura: p.nombre,
                duracion: `${Math.max(3, Math.round(p.duracion_estimada_seg / 10))} respiraciones`,
                guia: p.instrucciones_clave[0] || "Mantén postura, respira profundamente"
            }))
        });
    }
    
    // CIERRE
    flujo.push({
        tipo: "cierre",
        pasos: [
            {
                postura: "Savasana",
                duracion: "2 minutos",
                guia: "Relaja todo el cuerpo, cierra ojos, respira naturalmente"
            },
            {
                transicion: "Levántate lentamente, llevando la calma contigo"
            },
            {
                instrucciones: ["Clase finalizada. Namaste 🙏"]
            }
        ]
    });
    
    // Modo instructor mejorado
    const modoInstructor = {
        ritmoGeneral: caracteristicas.ritmo,
        respiracionPorPostura: "3 a 6 respiraciones (ajustar según postura)",
        puntosClave: [
            `Enfoque: ${caracteristicas.enfoque}`,
            "Mantener conciencia de la respiración en todo momento",
            "No forzar rango de movimiento; honrar los límites del cuerpo",
            ...(intention === 'soltar' ? ["Enfatizar la exhalación para liberar tensión"] : []),
            ...(intention === 'activar' ? ["Iniciar movimientos con inhalación energética"] : []),
            "Observar la calidad de movimiento, no la cantidad"
        ]
    };
    
    // Verificar similitud con historial
    if (esClaseAdecuadamenteUnica(flujo, yogaHistorial)) {
        // Actualizar historial
        yogaHistorial.fechas.push(new Date().toISOString().split('T')[0]);
        if (yogaHistorial.fechas.length > 7) yogaHistorial.fechas.shift();
        
        // Actualizar posturas recientes
        const posturasUsadas = flujo.flatMap(seccion => 
            seccion.pasos?.filter(p => p.postura).map(p => p.postura) || []
        );
        yogaHistorial.posturasRecientes = [...new Set([...posturasUsadas, ...yogaHistorial.posturasRecientes])].slice(0, 20);
        
        // Actualizar secuencias recientes
        const secuenciaHash = Array.from(JSON.stringify(flujo)).reduce(
            (hash, char) => ((hash << 5) - hash) + char.charCodeAt(0), 0
        );
        yogaHistorial.secuenciasRecientes = [secuenciaHash.toString(), ...yogaHistorial.secuenciasRecientes].slice(0, 5);
        
        guardarHistorialYoga();
    }
    
    return {
        fecha: new Date().toISOString().split('T')[0],
        faseLunar: fase,
        tipoYoga: caracteristicas.tipo,
        duracion: duracionSeleccionada,
        intention: intention,
        mensajeDia: mensajeDia,
        flujo: flujo,
        modoInstructor: modoInstructor
    };
}

function esClaseAdecuadamenteUnica(flujo, historial) {
    if (!historial || historial.secuenciasRecientes.length === 0) return true;
    
    // Verificar similitud simple
    const secuenciaHash = Array.from(JSON.stringify(flujo)).reduce(
        (hash, char) => ((hash << 5) - hash) + char.charCodeAt(0), 0
    );
    
    return !historial.secuenciasRecientes.includes(secuenciaHash.toString());
}

// Cargar miniapp Yoga
function loadYoga() {
    console.debug('[CHM] Cargando miniapp Yoga');
    const container = document.getElementById('yoga');
    if (!container) return;
    
    // Inicializar historial
    cargarHistorialYoga();
    
    // Obtener fase lunar y preferencia guardada
    const faseActual = obtenerFaseLunarHoy();
    const caracteristicas = FASE_LUNAR_MAP[faseActual] || FASE_LUNAR_MAP['luna_nueva'];
    const preferenciaGuardada = localStorage.getItem('yoga_tipo_preferido') || 'automatico';
    
    // Determinar tipo automático
    const tipoAutomatico = caracteristicas.tipo.toLowerCase().includes('vinyasa') ? 'vinyasa' : 'hatha';
    
    container.innerHTML = `
        <div class="yoga-miniapp">
            <div class="yoga-header">
                <div class="fase-lunar-indicador">
                    <span class="fase-icon">🌙</span>
                    <span class="fase-texto">${faseActual.replace(/_/g, ' ')}</span>
                </div>
                
                <div class="yoga-tipo-selector">
                    <label>Tipo de Yoga:</label>
                    <div class="tipo-botones">
                        <button class="tipo-btn ${preferenciaGuardada === 'automatico' ? 'active' : ''}" 
                                data-tipo="automatico">
                            <span class="tipo-icon">🌓</span>
                            <span>Automático</span>
                            <small>(Basado en fase lunar: ${tipoAutomatico})</small>
                        </button>
                        <button class="tipo-btn ${preferenciaGuardada === 'vinyasa' ? 'active vinyasa' : ''}" 
                                data-tipo="vinyasa">
                            <span class="tipo-icon">💧</span>
                            <span>Vinyasa</span>
                            <small>Fluido y dinámico</small>
                        </button>
                        <button class="tipo-btn ${preferenciaGuardada === 'hatha' ? 'active hatha' : ''}" 
                                data-tipo="hatha">
                            <span class="tipo-icon">🧘</span>
                            <span>Hatha</span>
                            <small>Estático y profundo</small>
                        </button>
                    </div>
                </div>
                
                <div class="duracion-selector">
                    <label>Duración:</label>
                    <select id="duracion-select">
                        <option value="10">10 min</option>
                        <option value="20" selected>20 min</option>
                        <option value="30">30 min</option>
                    </select>
                </div>
                
                <button id="generar-btn" class="yoga-btn-primary">
                    Generar Clase
                </button>
            </div>
            
            <div id="clase-generada" class="clase-container">
                <!-- Se mostrará la clase generada aquí -->
            </div>
            
            <div class="modo-instructor-toggle">
                <label>
                    <input type="checkbox" id="modo-instructor">
                    Mostrar Guía para Instructor
                </label>
            </div>
            
            <button class="btn-regresar-seccion-m" onclick="volverASeccionM()">
                ← Volver a Sección M
            </button>
        </div>
    `;
    
    // Event listeners para selector de tipo
    document.querySelectorAll('.tipo-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // Remover active de todos
            document.querySelectorAll('.tipo-btn').forEach(b => b.classList.remove('active', 'vinyasa', 'hatha'));
            // Agregar active al seleccionado
            btn.classList.add('active');
            const tipo = btn.dataset.tipo;
            if (tipo === 'vinyasa') btn.classList.add('vinyasa');
            if (tipo === 'hatha') btn.classList.add('hatha');
            
            // Guardar preferencia si no es automático
            if (tipo !== 'automatico') {
                localStorage.setItem('yoga_tipo_preferido', tipo);
            } else {
                localStorage.removeItem('yoga_tipo_preferido');
            }
        });
    });
    
    // Event listener para generar clase
    document.getElementById('generar-btn').addEventListener('click', () => {
        const duracion = parseInt(document.getElementById('duracion-select').value);
        const tipoSeleccionado = document.querySelector('.tipo-btn.active').dataset.tipo;
        const clase = generarClaseYogaGuiada(duracion, 'equilibrar', tipoSeleccionado);
        mostrarClaseYogaGuiada(clase);
    });
    
    // Auto-generar clase al cargar
    setTimeout(() => {
        const duracion = parseInt(document.getElementById('duracion-select').value) || 20;
        const tipoSeleccionado = document.querySelector('.tipo-btn.active').dataset.tipo;
        const clase = generarClaseYogaGuiada(duracion, 'equilibrar', tipoSeleccionado);
        mostrarClaseYogaGuiada(clase);
    }, 300);
}

// Mostrar clase generada
function mostrarClaseYogaGuiada(clase) {
    const container = document.getElementById('clase-generada');
    if (!container) return;
    
    const mostrarInstructor = document.getElementById('modo-instructor')?.checked || false;
    
    // Generar HTML del flujo (nueva estructura plana)
    const flujoHTML = clase.flujo.map((paso, index) => {
        // Si es una postura
        if (paso.postura) {
            const postura = obtenerPosturaPorNombre(paso.postura);
            const puntosClaveHTML = mostrarInstructor && postura?.puntos_clave_instructor ? 
                `<div class="puntos-clave-instructor">
                    <strong>Puntos clave:</strong>
                    <ul>${postura.puntos_clave_instructor.map(p => `<li>${p}</li>`).join('')}</ul>
                </div>` : '';
            
            // Clase CSS según tipo
            const claseTipo = paso.tipo === 'vinyasa' ? 'vinyasa' : 'hatha';
            
            return `
                <div class="paso-postura ${claseTipo}" data-index="${index}">
                    <div class="paso-numero">${index + 1}</div>
                    <div class="postura-contenido">
                        <h4>${paso.postura}</h4>
                        <div class="postura-detalles">
                            <span class="duracion">⏱️ ${paso.duracion}</span>
                            <span class="guia">📢 ${paso.guia}</span>
                        </div>
                        ${puntosClaveHTML}
                    </div>
                </div>
            `;
        } 
        // Si es una transición
        else if (paso.transicion) {
            return `
                <div class="paso-transicion" data-index="${index}">
                    <div class="transicion-contenido">
                        <span class="transicion-icon">→</span>
                        <span class="transicion-texto">${paso.transicion}</span>
                    </div>
                </div>
            `;
        }
        return '';
    }).join('');
    
    // Información del tipo de clase
    const tipoInfo = clase.tipo_seleccionado === 'vinyasa' 
        ? `💧 Vinyasa${clase.intensidad ? ` (${clase.intensidad})` : ''}`
        : `🧘 Hatha`;
    
    const ritmoInfo = clase.ritmo || (clase.tipo_seleccionado === 'vinyasa' ? 'Fluido' : 'Lento');
    const respiracionInfo = clase.respiracion || (clase.tipo_seleccionado === 'vinyasa' 
        ? 'Inhala-eleva, exhala-flexiona' 
        : '5-8 respiraciones profundas');
    
    // Modo instructor
    const modoInstructorHTML = mostrarInstructor ? `
        <div class="modo-instructor-panel">
            <h4>Modo Instructor</h4>
            <div class="instructor-info">
                <p><strong>Tipo:</strong> ${tipoInfo}</p>
                <p><strong>Ritmo:</strong> ${ritmoInfo}</p>
                <p><strong>Respiración:</strong> ${respiracionInfo}</p>
                ${clase.intention ? `<p><strong>Intención:</strong> ${clase.intention}</p>` : ''}
                <p><strong>Puntos clave:</strong></p>
                <ul>
                    <li>Mantener conciencia de la respiración</li>
                    <li>No forzar rango de movimiento</li>
                    <li>Observar calidad del movimiento</li>
                    ${clase.tipo_seleccionado === 'vinyasa' ? 
                        '<li>Mantener fluidez entre posturas</li>' : 
                        '<li>Mantener alineación en cada postura</li>'}
                </ul>
            </div>
        </div>
    ` : '';
    
    container.innerHTML = `
        <div class="clase-generada-header">
            <div class="clase-info">
                <div class="clase-tipo ${clase.tipo_seleccionado}">${tipoInfo}</div>
                <div class="clase-duracion">${clase.duracion} min</div>
                ${clase.intention ? `<div class="clase-intencion">Intención: ${clase.intention}</div>` : ''}
            </div>
            <div class="clase-ritmo">
                <span>Ritmo: ${ritmoInfo}</span>
                <span>Respiración: ${respiracionInfo}</span>
            </div>
        </div>
        
        <div class="clase-flujo">
            ${flujoHTML}
        </div>
        
        ${modoInstructorHTML}
        
        <div class="clase-controles">
            <button id="btn-anterior" class="clase-btn-control" disabled>← Anterior</button>
            <span id="contador-pasos">1 / ${clase.flujo.length}</span>
            <button id="btn-siguiente" class="clase-btn-control">Siguiente →</button>
            
            <div class="clase-modos">
                <label class="clase-modo-item">
                    <input type="checkbox" id="chk-pantalla-lima">
                    <span>Pantalla limpia</span>
                </label>
                <label class="clase-modo-item">
                    <input type="checkbox" id="chk-automatico">
                    <span>Auto-avanzar</span>
                    <span id="contador-tiempo">--:--</span>
                </label>
            </div>
        </div>
    `;
    
    // Inicializar navegación de clase
    inicializarNavegacionClase(clase);
    
    // Event listener para modo instructor
    const modoCheckbox = document.getElementById('modo-instructor');
    if (modoCheckbox) {
        modoCheckbox.addEventListener('change', () => {
            mostrarClaseYogaGuiada(clase);
        });
    }
}

// Inicializar navegación de clase
function inicializarNavegacionClase(clase) {
    let pasoActual = 0;
    let intervaloAutomatico = null;
    const pasosTotales = clase.flujo.length;
    
    const btnAnterior = document.getElementById('btn-anterior');
    const btnSiguiente = document.getElementById('btn-siguiente');
    const contadorPasos = document.getElementById('contador-pasos');
    const chkAutomatico = document.getElementById('chk-automatico');
    const contadorTiempo = document.getElementById('contador-tiempo');
    
    function actualizarControles() {
        if (!btnAnterior || !btnSiguiente || !contadorPasos) return;
        
        btnAnterior.disabled = pasoActual === 0;
        btnSiguiente.disabled = pasoActual === pasosTotales - 1;
        contadorPasos.textContent = `${pasoActual + 1} / ${pasosTotales}`;
    }
    
    function avanzarPaso() {
        if (pasoActual < pasosTotales - 1) {
            pasoActual++;
            actualizarControles();
            scrollToPaso(pasoActual);
        }
    }
    
    function retrocederPaso() {
        if (pasoActual > 0) {
            pasoActual--;
            actualizarControles();
            scrollToPaso(pasoActual);
        }
    }
    
    function scrollToPaso(index) {
        const pasos = document.querySelectorAll('.seccion-flujo, .paso-instrucciones');
        if (pasos[index]) {
            pasos[index].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
    
    function reiniciarTemporizadorAutomatico() {
        clearInterval(intervaloAutomatico);
        if (!contadorTiempo) return;
        contadorTiempo.textContent = "--:--";
        
        if (chkAutomatico?.checked && pasoActual < pasosTotales - 1) {
            const seccion = clase.flujo[pasoActual];
            let segundos = 30; // Valor por defecto
            
            if (seccion.pasos) {
                const primerPaso = seccion.pasos[0];
                if (primerPaso.duracion) {
                    const match = primerPaso.duracion.match(/(\d+)\s*respiraciones/);
                    if (match) segundos = parseInt(match[1]) * 4;
                }
            }
            
            let tiempoRestante = segundos;
            intervaloAutomatico = setInterval(() => {
                tiempoRestante--;
                const mins = Math.floor(tiempoRestante / 60);
                const secs = tiempoRestante % 60;
                contadorTiempo.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                
                if (tiempoRestante <= 0) {
                    avanzarPaso();
                }
            }, 1000);
        }
    }
    
    // Event listeners
    if (btnSiguiente) btnSiguiente.addEventListener('click', avanzarPaso);
    if (btnAnterior) btnAnterior.addEventListener('click', retrocederPaso);
    if (chkAutomatico) {
        chkAutomatico.addEventListener('change', () => {
            if (chkAutomatico.checked) {
                reiniciarTemporizadorAutomatico();
            } else {
                clearInterval(intervaloAutomatico);
                if (contadorTiempo) contadorTiempo.textContent = "--:--";
            }
        });
    }
    
    // Inicializar
    actualizarControles();
}

window.buscarSintoma = buscarSintoma;
window.abrirModalInterpretacion = abrirModalInterpretacion;
window.irASeccionM = irASeccionM;
window.abrirMiniapp = abrirMiniapp;
window.volverASeccionM = volverASeccionM;
window.loadYoga = loadYoga;
