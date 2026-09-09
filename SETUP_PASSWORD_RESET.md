# 🔐 Password Reset Setup Guide

## Step 1: Enable Gmail App Password

### 1. Go to your Google Account
- Visit: https://myaccount.google.com/
- Click **Security** (left sidebar)

### 2. Enable 2-Factor Authentication (if not already done)
- Scroll to "How you sign in to Google"
- Click "2-Step Verification"
- Follow the setup wizard

### 3. Create App Password
- Go back to Security settings
- Find "App passwords" (appears after 2FA is enabled)
- Select: **Mail** and **Windows Computer** (or your device)
- Google will generate a 16-character password
- **Copy and save this password** - you'll need it!

Example: `abcd efgh ijkl mnop` (without spaces)

---

## Step 2: Deploy Cloud Functions

### 1. Install Firebase CLI (if not installed)
```bash
npm install -g firebase-tools
```

### 2. Login to Firebase
```bash
firebase login
```

### 3. Navigate to your project
```bash
cd /path/to/your/project
```

### 4. Create `.env` file in `functions/` folder

Create a new file: `functions/.env`

Add your Gmail credentials:
```
GMAIL_USER=your-email@gmail.com
GMAIL_PASSWORD=abcdefghijklmnop
```

**⚠️ IMPORTANT:** Don't push `.env` to GitHub!

### 5. Create `.env.example` (for GitHub)
```
GMAIL_USER=your-email@gmail.com
GMAIL_PASSWORD=your-app-password-here
```

### 6. Deploy Functions
```bash
firebase deploy --only functions
```

Wait for deployment to complete. You'll see URLs like:
```
✓ Function URL: https://us-central1-animegold-bf2a7.cloudfunctions.net/sendTempPassword
```

**Copy these URLs** - you'll use them in the frontend!

---

## Step 3: Update Frontend with Function URLs

In **index.html** (login page), add the function URLs in the JavaScript:

```javascript
const TEMP_PASSWORD_FUNCTION = "https://us-central1-animegold-bf2a7.cloudfunctions.net/sendTempPassword";
const VALIDATE_TEMP_PASSWORD_FUNCTION = "https://us-central1-animegold-bf2a7.cloudfunctions.net/validateTempPassword";
const SET_NEW_PASSWORD_FUNCTION = "https://us-central1-animegold-bf2a7.cloudfunctions.net/setNewPassword";
```

---

## Step 4: How It Works

### User: "Forgot Password"
1. User clicks "Forgot Password" on login
2. Enters email
3. Function `sendTempPassword` is called
4. **Email with 6-digit temp password sent to Gmail**
5. Temp password expires in **30 minutes**
6. User logs in with temp password
7. Forced to set new password

### Admin: "Reset User Password"
1. Admin clicks "Reset Password" in dashboard
2. Function `resetPasswordByAdmin` is called
3. **Email with temp password sent to user**
4. User follows same process

### User: "Change Password" (While logged in)
1. User clicks "Change Password"
2. Enters current password (optional verification)
3. Sets new password
4. Function `setNewPassword` updates both:
   - Firestore (password field)
   - Login credentials

---

## Step 5: Environment Setup in Firebase Console

### 1. Go to Firebase Console
- https://console.firebase.google.com/

### 2. Select your project
- Click on **animegold-bf2a7**

### 3. Go to Functions
- Left sidebar → **Functions**

### 4. Set Environment Variables
- Click on a function name
- Go to **Runtime settings** tab
- Add your environment variables:
  - `GMAIL_USER` = your-email@gmail.com
  - `GMAIL_PASSWORD` = your-app-password

---

## Step 6: Firestore Security Rules

Update your `firestore.rules` to allow password updates:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
      allow read, write: if request.auth.token.email == "shadowtrimz@gmail.com"; // Admin
    }
  }
}
```

Deploy with:
```bash
firebase deploy --only firestore:rules
```

---

## Step 7: Test It Out

### Test from login page:
1. Go to login page
2. Click "Forgot Password"
3. Enter your email
4. Check your Gmail inbox
5. You should receive an email with a 6-digit password
6. Try logging in with that password

### Test from admin:
1. Go to admin dashboard
2. Click "Reset Password" on a user
3. Email sent to that user

---

## Troubleshooting

### Email not sending?
- ✅ Check GMAIL_USER and GMAIL_PASSWORD are correct
- ✅ Verify Gmail 2FA is enabled
- ✅ Verify App Password was created (not regular password)
- ✅ Check Cloud Functions logs: `firebase functions:log`

### Function not found?
- ✅ Make sure deployment completed successfully
- ✅ Check function URL is correct in index.html
- ✅ Check CORS is enabled (it is by default in functions)

### Password not updating?
- ✅ Make sure temp password hasn't expired (30 min limit)
- ✅ Check temp password matches exactly (case-sensitive)
- ✅ Verify Firestore rules allow updates

### Check Logs
```bash
firebase functions:log
```

---

## Security Notes

🔒 **Best Practices:**
- Temp passwords expire in **30 minutes**
- Temp passwords are **6 random digits**
- Passwords stored in Firestore (for now - can be improved with Firebase Auth)
- Never log sensitive data
- Use HTTPS only
- Consider adding rate limiting for password reset (prevent spam)

---

## Files to Update Next

1. **index.html** - Add "Forgot Password" button & modal
2. **admin.html** - Add "Reset Password" function for users
3. **earn.html** - Add "Change Password" for logged-in users

These files will call the Cloud Functions with the URLs above.

---

Questions? Let me know! 🚀
