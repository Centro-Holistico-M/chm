// URLs de las APIs
const API_URLS = {
    horarios: 'https://opensheet.elk.sh/1Tdxx6a3nKK8JmQvL8BwVzJhbFalWcHEAgd07cmt9uG0/Horarios',
    servicios: 'https://opensheet.elk.sh/1Tdxx6a3nKK8JmQvL8BwVzJhbFalWcHEAgd07cmt9uG0/Servicios',
    contacto: 'https://opensheet.elk.sh/1Tdxx6a3nKK8JmQvL8BwVzJhbFalWcHEAgd07cmt9uG0/Contacto'
};

// Estado de la aplicación
const app = {
    data: {
        horarios: [],
        servicios: [],
        contacto: {}
    },
    currentSection: 'horarios'
};

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    loadAllData();
});

// Configurar navegación
function setupNavigation() {
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const section = btn.dataset.section;
            switchSection(section);
            
            // Actualizar active state
            navBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

// Cambiar sección
function switchSection(sectionName) {
    // Ocultar todas las secciones
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.classList.remove('active'));
    
    // Mostrar la sección seleccionada
    const selectedSection = document.getElementById(sectionName);
    if (selectedSection) {
        selectedSection.classList.add('active');
    }
    
    app.currentSection = sectionName;
}

// Cargar todos los datos
async function loadAllData() {
    try {
        await Promise.all([
            loadHorarios(),
            loadServicios(),
            loadContacto()
        ]);
    } catch (error) {
        console.error('Error cargando datos:', error);
    }
}

// Cargar horarios
async function loadHorarios() {
    try {
        const response = await fetch(API_URLS.horarios);
        const data = await response.json();
        app.data.horarios = data;
        renderHorarios(data);
    } catch (error) {
        console.error('Error cargando horarios:', error);
        document.getElementById('horarios-container').innerHTML = 
            '<div class="loading" style="color: red;">Error al cargar horarios</div>';
    }
}

// Renderizar horarios
function renderHorarios(horarios) {
    const container = document.getElementById('horarios-container');
    
    if (horarios.length === 0) {
        container.innerHTML = '<div class="loading">No hay horarios disponibles</div>';
        return;
    }
    
    // Agrupar horarios por día
    const horariosPorDía = {};
    horarios.forEach(h => {
        if (h.Día) {
            if (!horariosPorDía[h.Día]) {
                horariosPorDía[h.Día] = [];
            }
            horariosPorDía[h.Día].push(h);
        }
    });
    
    const diasOrden = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    let html = '';
    
    diasOrden.forEach(día => {
        if (horariosPorDía[día]) {
            horariosPorDía[día].forEach(horario => {
                html += crearTarjetaHorario(día, horario);
            });
        }
    });
    
    // Agregar talleres especiales (sin día)
    if (horariosPorDía['']) {
        horariosPorDía[''].forEach(horario => {
            html += crearTarjetaHorario('Taller Especial', horario);
        });
    }
    
    container.innerHTML = html;
}

// Crear tarjeta de horario
function crearTarjetaHorario(día, horario) {
    const fecha = horario.Fecha ? `<span style="font-size: 12px; color: #999;">Fecha: ${horario.Fecha}</span>` : '';
    return `
        <div class="horario-card">
            <div class="horario-dia">${día}</div>
            <div class="horario-hora">${horario.Hora}</div>
            <div class="horario-actividad">${horario.Actividad}</div>
            <div class="horario-descripcion">${horario.Descripcion}</div>
            <div class="horario-info">
                <span class="horario-estado">${horario.Estado}</span>
                <span>Cupos: ${horario.Cupos}</span>
            </div>
            ${fecha}
        </div>
    `;
}

// Cargar servicios
async function loadServicios() {
    try {
        const response = await fetch(API_URLS.servicios);
        const data = await response.json();
        app.data.servicios = data;
        renderServicios(data);
    } catch (error) {
        console.error('Error cargando servicios:', error);
        document.getElementById('servicios-container').innerHTML = 
            '<div class="loading" style="color: red;">Error al cargar servicios</div>';
    }
}

// Renderizar servicios
function renderServicios(servicios) {
    const container = document.getElementById('servicios-container');
    
    if (servicios.length === 0) {
        container.innerHTML = '<div class="loading">No hay servicios disponibles</div>';
        return;
    }
    
    let html = '';
    servicios.forEach(servicio => {
        html += `
            <div class="servicio-card">
                <div class="servicio-nombre">${servicio.Nombre}</div>
                <span class="servicio-categoria">${servicio.Categoria}</span>
                <div class="servicio-corta">${servicio.DescripcionCorta}</div>
                <div class="servicio-descripcion">${servicio.DescripcionCompleta}</div>
                <div class="servicio-footer">
                    <span class="servicio-duracion">⏱️ ${servicio.Duracion}</span>
                    <span class="servicio-precio">$${servicio.Precio}</span>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Cargar contacto
async function loadContacto() {
    try {
        const response = await fetch(API_URLS.contacto);
        const data = await response.json();
        if (data.length > 0) {
            const contactoData = data[0];
            app.data.contacto = contactoData;
            renderContacto(contactoData);
        }
    } catch (error) {
        console.error('Error cargando contacto:', error);
        document.getElementById('contacto-container').innerHTML = 
            '<div class="loading" style="color: red;">Error al cargar información de contacto</div>';
    }
}

// Renderizar contacto
function renderContacto(contacto) {
    // Actualizar header con logo y slogan
    if (contacto.Logo) {
        const logoImg = document.getElementById('logo');
        // Convertir link de Google Drive a formato de descarga directa
        const logoUrl = convertGoogleDriveUrl(contacto.Logo);
        logoImg.src = logoUrl;
    }
    
    if (contacto.Nombre) {
        document.getElementById('nombre-centro').textContent = contacto.Nombre;
    }
    
    if (contacto.Slogan) {
        document.getElementById('slogan').textContent = contacto.Slogan;
    }
    
    // Renderizar información de contacto
    const container = document.getElementById('contacto-container');
    
    const redesSociales = `
        ${contacto.WhatsApp ? `<a href="https://wa.me/52${contacto.WhatsApp}" class="red-social" title="WhatsApp">💬</a>` : ''}
        ${contacto.Email ? `<a href="mailto:${contacto.Email}" class="red-social" title="Email">✉️</a>` : ''}
        ${contacto.Telefono ? `<a href="tel:${contacto.Telefono}" class="red-social" title="Teléfono">📞</a>` : ''}
        ${contacto.Instagram ? `<a href="${contacto.Instagram}" target="_blank" class="red-social" title="Instagram">📷</a>` : ''}
        ${contacto.Facebook ? `<a href="${contacto.Facebook}" target="_blank" class="red-social" title="Facebook">f</a>` : ''}
        ${contacto.Youtube ? `<a href="${contacto.Youtube}" target="_blank" class="red-social" title="YouTube">▶️</a>` : ''}
    `;
    
    const mapaUrl = contacto.MapaURL ? contacto.MapaURL : '';
    const mapaIframe = contacto.MapaURL ? 
        `<iframe src="${mapaUrl.replace('maps.app.goo.gl', 'www.google.com/maps')}" width="100%" height="300" style="border: none; border-radius: 10px;"></iframe>` : 
        '';
    
    const html = `
        <div class="contacto-info">
            <div class="contacto-item">
                <span class="contacto-label">Nombre:</span>
                <span class="contacto-valor">${contacto.Nombre}</span>
            </div>
            
            <div class="contacto-item">
                <span class="contacto-label">Teléfono:</span>
                <span class="contacto-valor"><a href="tel:${contacto.Telefono}">${contacto.Telefono}</a></span>
            </div>
            
            <div class="contacto-item">
                <span class="contacto-label">WhatsApp:</span>
                <span class="contacto-valor"><a href="https://wa.me/52${contacto.WhatsApp}">+52 ${contacto.WhatsApp}</a></span>
            </div>
            
            <div class="contacto-item">
                <span class="contacto-label">Email:</span>
                <span class="contacto-valor"><a href="mailto:${contacto.Email}">${contacto.Email}</a></span>
            </div>
            
            <div class="contacto-item">
                <span class="contacto-label">Dirección:</span>
                <span class="contacto-valor">${contacto.Direccion}, ${contacto.Ciudad}, ${contacto.Estado}</span>
            </div>
            
            <div class="contacto-item">
                <span class="contacto-label">Horarios:</span>
                <span class="contacto-valor">${contacto.HorarioAtencion}</span>
            </div>
            
            <div class="contacto-redes">
                ${redesSociales}
            </div>
        </div>
        
        <div class="contacto-mapa">
            ${mapaIframe || '<div class="loading">Mapa no disponible</div>'}
        </div>
    `;
    
    container.innerHTML = html;
}

// Convertir URL de Google Drive a URL descargable
function convertGoogleDriveUrl(url) {
    const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)\//);
    if (fileIdMatch) {
        return `https://drive.google.com/uc?export=view&id=${fileIdMatch[1]}`;
    }
    return url;
}
