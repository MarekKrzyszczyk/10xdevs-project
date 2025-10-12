import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import type {
	FlashcardDTO,
	FlashcardListResponseDTO,
	CreateFlashcardCommand,
	UpdateFlashcardCommand,
} from '@/types';

export function useFlashcards() {
	const [flashcards, setFlashcards] = useState<FlashcardDTO[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	// Pagination state
	const [page, setPage] = useState<number>(1);
	const [limit] = useState<number>(20);
	const [total, setTotal] = useState<number>(0);
	const [totalPages, setTotalPages] = useState<number>(0);

	// Fetch flashcards from API
	const fetchFlashcards = useCallback(async () => {
		setIsLoading(true);
		setError(null);

		try {
			const queryParams = new URLSearchParams({
				page: page.toString(),
				limit: limit.toString(),
				sort: 'created_at',
				order: 'desc',
			});

			const response = await fetch(`/api/flashcards?${queryParams}`);

			if (!response.ok) {
				if (response.status === 401) {
					const errorMsg = 'You must be logged in to view flashcards.';
					setError(errorMsg);
					toast.error('Unauthorized', { description: errorMsg });
				} else {
					const errorMsg = 'Failed to load flashcards. Please try again.';
					setError(errorMsg);
					toast.error('Load Failed', { description: errorMsg });
				}
				return;
			}

			const data: FlashcardListResponseDTO = await response.json();
			setFlashcards(data.data);
			setTotal(data.pagination.total);
			setTotalPages(data.pagination.total_pages);
		} catch (err) {
			console.error('Error fetching flashcards:', err);
			const errorMsg = 'An unexpected error occurred. Please check your connection and try again.';
			setError(errorMsg);
			toast.error('Network Error', { description: errorMsg });
		} finally {
			setIsLoading(false);
		}
	}, [page, limit]);

	// Load flashcards on mount and when page changes
	useEffect(() => {
		fetchFlashcards();
	}, [fetchFlashcards]);

	// Create a new flashcard
	const createFlashcard = useCallback(async (command: CreateFlashcardCommand): Promise<boolean> => {
		try {
			const response = await fetch('/api/flashcards', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(command),
			});

			if (!response.ok) {
				if (response.status === 400) {
					toast.error('Validation Error', { description: 'Please check your inputs.' });
				} else if (response.status === 401) {
					toast.error('Unauthorized', { description: 'You must be logged in.' });
				} else {
					toast.error('Create Failed', { description: 'Failed to create flashcard.' });
				}
				return false;
			}

			toast.success('Flashcard Created', {
				description: 'Your flashcard has been created successfully.'
			});

			// Refresh the list
			await fetchFlashcards();
			return true;
		} catch (err) {
			console.error('Error creating flashcard:', err);
			toast.error('Network Error', { description: 'Failed to create flashcard.' });
			return false;
		}
	}, [fetchFlashcards]);

	// Update an existing flashcard
	const updateFlashcard = useCallback(async (id: string, command: UpdateFlashcardCommand): Promise<boolean> => {
		try {
			const response = await fetch(`/api/flashcards/${id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(command),
			});

			if (!response.ok) {
				if (response.status === 400) {
					toast.error('Validation Error', { description: 'Please check your inputs.' });
				} else if (response.status === 404) {
					toast.error('Not Found', { description: 'Flashcard not found.' });
				} else if (response.status === 401) {
					toast.error('Unauthorized', { description: 'You must be logged in.' });
				} else {
					toast.error('Update Failed', { description: 'Failed to update flashcard.' });
				}
				return false;
			}

			toast.success('Flashcard Updated', {
				description: 'Your flashcard has been updated successfully.'
			});

			// Refresh the list
			await fetchFlashcards();
			return true;
		} catch (err) {
			console.error('Error updating flashcard:', err);
			toast.error('Network Error', { description: 'Failed to update flashcard.' });
			return false;
		}
	}, [fetchFlashcards]);

	// Delete a flashcard
	const deleteFlashcard = useCallback(async (id: string): Promise<boolean> => {
		try {
			const response = await fetch(`/api/flashcards/${id}`, {
				method: 'DELETE',
			});

			if (!response.ok) {
				if (response.status === 404) {
					toast.error('Not Found', { description: 'Flashcard not found.' });
				} else if (response.status === 401) {
					toast.error('Unauthorized', { description: 'You must be logged in.' });
				} else {
					toast.error('Delete Failed', { description: 'Failed to delete flashcard.' });
				}
				return false;
			}

			toast.success('Flashcard Deleted', {
				description: 'Your flashcard has been deleted successfully.'
			});

			// Refresh the list
			await fetchFlashcards();
			return true;
		} catch (err) {
			console.error('Error deleting flashcard:', err);
			toast.error('Network Error', { description: 'Failed to delete flashcard.' });
			return false;
		}
	}, [fetchFlashcards]);

	// Pagination handlers
	const goToPage = useCallback((newPage: number) => {
		if (newPage >= 1 && newPage <= totalPages) {
			setPage(newPage);
		}
	}, [totalPages]);

	const nextPage = useCallback(() => {
		if (page < totalPages) {
			setPage(page + 1);
		}
	}, [page, totalPages]);

	const previousPage = useCallback(() => {
		if (page > 1) {
			setPage(page - 1);
		}
	}, [page]);

	return {
		flashcards,
		isLoading,
		error,
		page,
		limit,
		total,
		totalPages,
		createFlashcard,
		updateFlashcard,
		deleteFlashcard,
		goToPage,
		nextPage,
		previousPage,
		refetch: fetchFlashcards,
	};
}
