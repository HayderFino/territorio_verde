// ==========================================
// MANTENER EL AUDIO AL PRINCIPIO PARA EVITAR BLOQUEOS
// ==========================================

console.trace("Audio Engine Supreme v1000 - Entry point");

// 1. Funciones de UI
function syncUI(isPlaying) {
    const btn = document.getElementById('btnLive');
    const liveText = document.getElementById('liveText');
    const liveIndicator = document.getElementById('liveIndicator');
    const liveStatus = document.getElementById('liveStatus');

    if (!btn) { console.warn("Button btnLive not found!"); return; }

    console.log("Syncing UI for", window.location.pathname, ":", isPlaying ? "Live" : "Off");

    if (isPlaying) {
        if (btn) btn.classList.add('playing');
        if (liveText) liveText.textContent = 'En Vivo ·';
        if (liveIndicator) {
            liveIndicator.classList.add('live');
            liveIndicator.classList.remove('offline');
        }
        if (liveStatus) liveStatus.textContent = 'En Vivo';
    } else {
        if (btn) btn.classList.remove('playing');
        if (liveText) liveText.textContent = 'Oír en Vivo';
        if (liveIndicator) {
            liveIndicator.classList.remove('live');
            liveIndicator.classList.add('offline');
        }
        if (liveStatus) liveStatus.textContent = 'Fuera del Aire';
    }
}

// 2. Funciones globales expuestas
window.toggleRadioStream = function() {
    const audio = document.getElementById('stream');
    if (!audio) return;

    if (audio.paused) {
        audio.load();
        audio.play().then(() => {
            localStorage.setItem('audioIsPlaying', 'true');
            syncUI(true);
        }).catch(err => {
            console.warn("Play error:", err);
            localStorage.setItem('audioIsPlaying', 'true');
            syncUI(true);
        });
    } else {
        audio.pause();
        localStorage.setItem('audioIsPlaying', 'false');
        syncUI(false);
    }
};

window.togglePlay = window.toggleRadioStream;
window.shareLink = function() {
    const url = window.location.href;
    if (navigator.share) {
        navigator.share({ title: 'En Territorio Verde – Radio CAS', url });
    } else {
        navigator.clipboard.writeText(url).then(() => alert('¡Enlace copiado!'));
    }
};

// 3. Inicialización inmediata y robusta
function startAudioEngine() {
    const audio = document.getElementById("stream");
    if (!audio) {
        // Reintentar en DOMContentLoaded si el script cargó muy rápido
        document.addEventListener("DOMContentLoaded", startAudioEngine);
        return;
    }

    const state = localStorage.getItem('audioIsPlaying') === 'true';
    if (state) {
        audio.load();
        audio.play().then(() => syncUI(true)).catch(() => {
            syncUI(true);
            const resume = () => {
                audio.play().then(() => {
                    syncUI(true);
                    document.removeEventListener('click', resume);
                    document.removeEventListener('touchstart', resume);
                });
            };
            document.addEventListener('click', resume);
            document.addEventListener('touchstart', resume);
        });
    } else {
        syncUI(false);
    }

    audio.addEventListener("play", () => { localStorage.setItem('audioIsPlaying', 'true'); syncUI(true); });
    audio.addEventListener("pause", () => { localStorage.setItem('audioIsPlaying', 'false'); syncUI(false); });
}

// Ejecución
startAudioEngine();

// ==========================================
// RESTO DE LÓGICA (HEADER, SCROLL, CONTENIDO)
// ==========================================

/* === HEADER DESAPARECE/REAPARECE === */
let lastScrollTop = 0;
const mainHeader = document.getElementById("mainHeader");
if (mainHeader) {
  window.addEventListener("scroll", () => {
    const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
    if (currentScroll > lastScrollTop && currentScroll > 100) {
      mainHeader.classList.add("hide");
    } else {
      mainHeader.classList.remove("hide");
    }
    lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
  });
}

/* === EFECTO APARICIÓN SUAVE === */
const intersectionObs = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      entry.target.classList.remove("hidden");
    }
  });
}, { threshold: 0.2 });

document.querySelectorAll(".section-container").forEach((section) => {
  section.classList.add("hidden");
  intersectionObs.observe(section);
});

/* === CARGA DE YOUTUBE === */
window.addEventListener("load", () => {
  const yt = document.getElementById("youtubeIframe");
  if (yt) setTimeout(() => { yt.src = yt.getAttribute("data-src"); }, 3500);
});

// ==== CARGA DINÁMICA DE CONTENIDO SEGURO ====
async function loadContent(page) {
  try {
    const response = await fetch(`data/${page}/config.json?v=${new Date().getTime()}`);
    if (!response.ok) return;
    const data = await response.json();

    if (page === 'inicio') {
      const carouselSlides = document.getElementById('carousel-slides');
      if (carouselSlides && data.programas_destacados) {
        const bannerImg = (data.banner && data.banner.image) ? data.banner.image : 'data/inicio/fondo-ligero2.jpg';
        const allSlidesData = [{ titulo: 'Bienvenido', descripcion: 'En sintonía con la naturaleza', imagen: bannerImg }, ...data.programas_destacados];
        carouselSlides.innerHTML = allSlidesData.map(p => `
          <div class="slide">
            <img src="${p.imagen}" alt="${p.titulo}" loading="lazy" style="width:100%; height:100%; object-fit:cover;" onerror="this.src='img/fondo-ligero.jpg'">
            <div class="slide-content">
              <h2>${p.titulo}</h2>
              <p>${p.descripcion}</p>
            </div>
          </div>
        `).join('');
        slideIndex = 0;
        setTimeout(() => { showSlide(0); startCarousel(); }, 100);
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
      const tableBody = document.querySelector('.schedule-table tbody');
      if (tableBody && data.parrilla) {
        tableBody.innerHTML = data.parrilla.map(row => `<tr><td>${row.dia}</td><td>${row.programa}</td><td>${row.horario}</td></tr>`).join('');
      }
    }

    if (page === 'nosotros') {
      const h2 = document.querySelector('.intro h2');
      if (h2 && data.historia) h2.innerText = data.historia.titulo;
      const ps = document.querySelectorAll('.intro p');
      if (ps.length >= 1 && data.historia) ps[0].innerText = data.historia.parrafo1;
      if (ps.length >= 2 && data.historia) ps[1].innerText = data.historia.parrafo2;
      const grid = document.querySelector('.values-grid');
      if (grid && data.valores) {
        grid.innerHTML = data.valores.map(v => `<div class="value-card"><h4>${v.titulo}</h4><p>${v.descripcion}</p></div>`).join('');
      }
    }

    if (page === 'programacion') {
      const h2 = document.querySelector('.intro h2');
      if (h2 && data.intro) h2.innerText = data.intro.titulo;
      const p = document.querySelector('.intro p');
      if (p && data.intro) p.innerText = data.intro.descripcion;
      const tableBody = document.querySelector('.schedule-table tbody');
      if (tableBody && data.parrilla_extendida) {
        tableBody.innerHTML = data.parrilla_extendida.map(row => `<tr><td>${row.hora}</td><td>${row.lunes}</td><td>${row.martes}</td><td>${row.miercoles}</td><td>${row.jueves}</td><td>${row.viernes}</td></tr>`).join('');
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

// ==== LÓGICA DEL CAROUSEL ====
let slideIndex = 0;
let carouselInterval;
function startCarousel() {
  if (carouselInterval) clearInterval(carouselInterval);
  carouselInterval = setInterval(() => moveSlide(1), 5000);
}
function showSlide(index) {
  const slidesContainer = document.getElementById('carousel-slides');
  const slides = document.querySelectorAll('.slide');
  if (!slidesContainer || slides.length === 0) return;
  if (index >= slides.length) slideIndex = 0;
  if (index < 0) slideIndex = slides.length - 1;
  slidesContainer.style.transform = `translateX(-${slideIndex * 100}%)`;
}
function moveSlide(step) {
  slideIndex += step;
  showSlide(slideIndex);
  startCarousel();
}


