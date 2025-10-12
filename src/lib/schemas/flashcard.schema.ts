import { z } from 'zod';

/**
 * Zod validation schema for GET /api/flashcards query parameters
 * Validates and coerces query parameters with appropriate defaults
 */
export const GetFlashcardsQuerySchema = z.object({
	/**
	 * Page number for pagination (must be >= 1)
	 * @default 1
	 */
	page: z
		.string()
		.nullish()
		.transform((val) => (val ? parseInt(val, 10) : 1))
		.pipe(z.number().int().min(1, 'Page must be at least 1')),

	/**
	 * Number of items per page (must be between 1 and 100)
	 * @default 20
	 */
	limit: z
		.string()
		.nullish()
		.transform((val) => (val ? parseInt(val, 10) : 20))
		.pipe(
			z
				.number()
				.int()
				.min(1, 'Limit must be at least 1')
				.max(100, 'Limit cannot exceed 100')
		),

	/**
	 * Filter flashcards by source (manual or ai_generated)
	 * @optional
	 */
	source: z
		.enum(['manual', 'ai_generated'], {
			errorMap: () => ({ message: 'Source must be either "manual" or "ai_generated"' }),
		})
		.nullish(),

	/**
	 * Field to sort by (created_at or updated_at)
	 * @default 'created_at'
	 */
	sort: z
		.enum(['created_at', 'updated_at'], {
			errorMap: () => ({ message: 'Sort must be either "created_at" or "updated_at"' }),
		})
		.nullish()
		.transform((val) => val ?? 'created_at'),

	/**
	 * Sort order (asc or desc)
	 * @default 'desc'
	 */
	order: z
		.enum(['asc', 'desc'], {
			errorMap: () => ({ message: 'Order must be either "asc" or "desc"' }),
		})
		.nullish()
		.transform((val) => val ?? 'desc'),
});

/**
 * Type for validated query parameters
 */
export type ValidatedFlashcardQueryParams = z.infer<typeof GetFlashcardsQuerySchema>;

/**
 * Zod validation schema for PUT /api/flashcards/:id request body
 * Validates flashcard update command
 */
export const UpdateFlashcardSchema = z.object({
	/**
	 * Front content of the flashcard (question)
	 * @optional
	 */
	front: z.string().min(1, 'Front content cannot be empty').optional(),

	/**
	 * Back content of the flashcard (answer)
	 * @optional
	 */
	back: z.string().min(1, 'Back content cannot be empty').optional(),
}).refine((data) => data.front || data.back, {
	message: 'At least one field (front or back) must be provided',
});

/**
 * Type for validated update flashcard command
 */
export type ValidatedUpdateFlashcardCommand = z.infer<typeof UpdateFlashcardSchema>;