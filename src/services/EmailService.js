const nodemailer = require("nodemailer");
const EmailTemplates = require("../templates/EmailTemplates");
const CONSTANTS = require("../config/constants");

class EmailService {
  constructor() {
    this.transporter = null;
    this.setupTransporter();
  }

  // Setup email transporter
  setupTransporter() {
    // Untuk development, gunakan ethereal email (test email service)
    // Untuk production, ganti dengan SMTP provider sebenarnya (Gmail, SendGrid, etc.)
    
    if (process.env.NODE_ENV === "production") {
      // Production email configuration
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    } else {
      // Development - menggunakan Gmail SMTP (untuk testing)
      // Anda perlu setup App Password di Gmail
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER || 'your-email@gmail.com',
          pass: process.env.EMAIL_PASS || 'your-app-password'
        }
      });
    }
  }

  // Send OTP email
  async sendOTPEmail(email, otpCode, userName = "User") {
    try {
      const mailOptions = {
        from: {
          name: CONSTANTS.EMAIL.FROM_NAME,
          address: process.env.EMAIL_USER || 'noreply@apipanel.com'
        },
        to: email,
        subject: CONSTANTS.EMAIL.SUBJECTS.OTP_VERIFICATION,
        html: EmailTemplates.getOTPVerificationTemplate(otpCode, userName)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log("📧 OTP Email sent successfully:", result.messageId);
      
      return {
        success: true,
        messageId: result.messageId,
        message: "OTP email sent successfully"
      };

    } catch (error) {
      console.error("💥 Failed to send OTP email:", error);
      
      return {
        success: false,
        error: error.message,
        message: "Failed to send OTP email"
      };
    }
  }

  // Resend OTP email
  async resendOTPEmail(email, otpCode, userName = "User") {
    return await this.sendOTPEmail(email, otpCode, userName);
  }

  // Send welcome email after verification
  async sendWelcomeEmail(email, userName) {
    try {
      const mailOptions = {
        from: {
          name: CONSTANTS.EMAIL.FROM_NAME,
          address: process.env.EMAIL_USER || 'noreply@apipanel.com'
        },
        to: email,
        subject: CONSTANTS.EMAIL.SUBJECTS.WELCOME,
        html: EmailTemplates.getWelcomeTemplate(userName)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log("📧 Welcome email sent successfully:", result.messageId);
      
      return {
        success: true,
        messageId: result.messageId,
        message: "Welcome email sent successfully"
      };

    } catch (error) {
      console.error("💥 Failed to send welcome email:", error);
      return {
        success: false,
        error: error.message,
        message: "Failed to send welcome email"
      };
    }
  }



  // Test email connection
  async testConnection() {
    try {
      await this.transporter.verify();
      console.log("📧 Email service connection successful");
      return { success: true, message: "Email service is ready" };
    } catch (error) {
      console.error("💥 Email service connection failed:", error);
      return { success: false, message: "Email service connection failed", error: error.message };
    }
  }
}

// Export singleton instance
module.exports = new EmailService(); 