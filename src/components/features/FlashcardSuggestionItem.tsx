import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import type { FlashcardSuggestionViewModel } from '@/components/hooks/useGenerateFlashcards';

interface FlashcardSuggestionItemProps {
	suggestion: FlashcardSuggestionViewModel;
	onUpdate: (id: string, newFront: string, newBack: string) => void;
	onToggleSelect: (id: string) => void;
	onRemove: (id: string) => void;
}

export function FlashcardSuggestionItem({
	suggestion,
	onUpdate,
	onToggleSelect,
	onRemove,
}: FlashcardSuggestionItemProps) {
	const handleFrontChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		onUpdate(suggestion.id, e.target.value, suggestion.back);
	};

	const handleBackChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		onUpdate(suggestion.id, suggestion.front, e.target.value);
	};

	return (
		<Card className={suggestion.isSelected ? 'border-primary' : 'border-muted'}>
			<CardContent className="pt-4 space-y-3">
				<div className="flex items-start gap-3">
					<Checkbox
						id={`select-${suggestion.id}`}
						checked={suggestion.isSelected}
						onCheckedChange={() => onToggleSelect(suggestion.id)}
						className="mt-2"
					/>
					<div className="flex-1 space-y-3">
						<div>
							<label htmlFor={`front-${suggestion.id}`} className="text-sm font-medium block mb-1">
								Front
							</label>
							<Input
								id={`front-${suggestion.id}`}
								value={suggestion.front}
								onChange={handleFrontChange}
								placeholder="Front of flashcard..."
								className="w-full"
							/>
						</div>
						<div>
							<label htmlFor={`back-${suggestion.id}`} className="text-sm font-medium block mb-1">
								Back
							</label>
							<Input
								id={`back-${suggestion.id}`}
								value={suggestion.back}
								onChange={handleBackChange}
								placeholder="Back of flashcard..."
								className="w-full"
							/>
						</div>
					</div>
					<Button
						variant="ghost"
						size="icon"
						onClick={() => onRemove(suggestion.id)}
						className="text-destructive hover:text-destructive hover:bg-destructive/10"
						aria-label="Remove suggestion"
					>
						<Trash2 className="h-4 w-4" />
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
