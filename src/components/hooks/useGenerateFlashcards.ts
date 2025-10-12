import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import type {
	GenerateFlashcardsCommand,
	GenerateFlashcardsResponseDTO,
	FlashcardSuggestionDTO,
	BatchCreateFlashcardCommand,
	BatchCreateFlashcardResponseDTO,
} from '@/types';

export type FlashcardSuggestionViewModel = FlashcardSuggestionDTO & {
	id: string;
	isSelected: boolean;
};

export function useGenerateFlashcards() {
	const [text, setText] = useState<string>('');
	const [suggestions, setSuggestions] = useState<FlashcardSuggestionViewModel[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);

	const handleGenerate = useCallback(async () => {
		if (text.length < 1000 || text.length > 10000) {
			const errorMsg = 'Text must be between 1,000 and 10,000 characters.';
			setError(errorMsg);
			toast.error('Validation Error', { description: errorMsg });
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			const command: GenerateFlashcardsCommand = {
				text,
			};

			const response = await fetch('/api/ai/generate', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(command),
			});

			if (!response.ok) {
				if (response.status === 400) {
					const errorMsg = 'The provided text must be between 1,000 and 10,000 characters.';
					setError(errorMsg);
					toast.error('Validation Error', { description: errorMsg });
				} else if (response.status === 502 || response.status === 503) {
					const errorMsg = 'The AI service is currently unavailable. Please try again later.';
					setError(errorMsg);
					toast.error('Service Unavailable', { description: errorMsg });
				} else {
					const errorMsg = 'An unexpected error occurred. Please try again.';
					setError(errorMsg);
					toast.error('Generation Failed', { description: errorMsg });
				}
				return;
			}

			const data: GenerateFlashcardsResponseDTO = await response.json();

			if (!data.suggestions || data.suggestions.length === 0) {
				const errorMsg = 'Could not generate flashcards from the provided text. Please try a different text.';
				setError(errorMsg);
				toast.warning('No Results', { description: errorMsg });
				return;
			}

			// Transform DTOs to ViewModels with client-side IDs and selection state
			const viewModels: FlashcardSuggestionViewModel[] = data.suggestions.map((suggestion) => ({
				...suggestion,
				id: crypto.randomUUID(),
				isSelected: true,
			}));

			setSuggestions(viewModels);
			toast.success('Flashcards Generated', {
				description: `Successfully generated ${viewModels.length} flashcard suggestions`
			});
		} catch (err) {
			console.error('Error generating flashcards:', err);
			const errorMsg = 'An unexpected error occurred. Please check your connection and try again.';
			setError(errorMsg);
			toast.error('Network Error', { description: errorMsg });
		} finally {
			setIsLoading(false);
		}
	}, [text]);

	const handleUpdateSuggestion = useCallback((id: string, newFront: string, newBack: string) => {
		setSuggestions((prev) =>
			prev.map((s) => (s.id === id ? { ...s, front: newFront, back: newBack } : s))
		);
	}, []);

	const handleToggleSelect = useCallback((id: string) => {
		setSuggestions((prev) => prev.map((s) => (s.id === id ? { ...s, isSelected: !s.isSelected } : s)));
	}, []);

	const handleRemoveSuggestion = useCallback((id: string) => {
		setSuggestions((prev) => prev.filter((s) => s.id !== id));
		toast.info('Suggestion Removed');
	}, []);

	const handleSaveSelected = useCallback(async () => {
		const selected = suggestions.filter((s) => s.isSelected);

		if (selected.length === 0) {
			const errorMsg = 'Please select at least one flashcard to save.';
			setError(errorMsg);
			toast.warning('No Selection', { description: errorMsg });
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			const command: BatchCreateFlashcardCommand = {
				flashcards: selected.map((s) => ({
					front: s.front,
					back: s.back,
					source: 'ai_generated' as const,
				})),
			};

			const response = await fetch('/api/flashcards/batch', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(command),
			});

			if (!response.ok) {
				const errorText = await response.text();
				console.error('Save failed:', errorText);

				if (response.status === 400 || response.status === 422) {
					const errorMsg = 'Some flashcards could not be saved. Please check your inputs.';
					setError(errorMsg);
					toast.error('Validation Error', { description: errorMsg });
				} else if (response.status === 401) {
					const errorMsg = 'You must be logged in to save flashcards.';
					setError(errorMsg);
					toast.error('Unauthorized', { description: errorMsg });
				} else {
					const errorMsg = 'An unexpected error occurred while saving. Please try again.';
					setError(errorMsg);
					toast.error('Save Failed', { description: errorMsg });
				}
				return;
			}

			const data: BatchCreateFlashcardResponseDTO = await response.json();

			// Remove saved suggestions from the list
			const savedIds = new Set(selected.map((s) => s.id));
			setSuggestions((prev) => prev.filter((s) => !savedIds.has(s.id)));

			// Success notification
			toast.success('Flashcards Saved', {
				description: `Successfully saved ${data.created} flashcard${data.created > 1 ? 's' : ''} to your collection`
			});
		} catch (err) {
			console.error('Error saving flashcards:', err);
			const errorMsg = 'An unexpected error occurred while saving. Please check your connection and try again.';
			setError(errorMsg);
			toast.error('Network Error', { description: errorMsg });
		} finally {
			setIsLoading(false);
		}
	}, [suggestions]);

	return {
		text,
		setText,
		suggestions,
		isLoading,
		error,
		handleGenerate,
		handleUpdateSuggestion,
		handleToggleSelect,
		handleRemoveSuggestion,
		handleSaveSelected,
	};
}
