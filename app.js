const API = {
    HORARIOS: 'https://opensheet.elk.sh/1Tdxx6a3nKK8JmQvL8BwVzJhbFalWcHEAgd07cmt9uG0/Horarios',
    AGENDA: 'https://opensheet.elk.sh/1Tdxx6a3nKK8JmQvL8BwVzJhbFalWcHEAgd07cmt9uG0/Agenda',
    SERVICIOS: 'https://opensheet.elk.sh/1Tdxx6a3nKK8JmQvL8BwVzJhbFalWcHEAgd07cmt9uG0/Servicios',
    CONTACTO: 'https://opensheet.elk.sh/1Tdxx6a3nKK8JmQvL8BwVzJhbFalWcHEAgd07cmt9uG0/Contacto'
};

const CACHE_DURATION = 3600000;
let cachedSlogan = '';

document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    initNavigation();
    loadTab('horarios');
    loadSlogan();
    registerSW();
});

function initParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    for (let i = 0; i < 15; i++) {
        setTimeout(() => createParticle(container), i * 300);
    }
    setInterval(() => createParticle(container), 800);
}

function createParticle(container) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.cssText = `left:${Math.random()*100}vw;animation-duration:${Math.random()*10+10}s;width:${Math.random()*3+2}px;height:${Math.random()*3+2}px;`;
    container.appendChild(p);
    setTimeout(() => p.remove(), 20000);
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
async function loadHorarios() {
    const container = document.getElementById('horarios-container');
    const [horarios, agenda] = await Promise.all([
        fetchAPI(API.HORARIOS, 'ch_horarios'),
        fetchAPI(API.AGENDA, 'ch_agenda')
    ]);

    let html = '';

    // Horario Semanal - Calendario
    if (horarios && horarios.length > 1) {
        html += '<h3 class="section-subtitle">📅 Horario Semanal</h3>';
        html += '<div class="calendario-semanal">';
        
        const headerRow = horarios[0];
        const allKeys = Object.keys(headerRow);
        
        const horaKey = allKeys.find(k => k.toLowerCase().includes('hora'));
        
        const dayOrder = ['lunes', 'martes', 'miércoles', 'miercoles', 'jueves', 'viernes', 'sábado', 'sabado', 'domingo'];
        const dayKeys = dayOrder.filter(d => allKeys.some(k => k.toLowerCase().includes(d)));
        
        // Header días
        html += '<div class="calendario-header"><div class="hora-header"></div>';
        dayKeys.forEach(d => {
            const nombreDia = d.charAt(0).toUpperCase() + d.slice(1,3);
            html += `<div class="dia-header">${nombreDia}</div>`;
        });
        html += '</div>';
        
        // Filas del calendario
        for (let i = 1; i < horarios.length; i++) {
            const row = horarios[i];
            if (!row) continue;
            
            const hora = horaKey ? row[horaKey] : Object.values(row)[0];
            if (!hora) continue;
            
            html += `<div class="calendario-fila"><div class="hora-label">${hora}</div>`;
            dayKeys.forEach(diaKey => {
                const contenido = row[diaKey] || '';
                const clase = contenido ? 'celda-llena' : '';
                html += `<div class="calendario-celda ${clase}">${contenido}</div>`;
            });
            html += '</div>';
        }
        html += '</div>';
    }

    // Actividades (Tipo = Actividad)
    const actividades = agenda?.filter(r => r.Nombre && r.Tipo === 'Actividad') || [];
    if (actividades.length) {
        html += '<h3 class="section-subtitle">🎯 Actividades</h3>';
        html += '<div class="cards-grid">';
        actividades.forEach(a => {
            const descLarga = a.DescripcionLarga || a.DescripcionCorta || '';
            html += `<div class="card" data-titulo="${a.Nombre}" data-categoria="${a.Categoria||''}" data-desc="${descLarga}" data-precio="${a.Precio||''}" data-duracion="${a.Duracion||''}" data-estado="${a.Estado||''}" data-tipo="actividad">
                <span class="badge ${(a.Estado||'').toLowerCase().includes('no') ? 'nodisponible' : 'disponible'}">${a.Estado||'Disponible'}</span>
                <h3>${a.Nombre}</h3>
                <span class="categoria">${a.Categoria||''}</span>
                <p>${a.DescripcionCorta||''}</p>
            </div>`;
        });
        html += '</div>';
    }

    // Talleres y Eventos
    const talleres = agenda?.filter(r => r.Nombre && (r.Tipo === 'Taller' || r.Tipo === 'Evento' || r.Fecha)) || [];
    if (talleres.length) {
        html += '<h3 class="section-subtitle">📚 Talleres y Eventos</h3>';
        html += '<div class="cards-grid">';
        talleres.forEach(t => {
            const descLarga = t.DescripcionLarga || t.DescripcionCorta || '';
            html += `<div class="card" data-titulo="${t.Nombre}" data-categoria="${t.Categoria||''}" data-desc="${descLarga}" data-precio="${t.Precio||''}" data-duracion="${t.Duracion||''}" data-estado="${t.Estado||''}" data-fecha="${t.Fecha||''}" data-hora="${t.Hora||''}" data-tipo="taller">
                <span class="badge ${(t.Estado||'').toLowerCase().includes('no') ? 'nodisponible' : 'disponible'}">${t.Estado||'Disponible'}</span>
                <h3>${t.Nombre}</h3>
                <span class="categoria">${t.Fecha||''} ${t.Hora||''}</span>
                <p>${t.DescripcionCorta||''}</p>
            </div>`;
        });
        html += '</div>';
    }

    container.innerHTML = html || '<p class="error">No hay horarios disponibles</p>';
    
    // Agregar eventos click
    container.querySelectorAll('.card').forEach(card => {
        card.addEventListener('click', () => {
            const datos = {
                titulo: card.dataset.titulo,
                categoria: card.dataset.categoria,
                descripcion: card.dataset.desc,
                precio: card.dataset.precio,
                duracion: card.dataset.duracion,
                estado: card.dataset.estado,
                fecha: card.dataset.fecha,
                hora: card.dataset.hora,
                tipo: card.dataset.tipo
            };
            showModal(datos);
        });
    });
}

// ======================
// SERVICIOS
// ======================
async function loadServicios() {
    const container = document.getElementById('servicios-container');
    const data = await fetchAPI(API.SERVICIOS, 'ch_servicios');

    let html = '<div class="cards-grid">';
    data.forEach(s => {
        const descLarga = s['Descripcion larga'] || s.DescripcionLarga || s['Descripcion corta'] || s.DescripcionCorta || '';
        html += `<div class="card" data-titulo="${s.Nombre}" data-categoria="${s.Categoria||s.Categoría||''}" data-desc="${descLarga}" data-precio="${s.Precio||''}" data-duracion="${s.Duracion||s.Duración||''}" data-tipo="servicio">
            <h3>${s.Nombre}</h3>
            <span class="categoria">${s.Categoria||s.Categoría||''}</span>
            <p>${s['Descripcion corta']||s.DescripcionCorta||''}</p>
            <div class="card-footer">
                <span>${s.Duracion||s.Duración||''}</span>
            </div>
        </div>`;
    });
    html += '</div>';
    container.innerHTML = html || '<p class="error">No hay servicios disponibles</p>';
    
    container.querySelectorAll('.card').forEach(card => {
        card.addEventListener('click', () => {
            const datos = {
                titulo: card.dataset.titulo,
                categoria: card.dataset.categoria,
                descripcion: card.dataset.desc,
                precio: card.dataset.precio,
                duracion: card.dataset.duracion
            };
            showModal(datos);
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
    const wa = (c.WhatsApp||'').replace(/\D/g,'');
    
    let redes = '';
    if (c.Instagram) redes += `<a href="${c.Instagram}" target="_blank" title="Instagram">📷</a>`;
    if (c.Facebook) redes += `<a href="${c.Facebook}" target="_blank" title="Facebook">📘</a>`;
    if (c.YouTube||c.Youtube) redes += `<a href="${c.YouTube||c.Youtube}" target="_blank" title="YouTube">▶️</a>`;
    if (c.TikTok) redes += `<a href="${c.TikTok}" target="_blank" title="TikTok">🎵</a>`;

    container.innerHTML = `
        <div class="contacto-card">
            <h2>Comunícate Conmigo</h2>
            
            ${c.Ciudad || (c.Direccion||c.Dirección) ? `<div class="info-row"><span class="icon">📍</span><div class="text"><strong>${c.Ciudad ? c.Ciudad + (c.Direccion||c.Dirección) ? ', ' : '' : ''}</strong><span>${c.Direccion||c.Dirección||''}</span></div></div>` : ''}
            ${c.Telefono||c.Teléfono ? `<div class="info-row"><span class="icon">📞</span><div class="text"><strong>Teléfono</strong><a href="tel:${c.Telefono||c.Teléfono}">${c.Telefono||c.Teléfono}</a></div></div>` : ''}
            ${c.Email ? `<div class="info-row"><span class="icon">✉️</span><div class="text"><strong>Email</strong><a href="mailto:${c.Email}">${c.Email}</a></div></div>` : ''}
            ${c.Horario ? `<div class="info-row"><span class="icon">🕰️</span><div class="text"><strong>Horario</strong><span>${c.Horario}</span></div></div>` : ''}
            
            ${redes ? `<div class="redes-sociales">${redes}</div>` : ''}
            
            ${wa ? `<a href="https://wa.me/${wa}" target="_blank" class="btn-whatsapp">💬 WhatsApp</a>` : ''}
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

// Modal
function showModal(datos) {
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
    
    m.innerHTML = `
        <div class="modal-content">
            <button class="modal-close">&times;</button>
            ${datos.estado ? `<span class="badge ${badgeClass}">${datos.estado}</span>` : ''}
            <h2 class="modal-title">${datos.titulo}</h2>
            ${infoHtml ? `<div class="modal-info">${infoHtml}</div>` : ''}
            <p class="modal-desc">${datos.descripcion || 'Sin descripción disponible.'}</p>
            <a href="https://wa.me/?text=${waMsg}" target="_blank" class="share-btn">💬 Consultar por WhatsApp</a>
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
