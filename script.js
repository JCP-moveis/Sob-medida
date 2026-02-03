/* =========================================================
  JCP Móveis - JS (COMPLETO)
  - Ano automático
  - Menu mobile
  - Lightbox por CATEGORIA (álbum) AUTO:
      abre todas as imagens que começam com "cozinha-", "quarto-", etc.
  - Navegação (ESC / ← / → / clique na foto = próxima)
  - Tracking GA4 seguro (só dispara evento se gtag existir)
========================================================= */

(function () {
  "use strict";

  // =========================
  // Ano atual no rodapé
  // =========================
  var anoEl = document.getElementById("anoAtual");
  if (anoEl) anoEl.textContent = String(new Date().getFullYear());

  // =========================
  // Menu Mobile
  // =========================
  var toggle = document.querySelector('[data-js="navToggle"]');
  var nav = document.querySelector('[data-js="nav"]');

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var isOpen = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });

    nav.addEventListener("click", function (e) {
      var target = e.target;
      if (target && target.tagName === "A" && nav.classList.contains("is-open")) {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  // =========================
  // LIGHTBOX (Modal)
  // =========================
  var lightbox = document.querySelector('[data-js="lightbox"]');
  var lightboxImg = document.querySelector('[data-js="lightboxImg"]');
  var lightboxCaption = document.querySelector('[data-js="lightboxCaption"]');
  var closeButtons = document.querySelectorAll('[data-js="lightboxClose"]');

  var currentAlbum = [];
  var currentIndex = 0;
  var currentCategory = "";

  // Nome bonito de cada categoria (legenda)
  var titleMap = {
    cozinha: "Cozinha",
    quarto: "Quarto / Closet",
    homeoffice: "Home office",
    outros: "Outros"
  };

  function renderLightbox() {
    if (!lightboxImg || !currentAlbum.length) return;

    var src = currentAlbum[currentIndex];
    lightboxImg.src = src;
    lightboxImg.alt = (titleMap[currentCategory] || currentCategory) + " - foto " + (currentIndex + 1);

    if (lightboxCaption) {
      lightboxCaption.textContent =
        (titleMap[currentCategory] || currentCategory) +
        " — " + (currentIndex + 1) + " / " + currentAlbum.length;
    }
  }

  function openLightboxAlbum(categoryKey, album, startIndex) {
    if (!lightbox || !lightboxImg) return;
    if (!album || !album.length) return;

    currentCategory = categoryKey;
    currentAlbum = album;
    currentIndex = typeof startIndex === "number" ? startIndex : 0;

    renderLightbox();

    lightbox.hidden = false;
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    if (!lightbox || !lightboxImg) return;
    lightbox.hidden = true;
    lightbox.setAttribute("aria-hidden", "true");
    lightboxImg.src = "";
    document.body.style.overflow = "";

    currentAlbum = [];
    currentIndex = 0;
    currentCategory = "";
  }

  function nextImage() {
    if (!currentAlbum.length) return;
    currentIndex = (currentIndex + 1) % currentAlbum.length;
    renderLightbox();
  }

  function prevImage() {
    if (!currentAlbum.length) return;
    currentIndex = (currentIndex - 1 + currentAlbum.length) % currentAlbum.length;
    renderLightbox();
  }

  closeButtons.forEach(function (btn) {
    btn.addEventListener("click", closeLightbox);
  });

  if (lightboxImg) {
    lightboxImg.style.cursor = "pointer";
    lightboxImg.addEventListener("click", function () {
      if (!lightbox || lightbox.hidden) return;
      nextImage();
    });
  }

  document.addEventListener("keydown", function (e) {
    if (!lightbox || lightbox.hidden) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowRight") nextImage();
    if (e.key === "ArrowLeft") prevImage();
  });

  // =========================
  // ✅ GALERIA AUTOMÁTICA POR PREFIXO
  // - tenta carregar prefixo-01, prefixo-02... até falhar
  // - funciona no "file://" e no GitHub Pages
  // =========================
  var albumCache = {}; // evita ficar recarregando toda vez

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function tryLoadImage(src) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () { resolve(true); };
      img.onerror = function () { resolve(false); };
      img.src = src;
    });
  }

  async function buildAlbumByPrefix(prefix, ext) {
    // cache
    var cacheKey = prefix + "|" + ext;
    if (albumCache[cacheKey]) return albumCache[cacheKey];

    var max = 60;              // até 60 imagens por categoria (ajuste se quiser)
    var stopAfterFails = 3;    // para após 3 falhas seguidas
    var fails = 0;
    var album = [];

    for (var i = 1; i <= max; i++) {
      var src = prefix + "-" + pad2(i) + "." + ext;

      // tenta carregar
      // eslint-disable-next-line no-await-in-loop
      var ok = await tryLoadImage(src);

      if (ok) {
        album.push(src);
        fails = 0; // reset
      } else {
        fails++;
        // se falhar 3 seguidas, assume que acabou
        if (fails >= stopAfterFails) break;
      }
    }

    albumCache[cacheKey] = album;
    return album;
  }

  // Clica nos cards da galeria
  var categoryButtons = document.querySelectorAll('[data-js="categoryOpen"]');

  categoryButtons.forEach(function (btn) {
    btn.addEventListener("click", async function () {
      var cat = btn.getAttribute("data-category"); // "cozinha" / "quarto" / "homeoffice" / "outros"

      // ✅ aqui você define a extensão padrão (você já confirmou que é .jpeg)
      var ext = "jpeg";

      var album = await buildAlbumByPrefix(cat, ext);

      if (!album.length) {
        alert("Nenhuma foto encontrada para: " + (titleMap[cat] || cat) + "\nConfirme os nomes, ex: " + cat + "-01." + ext);
        return;
      }

      openLightboxAlbum(cat, album, 0);
    });
  });

  // =========================
  // Tracking GA4 seguro
  // =========================
  function safeTrackClick(analyticsId) {
    try {
      if (typeof window.gtag === "function") {
        window.gtag("event", "click", {
          event_category: "cta",
          event_label: analyticsId,
          value: 1
        });
      }
    } catch (err) {}
  }

  document.addEventListener("click", function (e) {
    var el = e.target;
    while (el && el !== document.body && !el.getAttribute("data-analytics-id")) {
      el = el.parentElement;
    }
    if (!el || el === document.body) return;

    var analyticsId = el.getAttribute("data-analytics-id");
    if (!analyticsId) return;

    safeTrackClick(analyticsId);
  });
  
const header = document.querySelector('.header');

window.addEventListener('scroll', () => {
  if (window.scrollY > 10) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
});

})();