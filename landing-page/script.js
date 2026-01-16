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

// ===== Kenya Locations API =====
// Using the free Kenya API from https://kenya-api.onrender.com/
const KENYA_API_URL = 'https://kenya-api.onrender.com/api/v1/wards';

// Cache for API data
let kenyaLocationsCache = null;
let isLoadingLocations = false;

// Load Kenya locations from API
async function loadKenyaLocations() {
    if (kenyaLocationsCache) return kenyaLocationsCache;
    if (isLoadingLocations) return [];

    isLoadingLocations = true;

    try {
        const response = await fetch(KENYA_API_URL);
        if (!response.ok) throw new Error('Failed to fetch locations');

        const data = await response.json();
        if (data.wards && Array.isArray(data.wards)) {
            // Transform API data to our format
            kenyaLocationsCache = data.wards.map(ward => ({
                name: ward.office,
                code: ward.code,
                country: 'Kenya'
            }));
            console.log(`Loaded ${kenyaLocationsCache.length} Kenya locations from API`);
        } else {
            kenyaLocationsCache = [];
        }
    } catch (error) {
        console.error('Failed to load locations from API:', error);
        kenyaLocationsCache = [];
    }

    isLoadingLocations = false;
    return kenyaLocationsCache;
}

// Initialize locations on page load
loadKenyaLocations();

// ===== Custom Location Autocomplete =====
function initLocationAutocomplete(inputId, dropdownId, loadingId, placeIdInputId) {
    const input = document.getElementById(inputId);
    const dropdown = document.getElementById(dropdownId);
    const loadingIcon = document.getElementById(loadingId);
    const placeIdInput = document.getElementById(placeIdInputId);

    if (!input || !dropdown) return;

    let selectedIndex = -1;
    let filteredLocations = [];
    let debounceTimer = null;

    // Filter locations based on input (async to support API data)
    async function filterLocations(query) {
        if (!query || query.length < 1) return [];

        const locations = await loadKenyaLocations();
        const lowerQuery = query.toLowerCase();

        return locations.filter(loc =>
            loc.name.toLowerCase().includes(lowerQuery) ||
            loc.code.toLowerCase().includes(lowerQuery)
        ).slice(0, 10); // Limit to 10 results
    }

    // Render dropdown
    function renderDropdown(locations) {
        if (locations.length === 0) {
            dropdown.innerHTML = '<div class="location-no-results">No locations found. Try another search.</div>';
            dropdown.classList.add('active');
            return;
        }

        let html = '';
        locations.forEach((loc, idx) => {
            html += `
                <div class="location-dropdown-item" data-index="${idx}" data-name="${loc.name}" data-code="${loc.code}">
                    <div class="location-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F97316" stroke-width="2.5">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                            <circle cx="12" cy="10" r="3"/>
                        </svg>
                    </div>
                    <div class="location-text">
                        <div class="location-name">${loc.name}</div>
                        <div class="location-region">Code: ${loc.code}, Kenya</div>
                    </div>
                </div>
            `;
        });

        dropdown.innerHTML = html;
        dropdown.classList.add('active');

        // Add click handlers
        dropdown.querySelectorAll('.location-dropdown-item').forEach(item => {
            item.addEventListener('click', () => {
                selectLocation(item.dataset.name, item.dataset.code);
            });
        });
    }

    // Select a location
    function selectLocation(name, code) {
        input.value = name;
        if (placeIdInput) {
            placeIdInput.value = `${name}, ${code}, Kenya`;
        }
        dropdown.classList.remove('active');
        selectedIndex = -1;
    }

    // Show loading
    function showLoading() {
        if (loadingIcon) loadingIcon.classList.add('active');
    }

    // Hide loading
    function hideLoading() {
        if (loadingIcon) loadingIcon.classList.remove('active');
    }

    // Input event
    input.addEventListener('input', function () {
        const query = this.value.trim();

        // Clear previous timer
        if (debounceTimer) clearTimeout(debounceTimer);

        if (query.length < 1) {
            dropdown.classList.remove('active');
            hideLoading();
            return;
        }

        showLoading();

        // Debounce for smooth typing (async to support API data)
        debounceTimer = setTimeout(async () => {
            filteredLocations = await filterLocations(query);
            renderDropdown(filteredLocations);
            hideLoading();
        }, 150);
    });

    // Focus event - show dropdown if there's a query
    input.addEventListener('focus', async function () {
        const query = this.value.trim();
        if (query.length >= 1) {
            filteredLocations = await filterLocations(query);
            if (filteredLocations.length > 0) {
                renderDropdown(filteredLocations);
            }
        }
    });

    // Keyboard navigation
    input.addEventListener('keydown', function (e) {
        const items = dropdown.querySelectorAll('.location-dropdown-item');

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
            updateSelection(items);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedIndex = Math.max(selectedIndex - 1, 0);
            updateSelection(items);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedIndex >= 0 && items[selectedIndex]) {
                const item = items[selectedIndex];
                selectLocation(item.dataset.name, item.dataset.code);
            }
        } else if (e.key === 'Escape') {
            dropdown.classList.remove('active');
            selectedIndex = -1;
        }
    });

    // Update visual selection
    function updateSelection(items) {
        items.forEach((item, idx) => {
            if (idx === selectedIndex) {
                item.classList.add('selected');
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove('selected');
            }
        });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', function (e) {
        if (!input.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.remove('active');
            selectedIndex = -1;
        }
    });
}

// Initialize all location autocompletes
function initAllLocationAutocompletes() {
    // Tenant form location
    initLocationAutocomplete(
        'tenantLocationAutocomplete',
        'tenantLocationDropdown',
        'tenantLocationLoading',
        'tenantLocationPlaceId'
    );

    // Agent form location
    initLocationAutocomplete(
        'agentLocationAutocomplete',
        'agentLocationDropdown',
        'agentLocationLoading',
        'agentLocationPlaceId'
    );
}

// ===== Budget Range - Conditional Display =====
// Show for all budget options EXCEPT "Not Decided" and empty selection
function initBudgetConditionalLogic() {
    const budgetSelect = document.getElementById('budgetSelect');
    const budgetRangeContainer = document.getElementById('budgetRangeContainer');
    const budgetMinInput = document.getElementById('budgetMin');
    const budgetMaxInput = document.getElementById('budgetMax');

    if (!budgetSelect || !budgetRangeContainer) return;

    function updateBudgetRangeVisibility() {
        const selectedValue = budgetSelect.value;
        // Hide for empty selection and "Not Decided", show for all other options
        const hideRange = !selectedValue || selectedValue === 'Not Decided';

        if (hideRange) {
            budgetRangeContainer.style.display = 'none';
            // Clear values when hidden
            if (budgetMinInput) budgetMinInput.value = '';
            if (budgetMaxInput) budgetMaxInput.value = '';
        } else {
            budgetRangeContainer.style.display = 'block';
        }
    }

    // Initial check
    updateBudgetRangeVisibility();

    // Listen for changes
    budgetSelect.addEventListener('change', updateBudgetRangeVisibility);
}

// ===== Agent Preferred Areas Tags Functionality =====
let agentPreferredAreas = [];

function initAreasTagsInput() {
    const areasInput = document.getElementById('areasInput');
    const areasTagsContainer = document.getElementById('areasTags');
    const hiddenInput = document.getElementById('preferredAreasHidden');

    if (!areasInput || !areasTagsContainer || !hiddenInput) return;

    // Add area on Enter key
    areasInput.addEventListener('keydown', function (e) {
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
    areasInput.addEventListener('blur', function () {
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
document.addEventListener('DOMContentLoaded', function () {
    initBudgetConditionalLogic();
    initAreasTagsInput();
    initAllLocationAutocompletes();
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

// Helper function to format Kenya phone number with +254
function formatKenyaPhone(phone) {
    const digits = phone.replace(/\D/g, '');
    return '+254' + digits;
}

// Helper function to parse budget amount (remove commas)
function parseBudgetAmount(value) {
    if (!value) return '';
    return value.replace(/,/g, '');
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

        // Get budget with optional range
        let budgetValue = formData.get('budget');
        const budgetMinRaw = parseBudgetAmount(formData.get('budgetMin'));
        const budgetMaxRaw = parseBudgetAmount(formData.get('budgetMax'));

        // Format budget with range for display (if range values are provided)
        if (budgetValue && (budgetMinRaw || budgetMaxRaw)) {
            const minFormatted = budgetMinRaw ? Number(budgetMinRaw).toLocaleString() : '0';
            const maxFormatted = budgetMaxRaw ? Number(budgetMaxRaw).toLocaleString() : 'unlimited';
            budgetValue = `${budgetValue} (KES ${minFormatted} - ${maxFormatted})`;
        }

        const data = {
            fullName: formData.get('fullName'),
            phone: formatKenyaPhone(formData.get('phone')),
            email: formData.get('email'),
            location: formData.get('location'),
            locationPlaceId: formData.get('locationPlaceId') || '',
            propertyType: formData.get('propertyType'),
            budget: budgetValue,
            budgetMin: budgetMinRaw,
            budgetMax: budgetMaxRaw,
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
            phone: formatKenyaPhone(formData.get('phone')),
            email: formData.get('email'),
            agency: formData.get('agency') || 'Independent',
            location: formData.get('location'),
            locationPlaceId: formData.get('locationPlaceId') || '',
            experience: formData.get('experience'),
            propertyType: formData.get('propertyType'),
            preferredAreas: formData.get('preferredAreas') || '',
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
const revealElements = document.querySelectorAll('.feature-card, .step-card, .property-card, .location-card, .testimonial-card, .faq-item, .section-header, .fade-up, .workflow-step, .workflow-connector');

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('reveal', 'active', 'visible');
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
    input.addEventListener('invalid', function () {
        this.setCustomValidity('Please enter a valid email address');
    });

    input.addEventListener('input', function () {
        this.setCustomValidity('');
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (this.value && !emailRegex.test(this.value)) {
            this.style.borderColor = '#ef4444';
            this.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1)';
        } else if (this.value) {
            this.style.borderColor = '#22c55e';
            this.style.boxShadow = '0 0 0 3px rgba(34, 197, 94, 0.1)';
        } else {
            this.style.borderColor = '';
            this.style.boxShadow = '';
        }
    });

    input.addEventListener('blur', function () {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (this.value && !emailRegex.test(this.value)) {
            this.setCustomValidity('Please enter a valid email address');
        }
    });
});

// ===== Kenya Phone Number Validation =====
function initKenyaPhoneValidation() {
    const phoneInputs = document.querySelectorAll('#tenantPhone, #agentPhone');

    phoneInputs.forEach(input => {
        const wrapper = input.closest('.phone-input-wrapper');

        input.addEventListener('input', function () {
            // Remove non-digits
            let value = this.value.replace(/\D/g, '');

            // Remove leading 0 if present (since +254 is already shown)
            if (value.startsWith('0')) {
                value = value.substring(1);
            }

            // Limit to 10 digits (Kenya numbers can be 9 or 10 digits)
            value = value.substring(0, 10);

            // Format with spaces based on length
            // 9 digits: 712 345 678 (3-3-3 pattern)
            // 10 digits: 7318 408 040 (4-3-3 pattern)
            if (value.length <= 9) {
                // 9-digit format: 712 345 678
                if (value.length > 6) {
                    value = value.substring(0, 3) + ' ' + value.substring(3, 6) + ' ' + value.substring(6);
                } else if (value.length > 3) {
                    value = value.substring(0, 3) + ' ' + value.substring(3);
                }
            } else {
                // 10-digit format: 7318 408 040
                value = value.substring(0, 4) + ' ' + value.substring(4, 7) + ' ' + value.substring(7);
            }

            this.value = value;

            // Validation feedback - set border on wrapper, not input
            const digitsOnly = value.replace(/\s/g, '');
            const isValidLength = digitsOnly.length >= 9 && digitsOnly.length <= 10;
            const startsWithValidPrefix = /^[17]/.test(digitsOnly);

            if (wrapper) {
                if (isValidLength && startsWithValidPrefix) {
                    wrapper.style.borderColor = '#22c55e';
                    wrapper.style.boxShadow = '0 0 0 3px rgba(34, 197, 94, 0.1)';
                    this.setCustomValidity('');
                } else if (digitsOnly.length > 0 && isValidLength && !startsWithValidPrefix) {
                    wrapper.style.borderColor = '#ef4444';
                    wrapper.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1)';
                } else {
                    wrapper.style.borderColor = '';
                    wrapper.style.boxShadow = '';
                }
            }
        });

        input.addEventListener('invalid', function () {
            this.setCustomValidity('Please enter a valid Kenya phone number (9-10 digits)');
        });

        input.addEventListener('blur', function () {
            const digitsOnly = this.value.replace(/\D/g, '');
            if (digitsOnly.length > 0 && (digitsOnly.length < 9 || digitsOnly.length > 10)) {
                this.setCustomValidity('Please enter a valid Kenya phone number (9-10 digits)');
            } else if (digitsOnly.length >= 9 && !/^[17]/.test(digitsOnly)) {
                this.setCustomValidity('Kenya phone numbers start with 7 or 1');
            } else {
                this.setCustomValidity('');
            }
        });
    });
}

// Initialize phone validation
initKenyaPhoneValidation();

// ===== Budget Amount Formatting (with commas) =====
function formatKESAmount(value) {
    // Remove non-digits
    const digits = value.replace(/\D/g, '');
    // Format with commas
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function initBudgetFormatting() {
    const budgetInputs = document.querySelectorAll('#budgetMin, #budgetMax');

    budgetInputs.forEach(input => {
        input.addEventListener('input', function () {
            const cursorPos = this.selectionStart;
            const oldLength = this.value.length;

            this.value = formatKESAmount(this.value);

            // Adjust cursor position
            const newLength = this.value.length;
            const diff = newLength - oldLength;
            this.setSelectionRange(cursorPos + diff, cursorPos + diff);
        });

        input.addEventListener('blur', function () {
            if (this.value) {
                this.value = formatKESAmount(this.value);
            }
        });
    });
}

// Initialize budget formatting
initBudgetFormatting();

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

// Phone formatting moved to initKenyaPhoneValidation() above

// ===== Performance: Reduce animations on low-end devices =====
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.style.setProperty('scroll-behavior', 'auto');
}

// ===== Scroll Reveal Animations =====
function initScrollAnimations() {
    // All animatable elements
    const fadeElements = document.querySelectorAll('.fade-up, .fade-in, .fade-left, .fade-right, .scale-up');

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

// Hero fade-in animation on page load
function initHeroAnimations() {
    const heroElements = document.querySelectorAll('.hero-badge, .hero h1, .hero-subtitle, .hero-cta-group, .hero-value-props, .hero-social-proof');

    heroElements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';

        setTimeout(() => {
            el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        }, 100 + (index * 100));
    });
}

// Initialize scroll animations on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    initScrollAnimations();
    initHeroAnimations();
});

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

// ===== FAQ Accordion Logic =====
function initFaqAccordion() {
    const faqItems = document.querySelectorAll('.faq-item');
    if (!faqItems.length) return;

    faqItems.forEach(item => {
        const header = item.querySelector('.faq-header');
        if (!header) return;

        header.addEventListener('click', () => {
            const isActive = item.classList.contains('active');

            // Close all other items
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                }
            });

            // Toggle current item
            item.classList.toggle('active');
        });
    });
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    initFaqAccordion();
    initTestimonialsSlider();
});

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
