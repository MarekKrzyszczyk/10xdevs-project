import type { APIRoute } from 'astro';
import { GetFlashcardsQuerySchema, CreateFlashcardSchema } from '@/lib/schemas/flashcard.schema';
import { flashcardService, DatabaseQueryError } from '@/lib/services/flashcard.service';
import { DEFAULT_USER_ID } from '@/db/supabase.client';
import { createLogger } from '@/lib/utils/logger';

// Disable prerendering for this API route (SSR only)
export const prerender = false;

const logger = createLogger('FlashcardsAPI');

/**
 * GET /api/flashcards
 * Retrieve a paginated list of flashcards for the authenticated user
 *
 * Query Parameters:
 * - page (number, default: 1): Page number for pagination
 * - limit (number, default: 20, max: 100): Number of items per page
 * - source (string, optional): Filter by source ('manual' | 'ai_generated')
 * - sort (string, default: 'created_at'): Sort field ('created_at' | 'updated_at')
 * - order (string, default: 'desc'): Sort order ('asc' | 'desc')
 *
 * Returns:
 * - 200: Success with flashcard list and pagination metadata
 * - 400: Bad request (invalid query parameters)
 * - 401: Unauthorized (no valid session)
 * - 500: Internal server error
 */
export const GET: APIRoute = async ({ url, locals }) => {
	const userId = DEFAULT_USER_ID;
	const supabase = locals.supabase;

	try {
		// 1. Extract query parameters from URL
		const searchParams = url.searchParams;
		const rawParams = {
			page: searchParams.get('page'),
			limit: searchParams.get('limit'),
			source: searchParams.get('source'),
			sort: searchParams.get('sort'),
			order: searchParams.get('order'),
		};

		// 2. Validate query parameters with Zod schema
		const validation = GetFlashcardsQuerySchema.safeParse(rawParams);

		if (!validation.success) {
			const errors = validation.error.errors.map((err) => ({
				field: err.path.join('.'),
				message: err.message,
			}));

			logger.warn('Query parameter validation failed', { userId, rawParams, errors });

			return new Response(
				JSON.stringify({
					error: 'Validation failed',
					details: errors,
				}),
				{ status: 400, headers: { 'Content-Type': 'application/json' } }
			);
		}

		const queryParams = validation.data;

		logger.info('Processing flashcard list request', {
			userId,
			queryParams,
		});

		// 3. Call service to fetch flashcards
		const result = await flashcardService.getFlashcards(supabase, userId, queryParams);

		// 4. Return success response
		return new Response(JSON.stringify(result), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (error) {
		// Handle known service errors
		if (error instanceof DatabaseQueryError) {
			logger.error(
				'Database query failed',
				{ userId },
				error.originalError instanceof Error
					? error.originalError
					: new Error(String(error.originalError))
			);

			return new Response(
				JSON.stringify({
					error: 'Internal server error',
					message: 'Failed to retrieve flashcards',
				}),
				{ status: 500, headers: { 'Content-Type': 'application/json' } }
			);
		}

		// Handle unexpected errors
		logger.error('Unexpected error in GET /api/flashcards', { userId }, error as Error);

		return new Response(
			JSON.stringify({
				error: 'Internal server error',
				message: 'An unexpected error occurred while retrieving flashcards',
			}),
			{ status: 500, headers: { 'Content-Type': 'application/json' } }
		);
	}
};

/**
 * POST /api/flashcards
 * Create a new flashcard
 *
 * Request Body:
 * - front (string, required): The question/front side of the flashcard (1-1000 characters)
 * - back (string, required): The answer/back side of the flashcard (1-1000 characters)
 * - source (string, required): The source of the flashcard ('manual' | 'ai_generated')
 *
 * Returns:
 * - 201: Success with created flashcard
 * - 400: Bad request (validation errors)
 * - 401: Unauthorized (no valid session)
 * - 500: Internal server error
 */
export const POST: APIRoute = async ({ request, locals }) => {
	const userId = DEFAULT_USER_ID;
	const supabase = locals.supabase;

	try {
		// 1. Parse request body
		let body: unknown;
		try {
			body = await request.json();
		} catch (parseError) {
			logger.warn('Failed to parse request body', { userId }, parseError as Error);
			return new Response(
				JSON.stringify({
					error: 'Validation failed',
					message: 'Invalid JSON in request body',
				}),
				{ status: 400, headers: { 'Content-Type': 'application/json' } }
			);
		}

		// 2. Validate request body with Zod schema
		const validation = CreateFlashcardSchema.safeParse(body);

		if (!validation.success) {
			const errors = validation.error.errors.map((err) => ({
				field: err.path.join('.'),
				message: err.message,
			}));

			logger.warn('Request body validation failed', { userId, body, errors });

			return new Response(
				JSON.stringify({
					error: 'Validation failed',
					details: errors,
				}),
				{ status: 400, headers: { 'Content-Type': 'application/json' } }
			);
		}

		const command = validation.data;

		logger.info('Processing flashcard creation request', {
			userId,
			source: command.source,
		});

		// 3. Call service to create flashcard
		const result = await flashcardService.createFlashcard(supabase, userId, command);

		// 4. Return success response
		return new Response(JSON.stringify(result), {
			status: 201,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (error) {
		// Handle known service errors
		if (error instanceof DatabaseQueryError) {
			logger.error(
				'Database query failed',
				{ userId },
				error.originalError instanceof Error
					? error.originalError
					: new Error(String(error.originalError))
			);

			return new Response(
				JSON.stringify({
					error: 'Internal server error',
					message: 'Failed to create flashcard',
				}),
				{ status: 500, headers: { 'Content-Type': 'application/json' } }
			);
		}

		// Handle unexpected errors
		logger.error('Unexpected error in POST /api/flashcards', { userId }, error as Error);

		return new Response(
			JSON.stringify({
				error: 'Internal server error',
				message: 'An unexpected error occurred while creating flashcard',
			}),
			{ status: 500, headers: { 'Content-Type': 'application/json' } }
		);
	}
};
