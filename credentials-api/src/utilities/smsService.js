// credentials-api/src/utilities/smsService.js
// SMS sending service using email-to-SMS gateway

// SMS gateway mappings for major carriers
const SMS_GATEWAYS = {
    'att': '@txt.att.net',
    'tmobile': '@tmomail.net',
    'verizon': '@vtext.com',
    'sprint': '@messaging.sprintpcs.com',
    'metropcs': '@mymetropcs.com',
    'boost': '@sms.myboostmobile.com',
    'cricket': '@sms.cricketwireless.net',
    'uscellular': '@email.uscc.net'
};

/**
 * Send SMS via email-to-SMS gateway
 * This is a free method that works by sending email to carrier-specific addresses
 * 
 * @param {string} phone - Phone number (digits only)
 * @param {string} message - SMS message content
 * @param {string} carrier - Optional carrier ID (att, tmobile, verizon, etc.)
 * @returns {boolean} True if SMS sent successfully
 */
async function sendSMSViaEmail(phone, message, carrier = 'att') {
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    // Get gateway for carrier
    const gateway = SMS_GATEWAYS[carrier] || SMS_GATEWAYS['att'];
    const smsEmail = `${phone}${gateway}`;
    
    if (isDevelopment) {
        console.log('\n========================================');
        console.log('📱 SMS VERIFICATION (Development Mode)');
        console.log('========================================');
        console.log(`Phone: ${phone}`);
        console.log(`Carrier: ${carrier}`);
        console.log(`Gateway: ${smsEmail}`);
        console.log(`\nMessage:\n${message}`);
        console.log('========================================\n');
        
        return true; // Simulate success in development
    }
    
    // Production: Send email to SMS gateway
    try {
        // Example with SendGrid (uncomment and configure when ready):
        // const sgMail = require('@sendgrid/mail');
        // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        // 
        // const msg = {
        //     to: smsEmail,
        //     from: process.env.FROM_EMAIL,
        //     subject: '',  // Keep empty for SMS
        //     text: message
        // };
        // 
        // await sgMail.send(msg);
        
        console.warn('Production SMS service not configured. SMS not sent.');
        return false;
    } catch (error) {
        console.error('Error sending SMS:', error);
        return false;
    }
}

/**
 * Get list of supported carriers
 * @returns {array} Array of carrier IDs
 */
function getSupportedCarriers() {
    return Object.keys(SMS_GATEWAYS);
}

/**
 * Validate carrier ID
 * @param {string} carrier - Carrier ID to validate
 * @returns {boolean} True if carrier is supported
 */
function isValidCarrier(carrier) {
    return SMS_GATEWAYS.hasOwnProperty(carrier);
}

module.exports = {
    sendSMSViaEmail,
    getSupportedCarriers,
    isValidCarrier,
    SMS_GATEWAYS
};
