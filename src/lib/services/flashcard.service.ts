import type { SupabaseClient as SupabaseClientType } from '@supabase/supabase-js';
import type { Database } from '@/db/database.type';
import type { FlashcardListResponseDTO, FlashcardDTO, UpdateFlashcardCommand } from '@/types';
import type { ValidatedFlashcardQueryParams } from '@/lib/schemas/flashcard.schema';
import { createLogger } from '@/lib/utils/logger';

/**
 * Type alias for our Supabase client
 */
export type SupabaseClient = SupabaseClientType<Database>;

/**
 * Custom error types for flashcard service
 */
export class DatabaseQueryError extends Error {
	constructor(message: string, public readonly originalError?: unknown) {
		super(message);
		this.name = 'DatabaseQueryError';
	}
}

export class FlashcardNotFoundError extends Error {
	constructor(message: string = 'Flashcard not found') {
		super(message);
		this.name = 'FlashcardNotFoundError';
	}
}

/**
 * Flashcard Service
 * Handles business logic for flashcard operations
 */
export class FlashcardService {
	private readonly logger = createLogger('FlashcardService');

	/**
	 * Get paginated list of flashcards for a user
	 * @param supabase - Supabase client instance
	 * @param userId - User ID to filter flashcards
	 * @param queryParams - Validated query parameters (page, limit, source, sort, order)
	 * @returns Paginated flashcard list with metadata
	 * @throws {DatabaseQueryError} When database query fails
	 */
	async getFlashcards(
		supabase: SupabaseClient,
		userId: string,
		queryParams: ValidatedFlashcardQueryParams
	): Promise<FlashcardListResponseDTO> {
		const { page, limit, source, sort, order } = queryParams;

		// Calculate pagination offset
		const offset = (page - 1) * limit;

		this.logger.info('Fetching flashcards', {
			userId,
			page,
			limit,
			source,
			sort,
			order,
			offset,
		});

		try {
			// Build base query for flashcards
			let query = supabase
				.from('flashcards')
				.select('id, front, back, source, created_at, updated_at')
				.eq('user_id', userId);

			// Apply source filter if provided
			if (source) {
				query = query.eq('source', source);
			}

			// Apply sorting
			query = query.order(sort, { ascending: order === 'asc' });

			// Apply pagination
			query = query.range(offset, offset + limit - 1);

			// Execute query
			const { data, error } = await query;

			if (error) {
				this.logger.error(
					'Failed to fetch flashcards',
					{ userId, page, limit, source },
					error
				);
				throw new DatabaseQueryError('Failed to fetch flashcards from database', error);
			}

			// Build count query for pagination metadata
			let countQuery = supabase
				.from('flashcards')
				.select('*', { count: 'exact', head: true })
				.eq('user_id', userId);

			// Apply same source filter to count query
			if (source) {
				countQuery = countQuery.eq('source', source);
			}

			// Execute count query
			const { count, error: countError } = await countQuery;

			if (countError) {
				this.logger.error('Failed to fetch flashcard count', { userId, source }, countError);
				throw new DatabaseQueryError('Failed to fetch flashcard count', countError);
			}

			// Transform database rows to DTOs
			const flashcards: FlashcardDTO[] = data.map((row) => ({
				id: row.id,
				front: row.front,
				back: row.back,
				source: row.source as 'manual' | 'ai_generated',
				created_at: row.created_at,
				updated_at: row.updated_at,
			}));

			// Calculate pagination metadata
			const total = count ?? 0;
			const total_pages = Math.ceil(total / limit);

			const response: FlashcardListResponseDTO = {
				data: flashcards,
				pagination: {
					page,
					limit,
					total,
					total_pages,
				},
			};

			this.logger.info('Successfully fetched flashcards', {
				userId,
				count: flashcards.length,
				total,
				total_pages,
			});

			return response;
		} catch (error) {
			// Re-throw known errors
			if (error instanceof DatabaseQueryError) {
				throw error;
			}

			// Wrap unexpected errors
			this.logger.error(
				'Unexpected error while fetching flashcards',
				{ userId, page, limit },
				error as Error
			);
			throw new DatabaseQueryError('Unexpected error occurred while fetching flashcards', error);
		}
	}

	/**
	 * Update an existing flashcard
	 * @param supabase - Supabase client instance
	 * @param userId - User ID who owns the flashcard
	 * @param flashcardId - ID of the flashcard to update
	 * @param command - Update command with optional front and back fields
	 * @returns Updated flashcard DTO
	 * @throws {FlashcardNotFoundError} When flashcard doesn't exist or doesn't belong to user
	 * @throws {DatabaseQueryError} When database query fails
	 */
	async updateFlashcard(
		supabase: SupabaseClient,
		userId: string,
		flashcardId: string,
		command: UpdateFlashcardCommand
	): Promise<FlashcardDTO> {
		this.logger.info('Updating flashcard', { userId, flashcardId, command });

		try {
			// Build update object with only provided fields
			const updateData: Record<string, unknown> = {
				updated_at: new Date().toISOString(),
			};

			if (command.front !== undefined) {
				updateData.front = command.front;
			}

			if (command.back !== undefined) {
				updateData.back = command.back;
			}

			// Execute update query with user_id filter for security
			const { data, error } = await supabase
				.from('flashcards')
				.update(updateData)
				.eq('id', flashcardId)
				.eq('user_id', userId)
				.select('id, front, back, source, created_at, updated_at')
				.single();

			if (error) {
				// Check if it's a not found error (no rows matched)
				if (error.code === 'PGRST116') {
					this.logger.warn('Flashcard not found for update', { userId, flashcardId });
					throw new FlashcardNotFoundError(
						`Flashcard with id ${flashcardId} not found or does not belong to user`
					);
				}

				this.logger.error('Failed to update flashcard', { userId, flashcardId }, error);
				throw new DatabaseQueryError('Failed to update flashcard in database', error);
			}

			// Transform to DTO
			const flashcardDTO: FlashcardDTO = {
				id: data.id,
				front: data.front,
				back: data.back,
				source: data.source as 'manual' | 'ai_generated',
				created_at: data.created_at,
				updated_at: data.updated_at,
			};

			this.logger.info('Successfully updated flashcard', { userId, flashcardId });
			return flashcardDTO;
		} catch (error) {
			// Re-throw known errors
			if (error instanceof FlashcardNotFoundError || error instanceof DatabaseQueryError) {
				throw error;
			}

			// Wrap unexpected errors
			this.logger.error(
				'Unexpected error while updating flashcard',
				{ userId, flashcardId },
				error as Error
			);
			throw new DatabaseQueryError('Unexpected error occurred while updating flashcard', error);
		}
	}

	/**
	 * Delete a flashcard
	 * @param supabase - Supabase client instance
	 * @param userId - User ID who owns the flashcard
	 * @param flashcardId - ID of the flashcard to delete
	 * @throws {FlashcardNotFoundError} When flashcard doesn't exist or doesn't belong to user
	 * @throws {DatabaseQueryError} When database query fails
	 */
	async deleteFlashcard(
		supabase: SupabaseClient,
		userId: string,
		flashcardId: string
	): Promise<void> {
		this.logger.info('Deleting flashcard', { userId, flashcardId });

		try {
			// Execute delete query with user_id filter for security
			const { error, count } = await supabase
				.from('flashcards')
				.delete({ count: 'exact' })
				.eq('id', flashcardId)
				.eq('user_id', userId);

			if (error) {
				this.logger.error('Failed to delete flashcard', { userId, flashcardId }, error);
				throw new DatabaseQueryError('Failed to delete flashcard from database', error);
			}

			// Check if any rows were deleted
			if (count === 0) {
				this.logger.warn('Flashcard not found for deletion', { userId, flashcardId });
				throw new FlashcardNotFoundError(
					`Flashcard with id ${flashcardId} not found or does not belong to user`
				);
			}

			this.logger.info('Successfully deleted flashcard', { userId, flashcardId });
		} catch (error) {
			// Re-throw known errors
			if (error instanceof FlashcardNotFoundError || error instanceof DatabaseQueryError) {
				throw error;
			}

			// Wrap unexpected errors
			this.logger.error(
				'Unexpected error while deleting flashcard',
				{ userId, flashcardId },
				error as Error
			);
			throw new DatabaseQueryError('Unexpected error occurred while deleting flashcard', error);
		}
	}
}

/**
 * Singleton instance of FlashcardService
 */
export const flashcardService = new FlashcardService();
