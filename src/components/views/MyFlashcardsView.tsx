import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
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
		<div className="relative w-full mx-auto min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 p-4 sm:p-8">
			<div className="container mx-auto">
				{/* Header */}
				<div className="flex items-center justify-between mb-8">
					<div className="text-center flex-1">
						<h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 text-transparent bg-clip-text drop-shadow-lg">
							My Flashcards
						</h1>
						<p className="text-blue-100/90 drop-shadow-md">
							Manage and review your flashcard collection
						</p>
					</div>
					<Button
						size="lg"
						onClick={handleCreateClick}
						className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all"
					>
						New Flashcard
					</Button>
				</div>

				{/* Error State */}
				{error && (
					<div className="p-4 mb-6 bg-red-500/20 border border-red-400/50 rounded-lg text-red-100 backdrop-blur-sm">
						{error}
					</div>
				)}

				{/* Loading State */}
				{isLoading && (
					<div className="flex items-center justify-center py-12">
						<div className="text-center">
							<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-300 mx-auto mb-4" />
							<p className="text-blue-100/90">Loading flashcards...</p>
						</div>
					</div>
				)}

				{/* Empty State */}
				{!isLoading && flashcards.length === 0 && !error && (
					<div className="text-center py-12">
						<div className="backdrop-blur-xl bg-gradient-to-b from-white/10 to-white/5 rounded-2xl shadow-2xl p-12 border border-white/10">
							<div className="max-w-md mx-auto">
								<h3 className="text-xl font-semibold mb-2 text-blue-100">No flashcards yet</h3>
								<p className="text-blue-100/80 mb-6">
									Create your first flashcard to start learning!
								</p>
								<Button
									size="lg"
									onClick={handleCreateClick}
									className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all"
								>
									Create Flashcard
								</Button>
							</div>
						</div>
					</div>
				)}

				{/* Flashcard List */}
				{!isLoading && flashcards.length > 0 && (
					<div>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
							{flashcards.map((flashcard) => (
								<div
									key={flashcard.id}
									className="backdrop-blur-xl bg-gradient-to-b from-white/10 to-white/5 rounded-2xl shadow-2xl p-6 border border-white/10 hover:shadow-[0_20px_50px_rgba(139,92,246,0.3)] transition-shadow"
								>
									<div className="space-y-4">
										<div>
											<div className="text-sm font-medium text-blue-200/70 mb-1">
												Question
											</div>
											<div className="text-base font-medium text-white">
												{flashcard.front}
											</div>
										</div>
										<div>
											<div className="text-sm font-medium text-blue-200/70 mb-1">
												Answer
											</div>
											<div className="text-base text-blue-100/90">
												{flashcard.back}
											</div>
										</div>
										<div className="flex items-center justify-between pt-2 border-t border-white/20">
											<span className="text-xs text-blue-200/60 capitalize">
												{flashcard.source.replace('_', ' ')}
											</span>
											<div className="flex gap-2">
												<Button
													variant="outline"
													size="sm"
													onClick={() => handleEditClick(flashcard)}
													className="border-white/30 bg-white/10 text-blue-100 hover:bg-white/20 hover:text-white"
												>
													Edit
												</Button>
												<Button
													variant="outline"
													size="sm"
													onClick={() => handleDeleteClick(flashcard)}
													className="border-white/30 bg-white/10 text-blue-100 hover:bg-white/20 hover:text-white"
												>
													Delete
												</Button>
											</div>
										</div>
									</div>
								</div>
							))}
						</div>

						{/* Pagination */}
						{totalPages > 1 && (
							<div className="flex items-center justify-between backdrop-blur-xl bg-gradient-to-b from-white/10 to-white/5 rounded-2xl shadow-2xl p-4 border border-white/10">
								<div className="text-sm text-blue-100/90">
									Page {page} of {totalPages} ({total} total flashcards)
								</div>
								<div className="flex gap-2">
									<Button
										variant="outline"
										onClick={previousPage}
										disabled={page === 1}
										className="border-white/30 bg-white/10 text-blue-100 hover:bg-white/20 hover:text-white disabled:opacity-50"
									>
										Previous
									</Button>
									<Button
										variant="outline"
										onClick={nextPage}
										disabled={page === totalPages}
										className="border-white/30 bg-white/10 text-blue-100 hover:bg-white/20 hover:text-white disabled:opacity-50"
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
