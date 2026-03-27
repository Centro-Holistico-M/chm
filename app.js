const API = {
    HORARIOS: 'https://opensheet.elk.sh/1Tdxx6a3nKK8JmQvL8BwVzJhbFalWcHEAgd07cmt9uG0/Horarios',
    SERVICIOS: 'https://opensheet.elk.sh/1Tdxx6a3nKK8JmQvL8BwVzJhbFalWcHEAgd07cmt9uG0/Servicios',
    CONTACTO: 'https://opensheet.elk.sh/1Tdxx6a3nKK8JmQvL8BwVzJhbFalWcHEAgd07cmt9uG0/Contacto',
    DESCODIFICACION: 'https://opensheet.elk.sh/1Tdxx6a3nKK8JmQvL8BwVzJhbFalWcHEAgd07cmt9uG0/Descodificacion'
};

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
        else if (tab === 'contacto') await loadContacto();
        else if (tab === 'descodificacion') await loadDescodificacion();
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
const LUNAR_EVENTS = {};
const SOLAR_EVENTS = {};

function initCalendario() {
    const year = new Date().getFullYear();
    calculateLunarEvents(year);
    calculateSolarEvents(year);
}

function calculateLunarEvents(year) {
    const phases = [
        { name: 'Luna nueva', icon: '🌑' },
        { name: 'Cuarto creciente', icon: '🌓' },
        { name: 'Luna llena', icon: '🌕' },
        { name: 'Cuarto menguante', icon: '🌗' }
    ];
    
    for (let month = 0; month < 12; month++) {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const key = `${year}-${String(month + 1).padStart(2, '0')}`;
        LUNAR_EVENTS[key] = {};
        
        let phaseIndex = 0;
        let currentPhase = 0;
        const baseDate = new Date(year, month, 1);
        const knownNewMoon = getKnownNewMoon(year, month);
        
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const daysSinceNew = Math.floor((date - knownNewMoon) / (1000 * 60 * 60 * 24));
            const lunation = daysSinceNew % 29.53;
            
            if (lunation < 1 || lunation > 28.5) {
                LUNAR_EVENTS[key][day] = phases[0];
            } else if (lunation >= 7.38 && lunation < 8.38) {
                LUNAR_EVENTS[key][day] = phases[1];
            } else if (lunation >= 14.77 && lunation < 15.77) {
                LUNAR_EVENTS[key][day] = phases[2];
            } else if (lunation >= 22.15 && lunation < 23.15) {
                LUNAR_EVENTS[key][day] = phases[3];
            }
        }
    }
}

function getKnownNewMoon(year, month) {
    const knownNewMoons = {
        2026: [new Date(2026, 0, 13), new Date(2026, 1, 11), new Date(2026, 2, 13), new Date(2026, 3, 12), new Date(2026, 4, 11), new Date(2026, 5, 10), new Date(2026, 6, 9), new Date(2026, 7, 8), new Date(2026, 8, 7), new Date(2026, 9, 6), new Date(2026, 10, 5), new Date(2026, 11, 5)]
    };
    return knownNewMoons[year]?.[month] || new Date(year, month, 1);
}

function calculateSolarEvents(year) {
    SOLAR_EVENTS[year] = {
        '03-20': { name: 'Equinoccio Primavera', icon: '🌅' },
        '06-21': { name: 'Solsticio Verano', icon: '☀️' },
        '09-22': { name: 'Equinoccio Otoño', icon: '🌅' },
        '12-21': { name: 'Solsticio Invierno', icon: '❄️' }
    };
}

function renderCalendario(year, month) {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const key = `${year}-${String(month + 1).padStart(2, '0')}`;
    
    let html = `
        <div class="calendario-widget">
            <div class="calendario-header">
                <button class="cal-nav-btn" onclick="renderCalendario(${year}, ${month - 1})">◀</button>
                <span class="cal-mes">${meses[month]} ${year}</span>
                <button class="cal-nav-btn" onclick="renderCalendario(${year}, ${month + 1})">▶</button>
            </div>
            <div class="cal-dias-header">`;
    
    diasSemana.forEach(d => { html += `<span>${d}</span>`; });
    html += '</div><div class="cal-dias">';
    
    for (let i = 0; i < firstDay; i++) {
        html += '<span class="cal-vacio"></span>';
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
        let eventIcon = '';
        
        if (LUNAR_EVENTS[key]?.[day]) {
            eventIcon = `<span class="cal-icon">${LUNAR_EVENTS[key][day].icon}</span>`;
        }
        
        const solarKey = `${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        if (SOLAR_EVENTS[year]?.[solarKey]) {
            eventIcon = `<span class="cal-icon">${SOLAR_EVENTS[year][solarKey].icon}</span>`;
        }
        
        html += `<span class="cal-dia">${day}${eventIcon}</span>`;
    }
    
    html += '</div></div>';
    return html;
}

initCalendario();

async function loadHorarios() {
    const container = document.getElementById('horarios-container');
    const horarios = await fetchAPI(API.HORARIOS, 'ch_horarios');
    
    const diasSemana = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
    const diasCorto = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    
    todasActividadesGlobal.length = 0;
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
            } else {
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
        const nombreDia = dia.charAt(0).toUpperCase() + dia.slice(1);
        
        html += `<div class="dia-bloque">
            <div class="dia-header">${diasCorto[idx]}</div>
            <div class="dia-actividades">`;
        
        if (actividadesDia.length === 0) {
            html += `<span class="sin-actividad">-</span>`;
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
    
    // Eventos y Talleres
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
    const data = await fetchAPI(API.SERVICIOS, 'ch_servicios');

    let html = '<h3 class="section-subtitle">💆 Servicios</h3>';
    html += '<div class="cards-grid cards-horizontal">';
    data.forEach(s => {
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
    container.innerHTML = html || '<p class="error">No hay servicios disponibles</p>';
    
    container.querySelectorAll('.card').forEach(card => {
        card.addEventListener('click', () => {
            showModal({
                titulo: card.dataset.titulo,
                categoria: card.dataset.categoria,
                descripcion: card.dataset.desc,
                precio: card.dataset.precio,
                duracion: card.dataset.duracion,
                estado: card.dataset.estado,
                cupo: card.dataset.cupo
            }, cachedWhatsApp);
        });
    });
}

// ======================
// CONTACTO
// ======================
async function loadContacto() {
    const container = document.getElementById('contacto-container');
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

// ================================
// DESCODIFICACIÓN
// ================================
let cachedDescodificacion = [];

function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function parseDescId(id) {
    const str = String(id || '').trim().toLowerCase();
    const parts = str.split('-').filter(p => p && p.length > 0);
    
    return {
        nivel1: capitalize(parts[0] || ''),
        nivel2: capitalize(parts[1] || ''),
        nivel3: capitalize(parts[2] || parts[1] || '')
    };
}

async function loadDescodificacion() {
    const container = document.getElementById('descodificacion-container');
    
    try {
        if (cachedDescodificacion.length === 0) {
            cachedDescodificacion = await fetchAPI(API.DESCODIFICACION, 'ch_horarios_descodif');
        }
        
        if (!cachedDescodificacion || cachedDescodificacion.length === 0) {
            container.innerHTML = `
                <div class="desc-empty">
                    <div class="empty-icon">📋</div>
                    <p>No hay datos disponibles</p>
                    <p style="font-size:0.8rem;margin-top:8px;">Verifica que la hoja 'Descodificacion' tenga datos</p>
                </div>
            `;
            return;
        }
        
        renderNivel1(container);
    } catch (e) {
        console.error('Error cargando descodificación:', e);
        container.innerHTML = `
            <div class="desc-empty">
                <div class="empty-icon">❌</div>
                <p>Error al cargar datos</p>
                <p style="font-size:0.8rem;margin-top:8px;">Verifica el nombre de la hoja: 'Descodificacion'</p>
            </div>
        `;
    }
}

function renderNivel1(container) {
    const data = cachedDescodificacion;
    
    const zonasSet = new Set();
    data.forEach(item => {
        if (item && item.id) {
            const niveles = parseDescId(item.id);
            if (niveles.nivel1) {
                zonasSet.add(niveles.nivel1);
            }
        }
    });
    
    const zonasNivel1 = Array.from(zonasSet);
    
    const iconosNivel1 = {
        'Cabeza': '🧠',
        'Tronco': '❤️',
        'Extremidades': '💪'
    };
    
    let html = `
        <div class="desc-intro">
            <h2>🧠 Descodificación</h2>
            <p>Tu cuerpo es un mapa de emociones</p>
        </div>
        
        <div class="desc-instrucciones">
            <p>Selecciona una zona del cuerpo para explorar su significado emocional</p>
        </div>
        
        <div class="desc-zonas-nivel1">
    `;
    
    if (zonasNivel1.length === 0) {
        html += `
            <div class="desc-empty">
                <div class="empty-icon">❓</div>
                <p>No se encontraron zonas</p>
            </div>
        `;
    } else {
        zonasNivel1.forEach(nivel1 => {
            const count = data.filter(item => {
                if (!item || !item.id) return false;
                const niveles = parseDescId(item.id);
                return niveles.nivel1 === nivel1;
            }).length;
            
            html += `
                <div class="desc-zona" onclick="renderNivel2('${nivel1}')">
                    <span class="zona-icono">${iconosNivel1[nivel1] || '🔘'}</span>
                    <div class="zona-nombre">${nivel1}</div>
                    <div class="zona-count">${count} partes</div>
                </div>
            `;
        });
    }
    
    html += '</div>';
    container.innerHTML = html;
}

function renderNivel2(nivel1) {
    const container = document.getElementById('descodificacion-container');
    const filteredData = cachedDescodificacion.filter(item => {
        if (!item || !item.id) return false;
        const niveles = parseDescId(item.id);
        return niveles.nivel1 === nivel1;
    });
    
    const zonasNivel2Set = new Set();
    filteredData.forEach(item => {
        const niveles = parseDescId(item.id);
        if (niveles.nivel2) {
            zonasNivel2Set.add(niveles.nivel2);
        }
    });
    
    const zonasNivel2 = Array.from(zonasNivel2Set);
    
    const iconosNivel2 = {
        'Cara': '😊', 'Craneo': '💭', 'Cuello': '🔗', 'Sentidos': '👁️',
        'Pecho': '💗', 'Abdomen': '🫃', 'Espalda': '🔙', 'Caderas': '🦴',
        'Brazos': '💪', 'Manos': '🤲', 'Piernas': '🦵', 'Pies': '🦶'
    };
    
    let html = `
        <div class="desc-nav-back" onclick="renderNivel1(document.getElementById('descodificacion-container'))">
            <span>←</span> Volver
        </div>
        
        <h3 class="desc-level-title">🗺️ ${nivel1}</h3>
        
        <div class="desc-zonas-nivel2">
    `;
    
    zonasNivel2.forEach(nivel2 => {
        const count = filteredData.filter(item => {
            const niveles = parseDescId(item.id);
            return niveles.nivel2 === nivel2;
        }).length;
        
        html += `
            <div class="desc-zona" onclick="renderNivel3('${nivel1}', '${nivel2}')">
                <span class="zona-icono">${iconosNivel2[nivel2] || '🔘'}</span>
                <div class="zona-nombre">${nivel2}</div>
                <div class="zona-count">${count} partes</div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

function renderNivel3(nivel1, nivel2) {
    const container = document.getElementById('descodificacion-container');
    const filteredData = cachedDescodificacion.filter(item => {
        if (!item || !item.id) return false;
        const niveles = parseDescId(item.id);
        return niveles.nivel1 === nivel1 && niveles.nivel2 === nivel2;
    });
    
    let html = `
        <div class="desc-nav-back" onclick="renderNivel2('${nivel1}')">
            <span>←</span> ${nivel1}
        </div>
        
        <h3 class="desc-level-title">📍 ${nivel2}</h3>
        
        <div class="desc-zonas-nivel2">
    `;
    
    filteredData.forEach(item => {
        const niveles = parseDescId(item.id);
        const nombre = item.nombre || niveles.nivel3;
        
        html += `
            <div class="desc-zona" onclick="showDescDetail('${item.id}')">
                <span class="zona-icono">🔍</span>
                <div class="zona-nombre">${nombre}</div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

function showDescDetail(id) {
    const item = cachedDescodificacion.find(i => i.id === id);
    if (!item) return;
    
    const niveles = parseDescId(item.id);
    const nombre = item.nombre || niveles.nivel3;
    
    const m = document.createElement('div');
    m.className = 'modal-overlay active';
    
    const conflictoList = item.conflicto ? item.conflicto.split(/[|,]/).map(c => c.trim()).filter(Boolean) : [];
    const sintomaList = item.sintoma ? item.sintoma.split(/[|,]/).map(s => s.trim()).filter(Boolean) : [];
    const bloqueoList = item.bloqueo ? item.bloqueo.split(/[|,]/).map(b => b.trim()).filter(Boolean) : [];
    
    let cardsHtml = '';
    
    if (conflictoList.length) {
        cardsHtml += `
            <div class="desc-info-card">
                <div class="info-header">
                    <span class="info-icon">⚡</span>
                    <span class="info-title">Conflicto Emocional</span>
                </div>
                <ul class="info-list">
                    ${conflictoList.map(c => `<li>${c}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    if (sintomaList.length) {
        cardsHtml += `
            <div class="desc-info-card">
                <div class="info-header">
                    <span class="info-icon">🔍</span>
                    <span class="info-title">Síntomas Asociados</span>
                </div>
                <ul class="info-list">
                    ${sintomaList.map(s => `<li>${s}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    if (bloqueoList.length) {
        cardsHtml += `
            <div class="desc-info-card">
                <div class="info-header">
                    <span class="info-icon">🔒</span>
                    <span class="info-title">Bloqueo Energético</span>
                </div>
                <ul class="info-list">
                    ${bloqueoList.map(b => `<li>${b}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    m.innerHTML = `
        <div class="modal-content">
            <button class="modal-close">&times;</button>
            <div class="desc-detalle">
                <div class="desc-detalle-header">
                    <h3>${nombre}</h3>
                    <span class="subtitulo">${niveles.nivel1} › ${niveles.nivel2}</span>
                </div>
                ${cardsHtml || '<p style="color:var(--text-muted);text-align:center;">Sin información disponible</p>'}
            </div>
        </div>
    `;
    
    document.body.appendChild(m);
    
    m.querySelector('.modal-close').addEventListener('click', () => m.remove());
    m.addEventListener('click', (e) => { if (e.target === m) m.remove(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') m.remove(); });
}

// Funciones globales para onclick
window.renderNivel1 = renderNivel1;
window.renderNivel2 = renderNivel2;
window.renderNivel3 = renderNivel3;
window.showDescDetail = showDescDetail;
