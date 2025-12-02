import { createNotification } from './database';

// ============================================
// EMAIL NOTIFICATIONS (Using EmailJS or SendGrid)
// ============================================

export const sendEmailNotification = async (to, subject, htmlContent) => {
  try {
    // For production, integrate with SendGrid, AWS SES, or similar
    // For now, we'll use EmailJS as a simple solution
    
    // EmailJS Configuration (you'll need to set up EmailJS account)
    const emailJsConfig = {
      serviceId: process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
      templateId: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID,
      userId: process.env.NEXT_PUBLIC_EMAILJS_USER_ID,
    };

    // This is a placeholder - implement actual email sending
    console.log('Sending email to:', to, 'Subject:', subject);
    
    // Example using fetch to send email via your API route
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, htmlContent })
    });

    if (response.ok) {
      return { success: true };
    }
    
    return { success: false, error: 'Failed to send email' };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// WHATSAPP NOTIFICATIONS
// ============================================

export const sendWhatsAppMessage = (phoneNumber, message) => {
  try {
    // Format phone number (remove spaces, dashes, etc.)
    const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
    
    // Create WhatsApp URL
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
    
    // Open WhatsApp in new window
    if (typeof window !== 'undefined') {
      window.open(whatsappUrl, '_blank');
    }
    
    return { success: true, url: whatsappUrl };
  } catch (error) {
    console.error('Error opening WhatsApp:', error);
    return { success: false, error: error.message };
  }
};

// For automated WhatsApp messages (requires WhatsApp Business API)
export const sendAutomatedWhatsApp = async (phoneNumber, templateName, parameters) => {
  try {
    // This requires WhatsApp Business API integration
    // You'll need to set up a WhatsApp Business account and get API credentials
    
    const response = await fetch('/api/whatsapp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber,
        templateName,
        parameters
      })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error sending automated WhatsApp:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// IN-APP NOTIFICATIONS
// ============================================

export const notifyNewLead = async (agentId, leadData) => {
  try {
    await createNotification({
      userId: agentId,
      type: 'new_lead',
      title: 'New Lead Available!',
      message: `A new tenant is looking for ${leadData.type} in ${leadData.location}`,
      data: {
        leadId: leadData.id,
        location: leadData.location,
        type: leadData.type,
        budget: leadData.budget
      }
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error creating lead notification:', error);
    return { success: false, error: error.message };
  }
};

export const notifyAgentContact = async (tenantId, agentName) => {
  try {
    await createNotification({
      userId: tenantId,
      type: 'agent_contact',
      title: 'Agent Contacted You',
      message: `${agentName} has viewed your rental request and may contact you soon.`,
      data: {
        agentName
      }
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error creating contact notification:', error);
    return { success: false, error: error.message };
  }
};

export const notifySubscriptionExpiry = async (agentId, daysRemaining) => {
  try {
    await createNotification({
      userId: agentId,
      type: 'subscription_expiry',
      title: 'Subscription Expiring Soon',
      message: `Your premium subscription will expire in ${daysRemaining} days. Renew now to continue accessing leads.`,
      data: {
        daysRemaining
      }
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error creating subscription notification:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// NOTIFICATION TEMPLATES
// ============================================

export const EMAIL_TEMPLATES = {
  NEW_LEAD: (leadData) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #059669;">New Lead Available! 🏠</h2>
      <p>A new tenant is looking for a property matching your listings.</p>
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Property Type:</strong> ${leadData.type}</p>
        <p><strong>Location:</strong> ${leadData.location}</p>
        <p><strong>Budget:</strong> ${leadData.budget}</p>
      </div>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/agent-dashboard" 
         style="background: #059669; color: white; padding: 12px 24px; 
                text-decoration: none; border-radius: 8px; display: inline-block;">
        View Lead Details
      </a>
    </div>
  `,
  
  WELCOME_AGENT: (agentName) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #059669;">Welcome to RentConnect! 👋</h2>
      <p>Hi ${agentName},</p>
      <p>Thank you for joining RentConnect. You're now part of a network connecting serious tenants with verified agents.</p>
      <p>Start by upgrading to Premium to unlock all lead contacts and features.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/subscription" 
         style="background: #059669; color: white; padding: 12px 24px; 
                text-decoration: none; border-radius: 8px; display: inline-block;">
        Upgrade to Premium
      </a>
    </div>
  `,
  
  SUBSCRIPTION_SUCCESS: (agentName, endDate) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #059669;">Subscription Activated! 🎉</h2>
      <p>Hi ${agentName},</p>
      <p>Your Premium subscription is now active. You can now access all tenant contacts and unlock unlimited leads.</p>
      <p><strong>Subscription valid until:</strong> ${endDate}</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/agent-dashboard" 
         style="background: #059669; color: white; padding: 12px 24px; 
                text-decoration: none; border-radius: 8px; display: inline-block;">
        View Leads Now
      </a>
    </div>
  `,
  
  TENANT_CONFIRMATION: (tenantName, leadData) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #059669;">Request Submitted Successfully! ✓</h2>
      <p>Hi ${tenantName},</p>
      <p>Your rental request has been posted. Verified agents will start contacting you soon.</p>
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Your Requirements:</strong></p>
        <p>Property Type: ${leadData.type}</p>
        <p>Location: ${leadData.location}</p>
        <p>Budget: ${leadData.budget}</p>
      </div>
      <p>We'll notify you when agents view your request.</p>
    </div>
  `
};

export const WHATSAPP_TEMPLATES = {
  AGENT_TO_TENANT: (agentName, propertyDetails) => 
    `Hello! 👋\n\nI'm ${agentName} from RentConnect. I saw your rental request and have a property that matches your requirements:\n\n${propertyDetails}\n\nWould you like to schedule a viewing?`,
  
  NEW_LEAD_ALERT: (leadData) =>
    `🏠 New Lead Alert!\n\nLocation: ${leadData.location}\nType: ${leadData.type}\nBudget: ${leadData.budget}\n\nLogin to RentConnect to view contact details.`
};

// ============================================
// NOTIFICATION SCHEDULER
// ============================================

export const scheduleNotification = (userId, notificationData, delayMs) => {
  setTimeout(async () => {
    await createNotification({
      userId,
      ...notificationData
    });
  }, delayMs);
};

// Check for subscription expiry and send notifications
export const checkAndNotifySubscriptionExpiry = async (agentId, subscriptionEndDate) => {
  const now = new Date();
  const endDate = new Date(subscriptionEndDate);
  const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
  
  // Notify 7 days before expiry
  if (daysRemaining === 7 || daysRemaining === 3 || daysRemaining === 1) {
    await notifySubscriptionExpiry(agentId, daysRemaining);
  }
};
