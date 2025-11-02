// credentials-api/src/utilities/emailService.js
// Email sending service for verification and password reset using nodemailer

const nodemailer = require('nodemailer');

/**
 * Create nodemailer transporter
 * Uses Gmail with App Password (2FA bypass)
 * Set these environment variables:
 * - EMAIL_USER: Your Gmail address (e.g., yourgroup@gmail.com)
 * - EMAIL_PASSWORD: Your Gmail App Password (NOT your regular password)
 * 
 * To create an App Password:
 * 1. Go to Google Account settings
 * 2. Security > 2-Step Verification (enable if not enabled)
 * 3. App passwords > Select app: Mail, Select device: Other (Custom name)
 * 4. Copy the 16-character password and use it as EMAIL_PASSWORD
 */
function createTransporter() {
    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASSWORD;
    
    // If credentials not configured, return null (will use dev mode)
    if (!emailUser || !emailPassword) {
        return null;
    }
    
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: emailUser,
            pass: emailPassword
        }
    });
}

/**
 * Send verification email
 * 
 * @param {string} email - Recipient email address
 * @param {string} firstname - User's first name
 * @param {string} verificationUrl - Full URL with verification token
 * @returns {boolean} True if email sent successfully
 */
async function sendVerificationEmail(email, firstname, verificationUrl) {
    const transporter = createTransporter();
    
    // Dev mode: log to console if no email credentials configured
    if (!transporter) {
        console.log('\n========================================');
        console.log('📧 EMAIL VERIFICATION (Dev Mode - Logging Only)');
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
        
        return true; // Simulate success in dev mode
    }
    
    // Send real email with nodemailer
    try {
        const mailOptions = {
            from: `"Credentials API" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Verify your email address',
            text: `Hello ${firstname},\n\nPlease verify your email address by clicking the link below:\n\n${verificationUrl}\n\nThis link will expire in 48 hours.\n\nIf you did not request this verification, please ignore this email.`,
            html: `
                <h2>Email Verification</h2>
                <p>Hello ${firstname},</p>
                <p>Please verify your email address by clicking the button below:</p>
                <p style="margin: 30px 0;">
                    <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 14px 20px; text-decoration: none; border-radius: 4px;">Verify Email</a>
                </p>
                <p>Or copy and paste this link into your browser:</p>
                <p>${verificationUrl}</p>
                <p style="color: #666; font-size: 12px; margin-top: 30px;">This link will expire in 48 hours. If you did not request this verification, please ignore this email.</p>
            `
        };
        
        await transporter.sendMail(mailOptions);
        console.log(`✅ Verification email sent to ${email}`);
        return true;
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
    const transporter = createTransporter();
    
    // Dev mode: log to console if no email credentials configured
    if (!transporter) {
        console.log('\n========================================');
        console.log('🔑 PASSWORD RESET (Dev Mode - Logging Only)');
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
        
        return true; // Simulate success in dev mode
    }
    
    // Send real email with nodemailer
    try {
        const mailOptions = {
            from: `"Credentials API" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Reset your password',
            text: `Hello ${firstname},\n\nYou requested to reset your password. Click the link below:\n\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you did not request this reset, please ignore this email.`,
            html: `
                <h2>Password Reset</h2>
                <p>Hello ${firstname},</p>
                <p>You requested to reset your password. Click the button below to proceed:</p>
                <p style="margin: 30px 0;">
                    <a href="${resetUrl}" style="background-color: #2196F3; color: white; padding: 14px 20px; text-decoration: none; border-radius: 4px;">Reset Password</a>
                </p>
                <p>Or copy and paste this link into your browser:</p>
                <p>${resetUrl}</p>
                <p style="color: #666; font-size: 12px; margin-top: 30px;">This link will expire in 1 hour. If you did not request this reset, please ignore this email and your password will remain unchanged.</p>
            `
        };
        
        await transporter.sendMail(mailOptions);
        console.log(`✅ Password reset email sent to ${email}`);
        return true;
    } catch (error) {
        console.error('Error sending password reset email:', error);
        return false;
    }
}

module.exports = {
    sendVerificationEmail,
    sendPasswordResetEmail
};
