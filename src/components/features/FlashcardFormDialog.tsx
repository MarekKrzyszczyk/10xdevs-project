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
			<DialogContent className="sm:max-w-[600px]">
				<form onSubmit={handleSubmit}>
					<DialogHeader>
						<DialogTitle>{isEditMode ? 'Edit Flashcard' : 'Create New Flashcard'}</DialogTitle>
						<DialogDescription>
							{isEditMode
								? 'Update the question and answer for this flashcard.'
								: 'Create a new flashcard by entering a question and answer.'}
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-4">
						{/* Front (Question) */}
						<div className="space-y-2">
							<Label htmlFor={frontId}>
								Question <span className="text-destructive">*</span>
							</Label>
							<Textarea
								id={frontId}
								value={front}
								onChange={(e) => setFront(e.target.value)}
								placeholder="Enter the question..."
								className="min-h-[100px] resize-none"
								disabled={isSubmitting}
								aria-invalid={!!errors.front}
								aria-describedby={errors.front ? `${frontId}-error` : undefined}
							/>
							<div className="flex items-center justify-between text-sm">
								{errors.front ? (
									<span id={`${frontId}-error`} className="text-destructive">
										{errors.front}
									</span>
								) : (
									<span className="text-muted-foreground">
										{front.length} / 1000 characters
									</span>
								)}
							</div>
						</div>

						{/* Back (Answer) */}
						<div className="space-y-2">
							<Label htmlFor={backId}>
								Answer <span className="text-destructive">*</span>
							</Label>
							<Textarea
								id={backId}
								value={back}
								onChange={(e) => setBack(e.target.value)}
								placeholder="Enter the answer..."
								className="min-h-[100px] resize-none"
								disabled={isSubmitting}
								aria-invalid={!!errors.back}
								aria-describedby={errors.back ? `${backId}-error` : undefined}
							/>
							<div className="flex items-center justify-between text-sm">
								{errors.back ? (
									<span id={`${backId}-error`} className="text-destructive">
										{errors.back}
									</span>
								) : (
									<span className="text-muted-foreground">
										{back.length} / 1000 characters
									</span>
								)}
							</div>
						</div>
					</div>

					<DialogFooter>
						<Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
							Cancel
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting ? 'Saving...' : isEditMode ? 'Update' : 'Create'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
