import type { APIRoute } from 'astro';
import { z } from 'zod';
import type {
	BatchCreateFlashcardCommand,
	BatchCreateFlashcardResponseDTO,
	FlashcardDTO,
} from '@/types';
import { DEFAULT_USER_ID } from '@/db/supabase.client';
import { createLogger } from '@/lib/utils/logger';

// Disable prerendering for this API route (SSR only)
export const prerender = false;

const logger = createLogger('BatchFlashcardsAPI');

/**
 * Zod validation schema for batch flashcard creation
 */
const FlashcardSchema = z.object({
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

const BatchCreateFlashcardSchema = z.object({
	flashcards: z
		.array(FlashcardSchema)
		.min(1, 'At least one flashcard is required')
		.max(50, 'Maximum 50 flashcards per batch'),
});

/**
 * POST /api/flashcards/batch
 * Create multiple flashcards at once (for AI-generated acceptance)
 */
export const POST: APIRoute = async ({ request, locals }) => {
	const userId = DEFAULT_USER_ID;
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
		const validation = BatchCreateFlashcardSchema.safeParse(body);
		if (!validation.success) {
			const errors = validation.error.errors.map((err) => ({
				field: err.path.join('.'),
				message: err.message,
			}));

			logger.warn('Validation failed for batch create', { userId, errors });

			return new Response(
				JSON.stringify({
					error: 'Validation failed',
					details: errors,
				}),
				{ status: 400, headers: { 'Content-Type': 'application/json' } }
			);
		}

		const command: BatchCreateFlashcardCommand = validation.data;

		// 3. Prepare flashcards for insertion
		const flashcardsToInsert = command.flashcards.map((flashcard) => ({
			front: flashcard.front,
			back: flashcard.back,
			source: flashcard.source,
			user_id: userId,
		}));

		// 4. Insert flashcards into database
		const { data, error } = await supabase
			.from('flashcards')
			.insert(flashcardsToInsert)
			.select('id, front, back, source, created_at, updated_at');

		if (error) {
			logger.error('Failed to insert flashcards', { userId, count: flashcardsToInsert.length }, error);

			// Handle specific database errors
			if (error.code === '23505') {
				// Duplicate key violation
				return new Response(
					JSON.stringify({
						error: 'Conflict',
						message: 'One or more flashcards already exist',
					}),
					{ status: 409, headers: { 'Content-Type': 'application/json' } }
				);
			}

			if (error.code === '23514') {
				// Check constraint violation
				return new Response(
					JSON.stringify({
						error: 'Validation failed',
						message: 'One or more flashcards violate database constraints',
					}),
					{ status: 422, headers: { 'Content-Type': 'application/json' } }
				);
			}

			return new Response(
				JSON.stringify({
					error: 'Internal server error',
					message: 'Failed to save flashcards',
				}),
				{ status: 500, headers: { 'Content-Type': 'application/json' } }
			);
		}

		// 5. Build response
		const flashcards: FlashcardDTO[] = data.map((row) => ({
			id: row.id,
			front: row.front,
			back: row.back,
			source: row.source as 'manual' | 'ai_generated',
			created_at: row.created_at,
			updated_at: row.updated_at,
		}));

		const response: BatchCreateFlashcardResponseDTO = {
			created: flashcards.length,
			flashcards,
		};

		logger.info('Successfully created flashcards batch', {
			userId,
			created: flashcards.length,
		});

		// 6. Return success response
		return new Response(JSON.stringify(response), {
			status: 201,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (error) {
		logger.error('Unexpected error in batch create', { userId }, error as Error);

		return new Response(
			JSON.stringify({
				error: 'Internal server error',
				message: 'An unexpected error occurred while creating flashcards',
			}),
			{ status: 500, headers: { 'Content-Type': 'application/json' } }
		);
	}
};
