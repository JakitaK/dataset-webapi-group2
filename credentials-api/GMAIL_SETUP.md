# Gmail Setup for Email Verification

## Quick Setup (5 minutes)

### Step 1: Create a Gmail Account
Create a "burner" Gmail account for your group (e.g., `yourgroup.credentials@gmail.com`)

### Step 2: Enable 2-Step Verification
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Click **Security** in the left sidebar
3. Under "How you sign in to Google", click **2-Step Verification**
4. Follow the prompts to enable 2FA (you'll need your phone)

### Step 3: Generate App Password
1. Still in **Security**, scroll down to **2-Step Verification**
2. At the bottom, click **App passwords**
3. Select app: **Mail**
4. Select device: **Other (Custom name)** → Type "Credentials API"
5. Click **Generate**
6. **Copy the 16-character password** (it will look like: `abcd efgh ijkl mnop`)

### Step 4: Set Heroku Config Vars
```bash
heroku config:set EMAIL_USER=yourgroup.credentials@gmail.com -a credentials-api-group2
heroku config:set EMAIL_APP_PASSWORD=abcdefghijklmnop -a credentials-api-group2
```

**Important:** Use the 16-character app password (no spaces), NOT your regular Gmail password!

### Step 5: Test
1. Deploy your app
2. Register a user
3. Call `POST /auth/verify/email/send` with JWT token
4. Check your recipient's email inbox for the verification email

## Testing Locally

Add to your `.env` file:
```
EMAIL_USER=yourgroup.credentials@gmail.com
EMAIL_APP_PASSWORD=abcdefghijklmnop
```

Then run `npm start` and test the email endpoints.

## Troubleshooting

### "Invalid login" error
- Make sure you're using the **App Password**, not your regular Gmail password
- Verify 2FA is enabled on the Gmail account
- Try regenerating the App Password

### Emails not arriving
- Check spam folder
- Verify EMAIL_USER and EMAIL_APP_PASSWORD are set in Heroku config vars
- Check Heroku logs: `heroku logs --tail -a credentials-api-group2`

### Gmail daily limits
- Gmail free accounts: ~500 emails/day
- If you hit limits, wait 24 hours or upgrade to Google Workspace

## Dev Mode (No Email Setup)

If you don't set EMAIL_USER and EMAIL_APP_PASSWORD, the API runs in dev mode:
- Emails are logged to console/Heroku logs
- API response includes the `verificationUrl` for testing
- Perfect for development and testing!

---

**Note:** Never commit `.env` file or expose your App Password in code!
