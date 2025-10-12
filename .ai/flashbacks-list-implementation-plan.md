# API Endpoint Implementation Plan: GET /api/flashcards

## 1. Endpoint Overview
This endpoint retrieves a paginated list of flashcards belonging to the authenticated user. It supports filtering by source and sorting by creation or update date.

## 2. Request Details
- **HTTP Method**: `GET`
- **URL Structure**: `/api/flashcards`
- **Parameters**:
  - **Required**: None.
  - **Optional Query Parameters**:
    - `page` (integer, default: 1): The page number for pagination.
    - `limit` (integer, default: 20, max: 100): The number of items per page.
    - `source` (string, enum: `manual` | `ai_generated`): Filters flashcards by their source.
    - `sort` (string, enum: `created_at` | `updated_at`, default: `created_at`): The field to sort by.
    - `order` (string, enum: `asc` | `desc`, default: `desc`): The sort order.
- **Request Body**: None.

## 3. Used Types
- **DTOs**:
  - `FlashcardDTO`: Represents a single flashcard in the response.
  - `PaginationDTO`: Contains pagination metadata (`page`, `limit`, `total`, `total_pages`).
  - `FlashcardListResponseDTO`: The top-level response object, containing `data: FlashcardDTO[]` and `pagination: PaginationDTO`.
- **Query Parameter Type**:
  - `FlashcardQueryParams`: Type definition for the optional query parameters.

## 4. Data Flow
1. The client sends a `GET` request to `/api/flashcards` with an authentication token and optional query parameters.
2. The Astro middleware validates the JWT and attaches the user session to `context.locals`.
3. The API route handler at `src/pages/api/flashcards/index.ts` receives the request.
4. A Zod schema validates the query parameters (`page`, `limit`, `source`, `sort`, `order`), applying default values if they are not provided.
5. The handler extracts the `userId` from `context.locals.user.id`.
6. The handler calls the `getFlashcards` method in the `FlashcardService` (`src/lib/services/flashcard.service.ts`), passing the `userId` and validated query parameters.
7. The `FlashcardService` constructs a Supabase query to the `flashcards` table.
   - It applies a `eq('user_id', userId)` filter to fetch only the user's flashcards.
   - If the `source` parameter is provided, it adds an `eq('source', source)` filter.
   - It applies `order(sort, { ascending: order === 'asc' })` for sorting.
   - It uses `.range()` for pagination based on the `page` and `limit` parameters.
   - It executes a separate query to get the total count of matching records for the `total` and `total_pages` fields in the pagination response.
8. The service returns the list of flashcards and pagination details to the route handler.
9. The handler formats the data into the `FlashcardListResponseDTO` structure and sends it back to the client with a `200 OK` status.

## 5. Security Considerations
- **Authentication**: The endpoint is protected by Astro middleware that verifies the user's JWT. Requests without a valid token will be rejected with a `401 Unauthorized` error.
- **Authorization**: Row-Level Security (RLS) is enabled on the `flashcards` table in Supabase. The policy `auth.uid() = user_id` ensures that even if the API-level filter were to fail, the database would prevent a user from accessing another user's data.
- **Input Validation**: All query parameters are strictly validated using a Zod schema to prevent injection attacks and ensure data integrity. The `limit` parameter is capped at 100 to prevent abuse.

## 6. Error Handling
- **400 Bad Request**: Returned if query parameters fail validation (e.g., `limit` > 100, invalid `sort` value). The response body will contain a detailed error message from Zod.
- **401 Unauthorized**: Returned by the middleware if the JWT is missing, invalid, or expired.
- **500 Internal Server Error**: Returned for any unexpected server-side errors, such as a database connection failure. A generic error message will be sent to the client, and the detailed error will be logged on the server.

## 7. Performance Considerations
- **Database Indexing**: An index on the `flashcards(user_id)` column is crucial for efficiently fetching flashcards for a specific user. An additional composite index on `(user_id, source)` could further optimize filtered queries.
- **Pagination**: The use of `limit` and `page` parameters is essential to prevent fetching large datasets at once, ensuring fast response times and reducing server load.
- **Query Optimization**: The total count of records is fetched with a separate, lightweight `count()` query to avoid performance overhead on the main data query.

## 8. Implementation Steps
1. **Create Zod Schema**: In a new file `src/lib/schemas/flashcard.schema.ts`, define a Zod schema `GetFlashcardsQuerySchema` to validate the optional query parameters (`page`, `limit`, `source`, `sort`, `order`) with default values.
2. **Implement Service Logic**: Create a new file `src/lib/services/flashcard.service.ts`.
   - Add a `getFlashcards` function that accepts `supabase: SupabaseClient`, `userId: string`, and `queryParams: FlashcardQueryParams`.
   - Inside the function, build and execute the Supabase query to fetch flashcard data and the total count.
   - Return an object matching the `FlashcardListResponseDTO` structure.
3. **Create API Endpoint**: Create the file `src/pages/api/flashcards/index.ts`.
   - Export `prerender = false`.
   - Implement the `GET` handler function which takes an `APIContext`.
   - Use `context.locals.supabase` to get the Supabase client and `context.locals.user` for the user's session.
   - Parse and validate the query parameters from `context.url.searchParams` using the `GetFlashcardsQuerySchema`.
   - Call the `flashcardService.getFlashcards` method with the required arguments.
   - Return the response using `new Response(JSON.stringify(result))` with a status of `200`.
   - Add `try...catch` blocks for validation, database, and other unexpected errors, returning the appropriate HTTP status codes and error messages.
