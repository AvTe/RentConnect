# Yoombaa Landing Page

A standalone landing page for Yoombaa - Kenya's rental marketplace connecting tenants with verified agents.

## Features

- **SEO Optimized** - Full meta tags, Open Graph, Twitter Cards, and Schema.org structured data
- **Kenya-Focused** - Targeting Nairobi, Mombasa, Kisumu, and other major Kenyan cities
- **Responsive Design** - Works on all devices from mobile to desktop
- **Modern UI** - Clean, professional design with smooth animations
- **Fast Loading** - Pure HTML/CSS/JS, no framework dependencies
- **Email Capture** - Newsletter signup forms for launch notifications
- **Welcome Popup** - Asks users if they're a tenant or agent
- **Google Sheets Integration** - Automatically saves all form submissions
- **Stock Images** - High-quality Unsplash images included

## Files

```
landing-page/
├── index.html              # Main HTML file with all content and SEO tags
├── styles.css              # Complete CSS styling (responsive)
├── script.js               # JavaScript for interactivity
├── logo.svg                # Dark logo for light backgrounds
├── logo-white.svg          # White logo for dark backgrounds
├── favicon.svg             # Browser favicon
├── step-1.svg              # How it works illustration 1
├── step-2.svg              # How it works illustration 2
├── step-3.svg              # How it works illustration 3
├── google-apps-script.js   # Google Sheets integration script
└── README.md               # This file
```

## Google Sheets Integration Setup

### Step 1: Create Google Sheet

1. Go to [Google Sheets](https://sheets.google.com) and create a new spreadsheet
2. Name it "Yoombaa Landing Page Leads"
3. Create 3 sheets (tabs) at the bottom:
   - `Tenants`
   - `Agents`
   - `Newsletter`

### Step 2: Add Column Headers

**Tenants Sheet (Row 1):**
| Timestamp | Full Name | Phone | Email | Location | Property Type | Budget | Timeline | Requirements | Source |

**Agents Sheet (Row 1):**
| Timestamp | Full Name | Phone | Email | Agency | Location | Experience | Property Types | About | Source |

**Newsletter Sheet (Row 1):**
| Timestamp | Email | User Type | Source |

### Step 3: Deploy Google Apps Script

1. In your Google Sheet, go to **Extensions > Apps Script**
2. Delete any default code
3. Copy the entire contents of `google-apps-script.js` and paste it
4. Click **Save** (Ctrl+S)
5. Click **Deploy > New Deployment**
6. Click the gear icon ⚙️ and select **Web app**
7. Set:
   - Description: "Yoombaa Landing Page"
   - Execute as: **Me**
   - Who has access: **Anyone**
8. Click **Deploy**
9. Authorize the app when prompted
10. **Copy the Web App URL** (looks like: `https://script.google.com/macros/s/xxx/exec`)

### Step 4: Update Landing Page

1. Open `script.js`
2. Find this line at the top:
   ```javascript
   const GOOGLE_SHEET_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL';
   ```
3. Replace `YOUR_GOOGLE_APPS_SCRIPT_URL` with your Web App URL

### Step 5: Test

1. Open your landing page
2. Fill out the tenant or agent form
3. Check your Google Sheet - data should appear!

## Deployment

This landing page can be deployed to any static hosting service:

### Netlify
1. Push to GitHub
2. Connect repository to Netlify
3. Set build command: (none needed)
4. Set publish directory: `landing-page`
5. Deploy!

### Vercel
1. Push to GitHub
2. Import project to Vercel
3. Set root directory: `landing-page`
4. Deploy!

### GitHub Pages
1. Push to GitHub
2. Go to Settings > Pages
3. Select branch and set folder to `/landing-page`
4. Save and deploy!

### Manual Upload
Simply upload all files (except `google-apps-script.js`) to your web server's public directory.

## Welcome Popup

The landing page shows a welcome popup when users first visit, asking if they're:
- **Looking for a rental** → Opens tenant requirements form
- **A real estate agent** → Opens agent registration form

The popup only shows once per user (stored in localStorage). To reset for testing:
1. Open browser DevTools (F12)
2. Go to Application > Local Storage
3. Delete `yoombaa_welcome_seen`

## Customization

### Update Company Info
- Edit contact email/phone in `index.html` footer
- Update social media links in footer
- Modify "Coming Soon" badges when locations go live

### Change Images
The landing page uses free Unsplash images:
- Hero image: Modern apartments
- Agent section: Real estate concept

To change, update the URLs in `index.html`:
```html
<img src="https://images.unsplash.com/photo-xxx" alt="...">
```

### Add Analytics
Add Google Analytics before `</head>`:
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=YOUR_ID"></script>
<script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'YOUR_ID');
</script>
```

## SEO Keywords Included

- rental houses Kenya
- apartments Nairobi
- houses to let Nairobi
- bedsitter Nairobi
- rental property Kenya
- Mombasa apartments
- Kisumu rentals
- Kenya real estate
- house hunting Kenya
- affordable rentals Nairobi
- Westlands apartments
- Kilimani rentals
- verified agents Kenya

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome for Android)

## License

© 2024 Yoombaa. All rights reserved.
