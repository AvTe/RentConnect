/**
 * Yoombaa Landing Page - Google Sheets Integration
 * 
 * SETUP INSTRUCTIONS:
 * 
 * 1. Create a new Google Sheet with the following sheets (tabs):
 *    - "Tenants" - For tenant rental requirements
 *    - "Agents" - For agent registrations  
 *    - "Newsletter" - For email signups
 * 
 * 2. In each sheet, add these column headers in Row 1:
 * 
 *    TENANTS SHEET:
 *    | Timestamp | Full Name | Phone | Email | Location | Property Type | Budget | Timeline | Requirements | Source |
 * 
 *    AGENTS SHEET:
 *    | Timestamp | Full Name | Phone | Email | Agency | Location | Experience | Property Types | About | Source |
 * 
 *    NEWSLETTER SHEET:
 *    | Timestamp | Email | User Type | Source |
 * 
 * 3. Go to Extensions > Apps Script
 * 
 * 4. Replace the default code with this entire file content
 * 
 * 5. Click Deploy > New Deployment
 *    - Type: Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 
 * 6. Copy the Web App URL and paste it in your landing page's script.js:
 *    const GOOGLE_SHEET_URL = 'YOUR_URL_HERE';
 * 
 * 7. Test by submitting a form on your landing page!
 */

// Sheet names - update if you named them differently
const TENANT_SHEET_NAME = 'Tenants';
const AGENT_SHEET_NAME = 'Agents';
const NEWSLETTER_SHEET_NAME = 'Newsletter';

/**
 * Handles POST requests from the landing page
 */
function doPost(e) {
  try {
    // Parse the incoming JSON data
    const data = JSON.parse(e.postData.contents);
    
    // Get the active spreadsheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Route to appropriate handler based on type
    switch(data.type) {
      case 'tenant':
        saveTenantData(ss, data);
        break;
      case 'agent':
        saveAgentData(ss, data);
        break;
      case 'newsletter':
        saveNewsletterData(ss, data);
        break;
      default:
        throw new Error('Unknown form type: ' + data.type);
    }
    
    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // Log error and return error response
    console.error('Error processing form submission:', error);
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handles GET requests (for testing)
 */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ 
      status: 'ok', 
      message: 'Yoombaa Landing Page API is running',
      timestamp: new Date().toISOString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Save tenant requirements to the Tenants sheet
 */
function saveTenantData(ss, data) {
  const sheet = ss.getSheetByName(TENANT_SHEET_NAME);
  
  if (!sheet) {
    throw new Error('Tenants sheet not found. Please create a sheet named "' + TENANT_SHEET_NAME + '"');
  }
  
  // Format timestamp for Kenya timezone
  const timestamp = Utilities.formatDate(
    new Date(), 
    'Africa/Nairobi', 
    'yyyy-MM-dd HH:mm:ss'
  );
  
  // Append row with tenant data
  sheet.appendRow([
    timestamp,
    data.fullName || '',
    data.phone || '',
    data.email || '',
    data.location || '',
    data.propertyType || '',
    data.budget || '',
    data.timeline || '',
    data.requirements || '',
    data.source || 'landing_page'
  ]);
  
  // Optional: Send email notification for new tenant lead
  sendNewLeadNotification(data, 'tenant');
}

/**
 * Save agent registration to the Agents sheet
 */
function saveAgentData(ss, data) {
  const sheet = ss.getSheetByName(AGENT_SHEET_NAME);
  
  if (!sheet) {
    throw new Error('Agents sheet not found. Please create a sheet named "' + AGENT_SHEET_NAME + '"');
  }
  
  // Format timestamp for Kenya timezone
  const timestamp = Utilities.formatDate(
    new Date(), 
    'Africa/Nairobi', 
    'yyyy-MM-dd HH:mm:ss'
  );
  
  // Append row with agent data
  sheet.appendRow([
    timestamp,
    data.fullName || '',
    data.phone || '',
    data.email || '',
    data.agency || 'Independent',
    data.location || '',
    data.experience || '',
    data.propertyTypes || '',
    data.about || '',
    data.source || 'landing_page'
  ]);
  
  // Optional: Send email notification for new agent registration
  sendNewLeadNotification(data, 'agent');
}

/**
 * Save newsletter signup to the Newsletter sheet
 */
function saveNewsletterData(ss, data) {
  const sheet = ss.getSheetByName(NEWSLETTER_SHEET_NAME);
  
  if (!sheet) {
    throw new Error('Newsletter sheet not found. Please create a sheet named "' + NEWSLETTER_SHEET_NAME + '"');
  }
  
  // Format timestamp for Kenya timezone
  const timestamp = Utilities.formatDate(
    new Date(), 
    'Africa/Nairobi', 
    'yyyy-MM-dd HH:mm:ss'
  );
  
  // Append row with newsletter data
  sheet.appendRow([
    timestamp,
    data.email || '',
    data.userType || 'unknown',
    data.source || 'landing_page'
  ]);
}

/**
 * Send email notification for new submissions (optional)
 * Uncomment and configure if you want email alerts
 */
function sendNewLeadNotification(data, type) {
  // Configure your notification email here
  const NOTIFICATION_EMAIL = 'hello@yoombaa.com'; // Change this!
  const SEND_NOTIFICATIONS = false; // Set to true to enable
  
  if (!SEND_NOTIFICATIONS) return;
  
  const subject = type === 'tenant' 
    ? '🏠 New Tenant Lead: ' + data.fullName
    : '🏢 New Agent Registration: ' + data.fullName;
  
  let body = '';
  
  if (type === 'tenant') {
    body = `
New tenant lead from Yoombaa Landing Page!

Name: ${data.fullName}
Phone: ${data.phone}
Email: ${data.email}
Location: ${data.location}
Property Type: ${data.propertyType}
Budget: ${data.budget}
Timeline: ${data.timeline}
Requirements: ${data.requirements || 'None specified'}

---
Yoombaa - Kenya's Smartest Way to Find Rental Homes
    `;
  } else {
    body = `
New agent registration from Yoombaa Landing Page!

Name: ${data.fullName}
Phone: ${data.phone}
Email: ${data.email}
Agency: ${data.agency || 'Independent'}
Location: ${data.location}
Experience: ${data.experience}
Property Types: ${data.propertyTypes}
About: ${data.about || 'Not provided'}

---
Yoombaa - Kenya's Smartest Way to Find Rental Homes
    `;
  }
  
  try {
    GmailApp.sendEmail(NOTIFICATION_EMAIL, subject, body);
  } catch (error) {
    console.error('Failed to send notification email:', error);
  }
}

/**
 * Test function - run this to verify the script is working
 */
function testScript() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  console.log('Spreadsheet found: ' + ss.getName());
  
  const tenantSheet = ss.getSheetByName(TENANT_SHEET_NAME);
  const agentSheet = ss.getSheetByName(AGENT_SHEET_NAME);
  const newsletterSheet = ss.getSheetByName(NEWSLETTER_SHEET_NAME);
  
  console.log('Tenants sheet: ' + (tenantSheet ? 'Found ✓' : 'NOT FOUND ✗'));
  console.log('Agents sheet: ' + (agentSheet ? 'Found ✓' : 'NOT FOUND ✗'));
  console.log('Newsletter sheet: ' + (newsletterSheet ? 'Found ✓' : 'NOT FOUND ✗'));
}
