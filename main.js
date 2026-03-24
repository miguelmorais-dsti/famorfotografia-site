const grid = document.getElementById("gallery-grid");
const highlightsGrid = document.getElementById("highlights-masonry");
const lightbox = document.getElementById("lightbox");
const lightboxImage = document.getElementById("lightbox-image");
const lightboxClose = document.getElementById("lightbox-close");

// Data structure: window.FAMOR_ALBUMS = [{ id, title, cover, photos: [] }]
const albums = Array.isArray(window.FAMOR_ALBUMS) ? window.FAMOR_ALBUMS : [];
const highlights = Array.isArray(window.FAMOR_HIGHLIGHTS) ? window.FAMOR_HIGHLIGHTS : [];

// Intersection Observer
const observerOptions = { threshold: 0.05, rootMargin: "0px 0px -50px 0px" };
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

const clearGrid = () => {
  if (!grid) return;
  grid.innerHTML = "";
};

// Render the Artistic Mosaic (Highlights)
const renderHighlights = () => {
  if (!highlightsGrid) return;
  highlightsGrid.innerHTML = "";

  highlights.forEach((src, index) => {
    const item = document.createElement("div");
    item.className = "highlights-item fade-in";
    
    const image = document.createElement("img");
    image.src = src;
    image.alt = `Storyteller highlight ${index + 1}`;
    image.loading = "lazy";

    item.appendChild(image);
    highlightsGrid.appendChild(item);
    observer.observe(item);

    // Abrir no lightbox
    item.addEventListener("click", () => {
      if (!lightbox || !lightboxImage) return;
      currentAlbum = { title: "Storyteller", photos: highlights };
      currentPhotoIndex = index;
      updateLightbox();
      lightbox.classList.add("open");
    });
  });
};

// Language Switching Logic
const setLanguage = (lang) => {
  document.documentElement.lang = lang;
  
  // Update all elements with data-pt/data-en
  document.querySelectorAll("[data-pt]").forEach(el => {
    const text = lang === 'en' ? el.dataset.en : el.dataset.pt;
    if (text) el.innerHTML = text;
  });

  // Update placeholders
  document.querySelectorAll("[data-placeholder-pt]").forEach(el => {
    const ph = lang === 'en' ? el.dataset.placeholderEn : el.dataset.placeholderPt;
    if (ph) el.placeholder = ph;
  });

  // Update select options (specific cases)
  document.querySelectorAll("select option[data-pt]").forEach(opt => {
    const text = lang === 'en' ? opt.dataset.en : opt.dataset.pt;
    if (text) opt.textContent = text;
  });

  // Update active state in selector
  const btnPt = document.getElementById("btn-pt");
  const btnEn = document.getElementById("btn-en");
  if (btnPt) btnPt.classList.toggle("active", lang === 'pt');
  if (btnEn) btnEn.classList.toggle("active", lang === 'en');

  // Save preference
  localStorage.setItem("famor_lang", lang);
};

// Render the list of album covers
const renderAlbums = () => {
  if (!grid) return;
  
  // Esconder botão flutuante
  const floatingBack = document.getElementById("floating-back");
  if (floatingBack) floatingBack.classList.remove("visible");

  // Mostrar novamente a seção de highlights se voltarmos aos álbuns
  const hSection = document.getElementById("highlights-section");
  if (hSection) hSection.style.display = "block";

  clearGrid();
  grid.classList.remove("album-view");
  grid.classList.add("albums-list");

  const lang = document.documentElement.lang || 'pt';
  const label = lang === 'en' ? 'View Album' : 'Ver Álbum';

  albums.forEach((album) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "album-card fade-in";
    
    card.innerHTML = `
      <div class="album-cover">
        <img src="${album.cover}" alt="${album.title}" loading="lazy" />
        <div class="album-overlay">
          <span>${label}</span>
        </div>
      </div>
      <div class="album-info">
        <h3>${album.title}</h3>
      </div>
    `;

    card.addEventListener("click", () => renderPhotos(album));
    grid.appendChild(card);
    observer.observe(card);
  });
};

// Render photos of a specific album
const renderPhotos = (album) => {
  if (!grid) return;
  currentAlbum = album; // Guardar o álbum atual para o slideshow

  // Esconder seção de highlights ao abrir um álbum para focar na história
  const hSection = document.getElementById("highlights-section");
  if (hSection) hSection.style.display = "none";

  // Mostrar botão flutuante
  const floatingBack = document.getElementById("floating-back");
  if (floatingBack) floatingBack.classList.add("visible");

  clearGrid();
  grid.classList.remove("albums-list");
  grid.classList.add("album-view");

  const lang = document.documentElement.lang || 'pt';
  const backLabel = lang === 'en' ? '← Back to Albums' : '← Voltar aos Álbuns';

  // Add Header with Album Info
  const header = document.createElement("div");
  header.style.gridColumn = "1 / -1";
  header.style.marginBottom = "4rem";
  header.innerHTML = `
    <button class="back-to-albums btn-ghost" style="margin-bottom: 2rem;">${backLabel}</button>
    <h2 style="font-family: 'Cormorant Garamond', serif; font-size: 3.5rem; font-weight: 400;">${album.title}</h2>
  `;
  header.querySelector("button").addEventListener("click", renderAlbums);
  grid.appendChild(header);

  album.photos.forEach((src, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "gallery-item fade-in";
    
    const image = document.createElement("img");
    image.src = src;
    image.alt = `${album.title} - foto ${index + 1}`;
    image.loading = "lazy";

    button.appendChild(image);
    grid.appendChild(button);
    observer.observe(button);

    button.addEventListener("click", () => {
      if (!lightbox || !lightboxImage) return;
      currentPhotoIndex = index;
      updateLightbox();
      lightbox.classList.add("open");
    });
  });

  grid.scrollIntoView({ behavior: "smooth" });
};

const setupAnimations = () => {
  // Observar seções e elementos específicos
  document.querySelectorAll("section, .editorial-image, .pack-sale-card, .video-item, .editorial-copy, .pack-detail-card, .pack-detail-card li, .awards-section").forEach(el => {
    el.classList.add("fade-in");
    observer.observe(el);
  });

  // Garantir que elementos que já têm .fade-in no HTML (como na reserva.html) também são observados
  document.querySelectorAll(".fade-in").forEach(el => {
    observer.observe(el);
  });
};

// Hero Slideshow Logic
const setupHeroSlideshow = () => {
  const slides = document.querySelectorAll("#hero-slideshow img");
  const dotsContainer = document.getElementById("hero-dots");
  if (slides.length <= 1) return;

  let currentSlide = 0;
  let slideInterval;

  // Dots are optional
  if (dotsContainer) {
    slides.forEach((_, i) => {
      const dot = document.createElement("button");
      dot.className = `hero-dot ${i === 0 ? "active" : ""}`;
      dot.setAttribute("aria-label", `Ir para slide ${i + 1}`);
      dot.addEventListener("click", () => goToSlide(i));
      dotsContainer.appendChild(dot);
    });
  }

  const goToSlide = (n) => {
    slides[currentSlide].classList.remove("active");
    if (dotsContainer) {
      const dots = dotsContainer.querySelectorAll(".hero-dot");
      if (dots[currentSlide]) dots[currentSlide].classList.remove("active");
      if (dots[n]) dots[n].classList.add("active");
    }
    currentSlide = n;
    slides[currentSlide].classList.add("active");
    clearInterval(slideInterval);
    startTimer();
  };

  const nextSlide = () => {
    const next = (currentSlide + 1) % slides.length;
    slides[currentSlide].classList.remove("active");
    
    if (dotsContainer) {
      const dots = dotsContainer.querySelectorAll(".hero-dot");
      if (dots[currentSlide]) dots[currentSlide].classList.remove("active");
      if (dots[next]) dots[next].classList.add("active");
    }

    currentSlide = next;
    slides[currentSlide].classList.add("active");
  };

  const startTimer = () => {
    slideInterval = setInterval(nextSlide, 3000);
  };

  startTimer();
};

let currentAlbum = null;
let currentPhotoIndex = 0;

const updateLightbox = () => {
  if (!currentAlbum || !lightboxImage) return;
  const src = currentAlbum.photos[currentPhotoIndex];
  lightboxImage.src = src;
  
  const counter = document.getElementById("lightbox-counter");
  if (counter) {
    counter.textContent = `${currentPhotoIndex + 1} / ${currentAlbum.photos.length}`;
  }
};

const nextPhoto = (e) => {
  if (e) e.stopPropagation();
  if (!currentAlbum) return;
  currentPhotoIndex = (currentPhotoIndex + 1) % currentAlbum.photos.length;
  updateLightbox();
};

const prevPhoto = (e) => {
  if (e) e.stopPropagation();
  if (!currentAlbum) return;
  currentPhotoIndex = (currentPhotoIndex - 1 + currentAlbum.photos.length) % currentAlbum.photos.length;
  updateLightbox();
};

const closeLightbox = () => {
  if (!lightbox) return;
  lightbox.classList.remove("open");
  if (lightboxImage) lightboxImage.src = "";
  // Remover vídeo se existir
  const video = lightbox.querySelector("video");
  if (video) video.remove();
};

// Atribuir eventos aos botões do lightbox
const btnNext = document.getElementById("lightbox-next");
const btnPrev = document.getElementById("lightbox-prev");
if (btnNext) btnNext.addEventListener("click", nextPhoto);
if (btnPrev) btnPrev.addEventListener("click", prevPhoto);

// Video Player Logic
const setupVideoPlayers = () => {
  const videoContainers = document.querySelectorAll(".video-container");
  
  videoContainers.forEach(container => {
    const videoSrc = container.dataset.videoSrc;
    if (!videoSrc) return;

    container.addEventListener("click", () => {
      if (!lightbox) return;
      
      // Limpar conteúdo anterior
      if (lightboxImage) lightboxImage.src = "";
      const oldVideo = lightbox.querySelector("video");
      if (oldVideo) oldVideo.remove();

      // Criar elemento de vídeo
      const video = document.createElement("video");
      video.src = videoSrc;
      video.controls = true;
      video.autoplay = true;
      video.style.width = "min(90vw, 1200px)";
      video.style.maxHeight = "80vh";
      
      lightbox.appendChild(video);
      lightbox.classList.add("open");
    });

    // Preview on Hover (Opcional, mas dá vida)
    container.addEventListener("mouseenter", () => {
      const previewVideo = document.createElement("video");
      previewVideo.src = videoSrc;
      previewVideo.muted = true;
      previewVideo.loop = true;
      previewVideo.playsInline = true;
      previewVideo.style.position = "absolute";
      previewVideo.style.inset = "0";
      previewVideo.style.width = "100%";
      previewVideo.style.height = "100%";
      previewVideo.style.objectFit = "cover";
      previewVideo.style.zIndex = "1";
      previewVideo.style.opacity = "0";
      previewVideo.classList.add("video-preview");
      
      container.appendChild(previewVideo);
      
      previewVideo.oncanplay = () => {
        previewVideo.play();
        previewVideo.style.opacity = "1";
      };
    });

    container.addEventListener("mouseleave", () => {
      const preview = container.querySelector(".video-preview");
      if (preview) {
        preview.style.opacity = "0";
        setTimeout(() => preview.remove(), 300);
      }
    });
  });
};

if (lightboxClose) lightboxClose.addEventListener("click", closeLightbox);
if (lightbox) {
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) closeLightbox();
  });
}

document.addEventListener("keydown", (event) => {
  if (lightbox && lightbox.classList.contains("open")) {
    if (event.key === "ArrowRight") nextPhoto();
    if (event.key === "ArrowLeft") prevPhoto();
    if (event.key === "Escape") closeLightbox();
  }
  if (event.key === "Escape") closeCompareModal();
});

// Scroll handler for Nav
const nav = document.querySelector(".nav");
window.addEventListener("scroll", () => {
  if (window.scrollY > 50) {
    nav.classList.add("scrolled");
  } else {
    nav.classList.remove("scrolled");
  }
});

// Mobile Menu Toggle
const setupMobileMenu = () => {
  const toggle = document.getElementById("menu-toggle");
  const navLinks = document.querySelector(".nav-links");
  
  if (toggle && navLinks) {
    toggle.addEventListener("click", () => {
      const isOpen = navLinks.classList.toggle("open");
      toggle.classList.toggle("open");
      document.body.classList.toggle("menu-open", isOpen);
    });

    // Fechar menu ao clicar num link
    navLinks.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        toggle.classList.remove("open");
        navLinks.classList.remove("open");
        document.body.classList.remove("menu-open");
      });
    });
  }
};

// applyPackageFromQuery() and setupInquiryForms()
const applyPackageFromQuery = () => {
  const params = new URLSearchParams(window.location.search);
  const pack = params.get("pack");
  if (!pack) return;
  const selects = document.querySelectorAll("select[name='packageType']");
  selects.forEach((select) => {
    const hasOption = Array.from(select.options).some((o) => o.value === pack);
    if (hasOption) select.value = pack;
  });
};

const setupInquiryForms = () => {
  const forms = document.querySelectorAll("[data-inquiry-form]");
  forms.forEach((form) => {
    const statusNode = form.querySelector(".form-status");
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      const payload = Object.fromEntries(formData.entries());
      if (payload.website) { form.reset(); return; }
      const fields = Array.from(form.elements);
      fields.forEach((f) => { f.disabled = true; });
      try {
        const response = await fetch("/api/inquiry", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (response.ok) {
          if (statusNode) statusNode.textContent = "Enviado com sucesso.";
          form.reset();
        }
      } catch (e) {} finally {
        fields.forEach((f) => { f.disabled = false; });
      }
    });
  });
};

// Modal Logic
const compareModal = document.getElementById("compare-modal");
const compareClose = document.getElementById("compare-close");

const openCompareModal = (e) => {
  if (e) e.preventDefault();
  if (compareModal) compareModal.classList.add("open");
};

const closeCompareModal = () => {
  if (compareModal) compareModal.classList.remove("open");
};

if (compareClose) compareClose.addEventListener("click", closeCompareModal);
if (compareModal) {
  compareModal.addEventListener("click", (e) => {
    if (e.target === compareModal) closeCompareModal();
  });
}

// Attach to all "Comparar todos" links
const setupCompareButtons = () => {
  document.querySelectorAll('a').forEach(link => {
    const text = (link.dataset.pt || link.textContent).toLowerCase();
    if (text.includes("comparar") || text.includes("compare")) {
      link.addEventListener("click", openCompareModal);
    }
  });
};

// Start everything
const savedLang = localStorage.getItem("famor_lang") || 'pt';
setLanguage(savedLang);

if (document.getElementById("gallery-grid")) {
  renderHighlights();
  renderAlbums();
}
if (document.getElementById("hero-slideshow")) setupHeroSlideshow();
setupAnimations();
setupMobileMenu();
if (document.querySelectorAll(".video-container").length > 0) setupVideoPlayers();
applyPackageFromQuery();
setupInquiryForms();
setupCompareButtons();