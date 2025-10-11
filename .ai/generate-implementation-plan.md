# API Endpoint Implementation Plan: POST /api/ai/generate

## 1. Endpoint Overview

**Purpose**: Generate flashcard suggestions from user-provided text using a Large Language Model (LLM) via Openrouter.ai service.

**Key Functionality**:
- Accepts user text input (1000-10000 characters)
- Sends text to LLM through Openrouter.ai API
- Parses LLM response to extract flashcard front/back pairs
- Validates and filters suggestions
- Returns structured flashcard suggestions to client
- Does not save flashcards to database (suggestions only)

**Business Value**: Accelerates flashcard creation by leveraging AI to automatically generate study materials from educational content.

## 2. Request Details

### HTTP Method
`POST`

### URL Structure
```
/api/ai/generate
```

### Authentication
- **Required**: Yes
- **Method**: Supabase JWT token
- **Location**: Authorization header or session cookie
- **Validation**: Extract user_id from authenticated session

### Request Headers
```
Content-Type: application/json
Authorization: Bearer <jwt_token> (or session cookie)
```

### Request Body
```typescript
{
  text: string;      // Required, 1000-10000 characters
  model?: string;    // Optional, defaults to recommended model
}
```

### Validation Rules
- `text`:
  - Required field
  - Minimum length: 1000 characters
  - Maximum length: 10000 characters
  - Must be non-empty after trimming
  - Should not contain only whitespace
- `model`:
  - Optional field
  - If provided, must match supported models list
  - Defaults to cost-effective recommended model

## 3. Used Types

### Input Types
```typescript
// From src/types.ts
GenerateFlashcardsCommand {
  text: string;
  model?: string;
}
```

### Output Types
```typescript
// From src/types.ts
GenerateFlashcardsResponseDTO {
  suggestions: FlashcardSuggestionDTO[];
}

FlashcardSuggestionDTO {
  front: string;
  back: string;
}
```

### Additional Response Fields (Extended)
```typescript
// Extended response with metadata
{
  suggestions: FlashcardSuggestionDTO[];
  model_used: string;         // Actual model used for generation
  tokens_used: number;        // Token count for tracking costs
}
```

### Zod Validation Schema
```typescript
import { z } from 'zod';

const GenerateFlashcardsSchema = z.object({
  text: z.string()
    .min(1000, 'Text must be at least 1000 characters')
    .max(10000, 'Text must not exceed 10000 characters')
    .trim()
    .refine(val => val.length > 0, 'Text cannot be empty'),
  model: z.string().optional()
});
```

## 3. Response Details

### Success Response (200 OK)
```json
{
  "suggestions": [
    {
      "front": "What is the capital of France?",
      "back": "Paris"
    },
    {
      "front": "Define photosynthesis",
      "back": "The process by which plants convert light energy into chemical energy"
    }
  ],
  "model_used": "anthropic/claude-3-haiku",
  "tokens_used": 1234
}
```

### Error Responses

#### 400 Bad Request - Text Too Short
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "text",
      "message": "Text must be at least 1000 characters"
    }
  ]
}
```

#### 400 Bad Request - Text Too Long
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "text",
      "message": "Text must not exceed 10000 characters"
    }
  ]
}
```

#### 400 Bad Request - Invalid Model
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "model",
      "message": "Unsupported model. Supported models: [list]"
    }
  ]
}
```

#### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Missing or invalid authentication token"
}
```

#### 429 Too Many Requests
```json
{
  "error": "Rate limit exceeded",
  "message": "You have exceeded the generation rate limit. Please try again later.",
  "retry_after": 60
}
```

#### 502 Bad Gateway - LLM Error
```json
{
  "error": "Bad Gateway",
  "message": "AI generation service returned an error. Please try again."
}
```

#### 503 Service Unavailable
```json
{
  "error": "Service unavailable",
  "message": "AI generation service temporarily unavailable",
  "retry_after": 60
}
```

#### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred during flashcard generation"
}
```

## 4. Data Flow

### Request Flow
1. **Request Reception**: Astro API endpoint receives POST request at `/api/ai/generate`
2. **Authentication Check**: Middleware validates JWT token from `context.locals.supabase`
3. **Input Validation**: Zod schema validates request body (text length, model)
4. **Service Invocation**: Call `AiGenerationService.generateFlashcards(text, model, userId)`
5. **LLM API Call**: Service sends request to Openrouter.ai with:
   - User text in structured prompt
   - Selected model configuration
   - Timeout settings (30s)
   - API key from environment
6. **Response Parsing**: Parse LLM JSON response to extract flashcard pairs
7. **Validation**: Filter suggestions:
   - Front: 1-1000 characters, non-empty
   - Back: 1-1000 characters, non-empty
   - Remove duplicates
8. **Error Handling**: If no valid suggestions, return 500 error
9. **Response Formation**: Build response DTO with suggestions and metadata
10. **Return Response**: Send 200 OK with JSON payload

### Service Layer Interaction

**New Service**: `src/lib/services/ai-generation.service.ts`

```typescript
class AiGenerationService {
  async generateFlashcards(
    text: string, 
    model: string | undefined, 
    userId: string
  ): Promise<GenerateFlashcardsResponseDTO>
}
```

**Responsibilities**:
- Construct LLM prompt with instructions
- Make HTTP request to Openrouter.ai API
- Handle timeouts and retries
- Parse LLM response
- Validate each suggestion
- Track token usage
- Log errors for monitoring

### External Service Integration

**Openrouter.ai API**:
- Endpoint: `https://openrouter.ai/api/v1/chat/completions`
- Method: POST
- Headers:
  - `Authorization: Bearer ${OPENROUTER_API_KEY}`
  - `Content-Type: application/json`
  - `HTTP-Referer: ${APP_URL}` (optional, for tracking)
- Request Body:
  ```json
  {
    "model": "anthropic/claude-3-haiku",
    "messages": [
      {
        "role": "system",
        "content": "You are a flashcard generation assistant..."
      },
      {
        "role": "user",
        "content": "<user_text>"
      }
    ],
    "response_format": { "type": "json_object" }
  }
  ```

### No Database Interaction
This endpoint does not interact with the database. It only returns suggestions that users can later save via POST /api/flashcards or POST /api/flashcards/batch.

## 5. Security Considerations

### Authentication & Authorization
- **Requirement**: User must be authenticated via Supabase Auth
- **Implementation**: Use `context.locals.supabase.auth.getUser()` to verify session
- **Failure Response**: 401 Unauthorized if token missing or invalid

### Input Sanitization
- **Threat**: Prompt injection attacks
- **Mitigation**:
  - Validate text length strictly
  - Escape special characters in prompts
  - Use structured prompts with clear boundaries
  - Never execute or evaluate LLM responses as code

### API Key Protection
- **Threat**: Exposure of Openrouter API key
- **Mitigation**:
  - Store in environment variable: `OPENROUTER_API_KEY`
  - Access via `import.meta.env.OPENROUTER_API_KEY`
  - Never expose in client-side code
  - Server-only execution (Astro endpoint with `export const prerender = false`)

### Data Privacy
- **GDPR Compliance**:
  - Don't log user text in production logs
  - Inform users that text is sent to third-party LLM service
  - Ensure Openrouter.ai complies with data protection regulations
- **PII Handling**: Warn users not to include personal information in text input

### CORS & CSRF
- **CORS**: Not applicable (same-origin API)
- **CSRF**: Astro handles CSRF for API routes automatically

## 6. Error Handling

### Error Scenarios & Responses

| Error Scenario | Status Code | Error Type | User Message | Log Details |
|---------------|-------------|------------|--------------|-------------|
| Missing auth token | 401 | `UNAUTHORIZED` | "Missing or invalid authentication token" | User ID: none |
| Invalid auth token | 401 | `UNAUTHORIZED` | "Missing or invalid authentication token" | Token validation failed |
| Text < 1000 chars | 400 | `VALIDATION_ERROR` | "Text must be at least 1000 characters" | Text length: X |
| Text > 10000 chars | 400 | `VALIDATION_ERROR` | "Text must not exceed 10000 characters" | Text length: X |
| Invalid model | 400 | `VALIDATION_ERROR` | "Unsupported model. Supported: [...]" | Model: X |
| Missing text field | 400 | `VALIDATION_ERROR` | "Text field is required" | Body: {...} |
| Rate limit exceeded | 429 | `RATE_LIMIT_ERROR` | "Rate limit exceeded. Try again in X seconds" | User: X, Count: Y |
| LLM API timeout | 502 | `GATEWAY_TIMEOUT` | "AI service timeout. Please try again." | Timeout after 30s |
| LLM API 4xx error | 502 | `GATEWAY_ERROR` | "AI service error. Please try again." | LLM status: X, message: Y |
| LLM API 5xx error | 503 | `SERVICE_UNAVAILABLE` | "AI service temporarily unavailable" | LLM status: X |
| Invalid LLM response | 500 | `PARSE_ERROR` | "Failed to parse AI response" | Response: {...} |
| No valid suggestions | 500 | `NO_SUGGESTIONS` | "Could not generate valid flashcards from text" | Suggestions filtered: X |
| Network error | 502 | `NETWORK_ERROR` | "Network error connecting to AI service" | Error: {...} |
| Unexpected error | 500 | `INTERNAL_ERROR` | "An unexpected error occurred" | Stack trace |

### Error Logging Strategy

**Log Levels**:
- **ERROR**: LLM API failures, parsing errors, unexpected exceptions
- **WARN**: Rate limiting triggered, invalid models requested
- **INFO**: Successful generations, token usage

**Log Format**:
```typescript
{
  timestamp: ISO8601,
  level: "ERROR" | "WARN" | "INFO",
  endpoint: "/api/ai/generate",
  userId: string,
  error: {
    type: string,
    message: string,
    stack?: string
  },
  context: {
    textLength?: number,
    model?: string,
    tokensUsed?: number
  }
}
```

### Graceful Degradation
- If LLM service is down, return 503 with retry information
- If parsing fails, attempt fallback parsing strategy
- Always provide actionable error messages to users

## 7. Performance Considerations

### Potential Bottlenecks

1. **LLM API Latency**
   - Average response time: 5-15 seconds
   - Maximum timeout: 30 seconds
   - **Mitigation**: Set appropriate timeout, inform users of expected wait time

2. **Network I/O**
   - External API call is blocking operation
   - **Mitigation**: Use async/await, don't block event loop

3. **Text Processing**
   - Large text inputs (10,000 chars) increase processing time
   - **Mitigation**: Already limited to 10,000 chars max

4. **Rate Limiting Overhead**
   - Checking rate limits on every request
   - **Mitigation**: Use efficient in-memory store (Map) or Redis

### Optimization Strategies

1. **Model Selection**:
   - Default to cost-effective, fast models (e.g., gpt-5 mini)
   - Balance between quality and speed
   - Allow users to select premium models if needed

2. **Timeout Configuration**:
   - Connection timeout: 5 seconds
   - Read timeout: 30 seconds
   - Fail fast on connection issues

3. **Prompt Engineering**:
   - Optimize prompt length to reduce tokens
   - Clear, concise instructions to LLM
   - Request structured JSON output for easier parsing

### Resource Management

- **Memory**: LLM responses typically <10KB, no memory concerns
- **CPU**: Minimal (JSON parsing only)
- **Network**: Primary resource, monitor API quotas
- **Costs**: Track token usage per user for billing/limits

## 8. Implementation Steps

### Step 1: Create AI Generation Service
**File**: `src/lib/services/ai-generation.service.ts`

- Create service class with `generateFlashcards` method
- Implement Openrouter.ai API client
- Configure HTTP client with timeout (30s)
- Add environment variable access for API key
- Implement prompt construction logic
- Add response parsing with error handling
- Validate each suggestion (1-1000 chars, non-empty)
- Filter malformed suggestions
- Return structured DTO with suggestions and metadata

### Step 2: Create Zod Validation Schema
**File**: `src/pages/api/ai/generate.ts` or separate schema file

- Define `GenerateFlashcardsSchema` using Zod
- Validate `text` field: min 1000, max 10000 chars, trim, non-empty
- Validate `model` field: optional, must be in supported list
- Export schema for reuse

### Step 3: Implement Rate Limiting Utility
**File**: `src/lib/utils/rate-limiter.ts`

- Create in-memory rate limiter (Map-based)
- Track requests per user with timestamps
- Implement sliding window algorithm
- Configuration: 10 requests per hour per user
- Return remaining attempts and reset time
- Clean up old entries periodically

### Step 4: Create API Endpoint
**File**: `src/pages/api/ai/generate.ts`

- Export `export const prerender = false` for SSR
- Define `POST` handler function
- Extract `supabase` from `context.locals`
- Authenticate user via `supabase.auth.getUser()`
- Return 401 if authentication fails
- Parse request body as JSON
- Validate input with Zod schema
- Return 400 with validation errors if invalid
- Check rate limit for user
- Return 429 if rate limit exceeded
- Call `AiGenerationService.generateFlashcards(text, model, userId)`
- Handle service errors with try-catch
- Map service errors to appropriate HTTP status codes
- Return 200 OK with suggestions on success
- Log all errors with structured logging

### Step 5: Add Environment Variable
**File**: `.env` (local), `.env.example` (template)

- Add `OPENROUTER_API_KEY=your_api_key_here`
- Document required environment variables in README
- Update `.env.example` with placeholder

### Step 6: Implement Error Handling
**Throughout implementation**

- Use try-catch blocks around LLM API calls
- Implement specific error types (TimeoutError, ParseError, etc.)
- Map errors to HTTP status codes
- Provide user-friendly error messages
- Log errors with context for debugging
- Follow early return pattern for error conditions

### Step 7: Add Prompt Engineering
**File**: `src/lib/services/ai-generation.service.ts`

- Create system prompt:
  ```
  You are a flashcard generation assistant. Generate educational flashcards 
  from the provided text. Return JSON array with objects containing 'front' 
  and 'back' fields. Each field must be 1-1000 characters. Generate 5-15 
  flashcards covering key concepts.
  ```
- Structure user message with text content
- Request JSON response format
- Test with various text types

### Step 8: Implement Response Validation
**File**: `src/lib/services/ai-generation.service.ts`

- Parse LLM JSON response
- Validate array structure
- For each suggestion:
  - Check `front` exists and is string
  - Check `back` exists and is string
  - Validate lengths (1-1000 chars)
  - Trim whitespace
  - Remove if invalid
- Filter duplicates
- Return error if zero valid suggestions
- Return validated suggestions array

### Step 9: Add Token Usage Tracking
**File**: `src/lib/services/ai-generation.service.ts`

- Extract `usage` field from LLM response
- Calculate total tokens (prompt + completion)
- Include in response DTO
- Log for cost monitoring
- Consider adding per-user token quotas (future)

### Step 10: Write Unit Tests
**File**: `src/lib/services/ai-generation.service.test.ts`

- Mock Openrouter.ai API responses
- Test successful generation
- Test timeout handling
- Test invalid response parsing
- Test suggestion validation
- Test error scenarios
- Test rate limiting logic

### Step 11: Integration Testing
**File**: `tests/api/ai-generate.test.ts`

- Test full endpoint flow with authentication
- Test validation errors (text too short/long)
- Test rate limiting
- Test unauthorized access
- Test with various text inputs
- Verify response structure

### Step 12: Documentation
**Files**: README.md, API documentation

- Document endpoint usage
- Provide example requests/responses
- List supported models
- Explain rate limits
- Add troubleshooting guide
- Document environment variables

### Step 13: Monitoring & Logging Setup
**File**: Logging configuration

- Set up structured logging
- Track success/error rates
- Monitor LLM API response times
- Track token usage and costs
- Set up alerts for high error rates
- Create dashboard for monitoring

### Step 14: Security Review
**Review checklist**

- ✓ API key not exposed to client
- ✓ User authentication required
- ✓ Input validation implemented
- ✓ Rate limiting active
- ✓ Prompt injection mitigations
- ✓ Error messages don't leak sensitive info
- ✓ HTTPS enforced (production)

### Step 15: Performance Testing
**Load testing**

- Test with maximum text length (10,000 chars)
- Test concurrent requests
- Measure average response time
- Verify timeout handling
- Test rate limiter under load
- Optimize if needed

---

## Summary

This implementation plan provides a comprehensive guide for implementing the POST /api/ai/generate endpoint. Key focus areas include:

- **Security**: Authentication, input validation, API key protection, rate limiting
- **Reliability**: Error handling, timeouts, graceful degradation
- **Performance**: Efficient prompt design, caching opportunities, timeout configuration
- **User Experience**: Clear error messages, appropriate status codes, expected wait times
- **Maintainability**: Service layer separation, structured logging, comprehensive testing

The implementation follows Astro best practices, uses Zod for validation, extracts business logic into services, and maintains type safety throughout the stack.
