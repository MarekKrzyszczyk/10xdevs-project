import type { APIRoute } from 'astro';
import { z } from 'zod';
import { GetFlashcardsQuerySchema } from '@/lib/schemas/flashcard.schema';
import { flashcardService, DatabaseQueryError } from '@/lib/services/flashcard.service';
import { createLogger } from '@/lib/utils/logger';
import type { CreateFlashcardCommand, FlashcardDTO } from '@/types';

// Disable prerendering for this API route (SSR only)
export const prerender = false;

const logger = createLogger('FlashcardsListAPI');

/**
 * Zod validation schema for single flashcard creation
 */
const CreateFlashcardSchema = z.object({
	front: z
		.string()
		.min(1, 'Front must be at least 1 character')
		.max(1000, 'Front must not exceed 1000 characters')
		.trim(),
	back: z
		.string()
		.min(1, 'Back must be at least 1 character')
		.max(1000, 'Back must not exceed 1000 characters')
		.trim(),
	source: z.enum(['manual', 'ai_generated'], {
		errorMap: () => ({ message: 'Source must be either "manual" or "ai_generated"' }),
	}),
});

/**
 * POST /api/flashcards
 * Create a single flashcard
 *
 * Request Body:
 * - front (string, required): Front content of the flashcard (1-1000 characters)
 * - back (string, required): Back content of the flashcard (1-1000 characters)
 * - source (string, required): Source type ('manual' | 'ai_generated')
 *
 * Returns:
 * - 201: Success with created flashcard
 * - 400: Bad request (validation failed)
 * - 401: Unauthorized (no valid session)
 * - 500: Internal server error
 */
export const POST: APIRoute = async ({ request, locals }) => {
	// Check authentication
	if (!locals.user) {
		return new Response(
			JSON.stringify({
				error: 'Unauthorized',
				message: 'You must be logged in to create flashcards',
			}),
			{ status: 401, headers: { 'Content-Type': 'application/json' } }
		);
	}

	const userId = locals.user.id;
	const supabase = locals.supabase;

	try {
		// 1. Parse and validate request body
		let body: unknown;
		try {
			body = await request.json();
		} catch (parseError) {
			logger.error('Failed to parse request body', { userId }, parseError as Error);
			return new Response(
				JSON.stringify({
					error: 'Validation failed',
					message: 'Invalid JSON in request body',
				}),
				{ status: 400, headers: { 'Content-Type': 'application/json' } }
			);
		}

		// 2. Validate input with Zod schema
		const validation = CreateFlashcardSchema.safeParse(body);
		if (!validation.success) {
			const errors = validation.error.errors.map((err) => ({
				field: err.path.join('.'),
				message: err.message,
			}));

			logger.warn('Validation failed for flashcard creation', { userId, errors });

			return new Response(
				JSON.stringify({
					error: 'Validation failed',
					details: errors,
				}),
				{ status: 400, headers: { 'Content-Type': 'application/json' } }
			);
		}

		const command: CreateFlashcardCommand = validation.data;

		logger.info('Creating flashcard', { userId, command });

		// 3. Insert flashcard into database
		const { data, error } = await supabase
			.from('flashcards')
			.insert({
				front: command.front,
				back: command.back,
				source: command.source,
				user_id: userId,
			})
			.select('id, front, back, source, created_at, updated_at')
			.single();

		if (error) {
			logger.error('Failed to insert flashcard', { userId, command }, error);

			// Handle specific database errors
			if (error.code === '23505') {
				// Duplicate key violation
				return new Response(
					JSON.stringify({
						error: 'Conflict',
						message: 'Flashcard already exists',
					}),
					{ status: 409, headers: { 'Content-Type': 'application/json' } }
				);
			}

			if (error.code === '23514') {
				// Check constraint violation
				return new Response(
					JSON.stringify({
						error: 'Validation failed',
						message: 'Flashcard violates database constraints',
					}),
					{ status: 422, headers: { 'Content-Type': 'application/json' } }
				);
			}

			return new Response(
				JSON.stringify({
					error: 'Internal server error',
					message: 'Failed to save flashcard',
				}),
				{ status: 500, headers: { 'Content-Type': 'application/json' } }
			);
		}

		// 4. Build response DTO
		const flashcard: FlashcardDTO = {
			id: data.id,
			front: data.front,
			back: data.back,
			source: data.source as 'manual' | 'ai_generated',
			created_at: data.created_at,
			updated_at: data.updated_at,
		};

		logger.info('Successfully created flashcard', { userId, flashcardId: flashcard.id });

		// 5. Return success response
		return new Response(JSON.stringify(flashcard), {
			status: 201,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (error) {
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
	// Check authentication
	if (!locals.user) {
		return new Response(
			JSON.stringify({
				error: 'Unauthorized',
				message: 'You must be logged in to view flashcards',
			}),
			{ status: 401, headers: { 'Content-Type': 'application/json' } }
		);
	}

	const userId = locals.user.id;
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
