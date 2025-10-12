import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useFlashcards } from '@/components/hooks/useFlashcards';
import { FlashcardFormDialog } from '@/components/features/FlashcardFormDialog';
import { DeleteFlashcardDialog } from '@/components/features/DeleteFlashcardDialog';
import type { FlashcardDTO } from '@/types';

export default function MyFlashcardsView() {
	const {
		flashcards,
		isLoading,
		error,
		page,
		total,
		totalPages,
		nextPage,
		previousPage,
		createFlashcard,
		updateFlashcard,
		deleteFlashcard,
	} = useFlashcards();

	// Dialog state
	const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [selectedFlashcard, setSelectedFlashcard] = useState<FlashcardDTO | null>(null);

	// Handle create new flashcard
	const handleCreateClick = useCallback(() => {
		setSelectedFlashcard(null);
		setIsFormDialogOpen(true);
	}, []);

	// Handle edit flashcard
	const handleEditClick = useCallback((flashcard: FlashcardDTO) => {
		setSelectedFlashcard(flashcard);
		setIsFormDialogOpen(true);
	}, []);

	// Handle delete flashcard
	const handleDeleteClick = useCallback((flashcard: FlashcardDTO) => {
		setSelectedFlashcard(flashcard);
		setIsDeleteDialogOpen(true);
	}, []);

	// Handle form submit
	const handleFormSubmit = useCallback(async (command: any) => {
		if (selectedFlashcard) {
			// Edit mode
			return await updateFlashcard(selectedFlashcard.id, command);
		} else {
			// Create mode
			return await createFlashcard(command);
		}
	}, [selectedFlashcard, createFlashcard, updateFlashcard]);

	// Handle delete confirm
	const handleDeleteConfirm = useCallback(async (id: string) => {
		return await deleteFlashcard(id);
	}, [deleteFlashcard]);

	return (
		<div className="min-h-screen bg-background">
			<div className="container mx-auto px-4 py-8">
				{/* Header */}
				<div className="flex items-center justify-between mb-8">
					<div>
						<h1 className="text-3xl font-bold mb-2">My Flashcards</h1>
						<p className="text-muted-foreground">
							Manage and review your flashcard collection
						</p>
					</div>
					<Button size="lg" onClick={handleCreateClick}>
						New Flashcard
					</Button>
				</div>

				{/* Error State */}
				{error && (
					<div className="p-4 mb-6 bg-destructive/10 border border-destructive rounded-lg text-destructive">
						{error}
					</div>
				)}

				{/* Loading State */}
				{isLoading && (
					<div className="flex items-center justify-center py-12">
						<div className="text-center">
							<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
							<p className="text-muted-foreground">Loading flashcards...</p>
						</div>
					</div>
				)}

				{/* Empty State */}
				{!isLoading && flashcards.length === 0 && !error && (
					<div className="text-center py-12">
						<Card>
							<CardContent className="pt-12 pb-12">
								<div className="max-w-md mx-auto">
									<h3 className="text-xl font-semibold mb-2">No flashcards yet</h3>
									<p className="text-muted-foreground mb-6">
										Create your first flashcard to start learning!
									</p>
									<Button size="lg" onClick={handleCreateClick}>
										Create Flashcard
									</Button>
								</div>
							</CardContent>
						</Card>
					</div>
				)}

				{/* Flashcard List */}
				{!isLoading && flashcards.length > 0 && (
					<div>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
							{flashcards.map((flashcard) => (
								<Card key={flashcard.id} className="hover:shadow-lg transition-shadow">
									<CardContent className="pt-6">
										<div className="space-y-4">
											<div>
												<div className="text-sm font-medium text-muted-foreground mb-1">
													Question
												</div>
												<div className="text-base font-medium">
													{flashcard.front}
												</div>
											</div>
											<div>
												<div className="text-sm font-medium text-muted-foreground mb-1">
													Answer
												</div>
												<div className="text-base">
													{flashcard.back}
												</div>
											</div>
											<div className="flex items-center justify-between pt-2 border-t">
												<span className="text-xs text-muted-foreground capitalize">
													{flashcard.source.replace('_', ' ')}
												</span>
												<div className="flex gap-2">
													<Button
														variant="outline"
														size="sm"
														onClick={() => handleEditClick(flashcard)}
													>
														Edit
													</Button>
													<Button
														variant="outline"
														size="sm"
														onClick={() => handleDeleteClick(flashcard)}
													>
														Delete
													</Button>
												</div>
											</div>
										</div>
									</CardContent>
								</Card>
							))}
						</div>

						{/* Pagination */}
						{totalPages > 1 && (
							<div className="flex items-center justify-between">
								<div className="text-sm text-muted-foreground">
									Page {page} of {totalPages} ({total} total flashcards)
								</div>
								<div className="flex gap-2">
									<Button
										variant="outline"
										onClick={previousPage}
										disabled={page === 1}
									>
										Previous
									</Button>
									<Button
										variant="outline"
										onClick={nextPage}
										disabled={page === totalPages}
									>
										Next
									</Button>
								</div>
							</div>
						)}
					</div>
				)}
			</div>

			{/* Dialogs */}
			<FlashcardFormDialog
				open={isFormDialogOpen}
				onOpenChange={setIsFormDialogOpen}
				flashcard={selectedFlashcard}
				onSubmit={handleFormSubmit}
			/>
			<DeleteFlashcardDialog
				open={isDeleteDialogOpen}
				onOpenChange={setIsDeleteDialogOpen}
				flashcard={selectedFlashcard}
				onConfirm={handleDeleteConfirm}
			/>
		</div>
	);
}
