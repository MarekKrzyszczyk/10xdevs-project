import {beforeEach, describe, expect, it, vi} from 'vitest';
import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {FlashcardFormDialog} from '../FlashcardFormDialog';
import type {CreateFlashcardCommand, FlashcardDTO, UpdateFlashcardCommand} from '@/types';

describe('FlashcardFormDialog', () => {
    const mockFlashcard: FlashcardDTO = {
        id: 'test-id-123',
        front: 'What is React?',
        back: 'A JavaScript library for building user interfaces',
        source: 'manual',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
    };

    const defaultProps = {
        open: true,
        onOpenChange: vi.fn(),
        onSubmit: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('prefills fields in edit mode', () => {
        it('should populate form fields with flashcard data when in edit mode', () => {
            render(<FlashcardFormDialog {...defaultProps} flashcard={mockFlashcard}/>);

            // Verify edit mode title
            expect(screen.getByText('Edit Flashcard')).toBeInTheDocument();
            expect(screen.getByText('Update the question and answer for this flashcard.')).toBeInTheDocument();

            // Verify form fields are prefilled
            const questionTextarea = screen.getByPlaceholderText('Enter the question...') as HTMLTextAreaElement;
            const answerTextarea = screen.getByPlaceholderText('Enter the answer...') as HTMLTextAreaElement;

            expect(questionTextarea.value).toBe('What is React?');
            expect(answerTextarea.value).toBe('A JavaScript library for building user interfaces');

            // Verify button text
            expect(screen.getByRole('button', {name: 'Update'})).toBeInTheDocument();
        });
    });

    describe('submits trimmed values in create mode', () => {
        it('should submit CreateFlashcardCommand with trimmed values and source: manual', async () => {
            const user = userEvent.setup();
            const mockOnSubmit = vi.fn().mockResolvedValue(true);

            render(<FlashcardFormDialog {...defaultProps} onSubmit={mockOnSubmit}/>);

            // Verify create mode title
            expect(screen.getByText('Create New Flashcard')).toBeInTheDocument();
            expect(
                screen.getByText('Create a new flashcard by entering a question and answer.')
            ).toBeInTheDocument();

            // Enter values with extra whitespace
            const questionTextarea = screen.getByPlaceholderText('Enter the question...');
            const answerTextarea = screen.getByPlaceholderText('Enter the answer...');

            await user.type(questionTextarea, '  What is TypeScript?  ');
            await user.type(answerTextarea, '  A typed superset of JavaScript  ');

            // Submit form
            const createButton = screen.getByRole('button', {name: 'Create'});
            await user.click(createButton);

            // Verify onSubmit was called with trimmed values and source: 'manual'
            await waitFor(() => {
                expect(mockOnSubmit).toHaveBeenCalledWith({
                    front: 'What is TypeScript?',
                    back: 'A typed superset of JavaScript',
                    source: 'manual',
                } as CreateFlashcardCommand);
            });
        });

        it('should show correct button text in create mode', () => {
            render(<FlashcardFormDialog {...defaultProps} />);

            expect(screen.getByRole('button', {name: 'Create'})).toBeInTheDocument();
            expect(screen.queryByRole('button', {name: 'Update'})).not.toBeInTheDocument();
        });
    });

    describe('validates empty fields', () => {
        it('should show error messages when submitting empty form', async () => {
            const user = userEvent.setup();
            const mockOnSubmit = vi.fn();

            render(<FlashcardFormDialog {...defaultProps} onSubmit={mockOnSubmit}/>);

            const createButton = screen.getByRole('button', {name: 'Create'});
            await user.click(createButton);

            // Error messages should appear
            await waitFor(() => {
                expect(screen.getByText('Question is required')).toBeInTheDocument();
                expect(screen.getByText('Answer is required')).toBeInTheDocument();
            });

            // onSubmit should not be called
            expect(mockOnSubmit).not.toHaveBeenCalled();
        });

        it('should show error when only whitespace is entered', async () => {
            const user = userEvent.setup();
            const mockOnSubmit = vi.fn();

            render(<FlashcardFormDialog {...defaultProps} onSubmit={mockOnSubmit}/>);

            const questionTextarea = screen.getByPlaceholderText('Enter the question...');
            const answerTextarea = screen.getByPlaceholderText('Enter the answer...');

            // Enter only whitespace
            await user.type(questionTextarea, '   ');
            await user.type(answerTextarea, '   ');

            const createButton = screen.getByRole('button', {name: 'Create'});
            await user.click(createButton);

            // Error messages should appear for empty trimmed values
            await waitFor(() => {
                expect(screen.getByText('Question is required')).toBeInTheDocument();
                expect(screen.getByText('Answer is required')).toBeInTheDocument();
            });

            expect(mockOnSubmit).not.toHaveBeenCalled();
        });

        it('should show error when only question is filled', async () => {
            const user = userEvent.setup();
            const mockOnSubmit = vi.fn();

            render(<FlashcardFormDialog {...defaultProps} onSubmit={mockOnSubmit}/>);

            const questionTextarea = screen.getByPlaceholderText('Enter the question...');
            await user.type(questionTextarea, 'What is React?');

            const createButton = screen.getByRole('button', {name: 'Create'});
            await user.click(createButton);

            await waitFor(() => {
                expect(screen.getByText('Answer is required')).toBeInTheDocument();
            });

            // Question error should not be shown
            expect(screen.queryByText('Question is required')).not.toBeInTheDocument();
            expect(mockOnSubmit).not.toHaveBeenCalled();
        });
    });

    describe('closes dialog on successful submit', () => {
        it('should close dialog and reset form when submit succeeds', async () => {
            const user = userEvent.setup();
            const mockOnSubmit = vi.fn().mockResolvedValue(true);
            const mockOnOpenChange = vi.fn();

            render(
                <FlashcardFormDialog
                    {...defaultProps}
                    onSubmit={mockOnSubmit}
                    onOpenChange={mockOnOpenChange}
                />
            );

            const questionTextarea = screen.getByPlaceholderText('Enter the question...');
            const answerTextarea = screen.getByPlaceholderText('Enter the answer...');

            await user.type(questionTextarea, 'What is Vitest?');
            await user.type(answerTextarea, 'A blazing fast unit test framework');

            const createButton = screen.getByRole('button', {name: 'Create'});
            await user.click(createButton);

            await waitFor(() => {
                expect(mockOnSubmit).toHaveBeenCalled();
                expect(mockOnOpenChange).toHaveBeenCalledWith(false);
            });
        });
    });

    describe('leaves dialog open when submit fails', () => {
        it('should keep dialog open when onSubmit returns false', async () => {
            const user = userEvent.setup();
            const mockOnSubmit = vi.fn().mockResolvedValue(false);
            const mockOnOpenChange = vi.fn();

            render(
                <FlashcardFormDialog
                    {...defaultProps}
                    onSubmit={mockOnSubmit}
                    onOpenChange={mockOnOpenChange}
                />
            );

            const questionTextarea = screen.getByPlaceholderText('Enter the question...');
            const answerTextarea = screen.getByPlaceholderText('Enter the answer...');

            await user.type(questionTextarea, 'Question');
            await user.type(answerTextarea, 'Answer');

            const createButton = screen.getByRole('button', {name: 'Create'});
            await user.click(createButton);

            await waitFor(() => {
                expect(mockOnSubmit).toHaveBeenCalled();
            });

            // Dialog should remain open
            expect(mockOnOpenChange).not.toHaveBeenCalledWith(false);

            // Loading state should be cleared
            await waitFor(() => {
                expect(screen.getByRole('button', {name: 'Create'})).toBeInTheDocument();
                expect(screen.getByRole('button', {name: 'Create'})).not.toBeDisabled();
            });
        });

        it('should clear errors even when submit fails', async () => {
            const user = userEvent.setup();
            const mockOnSubmit = vi.fn().mockResolvedValue(false);

            render(<FlashcardFormDialog {...defaultProps} onSubmit={mockOnSubmit}/>);

            // First, trigger validation errors
            const createButton = screen.getByRole('button', {name: 'Create'});
            await user.click(createButton);

            await waitFor(() => {
                expect(screen.getByText('Question is required')).toBeInTheDocument();
            });

            // Now fill in the fields
            const questionTextarea = screen.getByPlaceholderText('Enter the question...');
            const answerTextarea = screen.getByPlaceholderText('Enter the answer...');

            await user.type(questionTextarea, 'Question');
            await user.type(answerTextarea, 'Answer');

            // Submit again (this time will call onSubmit which returns false)
            await user.click(createButton);

            await waitFor(() => {
                expect(mockOnSubmit).toHaveBeenCalled();
            });

            // Errors should not be shown
            expect(screen.queryByText('Question is required')).not.toBeInTheDocument();
        });
    });

    describe('resets form when reopened', () => {
        it('should clear previous input when reopened in create mode', async () => {
            const user = userEvent.setup();

            const {rerender} = render(<FlashcardFormDialog {...defaultProps} open={true}/>);

            const questionTextarea = screen.getByPlaceholderText('Enter the question...');
            const answerTextarea = screen.getByPlaceholderText('Enter the answer...');

            // Type some values
            await user.type(questionTextarea, 'Previous question');
            await user.type(answerTextarea, 'Previous answer');

            // Close dialog
            rerender(<FlashcardFormDialog {...defaultProps} open={false}/>);

            // Reopen dialog
            rerender(<FlashcardFormDialog {...defaultProps} open={true} flashcard={null}/>);

            // Fields should be empty
            await waitFor(() => {
                const newQuestionTextarea = screen.getByPlaceholderText(
                    'Enter the question...'
                ) as HTMLTextAreaElement;
                const newAnswerTextarea = screen.getByPlaceholderText(
                    'Enter the answer...'
                ) as HTMLTextAreaElement;

                expect(newQuestionTextarea.value).toBe('');
                expect(newAnswerTextarea.value).toBe('');
            });
        });

        it('should reset error state when reopened', async () => {
            const user = userEvent.setup();

            const {rerender} = render(<FlashcardFormDialog {...defaultProps} open={true}/>);

            // Trigger validation errors
            const createButton = screen.getByRole('button', {name: 'Create'});
            await user.click(createButton);

            await waitFor(() => {
                expect(screen.getByText('Question is required')).toBeInTheDocument();
            });

            // Close dialog
            rerender(<FlashcardFormDialog {...defaultProps} open={false}/>);

            // Reopen dialog
            rerender(<FlashcardFormDialog {...defaultProps} open={true}/>);

            // Errors should be cleared
            await waitFor(() => {
                expect(screen.queryByText('Question is required')).not.toBeInTheDocument();
                expect(screen.queryByText('Answer is required')).not.toBeInTheDocument();
            });
        });

        it('should prefill with new flashcard data when switching to edit mode', async () => {
            const newFlashcard: FlashcardDTO = {
                id: 'new-id',
                front: 'New question',
                back: 'New answer',
                source: 'manual',
                created_at: '2025-01-01T00:00:00Z',
                updated_at: '2025-01-01T00:00:00Z',
            };

            const {rerender} = render(
                <FlashcardFormDialog {...defaultProps} open={true} flashcard={mockFlashcard}/>
            );

            // Verify initial flashcard data
            expect(
                (screen.getByPlaceholderText('Enter the question...') as HTMLTextAreaElement).value
            ).toBe('What is React?');

            // Switch to different flashcard
            rerender(<FlashcardFormDialog {...defaultProps} open={true} flashcard={newFlashcard}/>);

            // Verify new flashcard data
            await waitFor(() => {
                expect(
                    (screen.getByPlaceholderText('Enter the question...') as HTMLTextAreaElement).value
                ).toBe('New question');
                expect(
                    (screen.getByPlaceholderText('Enter the answer...') as HTMLTextAreaElement).value
                ).toBe('New answer');
            });
        });
    });

    describe('form submission in edit mode', () => {
        it('should submit UpdateFlashcardCommand without source field', async () => {
            const user = userEvent.setup();
            const mockOnSubmit = vi.fn().mockResolvedValue(true);

            render(<FlashcardFormDialog {...defaultProps} flashcard={mockFlashcard} onSubmit={mockOnSubmit}/>);

            const questionTextarea = screen.getByPlaceholderText('Enter the question...');
            const answerTextarea = screen.getByPlaceholderText('Enter the answer...');

            // Clear and type new values
            await user.clear(questionTextarea);
            await user.clear(answerTextarea);
            await user.type(questionTextarea, '  Updated question  ');
            await user.type(answerTextarea, '  Updated answer  ');

            const updateButton = screen.getByRole('button', {name: 'Update'});
            await user.click(updateButton);

            await waitFor(() => {
                expect(mockOnSubmit).toHaveBeenCalledWith({
                    front: 'Updated question',
                    back: 'Updated answer',
                } as UpdateFlashcardCommand);
            });

            // Verify source field is not included
            expect(mockOnSubmit).not.toHaveBeenCalledWith(
                expect.objectContaining({source: expect.anything()})
            );
        });
    });

    describe('disables form during submission', () => {
        it('should disable textareas and buttons during submission', async () => {
            const user = userEvent.setup();
            let resolveSubmit: (value: boolean) => void;
            const mockOnSubmit = vi.fn(
                () =>
                    new Promise<boolean>((resolve) => {
                        resolveSubmit = resolve;
                    })
            );

            render(<FlashcardFormDialog {...defaultProps} onSubmit={mockOnSubmit}/>);

            const questionTextarea = screen.getByPlaceholderText('Enter the question...');
            const answerTextarea = screen.getByPlaceholderText('Enter the answer...');

            await user.type(questionTextarea, 'Question');
            await user.type(answerTextarea, 'Answer');

            const createButton = screen.getByRole('button', {name: 'Create'});
            await user.click(createButton);

            // Check loading state
            await waitFor(() => {
                expect(screen.getByRole('button', {name: 'Saving...'})).toBeInTheDocument();
            });

            // Verify form elements are disabled
            expect(screen.getByPlaceholderText('Enter the question...')).toBeDisabled();
            expect(screen.getByPlaceholderText('Enter the answer...')).toBeDisabled();
            expect(screen.getByRole('button', {name: 'Saving...'})).toBeDisabled();
            expect(screen.getByRole('button', {name: 'Cancel'})).toBeDisabled();

            // Resolve to clean up
            resolveSubmit!(true);
        });
    });
});
