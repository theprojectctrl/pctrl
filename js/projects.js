// Projects Page JavaScript
class ProjectsPage {
  constructor() {
    this.slides = document.querySelectorAll('.slide');
    this.projectCards = document.querySelectorAll('.project-card');
    this.sliderContainer = document.querySelector('.slider-container');
    this.prevButton = document.querySelector('.slider-button.prev');
    this.nextButton = document.querySelector('.slider-button.next');
    this.filterToggle = document.querySelector('.filter-toggle');
    this.filterPanel = document.querySelector('.filter-panel');
    this.filterOptions = document.querySelectorAll('.filter-option input');
    
    this.currentPage = 0;
    this.slidesPerPage = this.getSlidesPerPage();
    this.autoSlideInterval = null;
    this.observer = null;
    
    // Spotlight pagination
    this.slidesPerPage = 3; // Show 3 slides at a time
    this.currentPage = 0;
    this.spotlightPrevButton = document.querySelector('.spotlight-section .pagination-button.prev-page');
    this.spotlightNextButton = document.querySelector('.spotlight-section .pagination-button.next-page');
    this.spotlightCurrentPageSpan = document.querySelector('.spotlight-section .current-page');
    this.spotlightTotalPagesSpan = document.querySelector('.spotlight-section .total-pages');
    
    // Community projects pagination
    this.projectsPerPage = 25; // Show 25 projects per page
    this.currentProjectsPage = window.location.pathname.includes('projects-page-2.html') ? 2 : 1;
    this.communityPrevButton = document.querySelector('.community-section .pagination-button.prev-page');
    this.communityNextButton = document.querySelector('.community-section .pagination-button.next-page');
    this.communityCurrentPageSpan = document.querySelector('.community-section .current-page');
    this.communityTotalPagesSpan = document.querySelector('.community-section .total-pages');
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupIntersectionObserver();
    this.slides.forEach(slide => {
      slide.style.display = 'block';
      slide.classList.remove('active');
      slide.style.animation = '';
    });
    this.checkSuccessMessage();
    this.setupPagination();
    this.updateSpotlightPagination();
    this.updateCommunityPagination();
    this.updateProjectsPage();

    // Add event listener for always-visible clear filters button
    const clearBtn = document.querySelector('.cta-buttons .clear-filters');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearFilters());
    }
  }

  getSlidesPerPage() {
    return window.innerWidth > 1024 ? 3 : window.innerWidth > 768 ? 2 : 1;
  }

  setupEventListeners() {
    // Slider navigation
    this.prevButton?.addEventListener('click', () => {
      this.prevPage();
      this.stopAutoSlide();
    });

    this.nextButton?.addEventListener('click', () => {
      this.nextPage();
      this.stopAutoSlide();
    });

    // Filter toggle
    this.filterToggle?.addEventListener('click', () => {
      const isHidden = this.filterPanel.style.display === 'none' || this.filterPanel.style.display === '';
      this.filterPanel.style.display = isHidden ? 'block' : 'none';
      this.filterToggle.classList.toggle('active');
    });

    // Filter options
    this.filterOptions?.forEach(option => {
      option.addEventListener('change', () => this.updateVisibility());
    });

    // Window resize
    window.addEventListener('resize', () => {
      this.updateSlidesPerPage();
    });

    // Event delegation for project cards
    document.addEventListener('click', (e) => {
      const card = e.target.closest('.slide, .project-card');
      if (card) {
        this.handleCardClick(card);
      }
    });
  }

  setupIntersectionObserver() {
    const options = {
      threshold: 0.5,
      rootMargin: '50px'
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const counter = entry.target;
          const target = parseInt(counter.dataset.target);
          this.animateCounter(counter, target);
          this.observer.unobserve(counter);
        }
      });
    }, options);

    document.querySelectorAll('.metric-value').forEach(counter => {
      this.observer.observe(counter);
    });
  }

  showPage(page) {
    const totalPages = Math.ceil(this.slides.length / this.slidesPerPage);
    this.currentPage = (page + totalPages) % totalPages;

    this.slides.forEach((slide, index) => {
      const slidePosition = index - (this.currentPage * this.slidesPerPage);
      
      if (slidePosition >= 0 && slidePosition < this.slidesPerPage) {
        slide.style.display = 'block';
        slide.classList.add('active');
        slide.style.animation = 'slideIn 0.5s forwards';
        slide.style.animationDelay = `${slidePosition * 0.1}s`;
      } else {
        slide.style.display = 'none';
        slide.classList.remove('active');
        slide.style.animation = '';
      }
    });
  }

  nextPage() {
    this.showPage(this.currentPage + 1);
  }

  prevPage() {
    this.showPage(this.currentPage - 1);
  }

  startAutoSlide() {
    this.stopAutoSlide();
    this.autoSlideInterval = setInterval(() => this.nextPage(), 5000);
  }

  stopAutoSlide() {
    if (this.autoSlideInterval) {
      clearInterval(this.autoSlideInterval);
    }
  }

  updateSlidesPerPage() {
    this.slidesPerPage = this.getSlidesPerPage();
    this.showPage(this.currentPage);
  }

  animateCounter(counter, target) {
    let current = 0;
    const duration = 2000;
    const step = (target / duration) * 16;
    
    counter.classList.add('animate-count');
    
    const updateCounter = () => {
      current += step;
      if (current < target) {
        counter.textContent = Math.round(current);
        requestAnimationFrame(updateCounter);
      } else {
        counter.textContent = target;
      }
    };
    
    updateCounter();
  }

  updateVisibility() {
    const selectedFilters = this.getSelectedFilters();
    this.updateFilterCount(selectedFilters);
    this.filterProjects(selectedFilters);
  }

  getSelectedFilters() {
    const filters = {
      category: new Set()
    };

    this.filterOptions.forEach(option => {
      if (option.checked) {
        filters[option.name].add(option.value);
      }
    });

    return filters;
  }

  updateFilterCount(selectedFilters) {
    const totalSelected = Object.values(selectedFilters)
      .reduce((sum, set) => sum + set.size, 0);
    const filterCount = document.querySelector('.filter-count');
    
    if (totalSelected > 0) {
      filterCount.textContent = `(${totalSelected})`;
      this.filterToggle.classList.add('has-filters');
    } else {
      filterCount.textContent = '';
      this.filterToggle.classList.remove('has-filters');
    }
  }

  async filterProjects(selectedFilters) {
    // Remove any existing popup
    document.querySelectorAll('.popup-overlay.filter-popup').forEach(el => el.remove());

    // Check if CTRL Picks filter is selected
    const ctrlPicksSelected = selectedFilters.ctrlpicks && selectedFilters.ctrlpicks.has('CTRL Picks');
    const hasCategoryFilters = selectedFilters.category && selectedFilters.category.size > 0;
    if (!ctrlPicksSelected && !hasCategoryFilters) {
      this.showAllProjects();
      return;
    }

    // Gather all project cards from the current page
    let allCards = Array.from(this.projectCards);

    // Determine the other page to fetch
    let otherPage = '';
    if (window.location.pathname.includes('projects.html')) {
      otherPage = 'projects-page-2.html';
    } else if (window.location.pathname.includes('projects-page-2.html')) {
      otherPage = 'projects.html';
    }

    // Fetch and parse project cards from the other page
    if (otherPage) {
      try {
        const response = await fetch(otherPage);
        const text = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        const otherCards = Array.from(doc.querySelectorAll('.project-card'));
        allCards = allCards.concat(otherCards);
      } catch (e) {
        // If fetch fails, just use current page's cards
      }
    }

    // Filtering logic
    let matchingCards = allCards;
    if (ctrlPicksSelected) {
      matchingCards = matchingCards.filter(card => card.querySelector('.ctrl-pick-badge'));
    }
    if (hasCategoryFilters) {
      matchingCards = matchingCards.filter(element => {
        const tags = Array.from(element.querySelectorAll('.tag-category'));
        return Array.from(selectedFilters.category).some(selectedCategory =>
          tags.some(tag => tag.textContent.trim() === selectedCategory.trim())
        );
      });
    }

    if (matchingCards.length > 0) {
      this.showMultipleProjectsPopup(matchingCards);
    } else {
      this.showNoResultsPopup();
    }
  }

  showMultipleProjectsPopup(cards) {
    console.log('Popup called with projects:', cards);
    // Remove any existing filter popups
    document.querySelectorAll('.popup-overlay.filter-popup').forEach(el => el.remove());
    // Create popup overlay
    const div = document.createElement('div');
    div.className = 'popup-overlay filter-popup';
    div.innerHTML = `
      <div class="project-popup" style="max-width:900px;overflow:auto;max-height:90vh;">
        <button class="close-button" style="font-size:2.5rem;line-height:2rem;width:2.5rem;height:2.5rem;top:1rem;right:1rem;position:absolute;z-index:10;background:none;border:none;cursor:pointer;">×</button>
        <div style="padding:1rem 1rem 0 1rem;text-align:center;">
          <h2>Matching Projects</h2>
        </div>
        <div class="popup-projects-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.5rem;padding:1.5rem;"></div>
      </div>
    `;
    document.body.prepend(div);
    // Render each matching card as a mini card in the popup
    const grid = div.querySelector('.popup-projects-grid');
    cards.forEach(card => {
      const miniCard = card.cloneNode(true);
      miniCard.classList.add('popup-mini-card');
      // Remove any event listeners from the clone
      miniCard.onclick = null;
      grid.appendChild(miniCard);
    });
    // Robust close button
    const closeBtn = div.querySelector('.close-button');
    if (closeBtn) {
      closeBtn.onclick = () => div.remove();
    } else {
      // Fallback: close on overlay click
      div.onclick = (e) => {
        if (e.target === div) div.remove();
      };
    }
  }

  showNoResultsPopup() {
    // Remove any existing filter popups
    document.querySelectorAll('.popup-overlay.filter-popup').forEach(el => el.remove());
    // Create a simple popup
    const div = document.createElement('div');
    div.className = 'popup-overlay filter-popup';
    div.innerHTML = `
      <div class="project-popup">
        <button class="close-button">×</button>
        <div style="padding:2rem;text-align:center;">
          <h2>No projects found in the selected category.</h2>
          <button class="secondary-button clear-filters">
            Clear Filters <span class="button-icon">×</span>
          </button>
        </div>
      </div>
    `;
    document.body.prepend(div);
    div.querySelector('.close-button').onclick = () => div.remove();
    div.querySelector('.clear-filters').onclick = () => this.clearFilters();
  }

  showAllProjects() {
    this.projectCards.forEach(card => card.style.display = 'block');
    // Remove any filter popups
    document.querySelectorAll('.popup-overlay.filter-popup').forEach(el => el.remove());
  }

  handleCardClick(card) {
    if (this.autoSlideInterval) {
      this.stopAutoSlide();
    }
    
    const template = document.querySelector('#project-popup-template');
    const popup = template.content.cloneNode(true);
    
    this.populatePopupContent(popup, card);
    document.body.appendChild(popup);
    
    this.setupPopupClose(popup, card);
  }

  populatePopupContent(popup, card) {
    const title = card.querySelector('h3').textContent;
    const tags = Array.from(card.querySelectorAll('.project-tags .tag')).map(tag => tag.cloneNode(true));
    
    const leadName = card.dataset.leadName || 'Project Lead Name';
    const leadRole = card.dataset.leadRole || 'Project Role';
    const leadEmail = card.dataset.leadEmail || '';
    const leadPhone = card.dataset.leadPhone || '';
    
    popup.querySelector('h2').textContent = title;
    popup.querySelector('.member-name').textContent = leadName;
    popup.querySelector('.member-role').textContent = leadRole;
    
    const popupTags = popup.querySelector('.project-tags');
    popupTags.innerHTML = '';
    tags.forEach(tag => popupTags.appendChild(tag));
    
    this.setupContactInfo(popup, leadEmail, leadPhone);
  }

  setupContactInfo(popup, email, phone) {
    const contactDetails = popup.querySelector('.contact-details');
    const emailElement = contactDetails.querySelector('.contact-method:first-child .contact-value');
    const phoneElement = contactDetails.querySelector('.contact-method:last-child .contact-value');
    
    emailElement.textContent = email;
    phoneElement.textContent = phone;
    
    if (!email && !phone) {
      phoneElement.parentElement.style.display = 'none';
      emailElement.parentElement.style.display = 'none';
    } else {
      if (!email) emailElement.parentElement.style.display = 'none';
      if (!phone) phoneElement.parentElement.style.display = 'none';
    }
  }

  setupPopupClose(popup, card) {
    const overlay = document.querySelector('.popup-overlay');
    const closeButton = overlay.querySelector('.close-button');
    
    if (overlay) {
      const closePopup = () => {
        overlay.remove();
        if (card.classList.contains('slide')) {
          this.startAutoSlide();
        }
      };
      
      overlay.addEventListener('click', (e) => {
        if (e.target.classList.contains('popup-overlay')) {
          closePopup();
        }
      });
      
      closeButton.addEventListener('click', closePopup);
    }
  }

  checkSuccessMessage() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('status') === 'success') {
      const successMessage = document.getElementById('submission-success');
      successMessage.style.display = 'block';
      
      window.history.replaceState({}, document.title, window.location.pathname);
      
      setTimeout(() => {
        successMessage.style.display = 'none';
      }, 10000);
    }
  }

  setupPagination() {
    // Setup spotlight pagination
    if (this.spotlightPrevButton && this.spotlightNextButton) {
      this.spotlightPrevButton.addEventListener('click', () => {
        if (this.currentPage > 0) {
          this.currentPage--;
          this.showPage(this.currentPage);
          this.updateSpotlightPagination();
        }
      });

      this.spotlightNextButton.addEventListener('click', () => {
        const totalPages = Math.ceil(this.slides.length / this.slidesPerPage);
        if (this.currentPage < totalPages - 1) {
          this.currentPage++;
          this.showPage(this.currentPage);
          this.updateSpotlightPagination();
        }
      });
    }

    // Setup community projects pagination
    if (this.communityPrevButton && this.communityNextButton) {
      this.communityPrevButton.addEventListener('click', () => {
        if (this.currentProjectsPage === 2) {
          window.location.href = 'projects.html';
        }
      });

      this.communityNextButton.addEventListener('click', () => {
        if (this.currentProjectsPage === 1) {
          window.location.href = 'projects-page-2.html';
        }
      });
    }
  }

  updateProjectsPage() {
    const startIndex = (this.currentProjectsPage - 1) * this.projectsPerPage;
    const endIndex = startIndex + this.projectsPerPage;

    this.projectCards.forEach((card, index) => {
      if (index >= startIndex && index < endIndex) {
        card.style.display = 'block';
      } else {
        card.style.display = 'none';
      }
    });
  }

  updateSpotlightPagination() {
    if (!this.spotlightCurrentPageSpan || !this.spotlightTotalPagesSpan) return;

    const totalPages = Math.ceil(this.slides.length / this.slidesPerPage);
    
    this.spotlightCurrentPageSpan.textContent = this.currentPage + 1;
    this.spotlightTotalPagesSpan.textContent = totalPages;
    
    if (this.spotlightPrevButton) {
      this.spotlightPrevButton.disabled = this.currentPage === 0;
      this.spotlightPrevButton.innerHTML = '<span class="button-icon">←</span> Previous';
    }
    
    if (this.spotlightNextButton) {
      this.spotlightNextButton.disabled = this.currentPage === totalPages - 1;
      this.spotlightNextButton.innerHTML = 'Next <span class="button-icon">→</span>';
    }
  }

  updateCommunityPagination() {
    if (!this.communityCurrentPageSpan || !this.communityTotalPagesSpan) return;
    
    this.communityCurrentPageSpan.textContent = this.currentProjectsPage;
    this.communityTotalPagesSpan.textContent = 2; // We have 2 pages total
    
    if (this.communityPrevButton) {
      this.communityPrevButton.disabled = this.currentProjectsPage === 1;
      if (this.currentProjectsPage === 2) {
        this.communityPrevButton.innerHTML = '<span class="button-icon">←</span> Back to Project Hub';
      } else {
        this.communityPrevButton.innerHTML = '<span class="button-icon">←</span> Previous';
      }
    }
    
    if (this.communityNextButton) {
      this.communityNextButton.disabled = this.currentProjectsPage === 2;
      if (this.currentProjectsPage === 1) {
        this.communityNextButton.innerHTML = 'View More Projects <span class="button-icon">→</span>';
      } else {
        this.communityNextButton.innerHTML = 'Next <span class="button-icon">→</span>';
      }
    }
  }

  clearFilters() {
    // Uncheck all filter checkboxes
    this.filterOptions.forEach(option => {
      option.checked = false;
    });

    // Reset filter count
    const filterCount = document.querySelector('.filter-count');
    if (filterCount) {
      filterCount.textContent = '';
    }

    // Hide filter panel
    if (this.filterPanel) {
      this.filterPanel.style.display = 'none';
    }

    // Show all projects
    this.showAllProjects();
  }
}

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const grid = document.querySelector('.projects-grid');
  const template = document.getElementById('project-card-template');
  let allProjects = [];
  let filteredProjects = [];

  // Restore filter toggle button functionality
  const filterToggle = document.querySelector('.filter-toggle');
  const filterPanel = document.querySelector('.filter-panel');
  if (filterToggle && filterPanel) {
    filterToggle.addEventListener('click', () => {
      const isHidden = filterPanel.style.display === 'none' || filterPanel.style.display === '';
      filterPanel.style.display = isHidden ? 'block' : 'none';
      filterToggle.classList.toggle('active');
    });
  }

  // Fetch project data
  fetch('projects.json')
    .then(res => res.json())
    .then(data => {
      allProjects = data;
      filteredProjects = data;
      renderProjects(filteredProjects);
      setupFilters();
    });

  // Render projects
  function renderProjects(projects) {
    grid.innerHTML = '';
    projects.forEach(project => {
      const card = template.content.cloneNode(true).querySelector('.project-card');
      // Badge
      if (project.ctrlPick) {
        const badge = document.createElement('div');
        badge.className = 'ctrl-pick-badge';
        badge.innerHTML = '<span class="star-icon">⭐</span> CTRL Picks';
        card.prepend(badge);
      }
      // Header
      card.querySelector('.project-title').textContent = project.title;
      // Tags
      const tags = card.querySelector('.project-tags');
      tags.innerHTML = '';
      
      // Always add category tag first
      if (project.category) {
        tags.innerHTML += `<span class="tag tag-category">${project.category}</span>`;
      }
      
      // Add other tags in a specific order with color rotation
      const otherTags = [
        { value: project.type, class: 'tag-type' },
        { value: project.stage, class: 'tag-stage' },
        { value: project.modality, class: 'tag-modality' },
        { value: project.team, class: 'tag-team' },
        { value: project.marketReach, class: 'tag-market' },
        { value: project.duration, class: 'tag-duration' }
      ].filter(tag => tag.value);

      // Add status tags if they exist
      if (project.status && Array.isArray(project.status)) {
        project.status.forEach(st => {
          if (st) otherTags.push({ value: st, class: 'tag-status' });
        });
      }

      // Add other tags with color rotation
      otherTags.forEach((tag, index) => {
        const colorClass = `tag-color-${(index % 8) + 1}`; // 8 different colors
        tags.innerHTML += `<span class="tag ${tag.class} ${colorClass}">${tag.value}</span>`;
      });

      card.querySelector('.project-description').textContent = project.description || '';
      // Data attributes for popup
      card.dataset.leadName = project.leadName || '';
      card.dataset.leadRole = project.leadRole || '';
      card.dataset.leadEmail = project.leadEmail || '';
      card.dataset.leadPhone = project.leadPhone || '';
      card.dataset.preferredContact = project.preferredContact || '';
      card.dataset.title = project.title || '';
      card.dataset.type = project.type || '';
      card.dataset.category = project.category || '';
      card.dataset.stage = project.stage || '';
      card.dataset.team = project.team || '';
      card.dataset.modality = project.modality || '';
      card.dataset.marketReach = project.marketReach || '';
      card.dataset.duration = project.duration || '';
      card.dataset.status = project.status ? project.status.join(',') : '';
      card.dataset.description = project.description || '';
      card.dataset.ctrlPick = project.ctrlPick ? 'true' : '';
      card.dataset.website = project.website || '';
      // Popup click
      card.addEventListener('click', () => showPopup(project));
      grid.appendChild(card);
    });
  }

  // Filtering logic
  function setupFilters() {
    const filterInputs = document.querySelectorAll('.filter-option input');
    filterInputs.forEach(input => {
      input.addEventListener('change', () => {
        let typeFilters = [];
        let categoryFilters = [];
        filterInputs.forEach(i => {
          if (i.checked) {
            if (i.name === 'category') categoryFilters.push(i.value);
            if (i.name === 'type') typeFilters.push(i.value);
          }
        });
        const anyFilters = typeFilters.length > 0 || categoryFilters.length > 0;
        filteredProjects = allProjects.filter(project => {
          const typeMatch = !typeFilters.length || typeFilters.includes(project.type);
          const categoryMatch = !categoryFilters.length || categoryFilters.includes(project.category);
          return typeMatch && categoryMatch;
        });
        if (anyFilters) {
          if (filteredProjects.length > 0) {
            showMultipleProjectsPopup(filteredProjects);
          } else {
            showNoResultsPopup();
          }
        } else {
          renderProjects(allProjects);
        }
      });
    });
  }

  // Show multiple projects in a popup overlay (mini-card style)
  function showMultipleProjectsPopup(projects) {
    console.log('Popup called with projects:', projects);
    document.querySelectorAll('.popup-overlay.filter-popup').forEach(el => el.remove());
    const div = document.createElement('div');
    div.className = 'popup-overlay filter-popup';
    div.innerHTML = `
      <div class="project-popup" style="max-width:900px;overflow:auto;max-height:90vh;">
        <button class="close-button" style="font-size:2.5rem;line-height:2rem;width:2.5rem;height:2.5rem;top:1rem;right:1rem;position:absolute;z-index:10;background:none;border:none;cursor:pointer;">×</button>
        <div style="padding:1rem 1rem 0 1rem;text-align:center;">
          <h2>Matching Projects</h2>
        </div>
        <div class="popup-projects-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.5rem;padding:1.5rem;"></div>
      </div>
    `;
    document.body.prepend(div);
    const gridEl = div.querySelector('.popup-projects-grid');
    projects.forEach(project => {
      const card = template.content.cloneNode(true).querySelector('.project-card');
      if (project.ctrlPick) {
        const badge = document.createElement('div');
        badge.className = 'ctrl-pick-badge';
        badge.innerHTML = '<span class="star-icon">⭐</span> CTRL Picks';
        card.prepend(badge);
      }
      card.querySelector('.project-title').textContent = project.title;
      const tags = card.querySelector('.project-tags');
      tags.innerHTML = '';
      if (project.type) tags.innerHTML += `<span class="tag tag-type">${project.type}</span>`;
      if (project.stage) tags.innerHTML += `<span class="tag tag-stage">${project.stage}</span>`;
      if (project.category) tags.innerHTML += `<span class="tag tag-category">${project.category}</span>`;
      if (project.modality) tags.innerHTML += `<span class="tag tag-modality">${project.modality}</span>`;
      if (project.team) tags.innerHTML += `<span class="tag tag-team">${project.team}</span>`;
      if (project.marketReach) tags.innerHTML += `<span class="tag tag-market">${project.marketReach}</span>`;
      if (project.duration) tags.innerHTML += `<span class="tag tag-duration">${project.duration}</span>`;
      if (project.status && Array.isArray(project.status)) {
        project.status.forEach(st => {
          if (st) tags.innerHTML += `<span class="tag tag-status">${st}</span>`;
        });
      }
      card.querySelector('.project-description').textContent = project.description || '';
      card.addEventListener('click', () => showPopup(project));
      card.classList.add('popup-mini-card');
      gridEl.appendChild(card);
    });
    // Robust close button
    const closeBtn = div.querySelector('.close-button');
    if (closeBtn) {
      closeBtn.onclick = () => div.remove();
    } else {
      // Fallback: close on overlay click
      div.onclick = (e) => {
        if (e.target === div) div.remove();
      };
    }
  }

  // Show no results popup
  function showNoResultsPopup() {
    document.querySelectorAll('.popup-overlay.filter-popup').forEach(el => el.remove());
    const div = document.createElement('div');
    div.className = 'popup-overlay filter-popup';
    div.innerHTML = `
      <div class="project-popup">
        <button class="close-button">×</button>
        <div style="padding:2rem;text-align:center;">
          <h2>No projects found in the selected category.</h2>
          <button class="secondary-button clear-filters">
            Clear Filters <span class="button-icon">×</span>
          </button>
        </div>
      </div>
    `;
    document.body.prepend(div);
    div.querySelector('.close-button').onclick = () => div.remove();
    div.querySelector('.clear-filters').onclick = () => {
      document.querySelectorAll('.filter-option input').forEach(i => i.checked = false);
      renderProjects(allProjects);
      div.remove();
    };
  }

  // Popup logic
  function showPopup(project) {
    document.querySelectorAll('.popup-overlay').forEach(el => el.remove());
    const template = document.getElementById('project-popup-template');
    const popup = template.content.cloneNode(true);
    popup.querySelector('h2').textContent = project.title;
    const tags = popup.querySelector('.project-tags');
    tags.innerHTML = '';
    if (project.type) tags.innerHTML += `<span class="tag tag-type">${project.type}</span>`;
    if (project.stage) tags.innerHTML += `<span class="tag tag-stage">${project.stage}</span>`;
    if (project.category) tags.innerHTML += `<span class="tag tag-category">${project.category}</span>`;
    if (project.modality) tags.innerHTML += `<span class="tag tag-modality">${project.modality}</span>`;
    if (project.team) tags.innerHTML += `<span class="tag tag-team">${project.team}</span>`;
    if (project.marketReach) tags.innerHTML += `<span class="tag tag-market">${project.marketReach}</span>`;
    if (project.duration) tags.innerHTML += `<span class="tag tag-duration">${project.duration}</span>`;
    if (project.status && Array.isArray(project.status)) {
      project.status.forEach(st => {
        tags.innerHTML += `<span class="tag tag-status">${st}</span>`;
      });
    }
    // Add website button if present, right after tags
    if (project.website) {
      const btn = document.createElement('a');
      btn.href = project.website;
      btn.target = '_blank';
      btn.className = 'primary-button';
      btn.style.margin = '1rem 0 0 0';
      btn.innerHTML = 'Visit Project Website →';
      tags.parentNode.insertBefore(btn, tags.nextSibling);
    }
    popup.querySelector('.member-name').textContent = project.leadName;
    popup.querySelector('.member-role').textContent = project.leadRole;
    const contactDetails = popup.querySelector('.contact-details');
    contactDetails.querySelector('.contact-method:first-child .contact-value').textContent = project.leadEmail;
    contactDetails.querySelector('.contact-method:last-child .contact-value').textContent = project.leadPhone;
    if (!project.leadEmail) contactDetails.querySelector('.contact-method:first-child').style.display = 'none';
    if (!project.leadPhone) contactDetails.querySelector('.contact-method:last-child').style.display = 'none';

    // Update activity log section
    const activityList = popup.querySelector('.activity-list');
    const emptyState = activityList.querySelector('.empty-state');
    
    if (project.activityLog && project.activityLog.length > 0) {
      // Create a container for activity items
      const activityItemsContainer = document.createElement('div');
      activityItemsContainer.className = 'activity-items';
      
      // Add activity items
      project.activityLog.forEach(activity => {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        activityItem.textContent = activity;
        activityItemsContainer.appendChild(activityItem);
      });
      
      // Insert activity items before the empty state
      activityList.insertBefore(activityItemsContainer, emptyState);
    }

    document.body.appendChild(popup);
    document.querySelector('.popup-overlay .close-button').onclick = () => {
      document.querySelector('.popup-overlay').remove();
    };
  }
}); 