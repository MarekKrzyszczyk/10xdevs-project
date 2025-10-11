# REST API Plan

## 1. Resources

- **Flashcards** - Maps to `flashcards` table
- **AI Generation** - Virtual resource for LLM integration

## 2. Endpoints

### 2.1 Flashcards Resource

#### GET /api/flashcards
**Description**: Retrieve all flashcards for authenticated user

**Query Parameters**:
- `page` (integer, optional, default: 1)
- `limit` (integer, optional, default: 20, max: 100)
- `source` (string, optional, enum: "manual" | "ai_generated")
- `sort` (string, optional, enum: "created_at" | "updated_at", default: "created_at")
- `order` (string, optional, enum: "asc" | "desc", default: "desc")

**Response (200 OK)**:
```json
{
  "data": [
    {
      "id": "uuid",
      "front": "string",
      "back": "string",
      "source": "manual" | "ai_generated",
      "created_at": "ISO8601 timestamp",
      "updated_at": "ISO8601 timestamp"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "total_pages": 8
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid authentication token
- `400 Bad Request`: Invalid query parameters

---

#### POST /api/flashcards
**Description**: Create a new flashcard (manual or save AI-generated)

**Request Body**:
```json
{
  "front": "string (1-1000 chars, required)",
  "back": "string (1-1000 chars, required)",
  "source": "manual" | "ai_generated" (required)
}
```

**Response (201 Created)**:
```json
{
  "id": "uuid",
  "front": "string",
  "back": "string",
  "source": "manual" | "ai_generated",
  "created_at": "ISO8601 timestamp",
  "updated_at": "ISO8601 timestamp"
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid authentication token
- `400 Bad Request`: Invalid input (validation errors)
- `422 Unprocessable Entity`: Front or back exceeds character limits

---

#### POST /api/flashcards/batch
**Description**: Create multiple flashcards at once (for AI-generated acceptance)

**Request Body**:
```json
{
  "flashcards": [
    {
      "front": "string (1-1000 chars)",
      "back": "string (1-1000 chars)",
      "source": "ai_generated"
    }
  ]
}
```

**Response (201 Created)**:
```json
{
  "created": 15,
  "flashcards": [
    {
      "id": "uuid",
      "front": "string",
      "back": "string",
      "source": "ai_generated",
      "created_at": "ISO8601 timestamp",
      "updated_at": "ISO8601 timestamp"
    }
  ]
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid authentication token
- `400 Bad Request`: Invalid array or validation errors
- `422 Unprocessable Entity`: One or more flashcards violate constraints

---

#### GET /api/flashcards/:id
**Description**: Retrieve a specific flashcard

**URL Parameters**:
- `id` (uuid, required)

**Response (200 OK)**:
```json
{
  "id": "uuid",
  "front": "string",
  "back": "string",
  "source": "manual" | "ai_generated",
  "created_at": "ISO8601 timestamp",
  "updated_at": "ISO8601 timestamp"
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: Flashcard doesn't exist or doesn't belong to user

---

#### PATCH /api/flashcards/:id
**Description**: Update an existing flashcard

**URL Parameters**:
- `id` (uuid, required)

**Request Body**:
```json
{
  "front": "string (1-1000 chars, optional)",
  "back": "string (1-1000 chars, optional)"
}
```

**Response (200 OK)**:
```json
{
  "id": "uuid",
  "front": "string",
  "back": "string",
  "source": "manual",
  "created_at": "ISO8601 timestamp",
  "updated_at": "ISO8601 timestamp"
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: Flashcard doesn't exist or doesn't belong to user
- `400 Bad Request`: No fields provided for update
- `422 Unprocessable Entity`: Validation error on fields

---

#### DELETE /api/flashcards/:id
**Description**: Delete a flashcard and its study progress

**URL Parameters**:
- `id` (uuid, required)

**Response (204 No Content)**: Empty body

**Error Responses**:
- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: Flashcard doesn't exist or doesn't belong to user

---

### 2.2 AI Generation Resource

#### POST /api/ai/generate
**Description**: Generate flashcard suggestions from text using LLM

**Request Body**:
```json
{
  "text": "string (1000-10000 chars, required)",
  "model": "string (optional, default: recommended model)"
}
```

**Response (200 OK)**:
```json
{
  "suggestions": [
    {
      "front": "string",
      "back": "string"
    }
  ],
  "model_used": "string",
  "tokens_used": 1234
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid authentication token
- `400 Bad Request`: Text length out of range
- `429 Too Many Requests`: Rate limit exceeded
- `502 Bad Gateway`: LLM API error or timeout
- `503 Service Unavailable`: LLM service temporarily unavailable

---

### 2.3 Study Session Resource

#### GET /api/study/due
**Description**: Get flashcards due for review

**Query Parameters**:
- `limit` (integer, optional, default: 20, max: 100)

**Response (200 OK)**:
```json
{
  "flashcards": [
    {
      "id": "uuid",
      "front": "string",
      "back": "string",
      "progress": {
        "ease_factor": 2.5,
        "interval": 3,
        "repetitions": 2,
        "next_review_date": "ISO8601 timestamp"
      }
    }
  ],
  "total_due": 42
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid authentication token

---

## 3. Validation and Business Logic

### Flashcard Validation Rules

**Creation and Updates**:
- `front`: Required (on create), 1-1000 characters, cannot be empty string
- `back`: Required (on create), 1-1000 characters, cannot be empty string
- `source`: Required (on create), must be "manual" or "ai_generated"
- `user_id`: Automatically set from authenticated user's JWT, cannot be modified

**Database Constraints**:
- CHECK constraint: `length(front) > 0 AND length(front) <= 1000`
- CHECK constraint: `length(back) > 0 AND length(back) <= 1000`
- Foreign key: `user_id` references `auth.users(id)` with CASCADE DELETE

### AI Generation Validation Rules

**Input**:
- `text`: Required, 1000-10000 characters
- `model`: Optional, validated against supported models list

**Output Processing**:
- LLM response parsed to extract front/back pairs
- Each suggestion validated: front and back 1-1000 chars
- Malformed suggestions filtered out
- Return error if no valid suggestions generated

### Batch Operations

**Batch Flashcard Creation**:
- Maximum 50 flashcards per batch request
- All flashcards validated before any database inserts
- Transaction: all succeed or all fail (atomicity)
- On error, response indicates which flashcards failed validation

### Automatic Updates

**Timestamp Management**:
- `created_at`: Set automatically on insert (DEFAULT now())
- `updated_at`: Updated automatically on any flashcard modification via database trigger
- Clients cannot manually set these fields

### Error Handling Strategy

**Validation Errors (400)**:
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "front",
      "message": "Must be between 1 and 1000 characters"
    }
  ]
}
```

**Not Found Errors (404)**:
```json
{
  "error": "Not found",
  "message": "Flashcard not found or access denied"
}
```

**Server Errors (500)**:
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

**External Service Errors (502/503)**:
```json
{
  "error": "Service unavailable",
  "message": "AI generation service temporarily unavailable",
  "retry_after": 60
}
```
