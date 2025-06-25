const CONSTANTS = require("../config/constants");

class EmailTemplates {
  // Base email template wrapper
  static getBaseTemplate(title, headerColor, content) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                line-height: 1.6; 
                color: #333; 
                margin: 0; 
                padding: 0; 
                background-color: #f4f4f4; 
            }
            .container { 
                max-width: 600px; 
                margin: 20px auto; 
                background-color: white; 
                border-radius: 8px; 
                box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
                overflow: hidden;
            }
            .header { 
                background-color: ${headerColor}; 
                color: white; 
                padding: 30px 20px; 
                text-align: center; 
            }
            .header h1 { 
                margin: 0; 
                font-size: 28px; 
                font-weight: bold; 
            }
            .content { 
                padding: 40px 30px; 
                background-color: white; 
            }
            .footer { 
                text-align: center; 
                padding: 20px; 
                background-color: #f8f9fa; 
                color: #666; 
                font-size: 14px; 
                border-top: 1px solid #eee;
            }
            .otp-code { 
                font-size: 36px; 
                font-weight: bold; 
                color: #007bff; 
                text-align: center; 
                letter-spacing: 8px; 
                margin: 30px 0; 
                padding: 20px; 
                background-color: #f8f9fa; 
                border-radius: 8px; 
                border: 3px dashed #007bff; 
                font-family: 'Courier New', monospace;
            }
            .info-box { 
                background-color: #e7f3ff; 
                border-left: 4px solid #007bff; 
                padding: 15px; 
                margin: 20px 0; 
                border-radius: 4px;
            }
            .warning-box { 
                background-color: #fff3cd; 
                border-left: 4px solid #ffc107; 
                padding: 15px; 
                margin: 20px 0; 
                border-radius: 4px;
            }
            .success-box { 
                background-color: #d4edda; 
                border-left: 4px solid #28a745; 
                padding: 15px; 
                margin: 20px 0; 
                border-radius: 4px;
            }
            ul { 
                padding-left: 20px; 
            }
            li { 
                margin-bottom: 8px; 
            }
            .btn { 
                display: inline-block; 
                padding: 12px 24px; 
                background-color: #007bff; 
                color: white; 
                text-decoration: none; 
                border-radius: 5px; 
                font-weight: bold; 
                margin: 20px 0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            ${content}
            <div class="footer">
                <p><strong>© 2024 ${CONSTANTS.EMAIL.FROM_NAME}</strong></p>
                <p>This is an automated email, please do not reply directly to this message.</p>
                <p>If you need assistance, please contact our support team.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  // OTP Verification Email Template
  static getOTPVerificationTemplate(otpCode, userName = "User") {
    const content = `
      <div class="header">
          <h1>🔐 Email Verification</h1>
      </div>
      <div class="content">
          <h2>Hello ${userName}!</h2>
          <p>Thank you for registering with <strong>${CONSTANTS.EMAIL.FROM_NAME}</strong>. To complete your registration and activate your account, please verify your email address using the OTP code below:</p>
          
          <div class="otp-code">${otpCode}</div>
          
          <div class="info-box">
              <p><strong>📋 Important Information:</strong></p>
              <ul>
                  <li>This OTP code is valid for <strong>${CONSTANTS.OTP.EXPIRY_MINUTES} minutes</strong></li>
                  <li>You have <strong>${CONSTANTS.OTP.MAX_ATTEMPTS} attempts</strong> to enter the correct code</li>
                  <li>The code is case-sensitive and must be entered exactly as shown</li>
                  <li>Do not share this code with anyone for security reasons</li>
              </ul>
          </div>

          <div class="warning-box">
              <p><strong>⚠️ Security Notice:</strong></p>
              <p>If you didn't request this verification, please ignore this email. Your account will remain unverified and no further action is required.</p>
          </div>

          <p>Once verified, you'll have full access to all ${CONSTANTS.EMAIL.FROM_NAME} features and services.</p>
      </div>
    `;

    return this.getBaseTemplate(
      CONSTANTS.EMAIL.SUBJECTS.OTP_VERIFICATION,
      "#007bff",
      content
    );
  }

  // Welcome Email Template
  static getWelcomeTemplate(userName = "User") {
    const content = `
      <div class="header">
          <h1>🎉 Welcome to ${CONSTANTS.EMAIL.FROM_NAME}!</h1>
      </div>
      <div class="content">
          <h2>Congratulations ${userName}!</h2>
          
          <div class="success-box">
              <p><strong>✅ Your email has been successfully verified!</strong></p>
          </div>
          
          <p>Welcome to <strong>${CONSTANTS.EMAIL.FROM_NAME}</strong>! Your account is now fully activated and ready to use. We're excited to have you on board!</p>
          
          <div class="info-box">
              <p><strong>🚀 What's next?</strong></p>
              <ul>
                  <li><strong>Log in to your account</strong> - Start exploring all available features</li>
                  <li><strong>Complete your profile</strong> - Add more details to personalize your experience</li>
                  <li><strong>Explore API features</strong> - Discover powerful tools for your projects</li>
                  <li><strong>Access documentation</strong> - Learn how to make the most of our platform</li>
              </ul>
          </div>

          <p>Our platform offers comprehensive API management tools designed to streamline your development workflow. Whether you're building mobile apps, web applications, or managing multiple projects, we've got you covered.</p>

          <div class="info-box">
              <p><strong>💡 Quick Tips:</strong></p>
              <ul>
                  <li>Keep your account secure by using a strong password</li>
                  <li>Enable two-factor authentication for extra security</li>
                  <li>Check our documentation for best practices</li>
                  <li>Join our community for tips and support</li>
              </ul>
          </div>

          <p>If you have any questions or need assistance getting started, our support team is here to help. Don't hesitate to reach out!</p>
          
          <p>Thank you for choosing ${CONSTANTS.EMAIL.FROM_NAME}. Let's build something amazing together! 🚀</p>
      </div>
    `;

    return this.getBaseTemplate(
      CONSTANTS.EMAIL.SUBJECTS.WELCOME,
      "#28a745",
      content
    );
  }

  // Password Reset Email Template (untuk future use)
  static getPasswordResetTemplate(resetToken, userName = "User") {
    const content = `
      <div class="header">
          <h1>🔒 Password Reset Request</h1>
      </div>
      <div class="content">
          <h2>Hello ${userName}!</h2>
          <p>We received a request to reset your password for your <strong>${CONSTANTS.EMAIL.FROM_NAME}</strong> account.</p>
          
          <div class="otp-code">${resetToken}</div>
          
          <div class="info-box">
              <p><strong>📋 Reset Instructions:</strong></p>
              <ul>
                  <li>This reset code is valid for <strong>${CONSTANTS.OTP.EXPIRY_MINUTES} minutes</strong></li>
                  <li>You have <strong>${CONSTANTS.OTP.MAX_ATTEMPTS} attempts</strong> to use this code</li>
                  <li>Enter this code in the password reset form</li>
                  <li>Choose a strong, unique password</li>
              </ul>
          </div>

          <div class="warning-box">
              <p><strong>⚠️ Security Alert:</strong></p>
              <p>If you didn't request this password reset, please ignore this email. Your account remains secure and no changes will be made.</p>
          </div>
      </div>
    `;

    return this.getBaseTemplate(
      CONSTANTS.EMAIL.SUBJECTS.PASSWORD_RESET,
      "#dc3545",
      content
    );
  }

  // Generic notification template
  static getNotificationTemplate(title, message, userName = "User", type = "info") {
    const colors = {
      info: "#007bff",
      success: "#28a745",
      warning: "#ffc107",
      error: "#dc3545"
    };

    const icons = {
      info: "ℹ️",
      success: "✅",
      warning: "⚠️",
      error: "❌"
    };

    const content = `
      <div class="header">
          <h1>${icons[type]} ${title}</h1>
      </div>
      <div class="content">
          <h2>Hello ${userName}!</h2>
          <p>${message}</p>
          
          <p>If you have any questions about this notification, please don't hesitate to contact our support team.</p>
      </div>
    `;

    return this.getBaseTemplate(title, colors[type], content);
  }
}

module.exports = EmailTemplates; 