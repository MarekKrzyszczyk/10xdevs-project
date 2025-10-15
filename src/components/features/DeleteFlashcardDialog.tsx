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
			<AlertDialogContent className="backdrop-blur-xl bg-gradient-to-b from-slate-900/95 to-slate-800/95 border border-white/10 text-white shadow-2xl">
				<AlertDialogHeader>
					<AlertDialogTitle className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-purple-200">
						Delete Flashcard
					</AlertDialogTitle>
					<AlertDialogDescription className="text-blue-100/80">
						Are you sure you want to delete this flashcard? This action cannot be undone.
					</AlertDialogDescription>
				</AlertDialogHeader>

				<div className="my-4 p-4 bg-white/5 backdrop-blur-sm rounded-lg space-y-2 border border-white/10">
					<div>
						<div className="text-sm font-medium text-blue-200/70 mb-1">Question</div>
						<div className="text-sm text-white">{truncate(flashcard.front)}</div>
					</div>
					<div>
						<div className="text-sm font-medium text-blue-200/70 mb-1">Answer</div>
						<div className="text-sm text-blue-100/90">{truncate(flashcard.back)}</div>
					</div>
				</div>

				<AlertDialogFooter>
					<AlertDialogCancel
						onClick={handleCancel}
						disabled={isDeleting}
						className="border-white/30 bg-white/10 text-blue-100 hover:bg-white/20 hover:text-white disabled:opacity-50"
					>
						Cancel
					</AlertDialogCancel>
					<AlertDialogAction
						onClick={handleConfirm}
						disabled={isDeleting}
						className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
					>
						{isDeleting ? 'Deleting...' : 'Delete'}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
