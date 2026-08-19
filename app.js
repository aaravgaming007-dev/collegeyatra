// ─────────────────────────────────────────
//  CollegeYatra — Main App JS  (API-backed)
// ─────────────────────────────────────────
const API_BASE = window.location.origin.startsWith('file://') ? 'http://localhost:3000' : '';
const API = API_BASE + '/api/images';

/* ── LOADER ── */
window.addEventListener('load', () => {
  setTimeout(async () => {
    document.getElementById('loader').classList.add('done');
    startHeroSlider();
    revealOnScroll();
    await buildGallery();   // fetch from server
  }, 1900);
});

/* ── CUSTOM CURSOR ── */
const cursor   = document.getElementById('cursor');
const follower = document.getElementById('cursorFollower');
let mx = 0, my = 0, fx = 0, fy = 0;

document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  cursor.style.left = mx + 'px';
  cursor.style.top  = my + 'px';
});
(function movFollower() {
  fx += (mx - fx) * 0.12;
  fy += (my - fy) * 0.12;
  follower.style.left = fx + 'px';
  follower.style.top  = fy + 'px';
  requestAnimationFrame(movFollower);
})();
document.querySelectorAll('a, button, .gallery-item, .dot').forEach(el => {
  el.addEventListener('mouseenter', () => follower.classList.add('grow'));
  el.addEventListener('mouseleave', () => follower.classList.remove('grow'));
});

/* ── NAV SCROLL ── */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

/* ── HAMBURGER ── */
const hamburger  = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  mobileMenu.classList.toggle('open');
});
mobileMenu.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    hamburger.classList.remove('open');
    mobileMenu.classList.remove('open');
  });
});

/* ── HERO SLIDESHOW ── */
const slides = document.querySelectorAll('.hero-slide');
const dots   = document.querySelectorAll('.dot');
let currentSlide = 0;
let slideTimer;

function goToSlide(idx) {
  slides[currentSlide].classList.remove('active');
  dots[currentSlide].classList.remove('active');
  currentSlide = (idx + slides.length) % slides.length;
  slides[currentSlide].classList.add('active');
  dots[currentSlide].classList.add('active');
}
function startHeroSlider() {
  slideTimer = setInterval(() => goToSlide(currentSlide + 1), 5000);
}
dots.forEach(dot => {
  dot.addEventListener('click', () => {
    clearInterval(slideTimer);
    goToSlide(parseInt(dot.dataset.idx));
    startHeroSlider();
  });
});

/* ── REVEAL ON SCROLL ── */
const revealEls = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 80);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
function revealOnScroll() {
  revealEls.forEach(el => revealObserver.observe(el));
}

/* ── COUNTER ANIMATION ── */
const counters = document.querySelectorAll('.stat-num');
const counterObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el     = entry.target;
      const target = parseInt(el.dataset.target);
      let current  = 0;
      const step   = Math.max(1, Math.ceil(target / 60));
      const timer  = setInterval(() => {
        current = Math.min(current + step, target);
        el.textContent = current;
        if (current >= target) clearInterval(timer);
      }, 25);
      counterObserver.unobserve(el);
    }
  });
}, { threshold: 0.5 });
counters.forEach(el => counterObserver.observe(el));

/* ── GALLERY ── */
const galleryGrid = document.getElementById('galleryGrid');
const lightbox    = document.getElementById('lightbox');
const lbImg       = document.getElementById('lbImg');
const lbCaption   = document.getElementById('lbCaption');
const lbClose     = document.getElementById('lbClose');
const lbPrev      = document.getElementById('lbPrev');
const lbNext      = document.getElementById('lbNext');

let galleryImages = [];
let lbIndex = 0;

async function buildGallery() {
  // Show skeleton while loading
  galleryGrid.innerHTML = '<div class="gallery-loading">Loading memories…</div>';

  try {
    const res  = await fetch(API);
    galleryImages = await res.json();
  } catch (e) {
    galleryGrid.innerHTML = '<div class="gallery-loading">Could not load gallery. Is the server running?</div>';
    return;
  }

  galleryGrid.innerHTML = '';
  galleryImages.forEach((img, i) => {
    const item = document.createElement('div');
    item.className = 'gallery-item gallery-item-animate';
    item.innerHTML = `
      <img src="${img.src}" alt="${img.caption}" loading="lazy" />
      <div class="gallery-item-overlay">
        <span class="gallery-item-caption">${img.caption}</span>
      </div>
    `;
    item.addEventListener('click', () => openLightbox(i));
    galleryGrid.appendChild(item);
    setTimeout(() => item.classList.add('visible'), 100 + i * 80);
  });

  // Re-attach cursor events to new items
  document.querySelectorAll('.gallery-item').forEach(el => {
    el.addEventListener('mouseenter', () => follower.classList.add('grow'));
    el.addEventListener('mouseleave', () => follower.classList.remove('grow'));
  });
}

function openLightbox(idx) {
  lbIndex = idx;
  const img = galleryImages[idx];
  lbImg.src = img.src;
  lbCaption.textContent = img.caption;
  lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeLightbox() {
  lightbox.classList.remove('open');
  document.body.style.overflow = '';
}

lbClose.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
lbPrev.addEventListener('click', e => { e.stopPropagation(); openLightbox((lbIndex - 1 + galleryImages.length) % galleryImages.length); });
lbNext.addEventListener('click', e => { e.stopPropagation(); openLightbox((lbIndex + 1) % galleryImages.length); });
document.addEventListener('keydown', e => {
  if (!lightbox.classList.contains('open')) return;
  if (e.key === 'Escape')       closeLightbox();
  if (e.key === 'ArrowLeft')    openLightbox((lbIndex - 1 + galleryImages.length) % galleryImages.length);
  if (e.key === 'ArrowRight')   openLightbox((lbIndex + 1) % galleryImages.length);
});

/* ── PARALLAX FEATURED IMAGE ── */
const featuredImg = document.querySelector('.featured-img img');
window.addEventListener('scroll', () => {
  if (!featuredImg) return;
  const rect     = featuredImg.closest('.featured-photo').getBoundingClientRect();
  const progress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
  if (progress >= 0 && progress <= 1) {
    featuredImg.style.transform = `translateY(${(progress - 0.5) * 60}px)`;
  }
}, { passive: true });
