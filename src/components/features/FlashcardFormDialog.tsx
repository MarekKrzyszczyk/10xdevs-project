import React, { useState, useCallback, useEffect, useId } from 'react';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { FlashcardDTO, CreateFlashcardCommand, UpdateFlashcardCommand } from '@/types';

interface FlashcardFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	flashcard?: FlashcardDTO | null;
	onSubmit: (command: CreateFlashcardCommand | UpdateFlashcardCommand) => Promise<boolean>;
}

export function FlashcardFormDialog({ open, onOpenChange, flashcard, onSubmit }: FlashcardFormDialogProps) {
	const [front, setFront] = useState('');
	const [back, setBack] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errors, setErrors] = useState<{ front?: string; back?: string }>({});

	const frontId = useId();
	const backId = useId();

	const isEditMode = !!flashcard;

	// Reset form when dialog opens or flashcard changes
	useEffect(() => {
		if (open) {
			if (flashcard) {
				setFront(flashcard.front);
				setBack(flashcard.back);
			} else {
				setFront('');
				setBack('');
			}
			setErrors({});
		}
	}, [open, flashcard]);

	// Validate form
	const validate = useCallback(() => {
		const newErrors: { front?: string; back?: string } = {};

		if (!front.trim()) {
			newErrors.front = 'Question is required';
		} else if (front.length > 1000) {
			newErrors.front = 'Question must not exceed 1000 characters';
		}

		if (!back.trim()) {
			newErrors.back = 'Answer is required';
		} else if (back.length > 1000) {
			newErrors.back = 'Answer must not exceed 1000 characters';
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	}, [front, back]);

	// Handle form submission
	const handleSubmit = useCallback(async (e: React.FormEvent) => {
		e.preventDefault();

		if (!validate()) {
			return;
		}

		setIsSubmitting(true);

		try {
			const command = isEditMode
				? { front: front.trim(), back: back.trim() } as UpdateFlashcardCommand
				: { front: front.trim(), back: back.trim(), source: 'manual' as const } as CreateFlashcardCommand;

			const success = await onSubmit(command);

			if (success) {
				onOpenChange(false);
			}
		} finally {
			setIsSubmitting(false);
		}
	}, [front, back, isEditMode, onSubmit, onOpenChange, validate]);

	// Handle cancel
	const handleCancel = useCallback(() => {
		onOpenChange(false);
	}, [onOpenChange]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[600px] backdrop-blur-xl bg-gradient-to-b from-slate-900/95 to-slate-800/95 border border-white/10 text-white shadow-2xl">
				<form onSubmit={handleSubmit}>
					<DialogHeader>
						<DialogTitle className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-purple-200">
							{isEditMode ? 'Edit Flashcard' : 'Create New Flashcard'}
						</DialogTitle>
						<DialogDescription className="text-blue-100/80">
							{isEditMode
								? 'Update the question and answer for this flashcard.'
								: 'Create a new flashcard by entering a question and answer.'}
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-4">
						{/* Front (Question) */}
						<div className="space-y-2">
							<Label htmlFor={frontId} className="text-blue-100">
								Question <span className="text-red-400">*</span>
							</Label>
							<Textarea
								id={frontId}
								value={front}
								onChange={(e) => setFront(e.target.value)}
								placeholder="Enter the question..."
								className="min-h-[100px] resize-none bg-white/10 border-white/20 text-white placeholder:text-white/50 backdrop-blur-sm focus:bg-white/15 focus:border-white/40"
								disabled={isSubmitting}
								aria-invalid={!!errors.front}
								aria-describedby={errors.front ? `${frontId}-error` : undefined}
							/>
							<div className="flex items-center justify-between text-sm">
								{errors.front ? (
									<span id={`${frontId}-error`} className="text-red-300">
										{errors.front}
									</span>
								) : (
									<span className="text-blue-200/70">
										{front.length} / 1000 characters
									</span>
								)}
							</div>
						</div>

						{/* Back (Answer) */}
						<div className="space-y-2">
							<Label htmlFor={backId} className="text-blue-100">
								Answer <span className="text-red-400">*</span>
							</Label>
							<Textarea
								id={backId}
								value={back}
								onChange={(e) => setBack(e.target.value)}
								placeholder="Enter the answer..."
								className="min-h-[100px] resize-none bg-white/10 border-white/20 text-white placeholder:text-white/50 backdrop-blur-sm focus:bg-white/15 focus:border-white/40"
								disabled={isSubmitting}
								aria-invalid={!!errors.back}
								aria-describedby={errors.back ? `${backId}-error` : undefined}
							/>
							<div className="flex items-center justify-between text-sm">
								{errors.back ? (
									<span id={`${backId}-error`} className="text-red-300">
										{errors.back}
									</span>
								) : (
									<span className="text-blue-200/70">
										{back.length} / 1000 characters
									</span>
								)}
							</div>
						</div>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={handleCancel}
							disabled={isSubmitting}
							className="border-white/30 bg-white/10 text-blue-100 hover:bg-white/20 hover:text-white disabled:opacity-50"
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={isSubmitting}
							className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
						>
							{isSubmitting ? 'Saving...' : isEditMode ? 'Update' : 'Create'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
