// BookFinder AI - Pure Black Theme Application JavaScript

class BookFinderAI {
    constructor() {
        this.apiBaseUrl = 'https://openlibrary.org/search.json';
        this.coverBaseUrl = 'https://covers.openlibrary.org/b/id/';
        this.bookBaseUrl = 'https://openlibrary.org';
        this.apiFields = 'key,title,author_name,first_publish_year,cover_i,edition_count';
        this.resultLimit = 24;
        
        // DOM Elements
        this.searchForm = document.getElementById('searchForm');
        this.searchType = document.getElementById('searchType');
        this.searchQuery = document.getElementById('searchQuery');
        this.loadingSpinner = document.getElementById('loadingSpinner');
        this.errorMessage = document.getElementById('errorMessage');
        this.resultsHeader = document.getElementById('resultsHeader');
        this.resultsCount = document.getElementById('resultsCount');
        this.booksGrid = document.getElementById('booksGrid');
        
        // Animation state
        this.animationDelay = 100;
        this.isSearching = false;
        
        this.init();
    }
    
    init() {
        this.searchForm.addEventListener('submit', this.handleSearch.bind(this));
        this.searchQuery.addEventListener('keypress', this.handleKeyPress.bind(this));
        this.searchQuery.addEventListener('input', this.handleInputChange.bind(this));
        this.searchType.addEventListener('change', this.updatePlaceholder.bind(this));
        
        // Initialize placeholder
        this.updatePlaceholder();
        
        // Add focus effects
        this.addFocusEffects();
        
        // Add ripple effects to buttons
        this.addRippleEffects();
        
        // Initialize styles for dynamic elements
        this.initializeDynamicStyles();
    }
    
    initializeDynamicStyles() {
        // Add ripple animation keyframes if not already added
        if (!document.getElementById('ripple-styles')) {
            const style = document.createElement('style');
            style.id = 'ripple-styles';
            style.textContent = `
                @keyframes ripple {
                    to {
                        transform: scale(2);
                        opacity: 0;
                    }
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
                    20%, 40%, 60%, 80% { transform: translateX(2px); }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    addFocusEffects() {
        const inputs = [this.searchQuery, this.searchType];
        inputs.forEach(input => {
            input.addEventListener('focus', (e) => {
                const parent = e.target.closest('.search-form__group');
                if (parent) parent.classList.add('focused');
            });
            
            input.addEventListener('blur', (e) => {
                const parent = e.target.closest('.search-form__group');
                if (parent) parent.classList.remove('focused');
            });
        });
    }
    
    addRippleEffects() {
        const buttons = document.querySelectorAll('.search-form__button, .error-button');
        buttons.forEach(button => {
            button.addEventListener('click', this.createRipple.bind(this));
        });
    }
    
    addRippleToElement(element) {
        element.addEventListener('click', this.createRipple.bind(this));
    }
    
    createRipple(event) {
        const button = event.currentTarget;
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.cssText = `
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.3);
            transform: scale(0);
            animation: ripple 0.6s ease-out;
            left: ${x}px;
            top: ${y}px;
            width: ${size}px;
            height: ${size}px;
            pointer-events: none;
        `;
        
        button.style.position = 'relative';
        button.style.overflow = 'hidden';
        button.appendChild(ripple);
        
        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.remove();
            }
        }, 600);
    }
    
    updatePlaceholder() {
        const searchTypes = {
            title: 'e.g., Harry Potter, 1984, The Great Gatsby',
            author: 'e.g., J.K. Rowling, George Orwell, Jane Austen',
            genre: 'e.g., science fiction, mystery, romance',
            general: 'e.g., programming, cooking, history'
        };
        
        this.searchQuery.placeholder = searchTypes[this.searchType.value] || 'Enter your search term...';
        
        // Add smooth placeholder transition effect
        this.searchQuery.style.transform = 'scale(0.98)';
        setTimeout(() => {
            this.searchQuery.style.transform = 'scale(1)';
        }, 150);
    }
    
    handleInputChange(event) {
        const value = event.target.value;
        if (value.length > 0) {
            event.target.classList.add('has-value');
        } else {
            event.target.classList.remove('has-value');
        }
    }
    
    handleKeyPress(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            this.handleSearch(event);
        }
    }
    
    async handleSearch(event) {
        event.preventDefault();
        
        if (this.isSearching) return;
        
        const query = this.searchQuery.value.trim();
        const type = this.searchType.value;
        
        if (!query) {
            this.showError('Please enter a search term to find amazing books!');
            this.searchQuery.focus();
            return;
        }
        
        this.isSearching = true;
        this.showLoading();
        this.hideError();
        this.hideResults();
        
        try {
            const books = await this.searchBooks(query, type);
            await this.displayResults(books, query);
        } catch (error) {
            console.error('Search error:', error);
            this.showError('Oops! Unable to search books right now. Please check your connection and try again.');
        } finally {
            this.hideLoading();
            this.isSearching = false;
        }
    }
    
    async searchBooks(query, type) {
        const searchParams = this.getSearchParams(query, type);
        const url = `${this.apiBaseUrl}?${searchParams.toString()}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data.docs || [];
    }
    
    getSearchParams(query, type) {
        const params = new URLSearchParams();
        
        switch (type) {
            case 'title':
                params.append('title', query);
                break;
            case 'author':
                params.append('author', query);
                break;
            case 'genre':
                params.append('subject', query);
                break;
            case 'general':
            default:
                params.append('q', query);
                break;
        }
        
        params.append('fields', this.apiFields);
        params.append('limit', this.resultLimit.toString());
        
        return params;
    }
    
    async displayResults(books, query) {
        if (books.length === 0) {
            this.showError(`No books found for "${query}". Try different keywords or search type!`);
            return;
        }
        
        this.showResultsHeader(books.length, query);
        await this.renderBooksWithAnimation(books);
        this.showResults();
        
        // Smooth scroll to results
        setTimeout(() => {
            document.getElementById('resultsHeader').scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }, 300);
    }
    
    showResultsHeader(count, query) {
        this.resultsCount.textContent = `Found ${count} amazing book${count !== 1 ? 's' : ''} for "${query}"`;
        this.resultsHeader.classList.remove('hidden');
        
        // Add animation
        this.resultsHeader.style.opacity = '0';
        this.resultsHeader.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            this.resultsHeader.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            this.resultsHeader.style.opacity = '1';
            this.resultsHeader.style.transform = 'translateY(0)';
        }, 100);
    }
    
    async renderBooksWithAnimation(books) {
        this.booksGrid.innerHTML = '';
        
        // Create all cards first (hidden)
        const cards = books.map(book => {
            const card = this.createBookCard(book);
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            return card;
        });
        
        // Add cards to grid
        cards.forEach(card => this.booksGrid.appendChild(card));
        
        // Animate cards in with staggered timing
        for (let i = 0; i < cards.length; i++) {
            setTimeout(() => {
                const card = cards[i];
                card.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, i * 50); // Stagger by 50ms
        }
    }
    
    createBookCard(book) {
        const card = document.createElement('div');
        card.className = 'book-card';
        
        const title = book.title || 'Unknown Title';
        const authors = this.formatAuthors(book.author_name || []);
        const publishYear = book.first_publish_year || 'Unknown';
        const editionCount = book.edition_count || 0;
        
        // Fix cover URL generation - use L size for better quality
        const coverUrl = book.cover_i ? `${this.coverBaseUrl}${book.cover_i}-L.jpg` : null;
        
        // Fix book URL generation
        let bookUrl = null;
        if (book.key) {
            const key = book.key.startsWith('/') ? book.key : `/${book.key}`;
            bookUrl = `${this.bookBaseUrl}${key}`;
        }
        
        // Enhanced cover HTML with better error handling
        const coverHtml = coverUrl ? 
            `<img src="${coverUrl}" alt="${this.escapeHtml(title)} cover" loading="lazy" 
                 onerror="this.onerror=null; this.parentElement.innerHTML='<span>📚 No Cover Available</span>'" />` :
            '<span>📚 No Cover Available</span>';
        
        card.innerHTML = `
            <div class="book-card__cover">
                ${coverHtml}
            </div>
            <div class="book-card__content">
                <h3 class="book-card__title">${this.escapeHtml(title)}</h3>
                <p class="book-card__authors">by ${this.escapeHtml(authors)}</p>
                <div class="book-card__details">
                    <div class="book-card__detail">
                        <span>📅</span>
                        <span>${publishYear}</span>
                    </div>
                    ${editionCount > 0 ? `
                    <div class="book-card__detail">
                        <span>📚</span>
                        <span>${editionCount} edition${editionCount !== 1 ? 's' : ''}</span>
                    </div>
                    ` : ''}
                </div>
                <div class="book-card__actions">
                    ${bookUrl ? 
                        `<a href="${bookUrl}" target="_blank" rel="noopener noreferrer" class="book-card__link">
                            <span>View Details</span>
                            <span>→</span>
                        </a>` :
                        `<span class="book-card__link book-card__link--disabled">
                            <span>No Details Available</span>
                        </span>`
                    }
                </div>
            </div>
        `;
        
        // Add ripple effect to functional links
        const link = card.querySelector('.book-card__link');
        if (link && !link.classList.contains('book-card__link--disabled')) {
            this.addRippleToElement(link);
        }
        
        return card;
    }
    
    formatAuthors(authors) {
        if (!authors || authors.length === 0) {
            return 'Unknown Author';
        }
        
        if (authors.length <= 2) {
            return authors.join(', ');
        }
        
        return `${authors.slice(0, 2).join(', ')} and ${authors.length - 2} more`;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    showLoading() {
        this.loadingSpinner.classList.remove('hidden');
        
        // Add entrance animation
        this.loadingSpinner.style.opacity = '0';
        this.loadingSpinner.style.transform = 'translateY(20px) scale(0.9)';
        
        setTimeout(() => {
            this.loadingSpinner.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
            this.loadingSpinner.style.opacity = '1';
            this.loadingSpinner.style.transform = 'translateY(0) scale(1)';
        }, 50);
    }
    
    hideLoading() {
        if (!this.loadingSpinner.classList.contains('hidden')) {
            this.loadingSpinner.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            this.loadingSpinner.style.opacity = '0';
            this.loadingSpinner.style.transform = 'translateY(-10px) scale(0.95)';
            
            setTimeout(() => {
                this.loadingSpinner.classList.add('hidden');
            }, 300);
        }
    }
    
    showError(message) {
        const errorText = this.errorMessage.querySelector('.error-text');
        errorText.textContent = message;
        this.errorMessage.classList.remove('hidden');
        
        // Add entrance animation
        this.errorMessage.style.opacity = '0';
        this.errorMessage.style.transform = 'translateY(20px) scale(0.9)';
        
        setTimeout(() => {
            this.errorMessage.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
            this.errorMessage.style.opacity = '1';
            this.errorMessage.style.transform = 'translateY(0) scale(1)';
        }, 50);
        
        // Add shake animation to search form
        this.searchForm.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
            this.searchForm.style.animation = '';
        }, 500);
    }
    
    hideError() {
        if (!this.errorMessage.classList.contains('hidden')) {
            this.errorMessage.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            this.errorMessage.style.opacity = '0';
            this.errorMessage.style.transform = 'translateY(-10px) scale(0.95)';
            
            setTimeout(() => {
                this.errorMessage.classList.add('hidden');
            }, 300);
        }
    }
    
    showResults() {
        this.booksGrid.classList.remove('hidden');
    }
    
    hideResults() {
        this.resultsHeader.classList.add('hidden');
        this.booksGrid.innerHTML = '';
        this.booksGrid.classList.add('hidden');
    }
    
    // Enhanced search with debouncing for future features
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Enhanced page loading experience with pure black theme
document.addEventListener('DOMContentLoaded', () => {
    // Add page load animation
    document.body.style.opacity = '0';
    document.body.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
        document.body.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        document.body.style.opacity = '1';
        document.body.style.transform = 'translateY(0)';
    }, 100);
    
    // Initialize the application
    new BookFinderAI();
    
    // Add smooth scrolling for the entire page
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Add keyboard navigation enhancement
    document.addEventListener('keydown', (e) => {
        // Focus search on '/' key
        if (e.key === '/' && !e.target.matches('input, textarea')) {
            e.preventDefault();
            document.getElementById('searchQuery').focus();
        }
        
        // Close modals/errors on 'Escape' key
        if (e.key === 'Escape') {
            const errorContainer = document.getElementById('errorMessage');
            if (!errorContainer.classList.contains('hidden')) {
                errorContainer.classList.add('hidden');
            }
        }
    });
    
    // Add intersection observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Add performance optimization for image loading
    const imageCache = new Map();
    window.preloadImage = (src) => {
        if (!imageCache.has(src)) {
            const img = new Image();
            img.src = src;
            imageCache.set(src, img);
        }
        return imageCache.get(src);
    };
    
    // Add service worker for offline capability (optional enhancement)
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            // Could register a service worker here for offline functionality
            console.log('BookFinder AI - Pure Black Edition loaded successfully!');
        });
    }
    
    // Add visual feedback for external links
    document.addEventListener('click', (e) => {
        if (e.target.matches('a[target="_blank"], a[target="_blank"] *')) {
            const link = e.target.closest('a');
            if (link) {
                // Add visual feedback with blue glow effect
                link.style.transform = 'scale(0.98)';
                link.style.boxShadow = '0 0 20px rgba(0, 191, 255, 0.5)';
                setTimeout(() => {
                    link.style.transform = '';
                    link.style.boxShadow = '';
                }, 100);
            }
        }
    });
    
    // Enhanced error handling for network issues
    window.addEventListener('online', () => {
        console.log('Connection restored - BookFinder AI ready');
        // Could show a toast notification here with blue accent
    });
    
    window.addEventListener('offline', () => {
        console.log('Connection lost - BookFinder AI offline mode');
        // Could show an offline indicator here
    });
    
    // Add dynamic theme effects for pure black theme
    const addThemeEffects = () => {
        // Add subtle glow effect to interactive elements
        const interactiveElements = document.querySelectorAll('button, input, select, a');
        interactiveElements.forEach(element => {
            element.addEventListener('mouseenter', () => {
                if (!element.disabled && !element.classList.contains('book-card__link--disabled')) {
                    element.style.transition = 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)';
                    element.style.filter = 'drop-shadow(0 0 5px rgba(0, 191, 255, 0.3))';
                }
            });
            
            element.addEventListener('mouseleave', () => {
                element.style.filter = '';
            });
        });
        
        // Add blue glow to focus states
        document.addEventListener('focusin', (e) => {
            if (e.target.matches('input, select, button, a')) {
                e.target.style.boxShadow = '0 0 20px rgba(0, 191, 255, 0.4)';
            }
        });
        
        document.addEventListener('focusout', (e) => {
            if (e.target.matches('input, select, button, a')) {
                setTimeout(() => {
                    e.target.style.boxShadow = '';
                }, 150);
            }
        });
    };
    
    // Initialize theme effects after a short delay
    setTimeout(addThemeEffects, 1000);
    
    // Add console welcome message with ASCII art
    console.log(`
    ╔══════════════════════════════════════╗
    ║        BookFinder AI - Black         ║
    ║             Pure Edition             ║
    ║                                      ║
    ║     🔍 Search • 📚 Discover          ║
    ║     💻 Made by Mohammed Sofi         ║
    ╚══════════════════════════════════════╝
    `);
});