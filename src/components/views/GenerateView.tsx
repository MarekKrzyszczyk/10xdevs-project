import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useGenerateFlashcards } from '@/components/hooks/useGenerateFlashcards';
import { FlashcardSuggestionItem } from '@/components/features/FlashcardSuggestionItem';

export default function GenerateView() {
	const {
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
	} = useGenerateFlashcards();

	const textLength = text.length;
	const isTextValid = textLength >= 1000 && textLength <= 10000;
	const canGenerate = isTextValid && !isLoading;
	const hasSelectedSuggestions = suggestions.some((s) => s.isSelected);

	return (
		<div className="relative w-full mx-auto min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 p-4 sm:p-8">
			<div className="container mx-auto">
				<div className="mb-8 text-center">
					<h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 text-transparent bg-clip-text drop-shadow-lg">
						AI Flashcard Generator
					</h1>
					<p className="text-blue-100/90 drop-shadow-md">
						Generate flashcards from your text using AI
					</p>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					{/* Input Section */}
					<div>
						<div className="backdrop-blur-xl bg-gradient-to-b from-white/10 to-white/5 rounded-2xl shadow-2xl p-6 border border-white/10">
							<div className="mb-4">
								<h2 className="text-xl font-semibold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-purple-200">
									Input Text
								</h2>
								<p className="text-blue-200/80 text-sm">
									Paste your text here (1,000 - 10,000 characters)
								</p>
							</div>
							<div className="space-y-4">
								<div>
									<Textarea
										value={text}
										onChange={(e) => setText(e.target.value)}
										placeholder="Paste your text here..."
										className="min-h-[400px] resize-none bg-white/10 border-white/20 text-white placeholder:text-white/50 backdrop-blur-sm focus:bg-white/15 focus:border-white/40"
										disabled={isLoading}
									/>
									<div className="mt-2 flex items-center justify-between text-sm">
										<span
											className={
												textLength < 1000
													? 'text-blue-200/70'
													: textLength > 10000
														? 'text-red-300'
														: 'text-green-300'
											}
										>
											{textLength.toLocaleString()} / 10,000 characters
										</span>
										{!isTextValid && textLength > 0 && (
											<span className="text-red-300">
												{textLength < 1000
													? `${(1000 - textLength).toLocaleString()} more needed`
													: 'Text too long'}
											</span>
										)}
									</div>
								</div>
								<Button
									onClick={handleGenerate}
									disabled={!canGenerate}
									className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all"
									size="lg"
								>
									{isLoading ? 'Generating...' : 'Generate Flashcards'}
								</Button>
							</div>
						</div>
					</div>

					{/* Suggestions Section */}
					<div>
						<div className="backdrop-blur-xl bg-gradient-to-b from-white/10 to-white/5 rounded-2xl shadow-2xl p-6 border border-white/10">
							<div className="mb-4">
								<h2 className="text-xl font-semibold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-purple-200">
									Generated Suggestions
								</h2>
								<p className="text-blue-200/80 text-sm">
									Review, edit, and select flashcards to save
								</p>
							</div>
							<div>
								{error && (
									<div className="p-4 mb-4 bg-red-500/20 border border-red-400/50 rounded-lg text-red-100 backdrop-blur-sm">
										{error}
									</div>
								)}

								{isLoading && (
									<div className="flex items-center justify-center py-12">
										<div className="text-center">
											<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-300 mx-auto mb-4" />
											<p className="text-blue-100/90">Generating flashcards...</p>
										</div>
									</div>
								)}

								{!isLoading && suggestions.length === 0 && !error && (
									<div className="text-center py-12">
										<p className="text-blue-100/80">
											No suggestions yet. Paste your text and click "Generate Flashcards"
											to get started.
										</p>
									</div>
								)}

								{!isLoading && suggestions.length > 0 && (
									<div className="space-y-4">
										<div className="max-h-[500px] overflow-y-auto space-y-3 pr-2">
											{suggestions.map((suggestion) => (
												<FlashcardSuggestionItem
													key={suggestion.id}
													suggestion={suggestion}
													onUpdate={handleUpdateSuggestion}
													onToggleSelect={handleToggleSelect}
													onRemove={handleRemoveSuggestion}
												/>
											))}
										</div>

										<div className="pt-4 border-t border-white/20">
											<Button
												onClick={handleSaveSelected}
												disabled={!hasSelectedSuggestions}
												className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all"
												size="lg"
											>
												Save Selected ({suggestions.filter((s) => s.isSelected).length})
											</Button>
										</div>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
