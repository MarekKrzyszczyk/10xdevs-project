import {beforeEach, describe, expect, it, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {FlashcardSuggestionItem} from '../FlashcardSuggestionItem';
import type {FlashcardSuggestionViewModel} from '@/components/hooks/useGenerateFlashcards';

describe('FlashcardSuggestionItem', () => {
    const mockSuggestion: FlashcardSuggestionViewModel = {
        id: 'suggestion-1',
        front: 'What is React?',
        back: 'A JavaScript library for building user interfaces',
        isSelected: true,
    };

    const mockUnselectedSuggestion: FlashcardSuggestionViewModel = {
        id: 'suggestion-2',
        front: 'What is TypeScript?',
        back: 'A typed superset of JavaScript',
        isSelected: false,
    };

    const defaultProps = {
        suggestion: mockSuggestion,
        onUpdate: vi.fn(),
        onToggleSelect: vi.fn(),
        onRemove: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('renders fields with suggestion data', () => {
        it('should display front and back values in input fields', () => {
            render(<FlashcardSuggestionItem {...defaultProps} />);

            const frontInput = screen.getByDisplayValue('What is React?') as HTMLInputElement;
            const backInput = screen.getByDisplayValue(
                'A JavaScript library for building user interfaces'
            ) as HTMLInputElement;

            expect(frontInput).toBeInTheDocument();
            expect(backInput).toBeInTheDocument();
            expect(frontInput.value).toBe('What is React?');
            expect(backInput.value).toBe('A JavaScript library for building user interfaces');
        });

        it('should display labels for Question and Answer', () => {
            render(<FlashcardSuggestionItem {...defaultProps} />);

            expect(screen.getAllByText('Question')[0]).toBeInTheDocument();
            expect(screen.getAllByText('Answer')[0]).toBeInTheDocument();
        });

        it('should reflect isSelected state in checkbox', () => {
            const {rerender} = render(<FlashcardSuggestionItem {...defaultProps} />);

            // Selected state
            const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
            expect(checkbox).toBeChecked();

            // Unselected state
            rerender(<FlashcardSuggestionItem {...defaultProps} suggestion={mockUnselectedSuggestion}/>);
            expect(checkbox).not.toBeChecked();
        });

        it('should use correct IDs for form elements', () => {
            render(<FlashcardSuggestionItem {...defaultProps} />);

            const checkbox = screen.getByRole('checkbox');
            const frontInput = screen.getByDisplayValue('What is React?');
            const backInput = screen.getByDisplayValue(
                'A JavaScript library for building user interfaces'
            );

            expect(checkbox).toHaveAttribute('id', 'select-suggestion-1');
            expect(frontInput).toHaveAttribute('id', 'front-suggestion-1');
            expect(backInput).toHaveAttribute('id', 'back-suggestion-1');
        });
    });

    describe('updates front/back via callbacks', () => {
        it('should call onUpdate for each character typed', async () => {
            const user = userEvent.setup();
            const mockOnUpdate = vi.fn();

            render(<FlashcardSuggestionItem {...defaultProps} onUpdate={mockOnUpdate}/>);

            const frontInput = screen.getByDisplayValue('What is React?');

            await user.type(frontInput, 'X');

            // Should be called with the original text + 'X'
            expect(mockOnUpdate).toHaveBeenCalledWith(
                'suggestion-1',
                'What is React?X',
                'A JavaScript library for building user interfaces'
            );
        });

        it('should handle empty values in onUpdate', async () => {
            const user = userEvent.setup();
            const mockOnUpdate = vi.fn();

            render(<FlashcardSuggestionItem {...defaultProps} onUpdate={mockOnUpdate}/>);

            const frontInput = screen.getByDisplayValue('What is React?');

            await user.clear(frontInput);

            // Called multiple times during clear, final call should have empty string
            const calls = mockOnUpdate.mock.calls;
            const lastCall = calls[calls.length - 1];
            expect(lastCall[1]).toBe(''); // front should be empty
            expect(lastCall[2]).toBe('A JavaScript library for building user interfaces'); // back preserved
        });
    });

    describe('toggles selection', () => {
        it('should call onToggleSelect with id when checkbox is clicked', async () => {
            const user = userEvent.setup();
            const mockOnToggleSelect = vi.fn();

            render(<FlashcardSuggestionItem {...defaultProps} onToggleSelect={mockOnToggleSelect}/>);

            const checkbox = screen.getByRole('checkbox');
            await user.click(checkbox);

            expect(mockOnToggleSelect).toHaveBeenCalledWith('suggestion-1');
            expect(mockOnToggleSelect).toHaveBeenCalledTimes(1);
        });

        it('should call onToggleSelect for both selected and unselected states', async () => {
            const user = userEvent.setup();
            const mockOnToggleSelect = vi.fn();

            const {rerender} = render(
                <FlashcardSuggestionItem
                    {...defaultProps}
                    suggestion={mockSuggestion}
                    onToggleSelect={mockOnToggleSelect}
                />
            );

            // Click when selected
            const checkbox = screen.getByRole('checkbox');
            await user.click(checkbox);

            expect(mockOnToggleSelect).toHaveBeenCalledWith('suggestion-1');

            // Rerender with unselected state
            rerender(
                <FlashcardSuggestionItem
                    {...defaultProps}
                    suggestion={mockUnselectedSuggestion}
                    onToggleSelect={mockOnToggleSelect}
                />
            );

            // Click when unselected
            await user.click(checkbox);

            expect(mockOnToggleSelect).toHaveBeenCalledWith('suggestion-2');
            expect(mockOnToggleSelect).toHaveBeenCalledTimes(2);
        });
    });

    describe('removes suggestion on button click', () => {
        it('should call onRemove with id when delete button is clicked', async () => {
            const user = userEvent.setup();
            const mockOnRemove = vi.fn();

            render(<FlashcardSuggestionItem {...defaultProps} onRemove={mockOnRemove}/>);

            const deleteButton = screen.getByRole('button', {name: 'Remove suggestion'});
            await user.click(deleteButton);

            expect(mockOnRemove).toHaveBeenCalledWith('suggestion-1');
            expect(mockOnRemove).toHaveBeenCalledTimes(1);
        });

        it('should display delete button with correct aria-label', () => {
            render(<FlashcardSuggestionItem {...defaultProps} />);

            const deleteButton = screen.getByRole('button', {name: 'Remove suggestion'});
            expect(deleteButton).toBeInTheDocument();
            expect(deleteButton).toHaveAttribute('aria-label', 'Remove suggestion');
        });
    });

    describe('applies selected styling', () => {
        it('should apply gradient classes when isSelected is true', () => {
            render(<FlashcardSuggestionItem {...defaultProps} suggestion={mockSuggestion}/>);

            const container = screen.getByRole('checkbox').closest('div')?.parentElement;
            expect(container).toHaveClass('bg-gradient-to-br', 'from-blue-500/20', 'to-purple-500/20');
            expect(container).toHaveClass('border-blue-400/50', 'shadow-lg');
        });

        it('should apply default classes when isSelected is false', () => {
            render(<FlashcardSuggestionItem {...defaultProps} suggestion={mockUnselectedSuggestion}/>);

            const container = screen.getByRole('checkbox').closest('div')?.parentElement;
            expect(container).toHaveClass('bg-white/5', 'border-white/10', 'hover:bg-white/10');
            expect(container).not.toHaveClass('bg-gradient-to-br');
        });

        it('should toggle styling classes based on selection state', () => {
            const {rerender} = render(
                <FlashcardSuggestionItem {...defaultProps} suggestion={mockSuggestion}/>
            );

            let container = screen.getByRole('checkbox').closest('div')?.parentElement;
            expect(container).toHaveClass('bg-gradient-to-br');

            // Rerender with unselected state
            rerender(<FlashcardSuggestionItem {...defaultProps} suggestion={mockUnselectedSuggestion}/>);

            container = screen.getByRole('checkbox').closest('div')?.parentElement;
            expect(container).not.toHaveClass('bg-gradient-to-br');
            expect(container).toHaveClass('bg-white/5');
        });

        it('should maintain other container classes regardless of selection', () => {
            const {rerender} = render(
                <FlashcardSuggestionItem {...defaultProps} suggestion={mockSuggestion}/>
            );

            let container = screen.getByRole('checkbox').closest('div')?.parentElement;
            expect(container).toHaveClass('backdrop-blur-sm', 'rounded-lg', 'p-4', 'border', 'transition-all');

            // Rerender with unselected state
            rerender(<FlashcardSuggestionItem {...defaultProps} suggestion={mockUnselectedSuggestion}/>);

            container = screen.getByRole('checkbox').closest('div')?.parentElement;
            expect(container).toHaveClass('backdrop-blur-sm', 'rounded-lg', 'p-4', 'border', 'transition-all');
        });
    });

    describe('accessibility features', () => {
        it('should properly associate labels with inputs', () => {
            render(<FlashcardSuggestionItem {...defaultProps} />);

            const frontLabel = screen.getByText('Question').closest('label');
            const backLabel = screen.getByText('Answer').closest('label');

            expect(frontLabel).toHaveAttribute('for', 'front-suggestion-1');
            expect(backLabel).toHaveAttribute('for', 'back-suggestion-1');
        });

        it('should have proper checkbox association', () => {
            render(<FlashcardSuggestionItem {...defaultProps} />);

            const checkbox = screen.getByRole('checkbox');
            expect(checkbox).toHaveAttribute('id', 'select-suggestion-1');
        });

        it('should render inputs with placeholders', () => {
            render(<FlashcardSuggestionItem {...defaultProps} />);

            expect(screen.getByPlaceholderText('Front of flashcard...')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Back of flashcard...')).toBeInTheDocument();
        });
    });

    describe('component layout', () => {
        it('should render all interactive elements', () => {
            render(<FlashcardSuggestionItem {...defaultProps} />);

            // Should have checkbox
            expect(screen.getByRole('checkbox')).toBeInTheDocument();

            // Should have two text inputs
            const inputs = screen.getAllByRole('textbox');
            expect(inputs).toHaveLength(2);

            // Should have delete button
            expect(screen.getByRole('button', {name: 'Remove suggestion'})).toBeInTheDocument();
        });

        it('should render Trash2 icon in delete button', () => {
            render(<FlashcardSuggestionItem {...defaultProps} />);

            const deleteButton = screen.getByRole('button', {name: 'Remove suggestion'});
            const svg = deleteButton.querySelector('svg');

            expect(svg).toBeInTheDocument();
        });
    });

    describe('edge cases', () => {
        it('should handle empty front and back values', () => {
            const emptySuggestion: FlashcardSuggestionViewModel = {
                id: 'empty-suggestion',
                front: '',
                back: '',
                isSelected: false,
            };

            render(<FlashcardSuggestionItem {...defaultProps} suggestion={emptySuggestion}/>);

            const inputs = screen.getAllByRole('textbox');
            expect((inputs[0] as HTMLInputElement).value).toBe('');
            expect((inputs[1] as HTMLInputElement).value).toBe('');
        });

        it('should handle very long text values', () => {
            const longTextSuggestion: FlashcardSuggestionViewModel = {
                id: 'long-suggestion',
                front: 'A'.repeat(1000),
                back: 'B'.repeat(1000),
                isSelected: true,
            };

            render(<FlashcardSuggestionItem {...defaultProps} suggestion={longTextSuggestion}/>);

            const frontInput = screen.getByDisplayValue('A'.repeat(1000)) as HTMLInputElement;
            const backInput = screen.getByDisplayValue('B'.repeat(1000)) as HTMLInputElement;

            expect(frontInput.value).toBe('A'.repeat(1000));
            expect(backInput.value).toBe('B'.repeat(1000));
        });

        it('should handle special characters in text', () => {
            const specialCharSuggestion: FlashcardSuggestionViewModel = {
                id: 'special-char',
                front: 'What is <React> & "JSX"?',
                back: 'It\'s a library with special chars: & < > " \'',
                isSelected: false,
            };

            render(<FlashcardSuggestionItem {...defaultProps} suggestion={specialCharSuggestion}/>);

            expect(screen.getByDisplayValue('What is <React> & "JSX"?')).toBeInTheDocument();
            expect(
                screen.getByDisplayValue('It\'s a library with special chars: & < > " \'')
            ).toBeInTheDocument();
        });
    });
});
