import { NextResponse } from 'next/server';

// Top GiftPesa partner brands with verified CDN logo URLs
const TOP_GIFTPESA_BRANDS = [
    {
        id: 'naivas',
        name: 'Naivas',
        category: 'Supermarkets',
        logo: 'https://www.naivas.co.ke/wp-content/uploads/2023/06/naivas-logo.png',
        color: '#E31837'
    },
    {
        id: 'carrefour',
        name: 'Carrefour',
        category: 'Supermarkets',
        logo: 'https://www.carrefour.ke/static/media/logo.8c1b8c9e.svg',
        color: '#004E9A'
    },
    {
        id: 'java-house',
        name: 'Java',
        category: 'Cafes',
        logo: 'https://javahouseafrica.com/wp-content/uploads/2023/01/cropped-JAVA-FAVICON-270x270.png',
        color: '#8B4513'
    },
    {
        id: 'kfc',
        name: 'KFC',
        category: 'Restaurants',
        logo: 'https://www.kfc.co.ke/images/logo-kfc.svg',
        color: '#F40027'
    },
    {
        id: 'pizza-inn',
        name: 'Pizza Inn',
        category: 'Restaurants',
        logo: 'https://www.pizza-inn.co.ke/wp-content/uploads/2020/08/pizza-inn-logo.png',
        color: '#006400'
    },
    {
        id: 'quickmart',
        name: 'Quickmart',
        category: 'Supermarkets',
        logo: 'https://quickmart.co.ke/wp-content/uploads/2023/03/Quickmart_Logo.png',
        color: '#FF6600'
    },
    {
        id: 'uber',
        name: 'Uber',
        category: 'Transport',
        logo: 'https://d1a3f4spazzrp4.cloudfront.net/uber-com/1.3.8/d1a3f4spazzrp4.cloudfront.net/images/uber-logo.svg',
        color: '#000000'
    },
    {
        id: 'glovo',
        name: 'Glovo',
        category: 'Delivery',
        logo: 'https://glovoapp.com/images/logo_green.svg',
        color: '#FFC244'
    },
    {
        id: 'jumia',
        name: 'Jumia',
        category: 'Shopping',
        logo: 'https://www.jumia.co.ke/images_mobile/logo.png',
        color: '#F68B1E'
    },
    {
        id: 'chicken-inn',
        name: 'Chicken Inn',
        category: 'Restaurants',
        logo: 'https://www.chickeninn.co.ke/images/logo.png',
        color: '#C8102E'
    }
];

export async function GET() {
    return NextResponse.json({
        success: true,
        data: TOP_GIFTPESA_BRANDS,
        total: TOP_GIFTPESA_BRANDS.length
    });
}
