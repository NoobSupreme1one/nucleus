# API Reference

## Base URL
- Development: `http://localhost:5000`
- Production: `https://your-domain.com`

## Authentication

All protected endpoints require authentication via Clerk tokens or AWS Cognito.

### Headers
```http
Authorization: Bearer <token>
Content-Type: application/json
```

## Endpoints

### Authentication

#### POST /auth/clerk/webhook
Handle Clerk webhook events for user management.

**Request Body:**
```json
{
  "type": "user.created",
  "data": { ... }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Webhook processed"
}
```

### Ideas & Validation

#### POST /api/validate-idea
Validate a business idea using AI analysis.

**Request Body:**
```json
{
  "idea": "AI-powered meal planning app",
  "description": "An app that creates personalized meal plans based on dietary preferences and nutritional goals",
  "targetAudience": "Health-conscious individuals aged 25-45",
  "businessModel": "freemium"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "validation-123",
    "overallScore": 8.5,
    "marketPotential": 8.0,
    "feasibility": 7.5,
    "competition": 9.0,
    "insights": [
      "Strong market demand for health-focused apps",
      "Consider partnerships with nutritionists"
    ],
    "recommendations": [
      "Focus on unique dietary restrictions",
      "Implement social sharing features"
    ]
  }
}
```

#### GET /api/validation/:id
Get validation results by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "validation-123",
    "idea": "AI-powered meal planning app",
    "score": 8.5,
    "createdAt": "2025-08-09T12:00:00Z",
    "analysis": { ... }
  }
}
```

### Professional Reports

#### POST /api/generate-pro-report
Generate a comprehensive professional report.

**Request Body:**
```json
{
  "validationId": "validation-123",
  "sections": ["executive-summary", "market-analysis", "financial-projections"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "reportId": "report-456",
    "status": "generating",
    "estimatedCompletion": "2025-08-09T12:05:00Z"
  }
}
```

#### GET /api/pro-report/:id
Get professional report by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "report-456",
    "status": "completed",
    "sections": {
      "executiveSummary": {
        "overview": "Market opportunity analysis...",
        "keyFindings": ["Finding 1", "Finding 2"]
      },
      "marketAnalysis": {
        "marketSize": "$2.5B",
        "growthRate": "12%",
        "competitors": [...]
      }
    }
  }
}
```

### Matching Services

#### GET /api/matches/founders
Get potential co-founder matches.

**Query Parameters:**
- `skills` - Comma-separated skills
- `location` - Geographic location
- `stage` - Startup stage preference

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "user-789",
      "name": "Jane Doe",
      "skills": ["Marketing", "Sales"],
      "experience": "5 years",
      "location": "San Francisco",
      "matchScore": 0.85
    }
  ]
}
```

#### GET /api/matches/funding
Get funding opportunity matches.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "fund-101",
      "name": "Tech Ventures Fund",
      "type": "Seed",
      "range": "$100K - $1M",
      "focus": ["SaaS", "AI", "Healthcare"],
      "matchScore": 0.78
    }
  ]
}
```

### Portfolio & Analytics

#### GET /api/portfolio
Get user's portfolio of validated ideas.

**Response:**
```json
{
  "success": true,
  "data": {
    "ideas": [
      {
        "id": "idea-123",
        "title": "AI Meal Planner",
        "score": 8.5,
        "status": "validated",
        "createdAt": "2025-08-09T12:00:00Z"
      }
    ],
    "totalIdeas": 5,
    "averageScore": 7.8
  }
}
```

#### GET /api/analytics
Get user analytics and performance metrics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalValidations": 10,
    "averageScore": 7.8,
    "topCategory": "SaaS",
    "improvementTrend": "+12%",
    "leaderboardRank": 42
  }
}
```

### Leaderboard

#### GET /api/leaderboard
Get leaderboard rankings.

**Query Parameters:**
- `timeframe` - "weekly", "monthly", "all-time"
- `category` - Idea category filter

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "rank": 1,
      "userId": "user-456",
      "name": "John Smith",
      "score": 95.5,
      "ideasCount": 8,
      "avatar": "https://..."
    }
  ]
}
```

### File Upload

#### POST /api/upload
Upload files to S3 storage.

**Request:** Multipart form data
- `file` - File to upload
- `type` - File type ("avatar", "document", "image")

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://s3.amazonaws.com/bucket/file-key",
    "key": "file-key",
    "size": 1024000,
    "type": "image/png"
  }
}
```

### Domain Services

#### POST /api/domain/check
Check domain availability and suggestions.

**Request Body:**
```json
{
  "businessName": "AI Meal Planner",
  "keywords": ["meal", "nutrition", "ai"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "domain": "aimealplanner.com",
        "available": true,
        "price": "$12.99",
        "registrar": "GoDaddy"
      }
    ],
    "alternatives": [
      "mealplannerai.com",
      "smartmealplan.com"
    ]
  }
}
```

## Error Responses

### Standard Error Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    }
  }
}
```

### Error Codes
- `VALIDATION_ERROR` - Request validation failed
- `UNAUTHORIZED` - Invalid or missing authentication
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `RATE_LIMITED` - Too many requests
- `INTERNAL_ERROR` - Server error

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

## Rate Limiting

- **General API**: 100 requests per minute per user
- **AI Services**: 10 requests per minute per user
- **File Upload**: 50 requests per hour per user

## Webhooks

### Stripe Webhooks

#### POST /api/stripe/webhook
Handle Stripe payment events.

**Events:**
- `payment_intent.succeeded`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

### Clerk Webhooks

#### POST /api/clerk/webhook
Handle Clerk user management events.

**Events:**
- `user.created`
- `user.updated`
- `user.deleted`

## SDK Examples

### JavaScript/TypeScript
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.yourapp.com',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

// Validate idea
const validateIdea = async (ideaData) => {
  const response = await api.post('/api/validate-idea', ideaData);
  return response.data;
};

// Get matches
const getFounderMatches = async () => {
  const response = await api.get('/api/matches/founders');
  return response.data;
};
```

### Python
```python
import requests

class NucleusAPI:
    def __init__(self, token, base_url="https://api.yourapp.com"):
        self.token = token
        self.base_url = base_url
        self.headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
    
    def validate_idea(self, idea_data):
        response = requests.post(
            f"{self.base_url}/api/validate-idea",
            json=idea_data,
            headers=self.headers
        )
        return response.json()
```

## Changelog

### v1.0.0 (2025-08-09)
- Initial API release
- Core validation endpoints
- Professional report generation
- Matching services
- Portfolio management
- File upload capabilities