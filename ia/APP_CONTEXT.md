# APP_CONTEXT

## 1. INFORMACIÓN GENERAL

Nombre de la app: Centro Holístico M

Tipo de aplicación:
Single Page Application (SPA) con capacidades de Progressive Web App (PWA).

Objetivo de la app:
Servir como plataforma digital del Centro Holístico M para mostrar actividades semanales, talleres especiales, servicios holísticos y facilitar el contacto con la comunidad.

Pantalla inicial:
La aplicación abre directamente en la sección **Horarios**.

---

## 2. TECNOLOGÍAS DETECTADAS

Framework:
No detectado (Vanilla JavaScript)

Lenguajes:
- HTML5
- CSS3
- JavaScript (ES6+)

Librerías externas:
- Google Fonts (Cinzel, Montserrat)

Servicios externos:
- Google Sheets como base de datos
- Opensheet API (`opensheet.elk.sh`) como proxy para obtener datos en JSON

Herramientas de build:
No detectado (proyecto estático)

Sistema de deploy:
Vercel

---

## 3. ESTRUCTURA DEL PROYECTO
/CHM
index.html
script.js
styles.css
/images
logo.png
icon-192.png
icon-512.png
manifest.json
sw.js
/.git

---

## 4. ARCHIVOS PRINCIPALES

**index.html**

Punto de entrada de la aplicación.  
Define la estructura base de las secciones y los contenedores donde se renderiza el contenido dinámico.

**script.js**

Archivo principal de lógica de la app.  
Responsabilidades:

- obtener datos desde Google Sheets
- renderizar actividades, talleres y servicios
- controlar navegación entre secciones
- manejar interacción del usuario
- registrar el Service Worker

**styles.css**

Define el sistema visual:

- colores
- tipografías
- layout
- animaciones
- responsividad
- efectos visuales (aura, partículas)

**images/sw.js**

Service Worker encargado de:

- cachear recursos estáticos
- permitir funcionamiento offline
- optimizar carga de recursos

**images/manifest.json**

Configuración de la PWA:

- iconos de instalación
- nombre de la app
- comportamiento tipo app móvil

---

## 5. COMPONENTES O MÓDULOS PRINCIPALES

Splash Screen  
Pantalla inicial con animación del logo.

Sticky Header  
Barra superior fija con el logo y navegación entre secciones.

Navigation System  
Botones que cambian entre secciones de la aplicación.

Day Tabs  
Selector de días para filtrar las actividades semanales.

Carousel System  
Sistema de tarjetas desplazables horizontalmente para mostrar actividades y talleres.

Expanded Card / Modal  
Ventana emergente que muestra información completa de una actividad o servicio.

Particle & Aura Background  
Sistema visual de partículas y gradientes animados que refuerza la estética holística.

---

## 6. SECCIONES DE LA APP

Horarios

Contiene:

Actividades Semanales  
Clases recurrentes organizadas por día de la semana.

Talleres Especiales  
Eventos con fecha específica.

Servicios

Listado de servicios holísticos ofrecidos por el centro con:

- descripción
- duración
- inversión

Contacto

Información para contactar al centro:

- dirección
- teléfono
- correo
- botón directo a WhatsApp
- redes sociales

---

## 7. SISTEMA DE DATOS

Origen de datos:
Google Sheets.

Acceso a datos:
Proxy API:

https://opensheet.elk.sh

Los datos se consumen como JSON.

Carga de datos:

Se realiza mediante `fetch()` en `script.js` durante el evento:

`DOMContentLoaded`

Estructura de datos:

Los **Horarios y Talleres provienen de la misma hoja y misma tabla de Google Sheets**.

Otros datos cargados:

- Servicios
- Contacto

---

## 8. MODELO DE DATOS

### Horarios (Actividades y Talleres)

Campos detectados:

- Nombre / Actividad
- Descripción
- DescripciónCorta
- Día
- Hora
- Cupo
- Estado
- Tipo (Actividad o Taller)
- Fecha (principalmente para talleres)
- Duración
- Inversión / Precio
- Imagen

---

### Servicios

Campos detectados:

- Nombre
- Descripción
- Precio
- Duración
- Imagen

---

### Contacto

Campos detectados:

- Dirección
- Teléfono
- Correo
- Horario de atención
- Slogan
- WhatsApp

---

## 9. FLUJO DE FUNCIONAMIENTO

1. Apertura de la app  
Se muestra el Splash Screen.

2. Inicialización  
Se activan los sistemas visuales (partículas y aura).

3. Carga de datos  
Se realizan peticiones `fetch` a Google Sheets.

4. Renderizado inicial  
Se muestra la sección **Horarios**.

5. Filtrado automático  
Se muestran primero las actividades del día actual.

6. Interacción del usuario

El usuario puede:

- cambiar el día para ver otras actividades
- navegar a Servicios o Contacto
- abrir tarjetas para ver información completa

7. Modal

Al seleccionar una tarjeta:

- aparece un overlay
- se abre un modal con información completa.

---

## 10. DISEÑO Y UX

Estética general:

- estilo premium
- modo oscuro dominante

Paleta principal:

- Negro profundo `#070707`
- Dorado `#d4af37`

Tipografías:

- Cinzel
- Montserrat

Principios de diseño:

Mobile First  
Optimizado para navegación táctil.

Glassmorphism  
Tarjetas con fondo translúcido y blur.

Microinteracciones  
Animaciones suaves en botones y tarjetas.

Experiencia inmersiva  
Uso de partículas y efectos de aura.

---

## 11. DEPLOY

Sistema de despliegue:

Vercel

Tipo de proyecto:

Sitio web estático.

---

## 12. RESUMEN PARA IA

```json
{
  "app_name": "Centro Holístico M",
  "type": "SPA con capacidades PWA",
  "stack": [
    "HTML5",
    "CSS3",
    "Vanilla JavaScript",
    "Google Fonts"
  ],
  "data_sources": [
    "Google Sheets",
    "Opensheet API (opensheet.elk.sh)"
  ],
  "main_sections": [
    "Horarios",
    "Servicios",
    "Contacto"
  ],
  "main_components": [
    "Splash Screen",
    "Sticky Header",
    "Day Tabs",
    "Carousel Cards",
    "Expanded Modal",
    "Particle Background"
  ],
  "deployment": "Vercel",
  "core_features": [
    "Visualización dinámica de horarios",
    "Gestión de contenido desde Google Sheets",
    "Soporte offline mediante Service Worker",
    "Interfaz móvil inmersiva"
  ]
}