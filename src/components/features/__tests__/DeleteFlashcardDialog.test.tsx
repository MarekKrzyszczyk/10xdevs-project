import {beforeEach, describe, expect, it, vi} from 'vitest';
import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {DeleteFlashcardDialog} from '../DeleteFlashcardDialog';
import type {FlashcardDTO} from '@/types';

describe('DeleteFlashcardDialog', () => {
    const mockFlashcard: FlashcardDTO = {
        id: 'test-id-123',
        front: 'What is TypeScript?',
        back: 'A typed superset of JavaScript',
        source: 'manual',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
    };

    const mockFlashcardWithLongText: FlashcardDTO = {
        id: 'test-id-456',
        front: 'A'.repeat(150), // 150 characters
        back: 'B'.repeat(150), // 150 characters
        source: 'manual',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
    };

    const defaultProps = {
        open: true,
        onOpenChange: vi.fn(),
        flashcard: mockFlashcard,
        onConfirm: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('renders preview when flashcard provided', () => {
        it('should display truncated question and answer text', () => {
            render(<DeleteFlashcardDialog {...defaultProps} flashcard={mockFlashcard}/>);

            // Verify dialog title and description
            expect(screen.getByText('Delete Flashcard')).toBeInTheDocument();
            expect(
                screen.getByText('Are you sure you want to delete this flashcard? This action cannot be undone.')
            ).toBeInTheDocument();

            // Verify preview labels
            expect(screen.getByText('Question')).toBeInTheDocument();
            expect(screen.getByText('Answer')).toBeInTheDocument();

            // Verify flashcard content is displayed
            expect(screen.getByText('What is TypeScript?')).toBeInTheDocument();
            expect(screen.getByText('A typed superset of JavaScript')).toBeInTheDocument();
        });

        it('should truncate long text with ellipsis after 100 characters', () => {
            render(<DeleteFlashcardDialog {...defaultProps} flashcard={mockFlashcardWithLongText}/>);

            // Text should be truncated at 100 chars plus "..."
            const expectedFront = 'A'.repeat(100) + '...';
            const expectedBack = 'B'.repeat(100) + '...';

            expect(screen.getByText(expectedFront)).toBeInTheDocument();
            expect(screen.getByText(expectedBack)).toBeInTheDocument();
        });

        it('should not truncate text under 100 characters', () => {
            const shortFlashcard: FlashcardDTO = {
                ...mockFlashcard,
                front: 'Short question',
                back: 'Short answer',
            };

            render(<DeleteFlashcardDialog {...defaultProps} flashcard={shortFlashcard}/>);

            expect(screen.getByText('Short question')).toBeInTheDocument();
            expect(screen.getByText('Short answer')).toBeInTheDocument();
        });
    });

    describe('invokes onConfirm with id and closes on success', () => {
        it('should call onConfirm with flashcard id and close dialog when confirmed', async () => {
            const user = userEvent.setup();
            const mockOnConfirm = vi.fn().mockResolvedValue(true);
            const mockOnOpenChange = vi.fn();

            render(
                <DeleteFlashcardDialog
                    {...defaultProps}
                    onConfirm={mockOnConfirm}
                    onOpenChange={mockOnOpenChange}
                />
            );

            const deleteButton = screen.getByRole('button', {name: 'Delete'});
            await user.click(deleteButton);

            await waitFor(() => {
                expect(mockOnConfirm).toHaveBeenCalledWith('test-id-123');
                expect(mockOnConfirm).toHaveBeenCalledTimes(1);
            });

            await waitFor(() => {
                expect(mockOnOpenChange).toHaveBeenCalledWith(false);
            });
        });
    });

    describe('disables actions during deletion', () => {
        it('should show loading state and disable buttons during deletion', async () => {
            const user = userEvent.setup();
            let resolveConfirm: (value: boolean) => void;
            const mockOnConfirm = vi.fn(
                () =>
                    new Promise<boolean>((resolve) => {
                        resolveConfirm = resolve;
                    })
            );

            render(<DeleteFlashcardDialog {...defaultProps} onConfirm={mockOnConfirm}/>);

            const deleteButton = screen.getByRole('button', {name: 'Delete'});
            const cancelButton = screen.getByRole('button', {name: 'Cancel'});

            // Click delete button
            await user.click(deleteButton);

            // Check loading state
            await waitFor(() => {
                expect(screen.getByRole('button', {name: 'Deleting...'})).toBeInTheDocument();
            });

            // Verify both buttons are disabled
            expect(screen.getByRole('button', {name: 'Deleting...'})).toBeDisabled();
            expect(cancelButton).toBeDisabled();

            // Resolve the promise to clean up
            resolveConfirm!(true);

            // Wait for loading state to clear
            await waitFor(() => {
                expect(screen.queryByRole('button', {name: 'Deleting...'})).not.toBeInTheDocument();
            });
        });
    });

    describe('Cancel button respects isDeleting lock', () => {
        it('should allow cancel to close dialog when not deleting', async () => {
            const user = userEvent.setup();
            const mockOnOpenChange = vi.fn();

            render(<DeleteFlashcardDialog {...defaultProps} onOpenChange={mockOnOpenChange}/>);

            const cancelButton = screen.getByRole('button', {name: 'Cancel'});
            await user.click(cancelButton);

            expect(mockOnOpenChange).toHaveBeenCalledWith(false);
        });
    });

    describe('guard clause validation', () => {
        it('should return null when flashcard is null', () => {
            const {container} = render(<DeleteFlashcardDialog {...defaultProps} flashcard={null}/>);

            expect(container.firstChild).toBeNull();
        });

        it('should return null when flashcard is undefined', () => {
            const {container} = render(
                <DeleteFlashcardDialog {...defaultProps} flashcard={undefined as any}/>
            );

            expect(container.firstChild).toBeNull();
        });

        it('should not call onConfirm when flashcard is null during handleConfirm', async () => {
            const user = userEvent.setup();
            const mockOnConfirm = vi.fn().mockResolvedValue(true);

            // Render with valid flashcard first
            const {rerender} = render(
                <DeleteFlashcardDialog {...defaultProps} onConfirm={mockOnConfirm}/>
            );

            // Then rerender with null flashcard
            rerender(<DeleteFlashcardDialog {...defaultProps} flashcard={null} onConfirm={mockOnConfirm}/>);

            // Component should not render, so no buttons to click
            expect(screen.queryByRole('button', {name: 'Delete'})).not.toBeInTheDocument();
            expect(mockOnConfirm).not.toHaveBeenCalled();
        });
    });
});
