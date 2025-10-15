import React from 'react';
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
		<div
			className={`backdrop-blur-sm rounded-lg p-4 border transition-all ${
				suggestion.isSelected
					? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-blue-400/50 shadow-lg'
					: 'bg-white/5 border-white/10 hover:bg-white/10'
			}`}
		>
			<div className="flex items-start gap-3">
				<Checkbox
					id={`select-${suggestion.id}`}
					checked={suggestion.isSelected}
					onCheckedChange={() => onToggleSelect(suggestion.id)}
					className="mt-2 border-white/30 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-600 data-[state=checked]:to-purple-600 data-[state=checked]:border-transparent"
				/>
				<div className="flex-1 space-y-3">
					<div>
						<label
							htmlFor={`front-${suggestion.id}`}
							className="text-sm font-medium block mb-1 text-blue-100"
						>
							Question
						</label>
						<Input
							id={`front-${suggestion.id}`}
							value={suggestion.front}
							onChange={handleFrontChange}
							placeholder="Front of flashcard..."
							className="w-full bg-white/10 border-white/20 text-white placeholder:text-white/50 backdrop-blur-sm focus:bg-white/15 focus:border-white/40"
						/>
					</div>
					<div>
						<label
							htmlFor={`back-${suggestion.id}`}
							className="text-sm font-medium block mb-1 text-blue-100"
						>
							Answer
						</label>
						<Input
							id={`back-${suggestion.id}`}
							value={suggestion.back}
							onChange={handleBackChange}
							placeholder="Back of flashcard..."
							className="w-full bg-white/10 border-white/20 text-white placeholder:text-white/50 backdrop-blur-sm focus:bg-white/15 focus:border-white/40"
						/>
					</div>
				</div>
				<Button
					variant="ghost"
					size="icon"
					onClick={() => onRemove(suggestion.id)}
					className="text-red-300 hover:text-red-200 hover:bg-red-500/20 transition-colors"
					aria-label="Remove suggestion"
				>
					<Trash2 className="h-4 w-4" />
				</Button>
			</div>
		</div>
	);
}
