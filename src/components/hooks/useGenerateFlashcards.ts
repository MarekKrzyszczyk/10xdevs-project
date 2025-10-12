import { useState, useCallback } from 'react';
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
			setError('Text must be between 1,000 and 10,000 characters.');
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
					setError('The provided text must be between 1,000 and 10,000 characters.');
				} else if (response.status === 502 || response.status === 503) {
					setError('The AI service is currently unavailable. Please try again later.');
				} else {
					setError('An unexpected error occurred. Please try again.');
				}
				return;
			}

			const data: GenerateFlashcardsResponseDTO = await response.json();

			if (!data.suggestions || data.suggestions.length === 0) {
				setError('Could not generate flashcards from the provided text. Please try a different text.');
				return;
			}

			// Transform DTOs to ViewModels with client-side IDs and selection state
			const viewModels: FlashcardSuggestionViewModel[] = data.suggestions.map((suggestion) => ({
				...suggestion,
				id: crypto.randomUUID(),
				isSelected: true,
			}));

			setSuggestions(viewModels);
		} catch (err) {
			console.error('Error generating flashcards:', err);
			setError('An unexpected error occurred. Please check your connection and try again.');
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
	}, []);

	const handleSaveSelected = useCallback(async () => {
		const selected = suggestions.filter((s) => s.isSelected);

		if (selected.length === 0) {
			setError('Please select at least one flashcard to save.');
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
				if (response.status === 400 || response.status === 422) {
					setError('Some flashcards could not be saved. Please check your inputs.');
				} else if (response.status === 401) {
					setError('You must be logged in to save flashcards.');
				} else {
					setError('An unexpected error occurred while saving. Please try again.');
				}
				return;
			}

			const data: BatchCreateFlashcardResponseDTO = await response.json();

			// Remove saved suggestions from the list
			const savedIds = new Set(selected.map((s) => s.id));
			setSuggestions((prev) => prev.filter((s) => !savedIds.has(s.id)));

			// Success feedback (could be enhanced with a toast notification)
			console.log(`Successfully saved ${data.created} flashcards`);
		} catch (err) {
			console.error('Error saving flashcards:', err);
			setError('An unexpected error occurred while saving. Please check your connection and try again.');
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
