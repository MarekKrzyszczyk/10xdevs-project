import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
		<div className="min-h-screen bg-background">
			<div className="container mx-auto px-4 py-8">
				<div className="mb-8">
					<h1 className="text-3xl font-bold mb-2">AI Flashcard Generator</h1>
					<p className="text-muted-foreground">
						Generate flashcards from your text using AI
					</p>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					{/* Input Section */}
					<div>
						<Card>
							<CardHeader>
								<CardTitle>Input Text</CardTitle>
								<CardDescription>
									Paste your text here (1,000 - 10,000 characters)
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div>
									<Textarea
										value={text}
										onChange={(e) => setText(e.target.value)}
										placeholder="Paste your text here..."
										className="min-h-[400px] resize-none"
										disabled={isLoading}
									/>
									<div className="mt-2 flex items-center justify-between text-sm">
										<span
											className={
												textLength < 1000
													? 'text-muted-foreground'
													: textLength > 10000
														? 'text-destructive'
														: 'text-green-600'
											}
										>
											{textLength.toLocaleString()} / 10,000 characters
										</span>
										{!isTextValid && textLength > 0 && (
											<span className="text-destructive">
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
									className="w-full"
									size="lg"
								>
									{isLoading ? 'Generating...' : 'Generate Flashcards'}
								</Button>
							</CardContent>
						</Card>
					</div>

					{/* Suggestions Section */}
					<div>
						<Card>
							<CardHeader>
								<CardTitle>Generated Suggestions</CardTitle>
								<CardDescription>
									Review, edit, and select flashcards to save
								</CardDescription>
							</CardHeader>
							<CardContent>
								{error && (
									<div className="p-4 mb-4 bg-destructive/10 border border-destructive rounded-lg text-destructive">
										{error}
									</div>
								)}

								{isLoading && (
									<div className="flex items-center justify-center py-12">
										<div className="text-center">
											<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
											<p className="text-muted-foreground">Generating flashcards...</p>
										</div>
									</div>
								)}

								{!isLoading && suggestions.length === 0 && !error && (
									<div className="text-center py-12">
										<p className="text-muted-foreground">
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

										<div className="pt-4 border-t">
											<Button
												onClick={handleSaveSelected}
												disabled={!hasSelectedSuggestions}
												className="w-full"
												size="lg"
											>
												Save Selected ({suggestions.filter((s) => s.isSelected).length})
											</Button>
										</div>
									</div>
								)}
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
}
