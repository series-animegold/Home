const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const cors = require("cors")({ origin: true });

admin.initializeApp();

// Configure your Gmail account here
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER || "your-email@gmail.com",
    pass: process.env.GMAIL_PASSWORD || "your-app-password"
  }
});

// ✅ Function to send temp password via email
exports.sendTempPassword = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(400).send("Only POST requests allowed");
    }

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    try {
      const db = admin.firestore();
      const usersRef = db.collection("users");
      
      // Find user by email
      const snapshot = await usersRef.where("email", "==", email).get();

      if (snapshot.empty) {
        return res.status(404).json({ error: "Email not found" });
      }

      const userDoc = snapshot.docs[0];
      const userId = userDoc.id;
      const userData = userDoc.data();
      const userName = userData.userName || "User";

      // Generate random 6-digit temp password
      const tempPassword = Math.floor(100000 + Math.random() * 900000).toString();

      // Save temp password to Firestore with expiration (30 minutes)
      const expirationTime = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      await usersRef.doc(userId).update({
        tempPassword: tempPassword,
        tempPasswordExpiry: expirationTime,
        passwordResetRequested: new Date(),
        resetEmail: email
      });

      // Send email with temp password
      const mailOptions = {
        from: process.env.GMAIL_USER || "noreply@animegold.com",
        to: email,
        subject: "🔐 AnimeGold - Temporary Password Reset",
        html: `
          <div style="font-family: Arial, sans-serif; background: linear-gradient(-45deg, #1a0033, #2d0052); padding: 20px; border-radius: 10px; color: #fff;">
            <h2 style="color: #ffb84d;">Hello ${userName}! 👋</h2>
            
            <p>You requested a password reset. Here's your temporary password:</p>
            
            <div style="background: #333; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; border: 2px solid #ff9800;">
              <h3 style="color: #ffb84d; margin: 0; font-size: 32px; letter-spacing: 5px;">${tempPassword}</h3>
              <p style="margin: 10px 0 0 0; color: #ffb84d; font-size: 12px;">Use this to login</p>
            </div>

            <p><strong>⏰ This password expires in 30 minutes!</strong></p>
            
            <p style="background: #2a2a2a; padding: 15px; border-radius: 8px; border-left: 4px solid #ff9800;">
              <strong>📝 Instructions:</strong><br>
              1. Go to AnimeGold login page<br>
              2. Enter your email and the temporary password above<br>
              3. You'll be asked to set a new password<br>
              4. Use your new password for future logins
            </p>

            <p style="color: #ffb84d; font-size: 12px;">
              <strong>🔒 Security Tips:</strong><br>
              • Never share this password with anyone<br>
              • Change it immediately after logging in<br>
              • If you didn't request this, ignore this email
            </p>

            <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #444; font-size: 12px; color: #999;">
              © AnimeGold - All rights reserved
            </p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);

      res.status(200).json({
        success: true,
        message: `✅ Temporary password sent to ${email}`,
        expiresIn: "30 minutes"
      });

    } catch (error) {
      console.error("Error sending temp password:", error);
      res.status(500).json({ error: "Failed to send email: " + error.message });
    }
  });
});

// ✅ Function to reset password by admin
exports.resetPasswordByAdmin = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(400).send("Only POST requests allowed");
    }

    const { userId, email } = req.body;

    if (!userId || !email) {
      return res.status(400).json({ error: "userId and email are required" });
    }

    try {
      const db = admin.firestore();
      const usersRef = db.collection("users");
      
      // Get user data
      const userDoc = await usersRef.doc(userId).get();

      if (!userDoc.exists) {
        return res.status(404).json({ error: "User not found" });
      }

      const userData = userDoc.data();
      const userName = userData.userName || "User";

      // Generate random 6-digit temp password
      const tempPassword = Math.floor(100000 + Math.random() * 900000).toString();

      // Save temp password to Firestore with expiration (30 minutes)
      const expirationTime = new Date(Date.now() + 30 * 60 * 1000);
      await usersRef.doc(userId).update({
        tempPassword: tempPassword,
        tempPasswordExpiry: expirationTime,
        passwordResetByAdmin: new Date(),
        resetEmail: email
      });

      // Send email with temp password
      const mailOptions = {
        from: process.env.GMAIL_USER || "noreply@animegold.com",
        to: email,
        subject: "🔐 AnimeGold - Password Reset by Admin",
        html: `
          <div style="font-family: Arial, sans-serif; background: linear-gradient(-45deg, #1a0033, #2d0052); padding: 20px; border-radius: 10px; color: #fff;">
            <h2 style="color: #ffb84d;">Hello ${userName}! 👋</h2>
            
            <p>An administrator has reset your password. Here's your new temporary password:</p>
            
            <div style="background: #333; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; border: 2px solid #ff9800;">
              <h3 style="color: #ffb84d; margin: 0; font-size: 32px; letter-spacing: 5px;">${tempPassword}</h3>
              <p style="margin: 10px 0 0 0; color: #ffb84d; font-size: 12px;">Use this to login</p>
            </div>

            <p><strong>⏰ This password expires in 30 minutes!</strong></p>
            
            <p style="background: #2a2a2a; padding: 15px; border-radius: 8px; border-left: 4px solid #ff9800;">
              <strong>📝 Instructions:</strong><br>
              1. Go to AnimeGold login page<br>
              2. Enter your email and the temporary password above<br>
              3. You'll be asked to set a new password<br>
              4. Use your new password for future logins
            </p>

            <p style="color: #ffb84d; font-size: 12px;">
              <strong>🔒 Security Tips:</strong><br>
              • Never share this password with anyone<br>
              • Change it immediately after logging in
            </p>

            <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #444; font-size: 12px; color: #999;">
              © AnimeGold - All rights reserved
            </p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);

      res.status(200).json({
        success: true,
        message: `✅ Temporary password sent to ${email}`,
        tempPassword: tempPassword,
        expiresIn: "30 minutes"
      });

    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ error: "Failed to reset password: " + error.message });
    }
  });
});

// ✅ Function to verify temp password and set new password
exports.setNewPassword = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(400).send("Only POST requests allowed");
    }

    const { email, tempPassword, newPassword } = req.body;

    if (!email || !tempPassword || !newPassword) {
      return res.status(400).json({ error: "Email, tempPassword, and newPassword are required" });
    }

    try {
      const db = admin.firestore();
      const usersRef = db.collection("users");
      
      // Find user by email
      const snapshot = await usersRef.where("email", "==", email).get();

      if (snapshot.empty) {
        return res.status(404).json({ error: "User not found" });
      }

      const userDoc = snapshot.docs[0];
      const userId = userDoc.id;
      const userData = userDoc.data();

      // Verify temp password
      if (userData.tempPassword !== tempPassword) {
        return res.status(401).json({ error: "Invalid temporary password" });
      }

      // Check expiration
      const expiryTime = userData.tempPasswordExpiry?.toDate?.() || new Date(0);
      if (new Date() > expiryTime) {
        return res.status(401).json({ error: "Temporary password has expired" });
      }

      // Update password in Firestore
      await usersRef.doc(userId).update({
        password: newPassword,
        tempPassword: null,
        tempPasswordExpiry: null,
        passwordChangedAt: new Date(),
        lastPasswordChange: new Date()
      });

      res.status(200).json({
        success: true,
        message: "✅ Password changed successfully"
      });

    } catch (error) {
      console.error("Error setting new password:", error);
      res.status(500).json({ error: "Failed to set new password: " + error.message });
    }
  });
});

// ✅ Function to validate temp password
exports.validateTempPassword = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(400).send("Only POST requests allowed");
    }

    const { email, tempPassword } = req.body;

    if (!email || !tempPassword) {
      return res.status(400).json({ error: "Email and tempPassword are required" });
    }

    try {
      const db = admin.firestore();
      const usersRef = db.collection("users");
      
      const snapshot = await usersRef.where("email", "==", email).get();

      if (snapshot.empty) {
        return res.status(404).json({ error: "User not found" });
      }

      const userData = snapshot.docs[0].data();

      if (userData.tempPassword !== tempPassword) {
        return res.status(401).json({ valid: false, error: "Invalid password" });
      }

      const expiryTime = userData.tempPasswordExpiry?.toDate?.() || new Date(0);
      if (new Date() > expiryTime) {
        return res.status(401).json({ valid: false, error: "Password expired" });
      }

      res.status(200).json({ valid: true, message: "Password is valid" });

    } catch (error) {
      console.error("Error validating temp password:", error);
      res.status(500).json({ error: "Validation failed: " + error.message });
    }
  });
});
