# APP_RULES

Reglas para cualquier IA o desarrollador que modifique la app **Centro
Holístico M**.

------------------------------------------------------------------------

## 1. CONTEXTO OBLIGATORIO

Antes de modificar la aplicación se debe leer completamente:

APP_CONTEXT.md

Este archivo describe la arquitectura real del proyecto.

------------------------------------------------------------------------

## 2. ARQUITECTURA

La aplicación usa:

HTML\
CSS\
Vanilla JavaScript

No introducir frameworks como:

React\
Vue\
Angular

A menos que el usuario lo solicite.

------------------------------------------------------------------------

## 3. ESTRUCTURA DEL PROYECTO

Mantener la estructura actual:

CHM index.html script.js styles.css /images AI

No mover archivos sin motivo claro.

------------------------------------------------------------------------

## 4. SISTEMA DE DATOS

Los datos provienen de **Google Sheets**.

Se usa la API:

https://opensheet.elk.sh

Reglas:

-   No cambiar el sistema de fetch sin autorización
-   Horarios y talleres vienen de la misma tabla
-   Respetar los campos existentes

------------------------------------------------------------------------

## 5. DISEÑO

Mantener siempre:

modo oscuro\
estética premium\
mobile first

Colores principales:

#070707\
#d4af37

Tipografías:

Cinzel\
Montserrat

------------------------------------------------------------------------

## 6. COMPONENTES IMPORTANTES

No eliminar sin autorización:

Splash Screen\
Sticky Header\
Day Tabs\
Carousel de tarjetas\
Modal expandido\
Fondo de partículas / aura

Las mejoras deben extenderlos, no reemplazarlos.

------------------------------------------------------------------------

## 7. RENDIMIENTO

Prioridades:

carga rápida\
JavaScript ligero\
animaciones optimizadas\
compatibilidad móvil

Evitar librerías pesadas.

------------------------------------------------------------------------

## 8. CAMBIOS DE CÓDIGO

Antes de modificar código se debe:

1.  explicar la mejora
2.  mostrar el código nuevo
3.  indicar dónde colocarlo

No eliminar funciones existentes sin explicación.

------------------------------------------------------------------------

## 9. NUEVAS FUNCIONES

Las nuevas funciones deben:

integrarse con el sistema actual\
respetar el diseño existente\
no romper la sección de horarios

------------------------------------------------------------------------

## 10. DEPLOY

La app está desplegada en **Vercel** como sitio estático.

No agregar backend sin autorización.

------------------------------------------------------------------------

## 11. REGLA FINAL

Si existe duda sobre una modificación importante:

preguntar antes de cambiar la arquitectura.
