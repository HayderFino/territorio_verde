/* === HEADER DESAPARECE/REAPARECE === */
let lastScrollTop = 0;
const header = document.getElementById("mainHeader");

if (header) {
  window.addEventListener("scroll", () => {
    const currentScroll = window.pageYOffset || document.documentElement.scrollTop;

    if (currentScroll > lastScrollTop && currentScroll > 100) {
      header.classList.add("hide");
    } else {
      header.classList.remove("hide");
    }
    lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
  });
}

/* === EFECTO APARICIÓN SUAVE === */
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      entry.target.classList.remove("hidden");
    }
  });
}, { threshold: 0.2 });

document.querySelectorAll(".section-container").forEach((section) => {
  section.classList.add("hidden");
  observer.observe(section);
});


// ==== CONTROL DEL INDICADOR EN VIVO ====
document.addEventListener("DOMContentLoaded", () => {
  const audio = document.getElementById("stream");
  const liveIndicator = document.getElementById("liveIndicator");
  const liveText = document.getElementById("liveText");

  if (!audio || !liveIndicator || !liveText) return;

  const setLive = () => {
    liveIndicator.classList.add("live");
    liveIndicator.classList.remove("offline");
    liveText.textContent = "En Vivo";
  };

  const setOffline = () => {
    liveIndicator.classList.remove("live");
    liveIndicator.classList.add("offline");
    liveText.textContent = "Fuera del Aire";
  };

  // Estado inicial
  setOffline();

  // Eventos del audio
  audio.addEventListener("play", setLive);
  audio.addEventListener("playing", setLive);
  audio.addEventListener("pause", setOffline);
  audio.addEventListener("ended", setOffline);
  audio.addEventListener("error", setOffline);

  // Por si ya estaba reproduciendo
  if (!audio.paused) setLive();
});

// ==== DEFERIR CARGA DE YOUTUBE ====
// Evita que los scripts pesados de YouTube bloqueen la carga y renderizado inicial
window.addEventListener("load", () => {
  const ytIframe = document.getElementById("youtubeIframe");
  if (ytIframe) {
    // Esperamos 3.5 segundos en segundo plano antes de inyectar el video
    setTimeout(() => {
      ytIframe.src = ytIframe.getAttribute("data-src");
    }, 3500);
  }
});

// ==== CARGA DINÁMICA DE CONTENIDO ====
async function loadContent(page) {
  try {
    // Añadimos cache-busting para que el navegador NO guarde la versión antigua
    const response = await fetch(`data/${page}/config.json?v=${new Date().getTime()}`);
    const data = await response.json();

    // Cargar datos según la página
    if (page === 'inicio') {
      const banner = document.getElementById('banner');
      if (banner && data.banner) {
        banner.style.backgroundImage = `url('${data.banner.image}')`;
      }

      const grid = document.querySelector('.cards-grid');
      if (grid && data.programas_destacados) {
        grid.innerHTML = data.programas_destacados.map(p => `
                    <div class="card">
                        ${p.imagen ? `<img src="${p.imagen}" alt="${p.titulo}" loading="lazy">` : `<div style="width:100%; height:200px; background:#e0e0e0; display:flex; align-items:center; justify-content:center; color:#888;">NUEVO PROGRAMA</div>`}
                        <h4>${p.titulo}</h4>
                        <p>${p.descripcion}</p>
                    </div>
                `).join('');
      }
      // Parrilla
      const tableBody = document.querySelector('.schedule-table tbody');
      if (tableBody && data.parrilla) {
        tableBody.innerHTML = data.parrilla.map(row => `
                    <tr>
                        <td>${row.dia}</td>
                        <td>${row.programa}</td>
                        <td>${row.horario}</td>
                    </tr>
                `).join('');
      }
    }

    if (page === 'nosotros') {
      document.querySelector('.intro h2').innerText = data.historia.titulo;
      document.querySelectorAll('.intro p')[0].innerText = data.historia.parrafo1;
      document.querySelectorAll('.intro p')[1].innerText = data.historia.parrafo2;

      const grid = document.querySelector('.values-grid');
      if (grid) {
        grid.innerHTML = data.valores.map(v => `
                    <div class="value-card">
                        <h4>${v.titulo}</h4>
                        <p>${v.descripcion}</p>
                    </div>
                `).join('');
      }
    }
    if (page === 'programacion') {
      document.querySelector('.intro h2').innerText = data.intro.titulo;
      document.querySelector('.intro p').innerText = data.intro.descripcion;

      const tableBody = document.querySelector('.schedule-table tbody');
      if (tableBody && data.parrilla_extendida) {
        tableBody.innerHTML = data.parrilla_extendida.map(row => `
                    <tr>
                        <td>${row.hora}</td>
                        <td>${row.lunes}</td>
                        <td>${row.martes}</td>
                        <td>${row.miercoles}</td>
                        <td>${row.jueves}</td>
                        <td>${row.viernes}</td>
                    </tr>
                `).join('');
      }
    }
    
    if (page === 'contacto') {
      const titulo = document.getElementById('cv-titulo');
      if (titulo && data.introduccion) titulo.innerText = data.introduccion.titulo;

      const intro = document.getElementById('cv-intro');
      if (intro && data.introduccion) intro.innerText = data.introduccion.parrafo;

      const msj = document.getElementById('cv-mensaje');
      if (msj && data.mensaje_temporal) msj.innerText = data.mensaje_temporal.parrafo;

      const correo = document.getElementById('cv-correo');
      if (correo && data.canales_de_contacto) correo.innerText = data.canales_de_contacto.correo;

      const tel = document.getElementById('cv-telefono');
      if (tel && data.canales_de_contacto) tel.innerText = data.canales_de_contacto.telefono;

      const dir = document.getElementById('cv-direccion');
      if (dir && data.canales_de_contacto) dir.innerText = data.canales_de_contacto.direccion;
    }
  } catch (e) {
    console.error("Error cargando contenido dinámico:", e);
  }
}


