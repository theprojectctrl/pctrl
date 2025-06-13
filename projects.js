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
    
    this.projectsPerPage = 6;
    this.currentProjectsPage = 1;
    this.prevPageButton = document.querySelector('.pagination-button.prev-page');
    this.nextPageButton = document.querySelector('.pagination-button.next-page');
    this.currentPageSpan = document.querySelector('.current-page');
    this.totalPagesSpan = document.querySelector('.total-pages');
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupIntersectionObserver();
    this.updateSlidesPerPage();
    this.startAutoSlide();
    this.checkSuccessMessage();
    this.setupPagination();
    this.updatePagination();

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
      const isHidden = this.filterPanel.style.display === 'none';
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
      slide.classList.remove('active');
      const slidePosition = index - (this.currentPage * this.slidesPerPage);
      
      if (slidePosition >= 0 && slidePosition < this.slidesPerPage) {
        slide.style.display = 'block';
        slide.classList.add('active');
        slide.style.animation = 'slideIn 0.5s forwards';
        slide.style.animationDelay = `${slidePosition * 0.1}s`;
      } else {
        slide.style.display = 'none';
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

    const hasActiveFilters = selectedFilters.category.size > 0;
    if (!hasActiveFilters) {
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

    // Gather all project cards that match the selected category
    const matchingCards = allCards.filter(element => {
      const tags = Array.from(element.querySelectorAll('.tag-category'));
      return Array.from(selectedFilters.category).some(selectedCategory =>
        tags.some(tag => tag.textContent.trim() === selectedCategory.trim())
      );
    });

    if (matchingCards.length > 0) {
      this.showMultipleProjectsPopup(matchingCards);
    } else {
      this.showNoResultsPopup();
    }
  }

  showMultipleProjectsPopup(cards) {
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
        <div class="popup-projects-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.5rem;padding:1.5rem;">
        </div>
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
    // Close button
    div.querySelector('.close-button').onclick = () => div.remove();
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
    this.prevPageButton?.addEventListener('click', () => {
      if (window.location.pathname.includes('projects-page-2.html')) {
        // If we're on page 2, go back to the main projects page
        window.location.href = 'projects.html';
      } else if (this.currentProjectsPage > 1) {
        // If we're on the main page and not on the first page
        this.currentProjectsPage--;
        this.updateProjectsPage();
      }
    });

    this.nextPageButton?.addEventListener('click', () => {
      const totalPages = Math.ceil(this.projectCards.length / this.projectsPerPage);
      if (this.currentProjectsPage < totalPages) {
        this.currentProjectsPage++;
        this.updateProjectsPage();
      } else if (window.location.pathname.includes('projects.html')) {
        // If we're on the main projects page and there are more projects to show
        window.location.href = 'projects-page-2.html';
      }
    });
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

    this.updatePagination();
  }

  updatePagination() {
    const totalPages = Math.ceil(this.projectCards.length / this.projectsPerPage);
    
    this.currentPageSpan.textContent = this.currentProjectsPage;
    this.totalPagesSpan.textContent = totalPages;
    
    // Update Previous button
    if (window.location.pathname.includes('projects-page-2.html')) {
      this.prevPageButton.disabled = false;
      this.prevPageButton.textContent = 'Back to Project Hub';
      this.prevPageButton.innerHTML = '<span class="button-icon">←</span> Back to Project Hub';
    } else {
      this.prevPageButton.disabled = this.currentProjectsPage === 1;
      this.prevPageButton.textContent = 'Previous';
      this.prevPageButton.innerHTML = '<span class="button-icon">←</span> Previous';
    }
    
    // Update Next button
    if (window.location.pathname.includes('projects.html')) {
      this.nextPageButton.disabled = false;
      this.nextPageButton.textContent = 'View More Projects';
      this.nextPageButton.innerHTML = 'View More Projects <span class="button-icon">→</span>';
    } else {
      this.nextPageButton.disabled = this.currentProjectsPage === totalPages;
      this.nextPageButton.textContent = 'Next';
      this.nextPageButton.innerHTML = 'Next <span class="button-icon">→</span>';
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
  new ProjectsPage();
}); 
