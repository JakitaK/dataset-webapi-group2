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
 * Uses nodemailer (same as email verification) to send to carrier SMS gateways
 * 
 * @param {string} phone - Phone number (digits only)
 * @param {string} message - SMS message content
 * @param {string} carrier - Optional carrier ID (att, tmobile, verizon, etc.)
 * @returns {boolean} True if SMS sent successfully
 */
async function sendSMSViaEmail(phone, message, carrier = 'att') {
    const nodemailer = require('nodemailer');
    
    // Normalize carrier (handle both 'carrier' and 'carrierId' parameter names)
    const normalizedCarrier = (carrier || 'att').toLowerCase();
    
    // Get gateway for carrier
    const gateway = SMS_GATEWAYS[normalizedCarrier] || SMS_GATEWAYS['att'];
    const smsEmail = `${phone}${gateway}`;
    
    // Check if email credentials are configured
    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_APP_PASSWORD || process.env.EMAIL_PASSWORD;
    
    // Dev mode: log to console if no email credentials configured
    if (!emailUser || !emailPassword) {
        console.log('\n========================================');
        console.log('📱 SMS VERIFICATION (Dev Mode - Logging Only)');
        console.log('========================================');
        console.log(`Phone: ${phone}`);
        console.log(`Carrier: ${normalizedCarrier}`);
        console.log(`Gateway: ${smsEmail}`);
        console.log(`\nMessage:\n${message}`);
        console.log('========================================\n');
        
        return true; // Simulate success in dev mode
    }
    
    // Production: Send email to SMS gateway using nodemailer (Gmail)
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: emailUser,
                pass: emailPassword
            }
        });
        
        const mailOptions = {
            from: emailUser,
            to: smsEmail,
            subject: '', // Keep empty for SMS
            text: message
        };
        
        await transporter.sendMail(mailOptions);
        console.log(`✅ SMS sent to ${smsEmail} (carrier: ${normalizedCarrier})`);
        return true;
    } catch (error) {
        console.error('❌ Error sending SMS:', error);
        console.error(`  Phone: ${phone}, Carrier: ${normalizedCarrier}, Gateway: ${smsEmail}`);
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
