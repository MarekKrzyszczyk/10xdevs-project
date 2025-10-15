import type { APIRoute } from 'astro';
import { UpdateFlashcardSchema } from '@/lib/schemas/flashcard.schema';
import {
	flashcardService,
	DatabaseQueryError,
	FlashcardNotFoundError,
} from '@/lib/services/flashcard.service';
import { createLogger } from '@/lib/utils/logger';

// Disable prerendering for this API route (SSR only)
export const prerender = false;

const logger = createLogger('FlashcardDetailAPI');

/**
 * PUT /api/flashcards/:id
 * Update an existing flashcard
 *
 * Path Parameters:
 * - id (string): Flashcard ID
 *
 * Request Body:
 * - front (string, optional): Updated front content
 * - back (string, optional): Updated back content
 * - At least one field must be provided
 *
 * Returns:
 * - 200: Success with updated flashcard
 * - 400: Bad request (invalid input)
 * - 401: Unauthorized (no valid session)
 * - 404: Flashcard not found
 * - 500: Internal server error
 */
export const PUT: APIRoute = async ({ params, request, locals }) => {
	// Check authentication
	if (!locals.user) {
		return new Response(
			JSON.stringify({
				error: 'Unauthorized',
				message: 'You must be logged in to update flashcards',
			}),
			{ status: 401, headers: { 'Content-Type': 'application/json' } }
		);
	}

	const userId = locals.user.id;
	const supabase = locals.supabase;
	const flashcardId = params.id;

	// Validate flashcard ID
	if (!flashcardId) {
		logger.warn('Missing flashcard ID in PUT request', { userId });
		return new Response(
			JSON.stringify({
				error: 'Bad request',
				message: 'Flashcard ID is required',
			}),
			{ status: 400, headers: { 'Content-Type': 'application/json' } }
		);
	}

	try {
		// 1. Parse request body
		const body = await request.json();

		// 2. Validate request body with Zod schema
		const validation = UpdateFlashcardSchema.safeParse(body);

		if (!validation.success) {
			const errors = validation.error.errors.map((err) => ({
				field: err.path.join('.'),
				message: err.message,
			}));

			logger.warn('Update validation failed', { userId, flashcardId, errors });

			return new Response(
				JSON.stringify({
					error: 'Validation failed',
					details: errors,
				}),
				{ status: 400, headers: { 'Content-Type': 'application/json' } }
			);
		}

		const command = validation.data;

		logger.info('Processing flashcard update request', {
			userId,
			flashcardId,
			command,
		});

		// 3. Call service to update flashcard
		const updatedFlashcard = await flashcardService.updateFlashcard(
			supabase,
			userId,
			flashcardId,
			command
		);

		// 4. Return success response
		return new Response(JSON.stringify(updatedFlashcard), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (error) {
		// Handle flashcard not found error
		if (error instanceof FlashcardNotFoundError) {
			logger.warn('Flashcard not found', { userId, flashcardId });

			return new Response(
				JSON.stringify({
					error: 'Not found',
					message: error.message,
				}),
				{ status: 404, headers: { 'Content-Type': 'application/json' } }
			);
		}

		// Handle known service errors
		if (error instanceof DatabaseQueryError) {
			logger.error(
				'Database query failed',
				{ userId, flashcardId },
				error.originalError instanceof Error
					? error.originalError
					: new Error(String(error.originalError))
			);

			return new Response(
				JSON.stringify({
					error: 'Internal server error',
					message: 'Failed to update flashcard',
				}),
				{ status: 500, headers: { 'Content-Type': 'application/json' } }
			);
		}

		// Handle unexpected errors
		logger.error('Unexpected error in PUT /api/flashcards/:id', { userId, flashcardId }, error as Error);

		return new Response(
			JSON.stringify({
				error: 'Internal server error',
				message: 'An unexpected error occurred while updating flashcard',
			}),
			{ status: 500, headers: { 'Content-Type': 'application/json' } }
		);
	}
};

/**
 * DELETE /api/flashcards/:id
 * Delete a flashcard
 *
 * Path Parameters:
 * - id (string): Flashcard ID
 *
 * Returns:
 * - 204: Success (no content)
 * - 401: Unauthorized (no valid session)
 * - 404: Flashcard not found
 * - 500: Internal server error
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
	// Check authentication
	if (!locals.user) {
		return new Response(
			JSON.stringify({
				error: 'Unauthorized',
				message: 'You must be logged in to delete flashcards',
			}),
			{ status: 401, headers: { 'Content-Type': 'application/json' } }
		);
	}

	const userId = locals.user.id;
	const supabase = locals.supabase;
	const flashcardId = params.id;

	// Validate flashcard ID
	if (!flashcardId) {
		logger.warn('Missing flashcard ID in DELETE request', { userId });
		return new Response(
			JSON.stringify({
				error: 'Bad request',
				message: 'Flashcard ID is required',
			}),
			{ status: 400, headers: { 'Content-Type': 'application/json' } }
		);
	}

	try {
		logger.info('Processing flashcard delete request', {
			userId,
			flashcardId,
		});

		// Call service to delete flashcard
		await flashcardService.deleteFlashcard(supabase, userId, flashcardId);

		// Return success response (204 No Content)
		return new Response(null, { status: 204 });
	} catch (error) {
		// Handle flashcard not found error
		if (error instanceof FlashcardNotFoundError) {
			logger.warn('Flashcard not found', { userId, flashcardId });

			return new Response(
				JSON.stringify({
					error: 'Not found',
					message: error.message,
				}),
				{ status: 404, headers: { 'Content-Type': 'application/json' } }
			);
		}

		// Handle known service errors
		if (error instanceof DatabaseQueryError) {
			logger.error(
				'Database query failed',
				{ userId, flashcardId },
				error.originalError instanceof Error
					? error.originalError
					: new Error(String(error.originalError))
			);

			return new Response(
				JSON.stringify({
					error: 'Internal server error',
					message: 'Failed to delete flashcard',
				}),
				{ status: 500, headers: { 'Content-Type': 'application/json' } }
			);
		}

		// Handle unexpected errors
		logger.error('Unexpected error in DELETE /api/flashcards/:id', { userId, flashcardId }, error as Error);

		return new Response(
			JSON.stringify({
				error: 'Internal server error',
				message: 'An unexpected error occurred while deleting flashcard',
			}),
			{ status: 500, headers: { 'Content-Type': 'application/json' } }
		);
	}
};
