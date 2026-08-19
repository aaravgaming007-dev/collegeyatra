/**
 * College यात्रा - Memories of Abhishek Kumar
 * Heavy Scroll Animations & Smooth Interaction Engine
 */

(function () {
  'use strict';

  // Storage Keys
  const STORAGE_KEY = 'college_yatra_memories_v5';
  const AUTH_SESSION_KEY = 'college_yatra_admin_logged_in';

  // Photo Dataset for Abhishek Kumar
  const DEFAULT_MEMORIES = [
    {
      id: 'mem-1',
      title: 'Campus Walk & Quadrangle',
      image: 'pic1.jpeg',
      location: 'Main Quadrangle',
      tag: 'Campus',
      caption: 'Starting off campus moments at the main quadrangle.',
      liked: true,
      createdAt: 1
    },
    {
      id: 'mem-2',
      title: 'College Annual Fest',
      image: 'pic2.jpeg',
      location: 'Auditorium Grounds',
      tag: 'Events',
      caption: 'Participating in annual college cultural fest activities and stage events.',
      liked: true,
      createdAt: 2
    },
    {
      id: 'mem-3',
      title: 'Tech Symposium & Workshop',
      image: 'pic3.jpeg',
      location: 'Seminar Hall B',
      tag: 'Academics',
      caption: 'Attending technical presentations and project display sessions.',
      liked: false,
      createdAt: 3
    },
    {
      id: 'mem-4',
      title: 'Group Photo with Friends',
      image: 'pic 4.jpeg',
      location: 'College Campus',
      tag: 'Friends',
      caption: 'Gathering with classmates outside the department building.',
      liked: true,
      createdAt: 4
    },
    {
      id: 'mem-5',
      title: 'Lab & Project Sessions',
      image: 'pic5.jpeg',
      location: 'Computer Lab 3',
      tag: 'Academics',
      caption: 'Working on project evaluations and practical lab exams.',
      liked: false,
      createdAt: 5
    },
    {
      id: 'mem-6',
      title: 'Campus Lawn Gathering',
      image: 'pic6.jpeg',
      location: 'Central Lawn',
      tag: 'Campus',
      caption: 'Unwinding after examinations with college friends.',
      liked: true,
      createdAt: 6
    },
    {
      id: 'mem-7',
      title: 'Graduation & Farewell Ceremony',
      image: 'pic7.jpeg',
      location: 'Main Auditorium',
      tag: 'Events',
      caption: 'Official farewell ceremony and graduation photograph.',
      liked: true,
      createdAt: 7
    }
  ];

  // State
  let memories = [];
  let activeTag = 'all';
  let searchQuery = '';
  let currentViewMode = 'grid'; // 'grid' | 'list'
  let currentLightboxIndex = 0;
  let filteredMemoriesList = [];
  let isAdminLoggedIn = false;
  let scrollObserver = null;

  // DOM Elements
  const galleryContainer = document.getElementById('gallery-container');
  const emptyState = document.getElementById('empty-state');
  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('clear-search-btn');
  const tagBtns = document.querySelectorAll('.tag-btn');
  const resetFiltersBtn = document.getElementById('reset-filters-btn');
  const viewGridBtn = document.getElementById('view-grid-btn');
  const viewListBtn = document.getElementById('view-list-btn');
  const totalPhotosStat = document.getElementById('total-photos-stat');

  // Lightbox Elements
  const lightboxModal = document.getElementById('lightbox-modal');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxTag = document.getElementById('lightbox-tag');
  const lightboxTitle = document.getElementById('lightbox-title');
  const lightboxLocation = document.getElementById('lightbox-location');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxCloseBtn = document.getElementById('lightbox-close-btn');
  const lightboxPrevBtn = document.getElementById('lightbox-prev-btn');
  const lightboxNextBtn = document.getElementById('lightbox-next-btn');

  // Admin Elements
  const adminLockBtn = document.getElementById('admin-lock-btn');
  const adminAuthModal = document.getElementById('admin-auth-modal');
  const adminAuthCard = document.getElementById('admin-auth-card');
  const adminAuthForm = document.getElementById('admin-auth-form');
  const adminPasswordInput = document.getElementById('admin-password-input');
  const togglePasswordBtn = document.getElementById('toggle-password-btn');
  const adminAuthError = document.getElementById('admin-auth-error');
  const adminAuthCloseBtn = document.getElementById('admin-auth-close-btn');

  const adminDashboardModal = document.getElementById('admin-dashboard-modal');
  const adminDashboardCloseBtn = document.getElementById('admin-dashboard-close-btn');
  const adminLogoutBtn = document.getElementById('admin-logout-btn');
  const addMemoryForm = document.getElementById('add-memory-form');
  const memoryFileInput = document.getElementById('memory-file-input');
  const memoryUrlInput = document.getElementById('memory-url-input');
  const fileLabelText = document.getElementById('file-label-text');
  const imagePreviewContainer = document.getElementById('image-preview-container');
  const imagePreview = document.getElementById('image-preview');
  const editMemoryIdInput = document.getElementById('edit-memory-id');
  const memoryTitleInput = document.getElementById('memory-title-input');
  const memoryLocationInput = document.getElementById('memory-location-input');
  const memoryTagSelect = document.getElementById('memory-tag-select');
  const memoryCaptionInput = document.getElementById('memory-caption-input');
  const saveMemoryBtn = document.getElementById('save-memory-btn');
  const cancelEditBtn = document.getElementById('cancel-edit-btn');
  const formHeading = document.getElementById('form-heading');
  const adminMemoriesList = document.getElementById('admin-memories-list');
  const adminMemoryCount = document.getElementById('admin-memory-count');

  const toastContainer = document.getElementById('toast-container');

  // Initialize
  function init() {
    initScrollObserver();
    loadMemoriesFromStorage();
    checkAdminSession();
    renderGallery();
    setupEventListeners();
    refreshLucideIcons();
  }

  // IntersectionObserver for Smooth Scroll Reveal
  function initScrollObserver() {
    if ('IntersectionObserver' in window) {
      scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            scrollObserver.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.08,
        rootMargin: '0px 0px -20px 0px'
      });
    }

    // Observe initial static elements
    document.querySelectorAll('.reveal-on-scroll').forEach(el => {
      if (scrollObserver) scrollObserver.observe(el);
      else el.classList.add('is-visible');
    });
  }

  function observeNewScrollElements() {
    document.querySelectorAll('.reveal-on-scroll:not(.is-visible)').forEach(el => {
      if (scrollObserver) scrollObserver.observe(el);
      else el.classList.add('is-visible');
    });
  }

  function loadMemoriesFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        memories = JSON.parse(stored);
      } else {
        memories = [...DEFAULT_MEMORIES];
        saveMemoriesToStorage();
      }
    } catch (e) {
      console.error('Error loading memories:', e);
      memories = [...DEFAULT_MEMORIES];
    }
  }

  function saveMemoriesToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(memories));
    } catch (e) {
      console.error('Storage limit:', e);
      showToast('Storage limit reached for local uploads', 'error');
    }
  }

  function checkAdminSession() {
    isAdminLoggedIn = sessionStorage.getItem(AUTH_SESSION_KEY) === 'true';
    if (isAdminLoggedIn) {
      adminLockBtn.classList.add('text-emerald-400', 'border-emerald-500/40');
    } else {
      adminLockBtn.classList.remove('text-emerald-400', 'border-emerald-500/40');
    }
  }

  function getFilteredMemories() {
    return memories.filter(mem => {
      if (activeTag !== 'all' && mem.tag !== activeTag) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const mTitle = mem.title.toLowerCase().includes(q);
        const mCap = mem.caption.toLowerCase().includes(q);
        const mLoc = mem.location.toLowerCase().includes(q);
        const mTag = mem.tag.toLowerCase().includes(q);
        return mTitle || mCap || mLoc || mTag;
      }
      return true;
    });
  }

  function renderGallery() {
    filteredMemoriesList = getFilteredMemories();

    if (totalPhotosStat) {
      totalPhotosStat.textContent = memories.length;
    }

    if (filteredMemoriesList.length === 0) {
      galleryContainer.innerHTML = '';
      emptyState.classList.remove('hidden');
      return;
    }

    emptyState.classList.add('hidden');

    if (currentViewMode === 'list') {
      renderListView(filteredMemoriesList);
    } else {
      renderGridView(filteredMemoriesList);
    }

    observeNewScrollElements();
    refreshLucideIcons();
  }

  function renderGridView(items) {
    galleryContainer.className = 'grid grid-cols-1 gap-4 transition-all duration-300';

    galleryContainer.innerHTML = items.map((mem, index) => {
      const staggerClass = `stagger-${(index % 5) + 1}`;
      return `
        <article class="editorial-card reveal-on-scroll ${staggerClass} group cursor-pointer" data-index="${index}">
          <div class="relative overflow-hidden aspect-[4/3] bg-slate-900" onclick="window.CollegeYatra.openLightbox(${index})">
            <img src="${mem.image}" alt="${escapeHtml(mem.title)}" loading="lazy" class="w-full h-full object-cover">
            
            <span class="absolute top-3 left-3 px-2 py-0.5 rounded bg-slate-950/80 text-amber-400 text-[10px] font-mono font-bold uppercase tracking-wider border border-slate-800 backdrop-blur-md">
              ${mem.tag}
            </span>
          </div>

          <div class="p-3.5 space-y-1.5">
            <div class="flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span class="flex items-center gap-1 text-slate-400">
                <i data-lucide="map-pin" class="w-3 h-3 text-amber-400"></i>
                ${escapeHtml(mem.location)}
              </span>
            </div>

            <h3 class="font-bold text-sm text-slate-100 group-hover:text-amber-300 transition-colors" onclick="window.CollegeYatra.openLightbox(${index})">
              ${escapeHtml(mem.title)}
            </h3>

            <p class="text-xs text-slate-400 line-clamp-2 leading-relaxed" onclick="window.CollegeYatra.openLightbox(${index})">
              ${escapeHtml(mem.caption)}
            </p>

            <div class="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
              <button onclick="window.CollegeYatra.toggleFavorite('${mem.id}', event)" class="heart-btn ${mem.liked ? 'liked' : ''} flex items-center gap-1 text-slate-400 hover:text-rose-400 transition-all p-1 active:scale-95">
                <i data-lucide="heart" class="w-3.5 h-3.5 ${mem.liked ? 'fill-rose-500 text-rose-500' : ''}"></i>
                <span class="text-[10px] font-mono">${mem.liked ? 'Saved' : 'Save'}</span>
              </button>

              <button onclick="window.CollegeYatra.openLightbox(${index})" class="flex items-center gap-1 text-amber-400 font-mono text-[11px] hover:underline">
                <span>View Photo</span>
                <i data-lucide="arrow-right" class="w-3 h-3"></i>
              </button>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  function renderListView(items) {
    galleryContainer.className = 'space-y-2.5 transition-all duration-300';

    galleryContainer.innerHTML = items.map((mem, index) => {
      const staggerClass = `stagger-${(index % 5) + 1}`;
      return `
        <div class="editorial-card reveal-on-scroll ${staggerClass} p-2.5 flex gap-3 items-center cursor-pointer" onclick="window.CollegeYatra.openLightbox(${index})">
          <img src="${mem.image}" alt="${escapeHtml(mem.title)}" class="w-16 h-16 object-cover rounded-lg shrink-0 bg-slate-900 border border-slate-800">
          <div class="flex-1 min-w-0 space-y-0.5">
            <div class="text-[10px] font-mono text-amber-400 font-bold uppercase">
              ${mem.tag}
            </div>
            <h3 class="font-bold text-xs text-slate-100 truncate hover:text-amber-300">
              ${escapeHtml(mem.title)}
            </h3>
            <p class="text-[11px] text-slate-400 truncate">
              ${escapeHtml(mem.caption)}
            </p>
          </div>
        </div>
      `;
    }).join('');
  }

  // Lightbox Controls
  function openLightbox(index) {
    if (!filteredMemoriesList[index]) return;
    currentLightboxIndex = index;
    updateLightboxContent();
    lightboxModal.classList.remove('hidden');
    lightboxModal.classList.add('flex');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightboxModal.classList.add('hidden');
    lightboxModal.classList.remove('flex');
    document.body.style.overflow = '';
  }

  function updateLightboxContent() {
    const mem = filteredMemoriesList[currentLightboxIndex];
    if (!mem) return;

    lightboxImg.src = mem.image;
    lightboxImg.alt = mem.title;
    lightboxTag.textContent = mem.tag;
    lightboxTitle.textContent = mem.title;
    lightboxLocation.textContent = mem.location;
    lightboxCaption.textContent = mem.caption;

    refreshLucideIcons();
  }

  function nextLightbox() {
    if (filteredMemoriesList.length === 0) return;
    currentLightboxIndex = (currentLightboxIndex + 1) % filteredMemoriesList.length;
    updateLightboxContent();
  }

  function prevLightbox() {
    if (filteredMemoriesList.length === 0) return;
    currentLightboxIndex = (currentLightboxIndex - 1 + filteredMemoriesList.length) % filteredMemoriesList.length;
    updateLightboxContent();
  }

  function toggleFavorite(id, event) {
    if (event) event.stopPropagation();
    const index = memories.findIndex(m => m.id === id);
    if (index !== -1) {
      memories[index].liked = !memories[index].liked;
      saveMemoriesToStorage();
      renderGallery();
      showToast(memories[index].liked ? 'Saved to collection ❤️' : 'Removed from collection', 'info');
    }
  }

  // Admin Controls
  function handleAdminLockClick() {
    if (isAdminLoggedIn) {
      openAdminDashboard();
    } else {
      openAdminAuthModal();
    }
  }

  function openAdminAuthModal() {
    adminPasswordInput.value = '';
    adminAuthError.classList.add('hidden');
    adminAuthModal.classList.remove('hidden');
    setTimeout(() => adminPasswordInput.focus(), 100);
  }

  function closeAdminAuthModal() {
    adminAuthModal.classList.add('hidden');
  }

  function submitAdminAuth(e) {
    e.preventDefault();
    const pwd = adminPasswordInput.value.trim();
    if (pwd.toLowerCase() === 'collegeyatra') {
      isAdminLoggedIn = true;
      sessionStorage.setItem(AUTH_SESSION_KEY, 'true');
      checkAdminSession();
      closeAdminAuthModal();
      openAdminDashboard();
      showToast('Admin Dashboard Unlocked 🔓', 'success');
    } else {
      adminAuthError.classList.remove('hidden');
      adminAuthCard.classList.add('shake-error');
      setTimeout(() => adminAuthCard.classList.remove('shake-error'), 400);
    }
  }

  function handleLogout() {
    isAdminLoggedIn = false;
    sessionStorage.removeItem(AUTH_SESSION_KEY);
    checkAdminSession();
    closeAdminDashboard();
    showToast('Logged out of Admin mode', 'info');
  }

  function openAdminDashboard() {
    renderAdminMemoriesList();
    adminDashboardModal.classList.remove('hidden');
    adminDashboardModal.classList.add('flex');
    document.body.style.overflow = 'hidden';
  }

  function closeAdminDashboard() {
    adminDashboardModal.classList.add('hidden');
    adminDashboardModal.classList.remove('flex');
    document.body.style.overflow = '';
    resetAddForm();
  }

  function renderAdminMemoriesList() {
    adminMemoryCount.textContent = memories.length;

    adminMemoriesList.innerHTML = memories.map((mem) => `
      <div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 gap-3">
        <img src="${mem.image}" alt="${escapeHtml(mem.title)}" class="w-10 h-10 object-cover rounded-lg shrink-0 bg-slate-900">
        
        <div class="flex-1 min-w-0">
          <div class="font-bold text-xs text-slate-100 truncate">${escapeHtml(mem.title)}</div>
          <div class="text-[10px] font-mono text-amber-400 font-semibold">
            ${mem.tag}
          </div>
        </div>

        <div class="flex items-center gap-1 shrink-0">
          <button onclick="window.CollegeYatra.editMemory('${mem.id}')" class="p-1.5 rounded bg-slate-800 text-amber-400 text-xs hover:bg-slate-700 active:scale-95">
            <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
          </button>
          <button onclick="window.CollegeYatra.deleteMemory('${mem.id}')" class="p-1.5 rounded bg-rose-500/10 text-rose-400 text-xs hover:bg-rose-500/20 active:scale-95">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </div>
    `).join('');

    refreshLucideIcons();
  }

  function handleAddMemorySubmit(e) {
    e.preventDefault();

    const editId = editMemoryIdInput.value;
    const title = memoryTitleInput.value.trim();
    const location = memoryLocationInput.value.trim();
    const tag = memoryTagSelect.value;
    const caption = memoryCaptionInput.value.trim();
    
    let imageUrl = memoryUrlInput.value.trim();

    if (imagePreview.src && imagePreview.src !== '' && !imagePreviewContainer.classList.contains('hidden')) {
      imageUrl = imagePreview.src;
    }

    if (!imageUrl) {
      showToast('Please upload an image file or enter a valid URL', 'error');
      return;
    }

    if (editId) {
      const index = memories.findIndex(m => m.id === editId);
      if (index !== -1) {
        memories[index] = {
          ...memories[index],
          title,
          location,
          tag,
          caption,
          image: imageUrl
        };
        showToast('Photo details updated ✨', 'success');
      }
    } else {
      const newMemory = {
        id: 'mem-' + Date.now(),
        title,
        location,
        tag,
        caption,
        image: imageUrl,
        liked: false,
        createdAt: Date.now()
      };
      memories.unshift(newMemory);
      showToast('New photo added to album! 🎉', 'success');
    }

    saveMemoriesToStorage();
    renderGallery();
    renderAdminMemoriesList();
    resetAddForm();
  }

  function editMemory(id) {
    const mem = memories.find(m => m.id === id);
    if (!mem) return;

    editMemoryIdInput.value = mem.id;
    memoryTitleInput.value = mem.title;
    memoryLocationInput.value = mem.location;
    memoryTagSelect.value = mem.tag;
    memoryCaptionInput.value = mem.caption;
    memoryUrlInput.value = mem.image.startsWith('data:') ? '' : mem.image;

    imagePreview.src = mem.image;
    imagePreviewContainer.classList.remove('hidden');
    formHeading.textContent = 'Edit Photo';
    saveMemoryBtn.textContent = 'Update Photo';
    cancelEditBtn.classList.remove('hidden');

    adminDashboardModal.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function deleteMemory(id) {
    if (confirm('Delete this photo entry from album?')) {
      memories = memories.filter(m => m.id !== id);
      saveMemoriesToStorage();
      renderGallery();
      renderAdminMemoriesList();
      showToast('Photo removed', 'info');
    }
  }

  function resetAddForm() {
    addMemoryForm.reset();
    editMemoryIdInput.value = '';
    imagePreview.src = '';
    imagePreviewContainer.classList.add('hidden');
    fileLabelText.textContent = 'Choose file from device';
    formHeading.textContent = 'Add Photo';
    saveMemoryBtn.textContent = 'Save Photo';
    cancelEditBtn.classList.add('hidden');
  }

  function handleFileInputChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file', 'error');
      return;
    }

    fileLabelText.textContent = file.name;

    const reader = new FileReader();
    reader.onload = function (event) {
      imagePreview.src = event.target.result;
      imagePreviewContainer.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  }

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    const bg = type === 'success' ? 'bg-emerald-500 text-slate-950 font-bold' :
               type === 'error' ? 'bg-rose-500 text-white font-bold' :
               'bg-slate-100 text-slate-950 font-bold';

    toast.className = `p-2.5 rounded-xl shadow-lg text-xs font-mono text-center transform transition-all duration-200 translate-y-3 opacity-0 pointer-events-auto ${bg}`;
    toast.textContent = message;

    toastContainer.appendChild(toast);

    setTimeout(() => toast.classList.remove('translate-y-3', 'opacity-0'), 10);
    setTimeout(() => {
      toast.classList.add('translate-y-3', 'opacity-0');
      setTimeout(() => toast.remove(), 2500);
    }, 2500);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function refreshLucideIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  function setupEventListeners() {
    adminLockBtn.addEventListener('click', handleAdminLockClick);
    adminAuthCloseBtn.addEventListener('click', closeAdminAuthModal);
    adminAuthForm.addEventListener('submit', submitAdminAuth);
    adminLogoutBtn.addEventListener('click', handleLogout);
    adminDashboardCloseBtn.addEventListener('click', closeAdminDashboard);

    togglePasswordBtn.addEventListener('click', () => {
      const isPwd = adminPasswordInput.type === 'password';
      adminPasswordInput.type = isPwd ? 'text' : 'password';
      togglePasswordBtn.innerHTML = `<i data-lucide="${isPwd ? 'eye-off' : 'eye'}" class="w-4 h-4"></i>`;
      refreshLucideIcons();
    });

    memoryFileInput.addEventListener('change', handleFileInputChange);
    memoryUrlInput.addEventListener('input', (e) => {
      const url = e.target.value.trim();
      if (url) {
        imagePreview.src = url;
        imagePreviewContainer.classList.remove('hidden');
      } else if (!memoryFileInput.files.length) {
        imagePreviewContainer.classList.add('hidden');
      }
    });

    addMemoryForm.addEventListener('submit', handleAddMemorySubmit);
    cancelEditBtn.addEventListener('click', resetAddForm);

    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      if (searchQuery) {
        clearSearchBtn.classList.remove('hidden');
      } else {
        clearSearchBtn.classList.add('hidden');
      }
      renderGallery();
    });

    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchQuery = '';
      clearSearchBtn.classList.add('hidden');
      renderGallery();
    });

    tagBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tagBtns.forEach(b => {
          b.classList.remove('active', 'bg-slate-100', 'text-slate-950', 'font-semibold');
          b.classList.add('bg-slate-900', 'border', 'border-slate-800', 'text-slate-300');
        });

        btn.classList.add('active', 'bg-slate-100', 'text-slate-950', 'font-semibold');
        btn.classList.remove('bg-slate-900', 'border', 'border-slate-800', 'text-slate-300');

        activeTag = btn.getAttribute('data-tag');
        renderGallery();
      });
    });

    resetFiltersBtn.addEventListener('click', () => {
      activeTag = 'all';
      searchQuery = '';
      searchInput.value = '';
      clearSearchBtn.classList.add('hidden');

      tagBtns.forEach(b => {
        if (b.getAttribute('data-tag') === 'all') {
          b.classList.add('active', 'bg-slate-100', 'text-slate-950', 'font-semibold');
          b.classList.remove('bg-slate-900', 'border', 'border-slate-800', 'text-slate-300');
        } else {
          b.classList.remove('active', 'bg-slate-100', 'text-slate-950', 'font-semibold');
          b.classList.add('bg-slate-900', 'border', 'border-slate-800', 'text-slate-300');
        }
      });

      renderGallery();
    });

    viewGridBtn.addEventListener('click', () => {
      currentViewMode = 'grid';
      viewGridBtn.classList.add('bg-slate-800', 'text-amber-400');
      viewGridBtn.classList.remove('text-slate-400');
      viewListBtn.classList.remove('bg-slate-800', 'text-amber-400');
      viewListBtn.classList.add('text-slate-400');
      renderGallery();
    });

    viewListBtn.addEventListener('click', () => {
      currentViewMode = 'list';
      viewListBtn.classList.add('bg-slate-800', 'text-amber-400');
      viewListBtn.classList.remove('text-slate-400');
      viewGridBtn.classList.remove('bg-slate-800', 'text-amber-400');
      viewGridBtn.classList.add('text-slate-400');
      renderGallery();
    });

    lightboxCloseBtn.addEventListener('click', closeLightbox);
    lightboxPrevBtn.addEventListener('click', prevLightbox);
    lightboxNextBtn.addEventListener('click', nextLightbox);

    document.addEventListener('keydown', (e) => {
      if (!lightboxModal.classList.contains('hidden')) {
        if (e.key === 'ArrowRight') nextLightbox();
        if (e.key === 'ArrowLeft') prevLightbox();
        if (e.key === 'Escape') closeLightbox();
      } else if (!adminAuthModal.classList.contains('hidden')) {
        if (e.key === 'Escape') closeAdminAuthModal();
      } else if (!adminDashboardModal.classList.contains('hidden')) {
        if (e.key === 'Escape') closeAdminDashboard();
      }
    });
  }

  window.CollegeYatra = {
    openLightbox,
    toggleFavorite,
    editMemory,
    deleteMemory
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
