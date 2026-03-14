const API = {
    HORARIOS: 'https://opensheet.elk.sh/1Tdxx6a3nKK8JmQvL8BwVzJhbFalWcHEAgd07cmt9uG0/Horarios',
    AGENDA: 'https://opensheet.elk.sh/1Tdxx6a3nKK8JmQvL8BwVzJhbFalWcHEAgd07cmt9uG0/Agenda',
    SERVICIOS: 'https://opensheet.elk.sh/1Tdxx6a3nKK8JmQvL8BwVzJhbFalWcHEAgd07cmt9uG0/Servicios',
    CONTACTO: 'https://opensheet.elk.sh/1Tdxx6a3nKK8JmQvL8BwVzJhbFalWcHEAgd07cmt9uG0/Contacto'
};

const CACHE_DURATION = 3600000;
let cachedSlogan = '';
let cachedWhatsApp = '';

document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    initNavigation();
    loadTab('horarios');
    loadSlogan();
    loadWhatsApp();
    registerSW();
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
        const infoExtra = a.Cupo ? `<span class="cupo">Cupo: ${a.Cupo}</span>` : '';
        html += `<div class="timeline-card" data-titulo="${a.Nombre}" data-categoria="${a.Categoria||''}" data-desc="${descLarga}" data-duracion="${a.Duracion||''}" data-estado="${a.Estado||''}" data-hora="${a.Hora||''}" data-cupo="${a.Cupo||''}">
            <div class="timeline-hora">${a.Hora||''}</div>
            <div class="timeline-content">
                <span class="categoria-tag ${colorClass}">${a.Categoria||'Actividad'}</span>
                <h3>${a.Nombre}</h3>
                ${descCorta ? `<p class="timeline-desc">${descCorta}</p>` : ''}
                <span class="badge ${(a.Estado||'').toLowerCase().includes('no') ? 'nodisponible' : 'disponible'}">${a.Estado||'Disponible'}</span> ${infoExtra}
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
    return '';
}

async function loadHorarios() {
    const container = document.getElementById('horarios-container');
    const [horarios, agenda] = await Promise.all([
        fetchAPI(API.HORARIOS, 'ch_horarios'),
        fetchAPI(API.AGENDA, 'ch_agenda')
    ]);
    
    const diasSemana = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
    const diasCorto = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    
    // Limpiar array global
    todasActividadesGlobal.length = 0;
    
    // Procesar hoja Agenda
    if (agenda && agenda.length > 0) {
        agenda.forEach(row => {
            if (!row.Nombre) return;
            
            // Si tiene Fecha o es Evento/Taller -> es evento especial
            if (row.Tipo === 'Evento' || row.Tipo === 'Taller' || row.Fecha) {
                // Ya se maneja después como eventos
            } else if (row.Tipo === 'Actividad' || !row.Tipo) {
                // Es actividad regular - puede tener múltiples horas separadas por espacio
                const horas = (row.Hora||'').split(/\s+/).filter(h => h);
                const dia = (row.Dia||'').toLowerCase();
                
                horas.forEach(hora => {
                    if (dia && hora) {
                        todasActividadesGlobal.push({
                            Nombre: row.Nombre,
                            Dia: dia,
                            Hora: hora,
                            Categoria: row.Categoria||'Actividad',
                            Estado: row.Estado||'Disponible',
                            Duracion: row.Duracion,
                            Cupo: row.Cupo,
                            DescripcionCorta: row.DescripcionCorta,
                            DescripcionLarga: row.DescripcionLarga
                        });
                    }
                });
            }
        });
    }
    
    // También procesar hoja Horarios (estructura clásica: Hora, lunes, martes...)
    if (horarios && horarios.length > 1) {
        const headerRow = horarios[0];
        const allKeys = Object.keys(headerRow);
        const horaKey = allKeys.find(k => k.toLowerCase().includes('hora'));
        
        for (let i = 1; i < horarios.length; i++) {
            const row = horarios[i];
            if (!row) continue;
            const hora = horaKey ? row[horaKey] : Object.values(row)[0];
            if (!hora) continue;
            
            diasSemana.forEach((dia) => {
                const diaKey = allKeys.find(k => k.toLowerCase().includes(dia));
                if (diaKey && row[diaKey]) {
                    todasActividadesGlobal.push({
                        Nombre: row[diaKey],
                        Dia: dia,
                        Hora: hora,
                        Categoria: 'Actividad',
                        Estado: 'Disponible'
                    });
                }
            });
        }
    }
    
    // Generar HTML
    let html = '<h3 class="section-subtitle">📅 Horario Semanal</h3>';
    html += '<div class="dias-selector">';
    diasSemana.forEach((dia, idx) => {
        const tieneActividades = todasActividadesGlobal.some(a => a.Dia === dia);
        html += `<button class="dia-btn" data-dia="${dia}"><span class="dia-nombre">${diasCorto[idx]}</span><span class="dia-punto ${tieneActividades ? 'active' : ''}"></span></button>`;
    });
    html += '</div>';
    html += '<div id="timeline-container" class="timeline-list"></div>';
    
    // Eventos y Talleres
    const eventos = agenda?.filter(r => r.Nombre && (r.Tipo === 'Taller' || r.Tipo === 'Evento' || r.Fecha)) || [];
    if (eventos.length) {
        html += '<h3 class="section-subtitle">📚 Talleres y Eventos</h3>';
        html += '<div class="cards-grid">';
        eventos.forEach(t => {
            const descLarga = t.DescripcionLarga || t.DescripcionCorta || '';
            const estadoClass = (t.Estado||'').toLowerCase().includes('no') ? 'nodisponible' : 'disponible';
            const infoExtra = t.Cupo ? `<span class="cupo">Cupo: ${t.Cupo}</span>` : '';
            html += `<div class="card" data-titulo="${t.Nombre}" data-categoria="${t.Categoria||''}" data-desc="${descLarga}" data-precio="${t.Precio||''}" data-duracion="${t.Duracion||''}" data-estado="${t.Estado||''}" data-fecha="${t.Fecha||''}" data-hora="${t.Hora||''}" data-cupo="${t.Cupo||''}" data-tipo="taller">
                <span class="badge evento">✨ ${t.Tipo||'Evento'}</span>
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
    
    container.querySelectorAll('.dia-btn').forEach(btn => {
        btn.addEventListener('click', () => cambiarDia(btn.dataset.dia));
    });
    
    requestAnimationFrame(() => {
        setTimeout(() => {
            const timelineContainer = document.getElementById('timeline-container');
            if (timelineContainer) {
                cambiarDia('lunes');
            }
        }, 200);
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
    
    m.innerHTML = `
        <div class="modal-content">
            <button class="modal-close">&times;</button>
            ${datos.estado ? `<span class="badge ${badgeClass}">${datos.estado}</span>` : ''}
            <h2 class="modal-title">${datos.titulo}</h2>
            ${infoHtml ? `<div class="modal-info">${infoHtml}</div>` : ''}
            <p class="modal-desc">${datos.descripcion || 'Sin descripción disponible.'}</p>
            <div class="modal-buttons">
                <a href="#contacto" class="share-btn btn-contacto">📞 Ir a Contacto</a>
                <a href="${waNumero ? 'https://wa.me/' + waNumero + '?text=' + waMsg : '#'}" target="_blank" class="share-btn wa-btn">💬 WhatsApp</a>
            </div>
        </div>
    `;
    
    document.body.appendChild(m);
    
    m.querySelector('.modal-close').addEventListener('click', () => m.remove());
    m.querySelector('.btn-contacto').addEventListener('click', () => {
        m.remove();
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        document.querySelector('[data-tab="contacto"]').classList.add('active');
        document.getElementById('contacto').classList.add('active');
        loadTab('contacto');
    });
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

    let html = '<div class="cards-grid">';
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
    if (c.Instagram) redes += `<a href="${c.Instagram}" target="_blank" title="Instagram">📷</a>`;
    if (c.Facebook) redes += `<a href="${c.Facebook}" target="_blank" title="Facebook">📘</a>`;
    if (c.YouTube||c.Youtube) redes += `<a href="${c.YouTube||c.Youtube}" target="_blank" title="YouTube">▶️</a>`;
    if (c.TikTok) redes += `<a href="${c.TikTok}" target="_blank" title="TikTok">🎵</a>`;

    container.innerHTML = `
        <div class="contacto-card">
            <h2>Comunícate Conmigo</h2>
            
            ${c.Ciudad || c.Estado || (c.Direccion||c.Dirección) ? `<div class="info-row"><span class="icon">📍</span><div class="text">${c.Direccion||c.Dirección ? `<strong>Dirección:</strong> ${c.Direccion||c.Dirección}` : ''}${c.Ciudad ? `<br><strong>Ciudad:</strong> ${c.Ciudad}` : ''}${c.Estado ? `<br><strong>Estado:</strong> ${c.Estado}` : ''}</div></div>` : ''}
            ${c.Telefono||c.Teléfono ? `<div class="info-row"><span class="icon">📞</span><div class="text"><strong>Teléfono:</strong> <a href="tel:${c.Telefono||c.Teléfono}">${c.Telefono||c.Teléfono}</a></div></div>` : ''}
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
