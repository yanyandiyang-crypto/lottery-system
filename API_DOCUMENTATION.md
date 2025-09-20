# NewBetting API Documentation

## 🔐 API Versioning & Security

### Base URLs
- **Production**: `https://api.newbetting.com`
- **Staging**: `https://staging-api.newbetting.com`
- **Development**: `http://localhost:3000`

### API Versions
- **v1**: Stable, current production version
- **v2**: Beta, enhanced security features

### Authentication
All API requests require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Rate Limiting
- **v1**: 1000 requests per 15 minutes per IP
- **v2**: 500 requests per 15 minutes per IP
- **Login endpoints**: 5 requests per 15 minutes (v1), 3 requests per 15 minutes (v2)

## 📋 API Endpoints

### Authentication (v1)

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "agent001",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "agent001",
    "fullName": "John Doe",
    "role": "agent",
    "region": {
      "id": 1,
      "name": "Manila"
    },
    "balance": {
      "currentBalance": 1000.00,
      "totalLoaded": 5000.00,
      "totalUsed": 4000.00
    }
  }
}
```

#### Register (Admin only)
```http
POST /api/v1/auth/register
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "username": "agent002",
  "password": "password123",
  "fullName": "Jane Smith",
  "email": "jane@example.com",
  "role": "agent",
  "coordinatorId": 2
}
```

### Authentication (v2) - Enhanced Security

#### Login with Device Tracking
```http
POST /api/v2/auth/login
Content-Type: application/json

{
  "username": "agent001",
  "password": "password123",
  "deviceId": "device-12345",
  "userAgent": "Mozilla/5.0..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... },
  "apiVersion": "v2",
  "security": {
    "tokenExpiresIn": "24h",
    "requiresMFA": false,
    "lastLogin": "2024-01-15T10:30:00Z"
  }
}
```

#### Enhanced Registration
```http
POST /api/v2/auth/register
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "username": "agent002",
  "password": "Password123!",
  "fullName": "Jane Smith",
  "email": "jane@example.com",
  "phone": "09123456789",
  "role": "agent",
  "coordinatorId": 2
}
```

**Password Requirements (v2):**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### Users Management

#### Get Users
```http
GET /api/v1/users?page=1&limit=10&role=agent&status=active
Authorization: Bearer <token>
```

#### Get User Details
```http
GET /api/v1/users/123
Authorization: Bearer <token>
```

#### Update User
```http
PUT /api/v1/users/123
Authorization: Bearer <token>
Content-Type: application/json

{
  "fullName": "John Updated",
  "email": "john.updated@example.com",
  "phone": "09123456789"
}
```

### Tickets Management

#### Create Ticket (Agent only)
```http
POST /api/v1/tickets
Authorization: Bearer <agent-token>
Content-Type: application/json

{
  "betType": "standard",
  "betDigits": "123",
  "betAmount": 100.00,
  "drawId": 1,
  "templateId": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Ticket created successfully",
  "data": {
    "id": 1,
    "ticketNumber": "20240115123456789012345",
    "betType": "standard",
    "betDigits": "123",
    "betAmount": 100.00,
    "ticketTotalAmount": 100.00,
    "sequenceLetter": "A",
    "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "status": "pending",
    "agent": {
      "id": 1,
      "username": "agent001",
      "fullName": "John Doe"
    },
    "draw": {
      "id": 1,
      "drawDate": "2024-01-15",
      "drawTime": "2PM",
      "drawDatetime": "2024-01-15T14:00:00Z"
    }
  }
}
```

#### Get Tickets
```http
GET /api/v1/tickets?page=1&limit=10&status=pending&betType=standard
Authorization: Bearer <token>
```

#### Validate Ticket
```http
POST /api/v1/tickets/123/validate
Authorization: Bearer <token>
```

### Draws Management

#### Get Draws
```http
GET /api/v1/draws?page=1&limit=10&status=open&startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer <token>
```

#### Set Draw Result (Admin only)
```http
POST /api/v1/draws/123/result
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "winningNumber": "456"
}
```

#### Get Active Draws
```http
GET /api/v1/draws/current/active
Authorization: Bearer <token>
```

### Sales & Reporting

#### Get Agent Sales
```http
GET /api/v1/sales/agent/123?startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer <token>
```

#### Get Daily Sales
```http
GET /api/v1/sales/daily?date=2024-01-15&regionId=1
Authorization: Bearer <token>
```

#### Export Sales to Excel
```http
GET /api/v1/reports/sales/excel?startDate=2024-01-01&endDate=2024-01-31&format=xlsx
Authorization: Bearer <token>
```

**Response:** Binary Excel file download

### Balance Management

#### Get User Balance
```http
GET /api/v1/balance/123
Authorization: Bearer <token>
```

#### Load Balance (Coordinator/Admin only)
```http
POST /api/v1/balance/123/load
Authorization: Bearer <coordinator-token>
Content-Type: application/json

{
  "amount": 1000.00,
  "description": "Initial balance load"
}
```

#### Get Transaction History
```http
GET /api/v1/balance/123/transactions?page=1&limit=20&type=load
Authorization: Bearer <token>
```

### Notifications

#### Get Notifications
```http
GET /api/v1/notifications?page=1&limit=20&isRead=false&type=winning
Authorization: Bearer <token>
```

#### Mark as Read
```http
PUT /api/v1/notifications/123/read
Authorization: Bearer <token>
```

#### Mark All as Read
```http
PUT /api/v1/notifications/read-all
Authorization: Bearer <token>
```

## 🔒 Security Features

### API Version Security

#### v1 Security
- Basic JWT authentication
- Standard rate limiting
- Basic input validation
- CORS enabled

#### v2 Security
- Enhanced JWT with device tracking
- Stricter rate limiting
- Advanced input validation
- Enhanced audit logging
- Stronger password requirements
- Additional security headers

### Rate Limiting

| Endpoint | v1 Limit | v2 Limit |
|----------|----------|----------|
| `/auth/login` | 5/15min | 3/15min |
| `/auth/register` | 3/hour | 1/hour |
| `/tickets` | 10/min | 5/min |
| `/balance/load` | 3/5min | 1/5min |
| General API | 1000/15min | 500/15min |

### Error Responses

#### Standard Error Format
```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE",
  "apiVersion": "v1",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### Common Error Codes
- `INVALID_CREDENTIALS`: Authentication failed
- `INSUFFICIENT_PERMISSIONS`: Access denied
- `VALIDATION_FAILED`: Input validation error
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `RESOURCE_NOT_FOUND`: Resource doesn't exist
- `SUSPICIOUS_REQUEST`: Potential security threat

## 📊 Response Headers

### Standard Headers
```
API-Version: v1
X-API-Version: v1
X-API-Status: stable
Content-Type: application/json
```

### Security Headers
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

### v2 Additional Headers
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
Permissions-Policy: geolocation=(), microphone=(), camera=()
X-Permitted-Cross-Domain-Policies: none
```

## 🔄 WebSocket Events

### Connection
```javascript
const socket = io('http://localhost:3000');

socket.emit('join-room', {
  userId: 123,
  role: 'agent'
});
```

### Events
- `notification`: New notification received
- `you-won`: Winning ticket notification
- `agent-won`: Agent won notification (for coordinators)
- `new-ticket`: New ticket created
- `draw-result`: Draw result announced

## 📱 Mobile POS Integration

### Ticket Creation
```http
POST /api/v1/tickets
Authorization: Bearer <agent-token>
Content-Type: application/json

{
  "betType": "standard",
  "betDigits": "123",
  "betAmount": 100.00,
  "drawId": 1,
  "templateId": 1,
  "printImmediately": true
}
```

### QR Code Validation
```http
POST /api/v1/tickets/validate-qr
Authorization: Bearer <token>
Content-Type: application/json

{
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
}
```

## 🚀 Getting Started

### 1. Authentication
```javascript
import { authAPI } from './utils/api';

// Login
const response = await authAPI.login({
  username: 'agent001',
  password: 'password123'
});

// Store token
localStorage.setItem('token', response.data.token);
```

### 2. Create Ticket
```javascript
import { ticketsAPI } from './utils/api';

const ticket = await ticketsAPI.createTicket({
  betType: 'standard',
  betDigits: '123',
  betAmount: 100.00,
  drawId: 1
});
```

### 3. Handle Errors
```javascript
try {
  const response = await ticketsAPI.createTicket(ticketData);
} catch (error) {
  if (error.response?.status === 401) {
    // Redirect to login
    window.location.href = '/login';
  } else if (error.response?.status === 429) {
    // Show rate limit message
    alert('Too many requests. Please wait.');
  }
}
```

## 🔧 Configuration

### Environment Variables
```env
# API Configuration
REACT_APP_API_URL=http://localhost:3000
REACT_APP_API_VERSION=v1
REACT_APP_SOCKET_URL=http://localhost:3000

# Security
JWT_SECRET=your-super-secret-jwt-key
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
```

### API Version Selection
```javascript
// Use v1 (stable)
const api = axios.create({
  baseURL: 'http://localhost:3000/api/v1'
});

// Use v2 (beta)
const api = axios.create({
  baseURL: 'http://localhost:3000/api/v2'
});
```

## 📈 Monitoring & Analytics

### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00Z",
  "uptime": 3600,
  "environment": "production"
}
```

### API Version Info
```http
GET /api/versions
```

**Response:**
```json
{
  "success": true,
  "data": {
    "versions": [
      {
        "version": "v1",
        "status": "stable",
        "deprecationDate": null,
        "sunsetDate": null
      },
      {
        "version": "v2",
        "status": "beta",
        "deprecationDate": null,
        "sunsetDate": null
      }
    ],
    "current": "v1",
    "latest": "v2"
  }
}
```

---

**NewBetting API** - Secure, Scalable, and Versioned Lottery Management API




