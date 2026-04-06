# En Territorio Verde - Emisora Radio CAS

Proyecto web moderno para la emisora institucional de la Corporación Autónoma Regional de Santander (CAS).

## 🚀 Arquitectura y Tecnologías
- **Frontend**: HTML5, JavaScript (ES6+ Modular), CSS3 con Custom Properties.
- **Backend**: PHP 8.x (Apache / XAMPP).
- **Datos**: JSON persistentes en la carpeta `/data`.

## 🛠 Estructura del Proyecto
- `/Administrador`: Panel de control para gestionar contenidos de forma dinámica.
- `/css`: Estilos unificados en `styles.css` usando un sistema de diseño modular.
- `/data`: Archivos `config.json` para cada sección (Inicio, Nosotros, Programación, Contacto).
- `/js`: Lógica principal en `main.js` organizada bajo el objeto global `RadioApp`.
- `/img`: Directorio de recursos visuales y logos.

## 🌟 Buenas Prácticas Implementadas
1. **CSS Variables**: Todo el sistema de colores y tipografía se gestiona desde el `:root` de `styles.css` para cambios rápidos de marca.
2. **JS Modular (RadioApp)**: La lógica se encuentra encapsulada en un objeto principal para evitar conflictos en el espacio global y facilitar la depuración.
3. **Carga Dinámica**: Los contenidos no están "quemados" en el HTML, sino que se cargan desde JSON, permitiendo actualizaciones sin tocar código.
4. **Resilencia de Audio**: El motor de audio persiste el estado (Play/Pause) entre navegaciones usando `localStorage`.
5. **SEO & Performance**: Uso de etiquetas semánticas, lazy loading para imágenes e iframes, y versionamiento de caché (`?v=N`).

© 2026 En Territorio Verde · Corporación Autónoma Regional de Santander - CAS. Hayder Fino
