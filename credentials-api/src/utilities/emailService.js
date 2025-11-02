// credentials-api/src/utilities/emailService.js
// Email sending service for verification and password reset

/**
 * Send verification email
 * In development: logs to console
 * In production: integrate with real email service (SendGrid, AWS SES, etc.)
 * 
 * @param {string} email - Recipient email address
 * @param {string} firstname - User's first name
 * @param {string} verificationUrl - Full URL with verification token
 * @returns {boolean} True if email sent successfully
 */
async function sendVerificationEmail(email, firstname, verificationUrl) {
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    if (isDevelopment) {
        console.log('\n========================================');
        console.log('📧 EMAIL VERIFICATION (Development Mode)');
        console.log('========================================');
        console.log(`To: ${email}`);
        console.log(`Name: ${firstname}`);
        console.log(`Subject: Verify your email address`);
        console.log('\nEmail Body:');
        console.log(`Hello ${firstname},\n`);
        console.log('Please verify your email address by clicking the link below:\n');
        console.log(verificationUrl);
        console.log('\nThis link will expire in 48 hours.\n');
        console.log('If you did not request this verification, please ignore this email.');
        console.log('========================================\n');
        
        return true; // Simulate success in development
    }
    
    // Production: Integrate with real email service
    try {
        // Example with SendGrid (uncomment and configure when ready):
        // const sgMail = require('@sendgrid/mail');
        // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        // 
        // const msg = {
        //     to: email,
        //     from: process.env.FROM_EMAIL,
        //     subject: 'Verify your email address',
        //     text: `Hello ${firstname},\n\nPlease verify your email: ${verificationUrl}`,
        //     html: `<p>Hello ${firstname},</p><p>Please verify your email by clicking the link below:</p><p><a href="${verificationUrl}">Verify Email</a></p>`
        // };
        // 
        // await sgMail.send(msg);
        
        console.warn('Production email service not configured. Email not sent.');
        return false;
    } catch (error) {
        console.error('Error sending verification email:', error);
        return false;
    }
}

/**
 * Send password reset email
 * 
 * @param {string} email - Recipient email address
 * @param {string} firstname - User's first name
 * @param {string} resetUrl - Full URL with reset token
 * @returns {boolean} True if email sent successfully
 */
async function sendPasswordResetEmail(email, firstname, resetUrl) {
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    if (isDevelopment) {
        console.log('\n========================================');
        console.log('🔑 PASSWORD RESET (Development Mode)');
        console.log('========================================');
        console.log(`To: ${email}`);
        console.log(`Name: ${firstname}`);
        console.log(`Subject: Reset your password`);
        console.log('\nEmail Body:');
        console.log(`Hello ${firstname},\n`);
        console.log('You requested to reset your password. Click the link below:\n');
        console.log(resetUrl);
        console.log('\nThis link will expire in 1 hour.\n');
        console.log('If you did not request this reset, please ignore this email.');
        console.log('========================================\n');
        
        return true; // Simulate success in development
    }
    
    // Production: Integrate with real email service
    try {
        // Example with SendGrid (uncomment and configure when ready):
        // const sgMail = require('@sendgrid/mail');
        // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        // 
        // const msg = {
        //     to: email,
        //     from: process.env.FROM_EMAIL,
        //     subject: 'Reset your password',
        //     text: `Hello ${firstname},\n\nReset your password: ${resetUrl}`,
        //     html: `<p>Hello ${firstname},</p><p>Click the link below to reset your password:</p><p><a href="${resetUrl}">Reset Password</a></p>`
        // };
        // 
        // await sgMail.send(msg);
        
        console.warn('Production email service not configured. Email not sent.');
        return false;
    } catch (error) {
        console.error('Error sending password reset email:', error);
        return false;
    }
}

module.exports = {
    sendVerificationEmail,
    sendPasswordResetEmail
};
