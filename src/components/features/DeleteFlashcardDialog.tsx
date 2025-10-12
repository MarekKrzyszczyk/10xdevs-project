import React, { useState, useCallback } from 'react';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { FlashcardDTO } from '@/types';

interface DeleteFlashcardDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	flashcard: FlashcardDTO | null;
	onConfirm: (id: string) => Promise<boolean>;
}

export function DeleteFlashcardDialog({ open, onOpenChange, flashcard, onConfirm }: DeleteFlashcardDialogProps) {
	const [isDeleting, setIsDeleting] = useState(false);

	const handleConfirm = useCallback(async () => {
		if (!flashcard) return;

		setIsDeleting(true);

		try {
			const success = await onConfirm(flashcard.id);
			if (success) {
				onOpenChange(false);
			}
		} finally {
			setIsDeleting(false);
		}
	}, [flashcard, onConfirm, onOpenChange]);

	const handleCancel = useCallback(() => {
		if (!isDeleting) {
			onOpenChange(false);
		}
	}, [isDeleting, onOpenChange]);

	if (!flashcard) {
		return null;
	}

	// Truncate text for preview
	const truncate = (text: string, maxLength: number = 100) => {
		if (text.length <= maxLength) return text;
		return text.substring(0, maxLength) + '...';
	};

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete Flashcard</AlertDialogTitle>
					<AlertDialogDescription>
						Are you sure you want to delete this flashcard? This action cannot be undone.
					</AlertDialogDescription>
				</AlertDialogHeader>

				<div className="my-4 p-4 bg-muted rounded-lg space-y-2">
					<div>
						<div className="text-sm font-medium text-muted-foreground mb-1">Question</div>
						<div className="text-sm">{truncate(flashcard.front)}</div>
					</div>
					<div>
						<div className="text-sm font-medium text-muted-foreground mb-1">Answer</div>
						<div className="text-sm">{truncate(flashcard.back)}</div>
					</div>
				</div>

				<AlertDialogFooter>
					<AlertDialogCancel onClick={handleCancel} disabled={isDeleting}>
						Cancel
					</AlertDialogCancel>
					<AlertDialogAction
						onClick={handleConfirm}
						disabled={isDeleting}
						className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
					>
						{isDeleting ? 'Deleting...' : 'Delete'}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
