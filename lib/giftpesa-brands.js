// ============================================
// GIFTPESA BRAND CONSTANTS
// Top brands on GiftPesa platform for UI display
// ============================================

export const GIFTPESA_TOP_BRANDS = [
    {
        id: 'naivas',
        name: 'Naivas',
        category: 'Supermarkets',
        logo: 'https://upload.wikimedia.org/wikipedia/en/8/86/Naivas_logo.png',
        initials: 'N',
        color: 'bg-red-500'
    },
    {
        id: 'carrefour',
        name: 'Carrefour',
        category: 'Supermarkets',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Carrefour_logo.svg/200px-Carrefour_logo.svg.png',
        initials: 'C',
        color: 'bg-blue-600'
    },
    {
        id: 'java-house',
        name: 'Java House',
        category: 'Cafes',
        logo: 'https://javahouseafrica.com/wp-content/uploads/2021/03/Java-House-Logo.png',
        initials: 'JH',
        color: 'bg-amber-600'
    },
    {
        id: 'kfc',
        name: 'KFC',
        category: 'Restaurants',
        logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/b/bf/KFC_logo.svg/200px-KFC_logo.svg.png',
        initials: 'KFC',
        color: 'bg-red-600'
    },
    {
        id: 'pizza-inn',
        name: 'Pizza Inn',
        category: 'Restaurants',
        logo: 'https://upload.wikimedia.org/wikipedia/en/9/9f/Pizza_Inn_logo.png',
        initials: 'PI',
        color: 'bg-green-600'
    },
    {
        id: 'quickmart',
        name: 'Quickmart',
        category: 'Supermarkets',
        logo: 'https://quickmart.co.ke/wp-content/uploads/2021/07/quickmart-logo.png',
        initials: 'Q',
        color: 'bg-orange-500'
    },
    {
        id: 'uber',
        name: 'Uber',
        category: 'Transport',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Uber_logo_2018.svg/200px-Uber_logo_2018.svg.png',
        initials: 'U',
        color: 'bg-black'
    },
    {
        id: 'jumia',
        name: 'Jumia',
        category: 'Shopping',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Jumia_logo.png/200px-Jumia_logo.png',
        initials: 'J',
        color: 'bg-orange-600'
    },
    {
        id: 'glovo',
        name: 'Glovo',
        category: 'Delivery',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Glovo_logo.svg/200px-Glovo_logo.svg.png',
        initials: 'G',
        color: 'bg-yellow-500'
    },
    {
        id: 'chicken-inn',
        name: 'Chicken Inn',
        category: 'Restaurants',
        logo: 'https://innscor.co.zw/wp-content/uploads/2021/04/chicken-inn.png',
        initials: 'CI',
        color: 'bg-red-500'
    },
];

// Voucher reward configuration per plan tier
export const VOUCHER_CONFIG = {
    starter: {
        enabled: false,
        value: 0,
        merchant: null
    },
    professional: {
        enabled: true,
        value: 200,
        merchant: 'Java House'
    },
    business: {
        enabled: true,
        value: 500,
        merchant: 'Carrefour'
    },
    enterprise: {
        enabled: true,
        value: 1000,
        merchant: 'Naivas'
    }
};
