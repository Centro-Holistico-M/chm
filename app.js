const API = {
    HORARIOS: 'https://opensheet.elk.sh/1Tdxx6a3nKK8JmQvL8BwVzJhbFalWcHEAgd07cmt9uG0/Horarios',
    SERVICIOS: 'https://opensheet.elk.sh/1Tdxx6a3nKK8JmQvL8BwVzJhbFalWcHEAgd07cmt9uG0/Servicios',
    CONTACTO: 'https://opensheet.elk.sh/1Tdxx6a3nKK8JmQvL8BwVzJhbFalWcHEAgd07cmt9uG0/Contacto'
};

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const CACHE_DURATION = 3600000; // 1 hora en milisegundos
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 segundo

let loadedTabs = { horarios: false, servicios: false, contacto: false };

document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    initNavigation();
    loadTab('horarios');
    registerSW();
});

// ============================================
// PARTÍCULAS DE FONDO
// ============================================
function initParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    
    const particleCount = 15;
    const createParticle = () => {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        const size = Math.random() * 3 + 2;
        const left = Math.random() * 100;
        const duration = Math.random() * 10 + 10;
        const delay = Math.random() * 5;
        
        particle.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            left: ${left}vw;
            animation-duration: ${duration}s;
            animation-delay: ${delay}s;
        `;
        
        container.appendChild(particle);
        
        setTimeout(() => particle.remove(), (duration + delay) * 1000);
    };
    
    // Crear partículas periódicamente
    for (let i = 0; i < particleCount; i++) {
        setTimeout(createParticle, i * 300);
    }
    
    setInterval(createParticle, 800);
}

function registerSW() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('images/sw.js')
            .then(reg => console.log('SW registrado'))
            .catch(err => console.warn('SW no disponible:', err));
    }
}

// ============================================
// CACHE LOCAL (localStorage)
// ============================================
function getCache(key) {
    try {
        const cached = localStorage.getItem(key);
        if (!cached) return null;
        
        const { data, timestamp } = JSON.parse(cached);
        
        // Verificar si el cache aún es válido
        if (Date.now() - timestamp < CACHE_DURATION) {
            return data;
        }
        
        // Cache expirado
        localStorage.removeItem(key);
        return null;
    } catch (e) {
        return null;
    }
}

function setCache(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify({
            data: data,
            timestamp: Date.now()
        }));
    } catch (e) {
        console.warn('No se pudo guardar cache:', e);
    }
}

// ============================================
// FETCH CON RETRY
// ============================================
async function fetchData(url, cacheKey = null) {
    // 1. Intentar obtener del cache primero
    if (cacheKey) {
        const cached = getCache(cacheKey);
        if (cached) {
            console.log('📦 Usando cache para:', cacheKey);
            return cached;
        }
    }
    
    // 2. Fetch con reintentos
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const res = await fetch(url);
            
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }
            
            const data = await res.json();
            
            if (!Array.isArray(data) || data.length === 0) {
                throw new Error('Datos vacíos');
            }
            
            // 3. Guardar en cache si es exitoso
            if (cacheKey) {
                setCache(cacheKey, data);
            }
            
            return data;
            
        } catch (error) {
            console.warn(`⚠️ Intento ${attempt}/${MAX_RETRIES} falló:`, error.message);
            
            if (attempt < MAX_RETRIES) {
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
            }
        }
    }
    
    // 4. Si todo falla, intentar usar cache aunque esté expirado
    if (cacheKey) {
        try {
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                const { data } = JSON.parse(cached);
                console.log('📦 Usando cache expirado para:', cacheKey);
                return data;
            }
        } catch (e) {}
    }
    
    throw new Error('No se pudo cargar los datos');
}

// ============================================
// NAVEGACIÓN
// ============================================
function initNavigation() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            switchTab(tab);
        });
    });
}

function switchTab(tabName) {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');
    
    if (!loadedTabs[tabName]) {
        loadTab(tabName);
    }
}

async function loadTab(tabName) {
    showLoading(true);
    try {
        switch(tabName) {
            case 'horarios': await loadHorarios(); break;
            case 'servicios': await loadServicios(); break;
            case 'contacto': await loadContacto(); break;
        }
        loadedTabs[tabName] = true;
    } catch (e) {
        console.error('Error cargando:', e);
        showError(tabName);
    }
    showLoading(false);
}

// ============================================
// HORARIOS - 3 TABLAS DESDE API HORARIOS
// ============================================
async function loadHorarios() {
    const container = document.getElementById('horarios-grid');
    const data = await fetchData(API.HORARIOS, 'chm_horarios');
    
    if (!data.length) {
        container.innerHTML = createErrorHTML('No hay horarios disponibles', 'horarios');
        return;
    }
    
    const keys = Object.keys(data[0] || {});
    const hasMatrix = keys.some(k => DAYS.some(d => k.toLowerCase() === d.toLowerCase()));
    
    let html = '';
    
    // TABLA 1: HORARIO SEMANAL
    if (hasMatrix) {
        const rows = data.filter(row => row.Hora || row.Horario);
        if (rows.length) {
            html += createSection('semanal', '📅', 'Horario Semanal', 'Clases disponibles cada día', rows.map(row => ({
                titulo: row.Hora || row.Horario,
                descripcion: DAYS.map(d => row[d] || '-').join(' | '),
                hora: row.Hora || row.Horario,
                dias: DAYS.map(d => ({ dia: d, actividad: row[d] || '' })).filter(d => d.actividad !== '-')
            })).filter(r => r.titulo));
        }
    }
    
    // TABLA 2: ACTIVIDADES
    const actividadesRows = data.filter(row => 
        (row.Nombre || row.NombreActividad) && 
        (row.Categoria || row.Categoría || row['Descripcion corta'] || row.DescripcionCorta)
    );
    if (actividadesRows.length) {
        html += createSection('actividades', '🎯', 'Nuestras Actividades', 'Clases y prácticas del centro', actividadesRows.map(row => ({
            titulo: row.Nombre || row.NombreActividad || 'Actividad',
            descripcion: row['Descripcion corta'] || row.DescripcionCorta || '',
            descripcionLarga: row['Descripcion larga'] || row.DescripcionLarga || row['Descripcion corta'] || row.DescripcionCorta || '',
            categoria: row.Categoria || row.Categoría || '',
            duracion: row.Duracion || row.Duración || '',
            precio: row.Precio || '',
            estado: row.Estado || ''
        })));
    }
    
    // TABLA 3: TALLERES
    const talleresRows = data.filter(row => 
        row.Taller || row.Evento || row.Nombre?.toLowerCase().includes('taller') || row.Nombre?.toLowerCase().includes('evento')
    );
    if (talleresRows.length) {
        html += createSection('talleres', '📚', 'Talleres y Eventos', 'Eventos especiales y talleres', talleresRows.map(row => ({
            titulo: row.Nombre || row.Taller || row.Evento || 'Taller',
            descripcion: row['Descripcion corta'] || row.DescripcionCorta || '',
            descripcionLarga: row['Descripcion larga'] || row.DescripcionLarga || '',
            fecha: row.Fecha || row.Dia || row.Día || '',
            hora: row.Hora || row.Horario || '',
            precio: row.Precio || '',
            estado: row.Estado || ''
        })));
    }
    
    if (!html) {
        html = createErrorHTML('No se pudieron cargar los horarios', 'horarios');
    }
    
    container.innerHTML = html;
    attachCardListeners(container);
}

function createSection(id, icon, titulo, desc, items) {
    if (!items || !items.length) return '';
    const cards = items.map((item, idx) => createCard(item, idx)).join('');
    return `
        <div class="schedule-section">
            <h3 class="section-subtitle">${icon} ${titulo}</h3>
            <p class="section-desc">${desc}</p>
            <div class="grid">${cards}</div>
        </div>
    `;
}

function createCard(item, idx = 0) {
    const info = {
        titulo: item.titulo || item.Nombre || item.NombreActividad || 'Actividad',
        descripcion: item.descripcionLarga || item.descripcion || '',
        categoria: item.categoria || item.Categoria || item.Categoría || '',
        duracion: item.duracion || item.Duracion || item.Duración || '',
        precio: item.precio || item.Precio || '',
        hora: item.hora || item.Hora || item.Horario || '',
        fecha: item.fecha || item.Fecha || item.Dia || item.Día || '',
        estado: item.estado || item.Estado || ''
    };
    
    return `
        <div class="card-item" data-info='${escapeHtml(JSON.stringify(info))}' style="animation-delay: ${idx * 0.05}s">
            <span class="badge ${normalizeStatus(info.estado)}">${info.estado || 'Disponible'}</span>
            <h3>${info.titulo}</h3>
            <p>${info.descripcion}</p>
            <div class="meta">
                ${info.categoria ? `<span>${info.categoria}</span>` : ''}
                ${info.duracion ? `<span>${info.duracion}</span>` : ''}
                ${info.precio ? `<span>$${info.precio}</span>` : ''}
            </div>
        </div>
    `;
}

// ============================================
// SERVICIOS
// ============================================
async function loadServicios() {
    const grid = document.getElementById('servicios-grid');
    const data = await fetchData(API.SERVICIOS, 'chm_servicios');
    
    if (!data.length) {
        grid.innerHTML = createErrorHTML('No hay servicios disponibles', 'servicios');
        return;
    }
    
    const html = data.map((item, idx) => {
        const info = {
            titulo: item.Nombre || 'Servicio',
            descripcion: item['Descripcion larga'] || item.DescripcionLarga || item['Descripcion corta'] || item.DescripcionCorta || '',
            categoria: item.Categoria || item.Categoría || '',
            duracion: item.Duracion || item.Duración || '',
            precio: item.Precio || '',
            estado: item.Estado || ''
        };
        
        return `
            <div class="card-item" data-info='${escapeHtml(JSON.stringify(info))}' style="animation-delay: ${idx * 0.05}s">
                <span class="badge ${normalizeStatus(info.estado)}">${info.estado || 'Disponible'}</span>
                <h3>${info.titulo}</h3>
                <p>${item['Descripcion corta'] || item.DescripcionCorta || ''}</p>
                <div class="meta">
                    <span>${info.duracion}</span>
                    <span>${info.precio ? '$' + info.precio : ''}</span>
                </div>
            </div>
        `;
    }).join('');
    
    grid.innerHTML = html;
    attachCardListeners(grid);
}

// ============================================
// CONTACTO
// ============================================
async function loadContacto() {
    const card = document.getElementById('contacto-card');
    const sloganEl = document.getElementById('slogan');
    const data = await fetchData(API.CONTACTO, 'chm_contacto');
    
    if (!data.length) {
        card.innerHTML = createErrorHTML('No hay información de contacto', 'contacto');
        return;
    }
    
    const c = data[0];
    
    if (c.Slogan) {
        sloganEl.textContent = c.Slogan;
        sloganEl.classList.add('visible');
    }
    
    const tel = c.Telefono || c.Teléfono || '';
    const wa = (c.WhatsApp || '').replace(/\D/g, '');
    const email = c.Email || '';
    const dir = c.Direccion || c.Dirección || '';
    const hor = c.Horario || c.HorarioAtencion || '';
    
    const redes = [];
    if (c.Instagram) redes.push({ nombre: 'instagram', url: c.Instagram, icono: '📷' });
    if (c.Facebook) redes.push({ nombre: 'facebook', url: c.Facebook, icono: '📘' });
    if (c.YouTube || c.Youtube) redes.push({ nombre: 'youtube', url: c.YouTube || c.Youtube, icono: '▶️' });
    if (c.TikTok) redes.push({ nombre: 'tiktok', url: c.TikTok, icono: '🎵' });
    
    const redesHtml = redes.length ? `
        <div class="social-links">
            ${redes.map(r => `<a href="${r.url}" target="_blank" class="social-btn" title="${r.nombre}">${r.icono}</a>`).join('')}
        </div>
    ` : '';
    
    card.innerHTML = `
        <p><strong>📍 Dirección:</strong> ${dir}</p>
        <p><strong>📞 Teléfono:</strong> <a href="tel:${tel}">${tel}</a></p>
        <p><strong>✉️ Email:</strong> <a href="mailto:${email}">${email}</a></p>
        <p><strong>🕰️ Horario:</strong> ${hor}</p>
        ${redesHtml}
        ${wa ? `<a href="https://wa.me/${wa}" target="_blank" class="btn-whatsapp">WhatsApp</a>` : ''}
    `;
}

// ============================================
// UTILIDADES
// ============================================
function attachCardListeners(container) {
    container.querySelectorAll('.card-item').forEach(card => {
        card.addEventListener('click', () => {
            const data = JSON.parse(card.dataset.info);
            showModal(data);
        });
    });
}

function normalizeStatus(s) {
    if (!s) return 'disponible';
    s = s.toString().toLowerCase();
    if (s.includes('no') || s.includes('cerrado') || s.includes('agotado')) return 'nodisponible';
    if (s.includes('prox') || s.includes('próxim') || s.includes('pronto')) return 'proximamente';
    return 'disponible';
}

function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

// ============================================
// MODAL
// ============================================
function showModal(data) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    
    const estado = normalizeStatus(data.estado);
    const estadoTexto = estado === 'disponible' ? 'Disponible' : estado === 'nodisponible' ? 'No disponible' : 'Próximamente';
    
    let infoHtml = '';
    if (data.categoria) infoHtml += createInfoRow('Categoría', data.categoria);
    if (data.duracion) infoHtml += createInfoRow('Duración', data.duracion);
    if (data.precio) infoHtml += createInfoRow('Precio', '$' + data.precio);
    if (data.hora) infoHtml += createInfoRow('Hora', data.hora);
    if (data.fecha) infoHtml += createInfoRow('Fecha', data.fecha);
    
    modal.innerHTML = `
        <div class="modal-content">
            <button class="modal-close">&times;</button>
            <span class="badge ${estado}">${estadoTexto}</span>
            <h2 class="modal-title">${data.titulo}</h2>
            ${infoHtml ? `<div class="modal-info">${infoHtml}</div>` : ''}
            <p class="modal-desc">${data.descripcion || 'Sin descripción disponible.'}</p>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(modal); });
    modal.querySelector('.modal-close').addEventListener('click', () => closeModal(modal));
    document.addEventListener('keydown', function handleEscape(e) {
        if (e.key === 'Escape') { closeModal(modal); document.removeEventListener('keydown', handleEscape); }
    });
    
    requestAnimationFrame(() => modal.classList.add('active'));
}

function createInfoRow(label, value) {
    if (!value) return '';
    return `<div class="info-row"><span class="info-label">${label}</span><span class="info-value">${value}</span></div>`;
}

function closeModal(modal) {
    modal.classList.remove('active');
    setTimeout(() => modal.remove(), 300);
}

// ============================================
// LOADING Y ERRORES
// ============================================
function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'flex' : 'none';
}

function createErrorHTML(message, tabName) {
    return `
        <div class="error-container">
            <p class="error-msg">${message}</p>
            <p class="error-submsg">Verifica tu conexión a internet</p>
            <button class="retry-btn" onclick="retryLoad('${tabName}')">Reintentar</button>
        </div>
    `;
}

function showError(tabName) {
    const el = document.getElementById(tabName + '-grid') || document.getElementById(tabName + '-card');
    if (el) el.innerHTML = createErrorHTML('Error al cargar los datos', tabName);
}

// Función global para retry
window.retryLoad = function(tabName) {
    loadedTabs[tabName] = false;
    loadTab(tabName);
};
