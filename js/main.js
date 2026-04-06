/**
 * En Territorio Verde - Main Application Script
 * Organized for scalability and maintainability.
 */

const APP_CONFIG = {
  SIGNAL_URL: "https://sonic.paulatina.co/8186/stream",
  CAROUSEL_SPEED: 5000,
  STORAGE_KEYS: {
    IS_PLAYING: 'audioIsPlaying'
  }
};

const RadioApp = {
  slideIndex: 0,
  carouselInterval: null,

  /**
   * Initialize all application modules
   */
  init() {
    console.log("🌿 RadioApp: Iniciando módulos...");
    this.initAudioEngine();
    this.initHeaderScroll();
    this.initIntersectionObserver();
    this.initYouTube();
    this.initUIEvents();
  },

  /**
   * Audio Engine & UI Synchronization
   */
  initAudioEngine() {
    const audio = document.getElementById("stream");
    if (!audio) return;

    const savedState = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.IS_PLAYING) === 'true';
    
    if (savedState) {
      this.playStream();
    }

    audio.addEventListener("play", () => this.updatePlayState(true));
    audio.addEventListener("pause", () => this.updatePlayState(false));
  },

  playStream() {
    const audio = document.getElementById("stream");
    if (!audio) return;

    audio.load();
    audio.play()
      .then(() => this.updatePlayState(true))
      .catch(() => {
        // Handle autoplay policy
        this.updatePlayState(true); // Show UI as playing/loading
        const resumeOnInteraction = () => {
          audio.play().then(() => {
            this.updatePlayState(true);
            document.removeEventListener('click', resumeOnInteraction);
          });
        };
        document.addEventListener('click', resumeOnInteraction);
      });
  },

  toggleStream() {
    const audio = document.getElementById("stream");
    if (!audio) return;

    if (audio.paused) {
      this.playStream();
    } else {
      audio.pause();
    }
  },

  updatePlayState(isPlaying) {
    localStorage.setItem(APP_CONFIG.STORAGE_KEYS.IS_PLAYING, isPlaying);
    
    const uiElements = {
      btn: document.getElementById('btnLive'),
      text: document.getElementById('liveText'),
      indicator: document.getElementById('liveIndicator'),
      status: document.getElementById('liveStatus')
    };

    if (!uiElements.btn) return;

    if (isPlaying) {
      uiElements.btn.classList.add('playing');
      if (uiElements.text) uiElements.text.textContent = 'En Vivo ·';
      if (uiElements.indicator) uiElements.indicator.className = 'live'; 
      if (uiElements.status) uiElements.status.textContent = 'En Vivo';
    } else {
      uiElements.btn.classList.remove('playing');
      if (uiElements.text) uiElements.text.textContent = 'Oír en Vivo';
      if (uiElements.indicator) uiElements.indicator.className = 'offline';
      if (uiElements.status) uiElements.status.textContent = 'Fuera del Aire';
    }
  },

  /**
   * Export Modal & Sharing
   */
  toggleExportModal(show = true) {
    let modal = document.getElementById('modal-export');
    if (!modal && show) {
      this.createExportModal();
      modal = document.getElementById('modal-export');
    }
    
    if (modal) {
      if (show) modal.classList.add('active');
      else modal.classList.remove('active');
    }
  },

  createExportModal() {
    const modal = document.createElement('div');
    modal.id = 'modal-export';
    modal.className = 'modal-export';
    modal.innerHTML = `
      <div class="modal-content">
        <h3><i class="fas fa-broadcast-tower"></i> Exportar Emisora</h3>
        <div class="export-options">
          <button class="btn-opt" onclick="RadioApp.shareSignal()">
            <i class="fas fa-share-nodes"></i> Compartir Señal (Apps)
          </button>
          <button class="btn-opt" onclick="RadioApp.copyLink()">
            <i class="fas fa-link"></i> Copiar Enlace Directo
          </button>
          <a href="senal_en_vivo.m3u" download="senal_en_vivo.m3u" class="btn-opt">
            <i class="fas fa-file-audio"></i> Descargar para VLC / Winamp
          </a>
          <button class="btn-opt" onclick="RadioApp.shareWeb()">
            <i class="fas fa-globe"></i> Compartir Página Web
          </button>
        </div>
        <button class="btn-close-modal" onclick="RadioApp.toggleExportModal(false)">✕ Cerrar</button>
      </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) this.toggleExportModal(false); });
  },

  shareSignal() { window.open(APP_CONFIG.SIGNAL_URL, '_blank'); },
  
  copyLink() {
    navigator.clipboard.writeText(APP_CONFIG.SIGNAL_URL)
      .then(() => alert('¡Enlace directo copiado!'));
  },

  shareWeb() {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: 'En Territorio Verde – Radio CAS', url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => alert('¡Enlace de la web copiado!'));
    }
  },

  /**
   * UI & Visual Effects
   */
  initHeaderScroll() {
    let lastScroll = 0;
    const header = document.getElementById("mainHeader");
    if (!header) return;

    window.addEventListener("scroll", () => {
      const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
      if (currentScroll > lastScroll && currentScroll > 100) {
        header.classList.add("hide");
      } else {
        header.classList.remove("hide");
      }
      lastScroll = Math.max(0, currentScroll);
    });
  },

  initIntersectionObserver() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add("visible");
      });
    }, { threshold: 0.15 });

    document.querySelectorAll(".section-container").forEach(el => observer.observe(el));
  },

  initYouTube() {
    window.addEventListener("load", () => {
      const yt = document.getElementById("youtubeIframe");
      if (yt) setTimeout(() => { yt.src = yt.getAttribute("data-src"); }, 3000);
    });
  },

  /**
   * Dynamic Content Loading
   */
  async loadPageContent(page) {
    try {
      const response = await fetch(`data/${page}/config.json?v=${Date.now()}`);
      if (!response.ok) return;
      const data = await response.json();
      this.renderPage(page, data);
    } catch (e) {
      console.error(`❌ RadioApp: Error cargando ${page}:`, e);
    }
  },

  renderPage(page, data) {
    const renders = {
      inicio: () => {
        this.renderCarousel(data);
        this.renderCards(data.programas_destacados);
        this.renderSchedule(data.parrilla);
      },
      nosotros: () => this.renderAbout(data),
      programacion: () => {
        this.renderIntro(data.intro);
        this.renderExtendedSchedule(data.parrilla_extendida);
      },
      contacto: () => this.renderContact(data)
    };

    if (renders[page]) renders[page]();
  },

  // Sub-renderers (simplified for cleaner code)
  renderCarousel(data) {
    const container = document.getElementById('carousel-slides');
    if (!container || !data.programas_destacados) return;

    const bannerImg = data.banner?.image || 'data/inicio/fondo-ligero2.jpg';
    const slides = [
      { titulo: 'Bienvenido', descripcion: 'En sintonía con la naturaleza', imagen: bannerImg },
      ...data.programas_destacados
    ];

    container.innerHTML = slides.map(s => `
      <div class="slide">
        <img src="${s.imagen}" alt="${s.titulo}" loading="lazy" onerror="this.src='img/fondo-ligero.jpg'">
        <div class="slide-content"><h2>${s.titulo}</h2><p>${s.descripcion}</p></div>
      </div>
    `).join('');

    this.slideIndex = 0;
    this.startCarousel();
  },

  renderCards(items) {
    const grid = document.querySelector('.cards-grid');
    if (grid && items) {
      grid.innerHTML = items.map(p => `
        <div class="card">
          <img src="${p.imagen || 'img/placeholder.jpg'}" alt="${p.titulo}" loading="lazy">
          <h4>${p.titulo}</h4>
          <p>${p.descripcion}</p>
        </div>
      `).join('');
    }
  },

  renderSchedule(items) {
    const tbody = document.querySelector('.schedule-table tbody');
    if (tbody && items) {
      tbody.innerHTML = items.map(r => `<tr><td>${r.dia}</td><td>${r.programa}</td><td>${r.horario}</td></tr>`).join('');
    }
  },

  renderAbout(data) {
    const h2 = document.querySelector('.intro h2');
    const ps = document.querySelectorAll('.intro p');
    if (h2 && data.historia) h2.innerText = data.historia.titulo;
    if (ps[0] && data.historia) ps[0].innerText = data.historia.parrafo1;
    if (ps[1] && data.historia) ps[1].innerText = data.historia.parrafo2;
    
    const grid = document.querySelector('.values-grid');
    if (grid && data.valores) {
      grid.innerHTML = data.valores.map(v => `<div class="value-card"><h4>${v.titulo}</h4><p>${v.descripcion}</p></div>`).join('');
    }
  },

  renderIntro(intro) {
     const h2 = document.querySelector('.intro h2');
     const p = document.querySelector('.intro p');
     if (h2 && intro) h2.innerText = intro.titulo;
     if (p && intro) p.innerText = intro.descripcion;
  },

  renderExtendedSchedule(items) {
    const tbody = document.querySelector('.schedule-table tbody');
    if (tbody && items) {
      tbody.innerHTML = items.map(r => `<tr><td>${r.hora}</td><td>${r.lunes}</td><td>${r.martes}</td><td>${r.miercoles}</td><td>${r.jueves}</td><td>${r.viernes}</td></tr>`).join('');
    }
  },

  renderContact(data) {
    const map = {
      'cv-titulo': data.introduccion?.titulo,
      'cv-intro': data.introduccion?.parrafo,
      'cv-mensaje': data.mensaje_temporal?.parrafo,
      'cv-correo': data.canales_de_contacto?.correo,
      'cv-telefono': data.canales_de_contacto?.telefono,
      'cv-direccion': data.canales_de_contacto?.direccion
    };
    for (let id in map) {
      const el = document.getElementById(id);
      if (el && map[id]) el.innerText = map[id];
    }
  },

  /**
   * Carousel Engine
   */
  startCarousel() {
    if (this.carouselInterval) clearInterval(this.carouselInterval);
    this.carouselInterval = setInterval(() => this.moveSlide(1), APP_CONFIG.CAROUSEL_SPEED);
  },

  moveSlide(step) {
    const slides = document.querySelectorAll('.slide');
    if (slides.length === 0) return;
    this.slideIndex = (this.slideIndex + step + slides.length) % slides.length;
    
    const container = document.getElementById('carousel-slides');
    if (container) container.style.transform = `translateX(-${this.slideIndex * 100}%)`;
  },

  /**
   * Global Helpers
   */
  initUIEvents() {
    // expose to global for HTML onclicks
    window.toggleRadioStream = () => this.toggleStream();
    window.toggleExportModal = () => this.toggleExportModal(true);
    window.loadContent = (p) => this.loadPageContent(p);
  }
};

// Start the APP
RadioApp.init();
