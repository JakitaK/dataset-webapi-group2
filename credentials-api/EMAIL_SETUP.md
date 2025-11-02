# Email Setup for Credentials API

This guide shows how to configure Gmail with nodemailer to send real verification and password reset emails.

## Overview

The Credentials API uses **nodemailer** to send emails. Without SMTP credentials configured, emails are logged to the console (dev mode) and the verification URL is returned in the API response for testing.

To send **real emails**, you need to set up a Gmail account with an App Password.

---

## Step 1: Create a Gmail Account

1. Create a new Gmail account for your group (a "burner" account)
   - Example: `yourgroup.credentials@gmail.com`
2. **Important:** Do NOT use a personal account — use a dedicated account for the project

---

## Step 2: Enable 2-Step Verification (Required)

Google requires 2FA to generate App Passwords.

1. Sign in to your Gmail account
2. Go to **Google Account** → **Security**
3. Under "How you sign in to Google", enable **2-Step Verification**
4. Follow the prompts to set it up (phone number, backup codes, etc.)

---

## Step 3: Generate an App Password

**Note:** You CANNOT use your normal Gmail password. You must create an App Password.

1. After enabling 2-Step Verification, go to:
   - **Google Account** → **Security** → **App passwords**
   - Or visit: https://myaccount.google.com/apppasswords

2. Click **Select app** → Choose **Mail**

3. Click **Select device** → Choose **Other (Custom name)**
   - Enter: `Credentials API`

4. Click **Generate**

5. Google will show a **16-character password** (like `abcd efgh ijkl mnop`)
   - **Copy this password** — you'll only see it once
   - Remove the spaces when using it: `abcdefghijklmnop`

---

## Step 4: Set Heroku Config Variables

Run these commands in PowerShell (replace the placeholders with your actual values):

```powershell
# Set email service to Gmail
heroku config:set EMAIL_SERVICE=gmail -a credentials-api-group2

# Set your Gmail address
heroku config:set EMAIL_USER=yourgroup.credentials@gmail.com -a credentials-api-group2

# Set the 16-character App Password (no spaces)
heroku config:set EMAIL_APP_PASSWORD=abcdefghijklmnop -a credentials-api-group2

# Set the "From" address (same as EMAIL_USER)
heroku config:set FROM_EMAIL=yourgroup.credentials@gmail.com -a credentials-api-group2
```

**Note:** Replace `credentials-api-group2` with your actual Heroku app name if different.

---

## Step 5: Verify Configuration

Check that all variables are set:

```powershell
heroku config -a credentials-api-group2
```

You should see:
```
EMAIL_SERVICE:      gmail
EMAIL_USER:         yourgroup.credentials@gmail.com
EMAIL_APP_PASSWORD: abcdefghijklmnop
FROM_EMAIL:         yourgroup.credentials@gmail.com
```

---

## Step 6: Test Email Sending

### Register a new user or login to get a JWT token:

```powershell
$body = @{
    email = "test@example.com"
    password = "TestPass123!"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "https://credentials-api-group2-20f368b8528b.herokuapp.com/auth/login" -Method Post -Body $body -ContentType "application/json"

$token = $response.data.accessToken
Write-Host "Token: $token"
```

### Send verification email:

```powershell
$headers = @{ "Authorization" = "Bearer $token" }
Invoke-RestMethod -Uri "https://credentials-api-group2-20f368b8528b.herokuapp.com/auth/verify/email/send" -Method Post -Headers $headers
```

### Check your inbox

- The verification email should arrive at the email address associated with the authenticated user
- Subject: "Verify your email address"
- Click the verification link to confirm

---

## Troubleshooting

### Email not arriving?

1. **Check Heroku logs:**
   ```powershell
   heroku logs --tail -a credentials-api-group2
   ```
   Look for errors from nodemailer.

2. **Check spam folder** in Gmail

3. **Verify config vars are set correctly:**
   ```powershell
   heroku config -a credentials-api-group2
   ```

4. **Common issues:**
   - App Password has spaces (remove them)
   - App Password is incorrect (regenerate it)
   - 2FA is not enabled (required for App Passwords)
   - EMAIL_USER doesn't match FROM_EMAIL
   - Wrong Heroku app name in commands

### Still not working?

- Make sure the Gmail account has 2FA enabled
- Try regenerating the App Password
- Check that you're using the App Password, not your regular Gmail password

---

## Gmail Sending Limits

**Free Gmail accounts have sending limits:**
- ~500 emails per day
- ~100-150 emails per hour

For production apps with higher volume, consider switching to:
- **SendGrid** (free tier: 100 emails/day)
- **AWS SES**
- **Mailgun**

The code already supports SendGrid — just set `SENDGRID_API_KEY` instead of the Gmail variables.

---

## Security Notes

- ✅ **App Passwords are secure** — they're designed for this use case
- ✅ Keep your App Password secret (don't commit it to git)
- ✅ Use Heroku config vars (environment variables) — never hardcode credentials
- ❌ Do NOT try to bypass 2FA — use App Passwords as intended

---

## Alternative: SendGrid (For Production)

If you prefer SendGrid (more reliable for production):

1. Sign up at https://sendgrid.com (free tier available)
2. Create an API key
3. Verify your sender email
4. Set Heroku config vars:
   ```powershell
   heroku config:set SENDGRID_API_KEY=your_sendgrid_api_key -a credentials-api-group2
   heroku config:set FROM_EMAIL=verified@yourdomain.com -a credentials-api-group2
   ```

The app will automatically use SendGrid if `SENDGRID_API_KEY` is set.

---

## Summary

✅ Create Gmail account  
✅ Enable 2-Step Verification  
✅ Generate App Password  
✅ Set Heroku config vars (EMAIL_SERVICE, EMAIL_USER, EMAIL_APP_PASSWORD, FROM_EMAIL)  
✅ Test by sending verification email  
✅ Check inbox and spam folder  

**That's it!** Your Credentials API can now send real emails. 📧
