# APP_CONTEXT

## 1. INFORMACIÓN GENERAL
Nombre de la app: Centro Holístico M
Tipo de aplicación: Single Page Application (SPA) / Progressive Web App (PWA)
Objetivo de la app: Proporcionar información sobre horarios de actividades semanales, talleres especiales, servicios holísticos y medios de contacto del Centro Holístico M.

## 2. TECNOLOGÍAS DETECTADAS
Framework: No detectado (Vanilla JavaScript)
Lenguajes: HTML5, CSS3, JavaScript (ES6+)
Librerías: 
- Google Fonts (Cinzel, Montserrat)
- Opensheet (elk.sh) como proxy para Google Sheets API
Herramientas de build: No detectado (Proyecto estático)
Sistema de deploy: Vercel (según historial de desarrollo)

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

## 4. ARCHIVOS PRINCIPALES
- **index.html**: Contiene la estructura base. Incluye contenedores para la sección de Horarios (3 tablas), Servicios y Contacto.
- **script.js**: Lógica de fetching (Google Sheets), mapeo robusto de datos (maneja columnas con nombres variables o 'undefined'), y renderizado de tablas dinámicas.
- **styles.css**: Sistema de diseño premium con aura y partículas. Incluye estilos específicos para tablas responsivas y centrado de slogan en móviles.
- **images/sw.js & manifest.json**: Configuración de PWA para soporte offline y cacheo de activos.

## 5. COMPONENTES O MÓDULOS
- **3-Table Schedule System**:
    1. **Resumen Semanal**: Tabla comparativa de actividades por hora y día.
    2. **Actividades Semanales**: Tabla detallada con Nombre, Categoría, Cupo, Estado y Descripción.
    3. **Talleres Especiales**: Tabla detallada para eventos y talleres únicos.
- **Expanded Detail Popup**: Ventana emergente activada al hacer clic en las filas de las tablas detalladas.
- **Centered Header**: Logo y Slogan perfectamente centrados en todas las resoluciones.
- **Background Aura & Particles**: Decoración dinámica para inmersión estética.

## 6. SECCIONES DE LA APP
- **Horarios**: Consolidada en 3 tablas ordenadas.
- **Servicios**: Catálogo de terapias y clases.
- **Contacto**: Información de contacto y enlace directo a WhatsApp.

## 7. SISTEMA DE DATOS
- **Origen**: Google Sheets.
- **APIs**: `opensheet.elk.sh`.
- **Mapeo**: Función `mapHorarioItem` que busca claves de forma flexible (Nombre, Actividad, Tipo, Categoría, etc.) para evitar errores por cambios en la hoja de cálculo.

## 8. MODELO DE DATOS
**Actividades y Talleres (Flex):**
- Name (Nombre/Actividad/Servicio)
- Categoria (Categoría/Tipo)
- Cupo (Cupos)
- Estado
- DescripcionCorta
- DescripcionLarga (Descripción/Detalle)
- Duracion
- Dia
- Hora (Horario)
- Imagen

## 9. FLUJO DE FUNCIONAMIENTO
1. **Fetch**: Carga paralela de datos desde la API.
2. **Setup**: Se inyecta el slogan en el header y se generan las 3 tablas de horarios.
3. **Interacción**: Clic en filas de tabla → Modal detallado. Clic en nav → Cambio de sección.
4. **Offline**: Service worker sirve activos cacheados si no hay conexión.

## 10. DISEÑO Y UX
- **Mobile First**: Tablas con scroll horizontal y tipografía ajustada.
- **Estética**: Oro sobre negro con gradientes y desenfoques.
- **Consistencia**: Centrado estricto de elementos clave (Slogan, Logo).

## 11. DEPLOY
Vercel / GitHub Pages.

## 12. RESUMEN PARA IA

```json
{
  "app_name": "Centro Holístico M",
  "type": "PWA",
  "stack": ["Vanilla JS", "CSS3", "HTML5"],
  "data_sources": ["Google Sheets via Opensheet"],
  "main_sections": ["Horarios (3 ordered tables)", "Servicios", "Contacto"],
  "main_components": ["ResponsiveTables", "RowClickModals", "CenteredSlogan"],
  "deployment": "Vercel",
  "core_features": ["Robust API Data Mapping", "Weekly Schedule Summary", "Offline Support"]
}
```
