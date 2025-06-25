# 🚀 API Panel Admin - Backend Service

A clean, modular Node.js backend service for API panel administration with email OTP verification system.

## ✨ Features

- **User Registration** with email verification
- **OTP Email System** with beautiful HTML templates
- **Clean Architecture** with modular services
- **Input Validation** with comprehensive error handling
- **MongoDB Integration** with Mongoose ODM
- **Email Templates** with responsive design
- **Consistent API Responses** for frontend consumption
- **Security Best Practices** implemented

## 🏗️ Architecture

```
src/
├── config/           # Configuration files
├── controllers/      # HTTP request handlers
├── models/          # Database models (Mongoose)
├── services/        # Business logic layer
├── templates/       # Email HTML templates
├── routes/          # API route definitions
└── utils/           # Utility functions
```

## 🛠️ Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Email:** Nodemailer with Gmail SMTP
- **Validation:** Custom validation service
- **Security:** bcryptjs for password hashing
- **Environment:** dotenv for configuration

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud)
- Gmail account with App Password (for email service)

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone <repository-url>
cd api_panel
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Setup
```bash
# Copy environment template
cp env.example .env

# Edit .env file with your configurations
nano .env
```

### 4. Configure Gmail SMTP
1. Enable 2-Factor Authentication in your Gmail account
2. Generate App Password: [Gmail App Passwords](https://myaccount.google.com/apppasswords)
3. Update `.env` file:
   ```env
   EMAIL_USER=your-gmail@gmail.com
   EMAIL_PASS=your-16-digit-app-password
   ```

### 5. Start MongoDB
```bash
# If using local MongoDB
mongod

# Or make sure your MongoDB cloud service is running
```

### 6. Run the application
```bash
# Development mode with auto-restart
npm run dev

# Or production mode
npm start
```

### 7. Test the setup
```bash
# Health check
curl http://localhost:3004/v1/api/health

# Email service test
curl http://localhost:3004/v1/api/test-email
```

## 📚 API Documentation

### Base URL
```
http://localhost:3004/v1/api
```

### Authentication Endpoints

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
    "username": "johndoe",
    "fullname": "John Doe",
    "email": "john@example.com",
    "password": "password123"
}
```

#### Verify Email
```http
POST /auth/verify-email
Content-Type: application/json

{
    "email": "john@example.com",
    "otp": "123456"
}
```

#### Resend OTP
```http
POST /auth/resend-otp
Content-Type: application/json

{
    "email": "john@example.com"
}
```

### Response Format

#### Success Response
```json
{
    "success": true,
    "code": 200,
    "message": "Operation successful",
    "data": { ... }
}
```

#### Error Response
```json
{
    "success": false,
    "code": 400,
    "message": "Validation failed",
    "error": [
        {
            "field": "email",
            "message": "Email is required"
        }
    ]
}
```

## 🧪 Testing

### Manual Testing with cURL

```bash
# Register a new user
curl -X POST http://localhost:3004/v1/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "fullname": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'

# Verify email (check your email for OTP)
curl -X POST http://localhost:3004/v1/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "otp": "123456"
  }'
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | 3004 | No |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017 | Yes |
| `DB_NAME` | Database name | api_panel | Yes |
| `EMAIL_USER` | Gmail address for SMTP | - | Yes |
| `EMAIL_PASS` | Gmail app password | - | Yes |
| `NODE_ENV` | Environment mode | development | No |

### Application Constants

All application constants are centralized in `src/config/constants.js`:

- **OTP Settings:** Length, expiry time, max attempts
- **User Validation:** Username/password requirements
- **Email Templates:** Subjects, from names
- **Response Messages:** Success/error messages

## 📁 Project Structure

```
api_panel/
├── src/
│   ├── config/
│   │   ├── constants.js      # Application constants
│   │   └── database.js       # MongoDB connection
│   ├── controllers/
│   │   └── AuthController.js # Authentication logic
│   ├── models/
│   │   ├── User.js          # User schema
│   │   └── OTP.js           # OTP schema
│   ├── services/
│   │   ├── ValidationService.js # Input validation
│   │   ├── OTPService.js        # OTP business logic
│   │   ├── EmailService.js      # Email sending
│   │   └── UserService.js       # User operations
│   ├── templates/
│   │   └── EmailTemplates.js    # HTML email templates
│   ├── routes/
│   │   ├── index.js         # Main router
│   │   ├── auth.js          # Auth routes
│   │   └── basic.js         # Basic routes
│   └── utils/
│       ├── response.js      # Response utilities
│       └── modelHelpers.js  # Database helpers
├── uploads/                 # File uploads directory
├── .env                     # Environment variables (not in git)
├── env.example             # Environment template
├── .gitignore              # Git ignore rules
├── package.json            # Dependencies and scripts
└── app.js                  # Application entry point
```

## 🔒 Security Features

- **Password Hashing:** bcryptjs with configurable salt rounds
- **Input Validation:** Comprehensive validation for all inputs
- **Email Verification:** Mandatory email verification for new users
- **OTP Security:** Time-limited OTPs with attempt limits
- **Environment Variables:** Sensitive data stored in environment variables
- **Data Sanitization:** Input sanitization to prevent injection attacks

## 🚦 Development Status

- ✅ User Registration
- ✅ Email OTP Verification
- ✅ Input Validation
- ✅ Error Handling
- ✅ Clean Architecture
- ⏳ User Login (Coming Next)
- ⏳ JWT Authentication
- ⏳ Admin Panel
- ⏳ API Documentation (Swagger)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Your Name**
- GitHub: [@yourusername](https://github.com/yourusername)
- Email: your.email@example.com

## 🙏 Acknowledgments

- Express.js team for the excellent framework
- MongoDB team for the robust database
- Nodemailer team for email functionality
- All contributors who help improve this project

---

**Happy Coding! 🚀** 