/**
 * Audio Engine & UI Sync
 */
function syncUI(isPlaying) {
    const btn = document.getElementById('btnLive');
    const liveText = document.getElementById('liveText');
    const liveIndicator = document.getElementById('liveIndicator');
    const liveStatus = document.getElementById('liveStatus');

    if (!btn) return;

    if (isPlaying) {
        btn.classList.add('playing');
        if (liveText) liveText.textContent = 'En Vivo ·';
        if (liveIndicator) {
            liveIndicator.classList.add('live');
            liveIndicator.classList.remove('offline');
        }
        if (liveStatus) liveStatus.textContent = 'En Vivo';
    } else {
        btn.classList.remove('playing');
        if (liveText) liveText.textContent = 'Oír en Vivo';
        if (liveIndicator) {
            liveIndicator.classList.remove('live');
            liveIndicator.classList.add('offline');
        }
        if (liveStatus) liveStatus.textContent = 'Fuera del Aire';
    }
}

window.toggleRadioStream = function() {
    const audio = document.getElementById('stream');
    if (!audio) return;

    if (audio.paused) {
        audio.load();
        audio.play().then(() => {
            localStorage.setItem('audioIsPlaying', 'true');
            syncUI(true);
        }).catch(() => {
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

const SIGNAL_URL = "https://sonic.paulatina.co/8186/stream";

window.toggleExportModal = function() {
  let modal = document.getElementById('modal-export');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'modal-export';
    modal.className = 'modal-export';
    modal.innerHTML = `
      <div class="modal-content">
        <h3><i class="fas fa-broadcast-tower" style="color:#006b3f;margin-right:8px;"></i>Exportar Emisora</h3>
        <div class="export-options">
          <button class="btn-opt" onclick="shareDirectSignal()">
            <i class="fas fa-share-nodes"></i> Compartir Señal (Apps)
          </button>
          <button class="btn-opt" onclick="exportOnlyLink()">
            <i class="fas fa-link"></i> Copiar Enlace Directo
          </button>
          <a href="senal_en_vivo.m3u" download="senal_en_vivo.m3u" class="btn-opt">
            <i class="fas fa-file-audio"></i> Descargar para VLC / Winamp
          </a>
          <button class="btn-opt" onclick="shareWebsiteLink()">
            <i class="fas fa-globe"></i> Compartir Página Web
          </button>
        </div>
        <button class="btn-close-modal" onclick="window.closeExportModal()">✕ Cerrar</button>
      </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) window.closeExportModal(); });
  }
  modal.classList.add('active');
};

window.closeExportModal = function() {
  const modal = document.getElementById('modal-export');
  if (modal) modal.classList.remove('active');
};

window.shareDirectSignal = function() {
  window.open(SIGNAL_URL, '_blank');
};

window.exportOnlyLink = function() {
  navigator.clipboard.writeText(SIGNAL_URL).then(() => {
    alert('¡Enlace directo a la señal de audio copiado!');
  });
};

window.shareWebsiteLink = function() {
  const url = window.location.href;
  if (navigator.share) {
    navigator.share({ title: 'En Territorio Verde – Radio CAS', url }).catch(() => {});
  } else {
    navigator.clipboard.writeText(url).then(() => alert('¡Enlace de la web copiado!'));
  }
};

function startAudioEngine() {
    const audio = document.getElementById("stream");
    if (!audio) {
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

startAudioEngine();

/**
 * UI Logic (Header, Intersection Observer, YouTube)
 */
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

window.addEventListener("load", () => {
  const yt = document.getElementById("youtubeIframe");
  if (yt) setTimeout(() => { yt.src = yt.getAttribute("data-src"); }, 3500);
});

/**
 * Dynamic Content Loading
 */
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

/**
 * Carousel Logic
 */
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
