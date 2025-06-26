# 🍪 Cookies-Based Authentication Implementation

## ✅ **IMPLEMENTED FEATURES**

### 1. **Backend Changes**
- ✅ Cookie-parser middleware installed and configured
- ✅ CORS configured with credentials support
- ✅ HttpOnly cookies for refresh tokens
- ✅ Automatic token refresh middleware
- ✅ Secure cookie settings for production

### 2. **Authentication Flow**
- ✅ Login stores refresh token in httpOnly cookie
- ✅ Access token sent in response body (for frontend storage)
- ✅ Automatic token refresh when access token expires
- ✅ New access token sent via `X-New-Access-Token` header

### 3. **Security Features**
- ✅ HttpOnly cookies (XSS protection)
- ✅ SameSite=strict (CSRF protection)
- ✅ Secure flag for production (HTTPS only)
- ✅ Path restriction (/api/auth)
- ✅ 7-day cookie expiration

---

## 🔄 **AUTHENTICATION FLOW**

### **Login Process:**
```
1. POST /v1/api/auth/login
   Body: { username, password }

2. Backend Response:
   - Set-Cookie: refreshToken=xxx; HttpOnly; Secure; SameSite=strict
   - Body: { accessToken, user, tokenType, expiresIn }

3. Frontend:
   - Store accessToken in memory/localStorage
   - Cookie automatically stored by browser
```

### **API Requests with Auto-Refresh:**
```
1. Frontend: GET /v1/api/user/profile
   Headers: Authorization: Bearer <accessToken>

2. If token valid:
   - Normal response

3. If token expired:
   - Backend automatically checks refresh token cookie
   - If refresh token valid: generates new access token
   - Response Headers: X-New-Access-Token: <newToken>
   - Frontend updates stored access token
   - Original request proceeds normally
```

### **Manual Refresh (Optional):**
```
1. POST /v1/api/auth/refresh-token
   - No body needed (uses cookie)

2. Response:
   - New access token in response body
   - Updated refresh token cookie (if rotated)
```

---

## 🎯 **FRONTEND INTEGRATION**

### **Flutter Implementation:**
```dart
// pubspec.yaml
dependencies:
  dio: ^5.3.2
  dio_cookie_manager: ^3.1.1
  cookie_jar: ^4.0.8

// api_service.dart
class ApiService {
  late Dio dio;
  late PersistCookieJar cookieJar;

  ApiService() {
    dio = Dio(BaseOptions(
      baseUrl: 'http://localhost:3004/v1/api',
      connectTimeout: Duration(seconds: 5),
      receiveTimeout: Duration(seconds: 3),
    ));

    // Setup cookie jar
    cookieJar = PersistCookieJar(
      storage: FileStorage("./cookies/"),
    );
    dio.interceptors.add(CookieManager(cookieJar));

    // Auto-refresh interceptor
    dio.interceptors.add(InterceptorsWrapper(
      onResponse: (response, handler) {
        // Check for new access token
        final newToken = response.headers.value('X-New-Access-Token');
        if (newToken != null) {
          updateAccessToken(newToken);
        }
        handler.next(response);
      },
    ));
  }

  Future<LoginResponse> login(String username, String password) async {
    final response = await dio.post('/auth/login', data: {
      'username': username,
      'password': password,
    });

    // Store access token
    await storeAccessToken(response.data['data']['accessToken']);
    
    return LoginResponse.fromJson(response.data);
  }

  Future<UserProfile> getProfile() async {
    final token = await getAccessToken();
    final response = await dio.get('/user/profile',
      options: Options(headers: {'Authorization': 'Bearer $token'})
    );
    return UserProfile.fromJson(response.data['data']);
  }
}
```

### **Web Frontend (JavaScript):**
```javascript
// api.js
class ApiClient {
  constructor() {
    this.baseURL = 'http://localhost:3004/v1/api';
    this.accessToken = localStorage.getItem('accessToken');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.accessToken}`,
        ...options.headers
      },
      credentials: 'include' // Important for cookies!
    };

    const response = await fetch(url, config);
    
    // Check for token refresh
    const newToken = response.headers.get('X-New-Access-Token');
    if (newToken) {
      this.accessToken = newToken;
      localStorage.setItem('accessToken', newToken);
    }

    return response.json();
  }

  async login(username, password) {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    if (data.success) {
      this.accessToken = data.data.accessToken;
      localStorage.setItem('accessToken', this.accessToken);
    }
    return data;
  }

  async getProfile() {
    return this.request('/user/profile');
  }
}
```

---

## 🔧 **CONFIGURATION**

### **Environment Variables:**
```env
# .env
PORT=3004
MONGODB_URI=mongodb://localhost:27017
DB_NAME=api_panel
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

### **Cookie Settings:**
```javascript
// Production settings
{
  httpOnly: true,           // XSS protection
  secure: true,             // HTTPS only
  sameSite: 'strict',       // CSRF protection
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/api/auth'         // Restricted path
}

// Development settings
{
  httpOnly: true,
  secure: false,            // HTTP allowed
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/api/auth'
}
```

---

## 🚀 **BENEFITS**

### **Security:**
- ✅ XSS protection (HttpOnly cookies)
- ✅ CSRF protection (SameSite cookies)
- ✅ Automatic token rotation
- ✅ Secure transmission in production

### **User Experience:**
- ✅ Transparent token refresh
- ✅ No manual refresh needed
- ✅ Persistent sessions
- ✅ Cross-platform compatibility

### **Developer Experience:**
- ✅ Simple frontend implementation
- ✅ Automatic cookie management
- ✅ Clear error handling
- ✅ Easy debugging

---

## 🧪 **TESTING**

### **Test Login:**
```bash
curl -X POST http://localhost:3004/v1/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}' \
  -c cookies.txt
```

### **Test Protected Route:**
```bash
curl -X GET http://localhost:3004/v1/api/user/profile \
  -H "Authorization: Bearer <access_token>" \
  -b cookies.txt
```

### **Test Refresh:**
```bash
curl -X POST http://localhost:3004/v1/api/auth/refresh-token \
  -b cookies.txt
```

---

## ⚠️ **IMPORTANT NOTES**

1. **Frontend must set `credentials: 'include'`** for cookies to work
2. **CORS must allow credentials** with specific origin (not *)
3. **HTTPS required in production** for secure cookies
4. **Cookie path restriction** limits cookie scope for security
5. **Token rotation** improves security by changing refresh tokens

---

## 🔄 **MIGRATION FROM LOCALSTORAGE APPROACH**

If migrating from localStorage approach:

1. **Backend**: Already implemented ✅
2. **Frontend**: Update HTTP client to include credentials
3. **Remove**: Manual refresh token handling
4. **Update**: Store only access token, cookies handle refresh token

The implementation is **production-ready** and provides **better security** than localStorage approach while maintaining **excellent user experience**. 