/**
 * Portfolio Je-tu-il (https://je-tu-il.github.io)
 * Moteur JavaScript : Catalogue dynamique, filtrage instantané, Command Palette Raycast
 */

let allProjects = [];
let activeCategory = 'all';
let searchQuery = '';
let paletteSelectedIndex = 0;
let paletteFilteredList = [];

// DOM Elements
const gridContainer = document.getElementById('projectsGrid');
const searchInput = document.getElementById('mainSearchInput');
const countDisplay = document.getElementById('countDisplay');
const paletteModal = document.getElementById('commandPalette');
const paletteInput = document.getElementById('paletteInput');
const paletteResults = document.getElementById('paletteResults');

function demoUrl(project) {
  return project.runnableUrl || "projects/demo.html?id=" + encodeURIComponent(project.id);
}

// Initialize
async function initPortfolio() {
  try {
    if (window.PROJECTS_DATA && Array.isArray(window.PROJECTS_DATA)) {
      allProjects = window.PROJECTS_DATA;
    } else {
      const res = await fetch('data/projects.json');
      if (!res.ok) throw new Error("Erreur de chargement des données");
      allProjects = await res.json();
    }
    updateCatalogueCounts();
    renderProjects();
    setupCommandPalette();
    setupKeyboardShortcuts();
  } catch (err) {
    console.error("Échec chargement projects.json :", err);
    if (gridContainer) {
      gridContainer.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #ef4444;">Impossible de charger les projets. Veuillez rafraîchir la page.</div>';
    }
  }
}

function updateCatalogueCounts() {
  for (const node of document.querySelectorAll('[data-project-total]')) {
    node.textContent = allProjects.length;
  }
  for (const node of document.querySelectorAll('[data-count-category]')) {
    const category = node.dataset.countCategory;
    node.textContent = allProjects.filter(project => category === 'all' ||
      (category === 'runnable' ? project.isRunnable : project.category === category)).length;
  }
}

// Filter and Render Projects
function renderProjects() {
  if (!gridContainer) return;

  const q = searchQuery.toLowerCase().trim();

  const filtered = allProjects.filter(p => {
    // Category Filter
    if (activeCategory === 'runnable' && !p.isRunnable) return false;
    if (activeCategory !== 'all' && activeCategory !== 'runnable' && p.category !== activeCategory) return false;

    // Search Query Filter
    if (!q) return true;
    const matchTitle = (p.title || '').toLowerCase().includes(q);
    const matchTagline = (p.tagline || '').toLowerCase().includes(q);
    const matchDesc = (p.description || '').toLowerCase().includes(q);
    const matchTech = (p.techStack || []).some(t => t.toLowerCase().includes(q));
    const matchCat = (p.categoryLabel || '').toLowerCase().includes(q);

    return matchTitle || matchTagline || matchDesc || matchTech || matchCat;
  });

  // Update Count
  if (countDisplay) {
    countDisplay.innerText = `Affichage de ${filtered.length} sur ${allProjects.length} projets`;
  }

  // Empty state
  if (filtered.length === 0) {
    gridContainer.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: var(--text-muted);">
        <div style="font-size: 32px; margin-bottom: 12px;">🔍</div>
        <h3 style="font-size: 18px; color: #fff; margin-bottom: 8px;">Aucun projet ne correspond à votre recherche</h3>
        <p style="font-size: 14px;">Essayez d'élargir votre recherche ou de sélectionner une autre catégorie.</p>
      </div>
    `;
    return;
  }

  // Render cards
  gridContainer.innerHTML = filtered.map(p => {
    let statusClass = 'opensource';
    if (p.isRunnable) statusClass = 'live';
    else if (p.category === '3d-hardware') statusClass = 'hardware';
    else if (p.category === 'concepts') statusClass = 'specs';

    const techPills = (p.techStack || []).slice(0, 4).map(t => `<span class="tech-tag">${t}</span>`).join('');
    
    const action = p.runnableUrl ? 'Ouvrir sur le web' : 'Voir le parcours';
    const primaryBtn = `<a href="${demoUrl(p)}" class="btn-card-launch">${action}</a>`;

    return `
      <div class="project-card" data-id="${p.id}">
        <div>
          <div class="card-top">
            <div class="card-icon">${p.icon || '🚀'}</div>
            <div class="card-badges">
              <span class="status-badge ${statusClass}">
                ${p.isRunnable ? '✨ Démo en direct' : p.status}
              </span>
              <span class="card-category-tag">${p.categoryLabel || p.category}</span>
            </div>
          </div>

          <h3 class="card-title">${p.title}</h3>
          <p class="card-tagline">${p.tagline}</p>

          <div class="card-tech-pills">
            ${techPills}
          </div>
        </div>

        <div class="card-actions">
          ${primaryBtn}
          <a href="projects/project.html?id=${encodeURIComponent(p.id)}" class="btn-card-details">Détails →</a>
        </div>
      </div>
    `;
  }).join('');
}

// Category filter button click
function setCategory(cat, element) {
  activeCategory = cat;
  document.querySelectorAll('.cat-pill').forEach(btn => btn.classList.remove('active'));
  if (element) element.classList.add('active');
  renderProjects();
}

// Search input listener
if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderProjects();
  });
}

// Command Palette (Raycast / Spotlight modal)
function setupCommandPalette() {
  if (!paletteInput) return;

  paletteInput.addEventListener('input', () => {
    paletteSelectedIndex = 0;
    renderPaletteResults();
  });

  paletteInput.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (paletteFilteredList.length > 0) {
        paletteSelectedIndex = (paletteSelectedIndex + 1) % paletteFilteredList.length;
        highlightPaletteItem();
        scrollPaletteIntoView();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (paletteFilteredList.length > 0) {
        paletteSelectedIndex = (paletteSelectedIndex - 1 + paletteFilteredList.length) % paletteFilteredList.length;
        highlightPaletteItem();
        scrollPaletteIntoView();
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = paletteFilteredList[paletteSelectedIndex];
      if (selected) window.location.href = demoUrl(selected);
    } else if (e.key === 'Escape') {
      closePalette();
    }
  });
}

function openPalette() {
  if (!paletteModal) return;
  paletteModal.classList.add('open');
  paletteInput.value = '';
  paletteSelectedIndex = 0;
  renderPaletteResults();
  setTimeout(() => paletteInput.focus(), 50);
}

function closePalette(e) {
  if (!e || e.target.id === 'commandPalette' || e.key === 'Escape') {
    if (paletteModal) paletteModal.classList.remove('open');
  }
}

function renderPaletteResults() {
  if (!paletteResults) return;

  const q = paletteInput.value.toLowerCase().trim();

  paletteFilteredList = allProjects.filter(p => {
    if (!q) return true;
    return p.title.toLowerCase().includes(q) ||
           p.tagline.toLowerCase().includes(q) ||
           (p.techStack || []).some(t => t.toLowerCase().includes(q));
  });

  if (paletteFilteredList.length === 0) {
    paletteResults.innerHTML = `
      <div style="padding: 24px; text-align: center; color: var(--text-dim); font-size: 13px;">
        Aucun projet trouvé.
      </div>
    `;
    return;
  }

  paletteResults.innerHTML = paletteFilteredList.map((p, idx) => {
    const isSelected = idx === paletteSelectedIndex;
    const targetUrl = demoUrl(p);

    return `
      <a href="${targetUrl}" class="palette-item ${isSelected ? 'active' : ''}" onmouseenter="paletteSelectedIndex=${idx}; highlightPaletteItem();">
        <div class="palette-item-left">
          <span class="palette-item-icon">${p.icon || '🚀'}</span>
          <div>
            <div class="palette-item-title">${p.title}</div>
            <div class="palette-item-sub">${p.tagline.substring(0, 70)}...</div>
          </div>
        </div>
        <span class="palette-item-badge">${p.isRunnable ? 'Démo directe' : p.categoryLabel}</span>
      </a>
    `;
  }).join('');
}

function highlightPaletteItem() {
  const items = paletteResults.querySelectorAll('.palette-item');
  items.forEach((it, i) => it.classList.toggle('active', i === paletteSelectedIndex));
}

function scrollPaletteIntoView() {
  const item = paletteResults.children[paletteSelectedIndex];
  if (item) item.scrollIntoView({ block: 'nearest' });
}

// Global Keyboard Shortcut (Ctrl+K or Cmd+K)
function setupKeyboardShortcuts() {
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (paletteModal && paletteModal.classList.contains('open')) {
        closePalette();
      } else {
        openPalette();
      }
    } else if (e.key === 'Escape') {
      closePalette();
    }
  });
}

// Document Ready
window.addEventListener('DOMContentLoaded', initPortfolio);
