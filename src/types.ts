import type { Database, Tables, TablesInsert, TablesUpdate, Enums } from './db/database.type';

// ============================================
// Entity Type Aliases
// ============================================

/**
 * Flashcard entity from database
 */
export type FlashcardEntity = Tables<'flashcards'>;

/**
 * Flashcard source enum
 */
export type FlashcardSource = Enums<'flashcard_source'>;

// ============================================
// Flashcard DTOs
// ============================================

/**
 * Flashcard DTO - Response object for flashcard endpoints
 * Derived from FlashcardEntity but excludes user_id for security
 */
export type FlashcardDTO = Omit<FlashcardEntity, 'user_id'>;

/**
 * Command for creating a new flashcard
 * Based on TablesInsert but requires only user-provided fields
 */
export type CreateFlashcardCommand = Pick<TablesInsert<'flashcards'>, 'front' | 'back' | 'source'>;

/**
 * Command for updating an existing flashcard
 * Only front and back can be updated, both optional
 */
export type UpdateFlashcardCommand = Partial<Pick<TablesUpdate<'flashcards'>, 'front' | 'back'>>;

/**
 * Command for batch creating flashcards
 */
export type BatchCreateFlashcardCommand = {
	flashcards: CreateFlashcardCommand[];
};

// ============================================
// Pagination DTOs
// ============================================

/**
 * Pagination metadata for list responses
 */
export type PaginationDTO = {
	page: number;
	limit: number;
	total: number;
	total_pages: number;
};

/**
 * Response DTO for flashcard list endpoint
 */
export type FlashcardListResponseDTO = {
	data: FlashcardDTO[];
	pagination: PaginationDTO;
};

/**
 * Response DTO for batch flashcard creation
 */
export type BatchCreateFlashcardResponseDTO = {
	created: number;
	flashcards: FlashcardDTO[];
};

// ============================================
// Query Parameter Types
// ============================================

/**
 * Query parameters for GET /api/flashcards
 */
export type FlashcardQueryParams = {
	page?: number;
	limit?: number;
	source?: FlashcardSource;
	sort?: 'created_at' | 'updated_at';
	order?: 'asc' | 'desc';
};

// ============================================
// AI Generation DTOs
// ============================================

/**
 * Command for generating flashcards from text using AI
 */
export type GenerateFlashcardsCommand = {
	text: string;
	model?: string;
};

/**
 * Single flashcard suggestion from AI generation
 * Contains only front and back, no metadata
 */
export type FlashcardSuggestionDTO = Pick<FlashcardDTO, 'front' | 'back'>;

/**
 * Response DTO for AI flashcard generation
 */
export type GenerateFlashcardsResponseDTO = {
	suggestions: FlashcardSuggestionDTO[];
};
