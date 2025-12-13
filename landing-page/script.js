// ===== Configuration =====
// Replace these URLs with your Google Apps Script Web App URLs after deploying
// Each form has its own separate Google Sheet

const GOOGLE_SHEETS_CONFIG = {
    // Tenant Requirements Form - Sheet for rental inquiries
    tenant: 'https://script.google.com/macros/s/AKfycbwts_WfEcgZmgoDmEo02lurxXa0YlovVLTim7H0fMuySerbztz6Mks55xxaaufiBBXj/exec',

    // Agent Registration Form - Sheet for agent applications
    agent: 'https://script.google.com/macros/s/AKfycbwW-Yf-3jcXzV7kC1qvsDlyd55JQm_1O-z-NG_n24TYILZo4PH3BzSgZslAVArdjf3L/exec',

    // Newsletter/Notify Form - Sheet for email subscriptions
    newsletter: 'https://script.google.com/macros/s/AKfycbzPHaUZbJm0ixhna3ju0oQHIVleKrFYcEGeH35L_oN88nFrU33uNTDLuncE4hHzF8AJxw/exec'
};

// ===== Google Places API Configuration =====
let tenantLocationAutocomplete = null;
let agentLocationAutocomplete = null;

// Initialize Google Places Autocomplete
function initGooglePlaces() {
    const tenantLocationInput = document.getElementById('tenantLocationAutocomplete');
    const agentLocationInput = document.getElementById('agentLocationAutocomplete');

    // Check if Google Maps API is loaded
    if (!window.google || !google.maps || !google.maps.places) {
        return;
    }

    // Initialize autocomplete for tenant location field
    if (tenantLocationInput) {
        tenantLocationAutocomplete = new google.maps.places.Autocomplete(tenantLocationInput, {
            types: ['(regions)'], // Restrict to regions (cities, neighborhoods, etc.)
            componentRestrictions: { country: 'ke' } // Restrict to Kenya
        });

        // Handle place selection
        tenantLocationAutocomplete.addListener('place_changed', function() {
            const place = tenantLocationAutocomplete.getPlace();
            const placeIdInput = document.getElementById('tenantLocationPlaceId');

            if (place && place.place_id) {
                placeIdInput.value = place.place_id;
            }
        });

        // Prevent form submission on Enter in autocomplete field
        tenantLocationInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
            }
        });
    }

    // Initialize autocomplete for agent location field
    if (agentLocationInput) {
        agentLocationAutocomplete = new google.maps.places.Autocomplete(agentLocationInput, {
            types: ['(regions)'], // Restrict to regions (cities, neighborhoods, etc.)
            componentRestrictions: { country: 'ke' } // Restrict to Kenya
        });

        // Handle place selection
        agentLocationAutocomplete.addListener('place_changed', function() {
            const place = agentLocationAutocomplete.getPlace();
            const placeIdInput = document.getElementById('agentLocationPlaceId');

            if (place && place.place_id) {
                placeIdInput.value = place.place_id;
            }
        });

        // Prevent form submission on Enter in autocomplete field
        agentLocationInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
            }
        });
    }
}

// Make initGooglePlaces available globally for the callback
window.initGooglePlaces = initGooglePlaces;

// ===== Budget Conditional Logic =====
function initBudgetConditionalLogic() {
    const budgetSelect = document.getElementById('budgetSelect');
    const budgetRangeContainer = document.getElementById('budgetRangeContainer');

    if (budgetSelect && budgetRangeContainer) {
        budgetSelect.addEventListener('change', function() {
            if (this.value === 'Medium') {
                budgetRangeContainer.style.display = 'block';
            } else {
                budgetRangeContainer.style.display = 'none';
                // Clear the budget range inputs when not Medium
                document.getElementById('budgetMin').value = '';
                document.getElementById('budgetMax').value = '';
            }
        });
    }
}

// ===== Agent Preferred Areas Tags Functionality =====
let agentPreferredAreas = [];

function initAreasTagsInput() {
    const areasInput = document.getElementById('areasInput');
    const areasTagsContainer = document.getElementById('areasTags');
    const hiddenInput = document.getElementById('preferredAreasHidden');

    if (!areasInput || !areasTagsContainer || !hiddenInput) return;

    // Add area on Enter key
    areasInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const value = this.value.trim();
            if (value && !agentPreferredAreas.includes(value)) {
                addAreaTag(value);
                this.value = '';
            }
        }
    });

    // Add area on blur (optional - when user clicks away)
    areasInput.addEventListener('blur', function() {
        const value = this.value.trim();
        if (value && !agentPreferredAreas.includes(value)) {
            addAreaTag(value);
            this.value = '';
        }
    });
}

function addAreaTag(area) {
    const areasTagsContainer = document.getElementById('areasTags');
    const hiddenInput = document.getElementById('preferredAreasHidden');

    agentPreferredAreas.push(area);
    updateHiddenAreasInput();

    // Create tag element
    const tag = document.createElement('span');
    tag.className = 'area-tag';
    tag.innerHTML = `${area} <span class="remove-tag" onclick="removeAreaTag('${area}', this)">×</span>`;
    areasTagsContainer.appendChild(tag);
}

function removeAreaTag(area, element) {
    const index = agentPreferredAreas.indexOf(area);
    if (index > -1) {
        agentPreferredAreas.splice(index, 1);
    }
    updateHiddenAreasInput();
    element.parentElement.remove();
}

function updateHiddenAreasInput() {
    const hiddenInput = document.getElementById('preferredAreasHidden');
    if (hiddenInput) {
        hiddenInput.value = agentPreferredAreas.join(', ');
    }
}

// Make removeAreaTag available globally for onclick handlers
window.removeAreaTag = removeAreaTag;

// Initialize new form features on DOM ready
document.addEventListener('DOMContentLoaded', function() {
    initBudgetConditionalLogic();
    initAreasTagsInput();

    // If Google Maps API loaded before DOMContentLoaded, initialize it
    if (window.google && google.maps && google.maps.places) {
        initGooglePlaces();
    }
});

// ===== DOM Elements =====
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const navLinks = document.getElementById('navLinks');
const navbar = document.getElementById('navbar');
const welcomeModal = document.getElementById('welcomeModal');
const tenantFormModal = document.getElementById('tenantFormModal');
const agentFormModal = document.getElementById('agentFormModal');
const successModal = document.getElementById('successModal');
const formSuccessModal = document.getElementById('formSuccessModal');
const heroForm = document.getElementById('notifyForm');
const ctaForm = document.getElementById('ctaForm');
const tenantForm = document.getElementById('tenantRequirementsForm');
const agentForm = document.getElementById('agentRegistrationForm');

// ===== Mobile Menu Toggle =====
if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        mobileMenuBtn.classList.toggle('active');
    });

    // Close menu when clicking a link
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            mobileMenuBtn.classList.remove('active');
        });
    });
}

// ===== Navbar Scroll Effect =====
let lastScrollY = 0;
const floatingCta = document.getElementById('floatingCta');

window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
    
    // Show/hide floating CTA bar after scrolling past hero
    if (floatingCta) {
        if (window.scrollY > 600) {
            floatingCta.classList.add('visible');
        } else {
            floatingCta.classList.remove('visible');
        }
    }
    
    lastScrollY = window.scrollY;
});

// ===== Welcome Modal Functions =====
function showWelcomeModal() {
    // Check if user has already seen the modal
    const hasSeenModal = localStorage.getItem('yoombaa_welcome_seen');
    if (!hasSeenModal) {
        setTimeout(() => {
            welcomeModal.classList.add('active');
            document.body.classList.add('modal-open');
        }, 1500); // Show after 1.5 seconds
    }
}

function closeWelcomeModal() {
    welcomeModal.classList.remove('active');
    document.body.classList.remove('modal-open');
    localStorage.setItem('yoombaa_welcome_seen', 'true');
}

function showTenantForm() {
    welcomeModal.classList.remove('active');
    tenantFormModal.classList.add('active');
    localStorage.setItem('yoombaa_welcome_seen', 'true');
}

function showAgentForm() {
    welcomeModal.classList.remove('active');
    agentFormModal.classList.add('active');
    localStorage.setItem('yoombaa_welcome_seen', 'true');
}

function closeTenantForm() {
    tenantFormModal.classList.remove('active');
    document.body.classList.remove('modal-open');
}

function closeAgentForm() {
    agentFormModal.classList.remove('active');
    document.body.classList.remove('modal-open');
}

function closeModal() {
    successModal.classList.remove('active');
    document.body.classList.remove('modal-open');
}

function closeFormSuccess() {
    formSuccessModal.classList.remove('active');
    document.body.classList.remove('modal-open');
}

// Show welcome modal on page load
document.addEventListener('DOMContentLoaded', showWelcomeModal);

// ===== Google Sheets Integration =====
async function submitToGoogleSheet(data, type) {
    try {
        // Get the correct Google Sheet URL based on form type
        const sheetUrl = GOOGLE_SHEETS_CONFIG[type];

        // Add metadata
        const payload = {
            ...data,
            type: type, // 'tenant' or 'agent' or 'newsletter'
            timestamp: new Date().toISOString(),
            source: 'landing_page'
        };

        // Check if URL is configured for this form type
        const isNotConfigured = !sheetUrl || sheetUrl.includes('YOUR_');

        if (isNotConfigured) {
            console.log(`📊 ${type.toUpperCase()} Form Submission (configure Google Sheet URL):`, payload);
            return { success: true, message: `Data logged (${type} Google Sheet not configured)` };
        }

        await fetch(sheetUrl, {
            method: 'POST',
            mode: 'no-cors', // Required for Google Apps Script
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        console.log(`✅ ${type.toUpperCase()} form submitted successfully`);
        return { success: true };
    } catch (error) {
        console.error(`Error submitting ${type} form to Google Sheet:`, error);
        return { success: false, error: error.message };
    }
}

// ===== Form Handlers =====
function handleFormSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const email = form.querySelector('input[type="email"]').value;
    const userType = form.querySelector('select')?.value || 'tenant';
    
    // Submit to Google Sheets
    submitToGoogleSheet({ email, userType }, 'newsletter');
    
    // Show success modal
    successModal.classList.add('active');
    document.body.classList.add('modal-open');
    
    // Reset form
    form.reset();
    
    // Track conversion (add your analytics here)
    if (typeof gtag !== 'undefined') {
        gtag('event', 'signup', {
            'event_category': 'engagement',
            'event_label': userType
        });
    }
}

// Tenant Requirements Form
if (tenantForm) {
    tenantForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = tenantForm.querySelector('button[type="submit"]');
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;

        // Gather form data
        const formData = new FormData(tenantForm);

        // Get budget with range if Medium was selected
        let budgetValue = formData.get('budget');
        const budgetMin = formData.get('budgetMin');
        const budgetMax = formData.get('budgetMax');
        if (budgetValue === 'Medium' && (budgetMin || budgetMax)) {
            budgetValue = `Medium (KES ${budgetMin || '0'} - ${budgetMax || 'unlimited'})`;
        }

        const data = {
            fullName: formData.get('fullName'),
            phone: formData.get('phone'),
            email: formData.get('email'),
            location: formData.get('location'),
            locationPlaceId: formData.get('locationPlaceId') || '', // Google Place ID
            propertyType: formData.get('propertyType'),
            budget: budgetValue,
            budgetMin: budgetMin || '',
            budgetMax: budgetMax || '',
            timeline: formData.get('timeline'),
            requirements: formData.get('requirements')
        };

        // Submit to Google Sheets
        await submitToGoogleSheet(data, 'tenant');

        // Hide tenant form
        tenantFormModal.classList.remove('active');

        // Show success message
        document.getElementById('formSuccessTitle').textContent = 'Request Submitted! 🎉';
        document.getElementById('formSuccessMessage').textContent =
            'Your rental requirements have been received. Verified agents in ' + data.location + ' will contact you soon!';
        formSuccessModal.classList.add('active');

        // Reset form and button
        tenantForm.reset();
        // Also hide the budget range container
        const budgetRangeContainer = document.getElementById('budgetRangeContainer');
        if (budgetRangeContainer) {
            budgetRangeContainer.style.display = 'none';
        }
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;

        // Track conversion
        if (typeof gtag !== 'undefined') {
            gtag('event', 'tenant_signup', {
                'event_category': 'conversion',
                'event_label': data.location
            });
        }
    });
}

// Agent Registration Form
if (agentForm) {
    agentForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = agentForm.querySelector('button[type="submit"]');
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;

        // Gather form data
        const formData = new FormData(agentForm);

        const data = {
            fullName: formData.get('fullName'),
            phone: formData.get('phone'),
            email: formData.get('email'),
            agency: formData.get('agency') || 'Independent',
            location: formData.get('location'),
            locationPlaceId: formData.get('locationPlaceId') || '', // Google Place ID
            experience: formData.get('experience'),
            propertyType: formData.get('propertyType'), // Now a single value (Residential/Commercial)
            preferredAreas: formData.get('preferredAreas') || '', // New field - comma-separated areas
            about: formData.get('about')
        };

        // Submit to Google Sheets
        await submitToGoogleSheet(data, 'agent');

        // Hide agent form
        agentFormModal.classList.remove('active');

        // Show success message
        document.getElementById('formSuccessTitle').textContent = 'Application Received! 🏢';
        document.getElementById('formSuccessMessage').textContent =
            'Thank you for your interest in joining Yoombaa! We\'ll review your application and contact you within 24 hours.';
        formSuccessModal.classList.add('active');

        // Reset form and button
        agentForm.reset();
        // Clear the preferred areas tags
        agentPreferredAreas = [];
        const areasTagsContainer = document.getElementById('areasTags');
        if (areasTagsContainer) {
            areasTagsContainer.innerHTML = '';
        }
        const hiddenAreasInput = document.getElementById('preferredAreasHidden');
        if (hiddenAreasInput) {
            hiddenAreasInput.value = '';
        }
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;

        // Track conversion
        if (typeof gtag !== 'undefined') {
            gtag('event', 'agent_signup', {
                'event_category': 'conversion',
                'event_label': data.location
            });
        }
    });
}

// Newsletter forms
if (heroForm) {
    heroForm.addEventListener('submit', handleFormSubmit);
}

if (ctaForm) {
    ctaForm.addEventListener('submit', handleFormSubmit);
}

// Footer Newsletter Form
const newsletterForm = document.getElementById('newsletterForm');
if (newsletterForm) {
    newsletterForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = newsletterForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span>Subscribing...</span>';
        submitBtn.disabled = true;

        // Gather form data
        const formData = new FormData(newsletterForm);
        const data = {
            email: formData.get('email'),
            userType: 'subscriber'
        };

        // Submit to Google Sheets
        await submitToGoogleSheet(data, 'newsletter');

        // Show success
        submitBtn.innerHTML = '<span>Subscribed! ✓</span>';
        newsletterForm.reset();

        // Reset button after 3 seconds
        setTimeout(() => {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }, 3000);

        // Track conversion
        if (typeof gtag !== 'undefined') {
            gtag('event', 'newsletter_signup', {
                'event_category': 'engagement',
                'event_label': 'footer'
            });
        }
    });
}

// ===== Modal Close Handlers =====
// Close modals on background click
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
            document.body.classList.remove('modal-open');
            // Mark welcome as seen if closing welcome modal
            if (modal.id === 'welcomeModal') {
                localStorage.setItem('yoombaa_welcome_seen', 'true');
            }
        }
    });
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.classList.remove('modal-open');
    }
});

// ===== Smooth Scroll for Anchor Links =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
            const navHeight = navbar.offsetHeight;
            const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight - 20;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// ===== Scroll Reveal Animations =====
const revealElements = document.querySelectorAll('.feature-card, .step-card, .property-card, .location-card, .testimonial-card, .faq-item, .section-header');

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('reveal', 'active');
            revealObserver.unobserve(entry.target);
        }
    });
}, {
    root: null,
    rootMargin: '0px 0px -50px 0px',
    threshold: 0.1
});

revealElements.forEach(el => {
    el.classList.add('reveal');
    revealObserver.observe(el);
});

// ===== Counter Animation for Stats =====
function animateCounter(element, target, duration = 2000) {
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;
    
    const updateCounter = () => {
        current += increment;
        if (current < target) {
            element.textContent = Math.floor(current) + '+';
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = target + '+';
        }
    };
    
    updateCounter();
}

// Animate stats when they come into view
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const statNumbers = entry.target.querySelectorAll('.stat-number');
            statNumbers.forEach(stat => {
                const text = stat.textContent;
                const number = parseInt(text.replace(/\D/g, ''));
                if (number) {
                    stat.textContent = '0+';
                    animateCounter(stat, number);
                }
            });
            statsObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

const heroStats = document.querySelector('.hero-stats');
if (heroStats) {
    statsObserver.observe(heroStats);
}

// ===== Preload Images =====
function preloadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = resolve;
        img.onerror = reject;
        img.src = src;
    });
}

// Preload hero image for better performance
const heroImage = document.querySelector('.hero-image img');
if (heroImage && heroImage.src) {
    preloadImage(heroImage.src);
}

// ===== Form Validation Feedback =====
document.querySelectorAll('input[type="email"]').forEach(input => {
    input.addEventListener('invalid', function(e) {
        this.setCustomValidity('Please enter a valid email address');
    });
    
    input.addEventListener('input', function(e) {
        this.setCustomValidity('');
    });
});

// ===== Lazy Loading Images =====
if ('loading' in HTMLImageElement.prototype) {
    // Browser supports native lazy loading
    document.querySelectorAll('img[loading="lazy"]').forEach(img => {
        if (img.dataset.src) {
            img.src = img.dataset.src;
        }
    });
} else {
    // Fallback for older browsers
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    
    const lazyImageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                }
                lazyImageObserver.unobserve(img);
            }
        });
    });
    
    lazyImages.forEach(img => lazyImageObserver.observe(img));
}

// ===== Console Welcome =====
console.log('%c🏠 Yoombaa', 'font-size: 24px; font-weight: bold; color: #FE9200;');
console.log('%cKenya\'s smartest way to find rental homes', 'font-size: 14px; color: #64748B;');
console.log('%cWant to join our team? Email us at hello@yoombaa.com', 'font-size: 12px; color: #64748B;');

// ===== Phone Number Formatting =====
document.querySelectorAll('input[type="tel"]').forEach(input => {
    input.addEventListener('input', function(e) {
        // Remove non-digits
        let value = this.value.replace(/\D/g, '');
        
        // Format Kenya phone number
        if (value.startsWith('254')) {
            value = '+' + value;
        } else if (value.startsWith('0')) {
            // Keep as is for local format
        } else if (value.startsWith('7') || value.startsWith('1')) {
            value = '0' + value;
        }
        
        this.value = value;
    });
});

// ===== Performance: Reduce animations on low-end devices =====
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.style.setProperty('scroll-behavior', 'auto');
}

// ===== Scroll Reveal Animations =====
function initScrollAnimations() {
    const fadeElements = document.querySelectorAll('.fade-up');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    fadeElements.forEach(el => observer.observe(el));
}

// Initialize scroll animations on DOM ready
document.addEventListener('DOMContentLoaded', initScrollAnimations);

// ===== Testimonials Slider =====
function initTestimonialsSlider() {
    const slider = document.getElementById('testimonialsSlider');
    if (!slider) return;

    const track = document.getElementById('sliderTrack');
    const slides = track.querySelectorAll('.slide');
    const prevBtn = document.getElementById('sliderPrev');
    const nextBtn = document.getElementById('sliderNext');
    const dotsContainer = document.getElementById('sliderDots');
    const dots = dotsContainer.querySelectorAll('.slider-dot');

    let currentSlide = 0;
    const totalSlides = slides.length;
    let autoPlayInterval = null;
    let isTransitioning = false;

    // Touch/swipe variables
    let touchStartX = 0;
    let touchEndX = 0;
    let isDragging = false;
    let startTranslate = 0;
    let currentTranslate = 0;

    // Go to specific slide
    function goToSlide(index, animate = true) {
        if (isTransitioning && animate) return;

        // Handle wrap-around
        if (index < 0) {
            currentSlide = totalSlides - 1;
        } else if (index >= totalSlides) {
            currentSlide = 0;
        } else {
            currentSlide = index;
        }

        isTransitioning = animate;
        track.style.transition = animate ? 'transform 0.5s cubic-bezier(0.25, 0.1, 0.25, 1)' : 'none';
        track.style.transform = `translateX(-${currentSlide * 100}%)`;

        // Update dots
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === currentSlide);
        });

        if (animate) {
            setTimeout(() => {
                isTransitioning = false;
            }, 500);
        }
    }

    // Next slide
    function nextSlide() {
        goToSlide(currentSlide + 1);
    }

    // Previous slide
    function prevSlide() {
        goToSlide(currentSlide - 1);
    }

    // Auto-play
    function startAutoPlay() {
        stopAutoPlay();
        autoPlayInterval = setInterval(nextSlide, 5000); // Change slide every 5 seconds
    }

    function stopAutoPlay() {
        if (autoPlayInterval) {
            clearInterval(autoPlayInterval);
            autoPlayInterval = null;
        }
    }

    // Reset auto-play on user interaction
    function resetAutoPlay() {
        startAutoPlay();
    }

    // Event listeners for arrows
    prevBtn.addEventListener('click', () => {
        prevSlide();
        resetAutoPlay();
    });

    nextBtn.addEventListener('click', () => {
        nextSlide();
        resetAutoPlay();
    });

    // Event listeners for dots
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            goToSlide(index);
            resetAutoPlay();
        });
    });

    // Touch events for swipe support
    track.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        isDragging = true;
        startTranslate = currentSlide * -100;
        track.style.transition = 'none';
        stopAutoPlay();
    }, { passive: true });

    track.addEventListener('touchmove', (e) => {
        if (!isDragging) return;

        touchEndX = e.touches[0].clientX;
        const diff = touchEndX - touchStartX;
        const slideWidth = slider.querySelector('.slider-container').offsetWidth;
        const percentMoved = (diff / slideWidth) * 100;
        currentTranslate = startTranslate + percentMoved;

        // Limit dragging at edges
        const maxTranslate = 0;
        const minTranslate = -(totalSlides - 1) * 100;
        currentTranslate = Math.max(Math.min(currentTranslate, maxTranslate + 20), minTranslate - 20);

        track.style.transform = `translateX(${currentTranslate}%)`;
    }, { passive: true });

    track.addEventListener('touchend', () => {
        if (!isDragging) return;
        isDragging = false;

        const diff = touchEndX - touchStartX;
        const threshold = 50; // Minimum swipe distance

        if (diff > threshold) {
            // Swiped right - go to previous
            prevSlide();
        } else if (diff < -threshold) {
            // Swiped left - go to next
            nextSlide();
        } else {
            // Return to current slide
            goToSlide(currentSlide);
        }

        resetAutoPlay();
    });

    // Mouse drag support for desktop
    let mouseStartX = 0;
    let isMouseDragging = false;

    track.addEventListener('mousedown', (e) => {
        mouseStartX = e.clientX;
        isMouseDragging = true;
        startTranslate = currentSlide * -100;
        track.style.transition = 'none';
        track.style.cursor = 'grabbing';
        stopAutoPlay();
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isMouseDragging) return;

        const diff = e.clientX - mouseStartX;
        const slideWidth = slider.querySelector('.slider-container').offsetWidth;
        const percentMoved = (diff / slideWidth) * 100;
        currentTranslate = startTranslate + percentMoved;

        // Limit dragging at edges
        const maxTranslate = 0;
        const minTranslate = -(totalSlides - 1) * 100;
        currentTranslate = Math.max(Math.min(currentTranslate, maxTranslate + 20), minTranslate - 20);

        track.style.transform = `translateX(${currentTranslate}%)`;
    });

    document.addEventListener('mouseup', (e) => {
        if (!isMouseDragging) return;
        isMouseDragging = false;
        track.style.cursor = 'grab';

        const diff = e.clientX - mouseStartX;
        const threshold = 50;

        if (diff > threshold) {
            prevSlide();
        } else if (diff < -threshold) {
            nextSlide();
        } else {
            goToSlide(currentSlide);
        }

        resetAutoPlay();
    });

    // Prevent text selection while dragging
    track.addEventListener('dragstart', (e) => e.preventDefault());

    // Pause auto-play when hovering
    slider.addEventListener('mouseenter', stopAutoPlay);
    slider.addEventListener('mouseleave', startAutoPlay);

    // Pause auto-play when not in viewport
    const sliderObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                startAutoPlay();
            } else {
                stopAutoPlay();
            }
        });
    }, { threshold: 0.3 });

    sliderObserver.observe(slider);

    // Keyboard navigation
    slider.setAttribute('tabindex', '0');
    slider.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            prevSlide();
            resetAutoPlay();
        } else if (e.key === 'ArrowRight') {
            nextSlide();
            resetAutoPlay();
        }
    });

    // Set initial cursor style
    track.style.cursor = 'grab';

    // Start auto-play
    startAutoPlay();
}

// Initialize slider on DOM ready
document.addEventListener('DOMContentLoaded', initTestimonialsSlider);

// ===== Expose functions to window for onclick handlers =====
window.showTenantForm = showTenantForm;
window.showAgentForm = showAgentForm;
window.closeWelcomeModal = closeWelcomeModal;
window.closeTenantForm = closeTenantForm;
window.closeAgentForm = closeAgentForm;
window.closeModal = closeModal;
window.closeFormSuccess = closeFormSuccess;

// Reset welcome modal for testing (remove in production)
// localStorage.removeItem('yoombaa_welcome_seen');
