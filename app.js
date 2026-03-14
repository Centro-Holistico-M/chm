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

// Cache
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

    // Horario Semanal (empezar desde fila 1)
    if (horarios && horarios.length > 1) {
        html += '<h3 class="section-subtitle">📅 Horario Semanal</h3>';
        html += '<div class="cards-grid">';
        
        for (let i = 1; i < horarios.length; i++) {
            const row = horarios[i];
            if (!row) continue;
            const hora = Object.values(row)[0];
            if (!hora) continue;
            
            const dias = [];
            ['lunes','martes','miércoles','jueves','viernes','sábado','domingo'].forEach(dia => {
                if (row[dia]) dias.push(`${dia.slice(0,3)}: ${row[dia]}`);
            });
            
            if (dias.length > 0) {
                html += `
                <div class="card" onclick="showModal('${hora}', '', '${dias.join(' | ')}', '', '', '')">
                    <h3>${hora}</h3>
                    <p>${dias.join(' | ')}</p>
                </div>`;
            }
        }
        html += '</div>';
    }

    // Actividades (Tipo = Actividad)
    const actividades = agenda?.filter(r => r.Nombre && r.Tipo === 'Actividad') || [];
    if (actividades.length) {
        html += '<h3 class="section-subtitle">🎯 Actividades</h3>';
        html += '<div class="cards-grid">';
        actividades.forEach(a => {
            html += `
            <div class="card" onclick="showModal('${a.Nombre}', '${a.Categoria||''}', '${a.DescripcionCorta||''}', '${a.DescripcionLarga||a.DescripcionCorta||''}', '${a.Duracion||''}', '${a.Precio||''}', '${a.Estado||''}')">
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
            html += `
            <div class="card" onclick="showModal('${t.Nombre}', '${t.Categoria||''}', '${t.DescripcionCorta||''}', '${t.DescripcionLarga||t.DescripcionCorta||''}', '${t.Duracion||''}', '${t.Precio||''}', '${t.Estado||''}', '${t.Fecha||''}', '${t.Hora||''}')">
                <span class="badge ${(t.Estado||'').toLowerCase().includes('no') ? 'nodisponible' : 'disponible'}">${t.Estado||'Disponible'}</span>
                <h3>${t.Nombre}</h3>
                <span class="categoria">${t.Fecha||''} ${t.Hora||''}</span>
                <p>${t.DescripcionCorta||''}</p>
            </div>`;
        });
        html += '</div>';
    }

    container.innerHTML = html || '<p class="error">No hay horarios disponibles</p>';
}

// ======================
// SERVICIOS
// ======================
async function loadServicios() {
    const container = document.getElementById('servicios-container');
    const data = await fetchAPI(API.SERVICIOS, 'ch_servicios');

    let html = '<div class="cards-grid">';
    data.forEach(s => {
        html += `
        <div class="card" onclick="showModal('${s.Nombre}', '${s.Categoria||''}', '${s['Descripcion corta']||s.DescripcionCorta||''}', '${s['Descripcion larga']||s.DescripcionLarga||s['Descripcion corta']||''}', '${s.Duracion||s.Duración||''}', '${s.Precio||''}', '${s.Estado||''}')">
            <h3>${s.Nombre}</h3>
            <span class="categoria">${s.Categoria||s.Categoría||''}</span>
            <p>${s['Descripcion corta']||s.DescripcionCorta||''}</p>
        </div>`;
    });
    html += '</div>';
    container.innerHTML = html || '<p class="error">No hay servicios disponibles</p>';
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
            
            ${c.Direccion||c.Dirección ? `
            <div class="info-row">
                <span class="icon">📍</span>
                <div class="text"><strong>Dirección</strong><span>${c.Direccion||c.Dirección}</span></div>
            </div>` : ''}
            
            ${c.Telefono||c.Teléfono ? `
            <div class="info-row">
                <span class="icon">📞</span>
                <div class="text"><strong>Teléfono</strong><a href="tel:${c.Telefono||c.Teléfono}">${c.Telefono||c.Teléfono}</a></div>
            </div>` : ''}
            
            ${c.Email ? `
            <div class="info-row">
                <span class="icon">✉️</span>
                <div class="text"><strong>Email</strong><a href="mailto:${c.Email}">${c.Email}</a></div>
            </div>` : ''}
            
            ${c.Horario ? `
            <div class="info-row">
                <span class="icon">🕰️</span>
                <div class="text"><strong>Horario</strong><span>${c.Horario}</span></div>
            </div>` : ''}
            
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
function showModal(titulo, categoria, descCorta, descLarga, duracion, precio, estado, fecha, hora) {
    const m = document.createElement('div');
    m.className = 'modal-overlay';
    
    const desc = descLarga || descCorta || 'Sin descripción';
    const badgeClass = (estado||'').toLowerCase().includes('no') ? 'nodisponible' : 'disponible';
    const waMsg = encodeURIComponent(`Hola! Me interesa: ${titulo}${precio ? ` - $${precio}` : ''}`);
    
    m.innerHTML = `
        <div class="modal-content">
            <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
            <span class="badge ${badgeClass}">${estado||'Disponible'}</span>
            <h2 class="modal-title">${titulo}</h2>
            
            <div class="modal-info">
                ${categoria ? `<p><span class="label">Categoría</span><span class="value">${categoria}</span></p>` : ''}
                ${duracion ? `<p><span class="label">Duración</span><span class="value">${duracion}</span></p>` : ''}
                ${precio ? `<p><span class="label">Precio</span><span class="value">$${precio}</span></p>` : ''}
                ${fecha ? `<p><span class="label">Fecha</span><span class="value">${fecha}</span></p>` : ''}
                ${hora ? `<p><span class="label">Hora</span><span class="value">${hora}</span></p>` : ''}
            </div>
            
            <p class="modal-desc">${desc}</p>
            
            <a href="https://wa.me/?text=${waMsg}" target="_blank" class="share-btn">💬 Consultar por WhatsApp</a>
        </div>
    `;
    
    document.body.appendChild(m);
    m.addEventListener('click', e => { if (e.target === m) m.remove(); });
    document.addEventListener('keydown', f => { if (f.key === 'Escape') m.remove(); });
}

function registerSW() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('images/sw.js').catch(console.error);
    }
}
