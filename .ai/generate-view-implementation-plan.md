# View Implementation Plan: AI Generator

## 1. Overview

The AI Generator view is the core feature of the application, enabling authenticated users to generate flashcard suggestions from a piece of text. Users can paste text into a designated area, initiate the generation process, and then review, edit, and select the suggestions they wish to save to their collection. The view is designed to be interactive and provide clear feedback throughout the process, including loading states and error handling.

## 2. View Routing

- **Path**: `/generate`
- **Access**: This view should be accessible only to authenticated users. Unauthenticated users attempting to access this path should be redirected to the `/login` page.

## 3. Component Structure

The view will be built using a hierarchical structure of React components within an Astro page. The component tree is as follows:

```
/src/pages/generate.astro
└── /src/components/views/GenerateView.tsx (Client-side component)
    ├── /src/components/ui/Textarea.tsx
    ├── /src/components/ui/Button.tsx (for Generate action)
    ├── /src/components/ui/Card.tsx (container for suggestions list)
    │   └── /src/components/features/FlashcardSuggestionItem.tsx (for each suggestion)
    │       ├── /src/components/ui/Input.tsx (for inline editing)
    │       ├── /src/components/ui/Checkbox.tsx (for selection)
    │       └── /src/components/ui/Button.tsx (for individual actions like delete)
    └── /src/components/ui/Button.tsx (for Save Selected action)
```

## 4. Component Details

### `GenerateView`

-   **Component Description**: This is the main client-side component that encapsulates the entire functionality of the AI Generator view. It manages the view's state, handles user interactions, and communicates with the backend API.
-   **Main Elements**: It consists of a `Textarea` for user input, a `Button` to trigger generation, a section to display the list of `FlashcardSuggestionItem` components, and a `Button` to save selected suggestions.
-   **Handled Interactions**: Text input changes, 'Generate' button clicks, and 'Save Selected' button clicks.
-   **Handled Validation**: Checks if the input text length is between 1,000 and 10,000 characters before enabling the 'Generate' button.
-   **Types**: `GenerateFlashcardsCommand`, `GenerateFlashcardsResponseDTO`, `FlashcardSuggestionViewModel`.
-   **Props**: None.

### `FlashcardSuggestionItem`

-   **Component Description**: A component that displays a single AI-generated flashcard suggestion. It allows for inline editing of the 'front' and 'back' content, selection via a checkbox, and removal from the list.
-   **Main Elements**: Two `Input` fields for the front and back of the flashcard, a `Checkbox` for selection, and a 'Delete' `Button`.
-   **Handled Interactions**: Editing text in the `Input` fields, toggling the `Checkbox`, and clicking the 'Delete' button.
-   **Handled Validation**: None.
-   **Types**: `FlashcardSuggestionViewModel`.
-   **Props**:
    -   `suggestion: FlashcardSuggestionViewModel`
    -   `onUpdate: (id: string, newFront: string, newBack: string) => void`
    -   `onToggleSelect: (id: string) => void`
    -   `onRemove: (id: string) => void`

## 5. Types

### DTOs (Data Transfer Objects)

-   **`GenerateFlashcardsCommand`**: The request payload sent to the API.
    ```typescript
    {
      text: string; // 1000-10000 characters
      model?: string; // Optional
    }
    ```
-   **`GenerateFlashcardsResponseDTO`**: The success response received from the API.
    ```typescript
    {
      suggestions: FlashcardSuggestionDTO[];
    }
    ```
-   **`FlashcardSuggestionDTO`**: A single suggestion object from the API.
    ```typescript
    {
      front: string;
      back: string;
    }
    ```

### ViewModels

-   **`FlashcardSuggestionViewModel`**: An extended version of `FlashcardSuggestionDTO` for use within the UI, including state for interactivity.
    ```typescript
    {
      id: string; // Unique client-side ID (e.g., from crypto.randomUUID())
      front: string;
      back: string;
      isSelected: boolean; // For checkbox state
    }
    ```

## 6. State Management

State will be managed locally within the `GenerateView` component using React hooks. A custom hook, `useGenerateFlashcards`, is recommended to encapsulate the logic and state management.

-   **State Variables**:
    -   `text: string`: Stores the content of the `Textarea`.
    -   `suggestions: FlashcardSuggestionViewModel[]`: An array of the generated flashcard suggestions.
    -   `isLoading: boolean`: A flag to indicate when the API call is in progress (for showing loaders).
    -   `error: string | null`: Stores any error messages from the API to display to the user.
-   **Custom Hook (`useGenerateFlashcards`)**:
    -   **Purpose**: To abstract the business logic away from the `GenerateView` component, making the view component cleaner and the logic more reusable and testable.
    -   **Exposed Values/Functions**: `text`, `setText`, `suggestions`, `isLoading`, `error`, `handleGenerate`, `handleUpdateSuggestion`, `handleToggleSelect`, `handleRemoveSuggestion`, `handleSaveSelected`.

## 7. API Integration

-   **Endpoint**: `POST /api/ai/generate`
-   **Action**: A `fetch` call will be made to this endpoint from the `useGenerateFlashcards` hook when the user clicks the 'Generate' button.
-   **Request**: The request body will be a JSON object of type `GenerateFlashcardsCommand`.
-   **Response**: On success (200 OK), the response will be a JSON object of type `GenerateFlashcardsResponseDTO`. The `suggestions` array will be mapped to `FlashcardSuggestionViewModel[]` by adding a unique `id` and `isSelected: true` (default) to each item.
-   **Batch Save**: After the user selects suggestions, a separate API call will be made to `POST /api/flashcards/batch` to save the selected items. The payload for this will be constructed from the selected `FlashcardSuggestionViewModel` items.

## 8. User Interactions

-   **Pasting Text**: The user pastes text into the `Textarea`. The UI validates the text length in real-time to enable/disable the 'Generate' button.
-   **Generating Suggestions**: The user clicks the 'Generate' button. The UI enters a loading state. Upon receiving a response, it displays the list of suggestions or an error message.
-   **Editing Suggestions**: The user can click into the `Input` fields for any suggestion's front or back to make corrections.
-   **Selecting/Deselecting**: The user can toggle the `Checkbox` on each suggestion to include or exclude it from the final set to be saved.
-   **Removing a Suggestion**: The user can click a 'Delete' button on a suggestion to remove it from the list immediately.
-   **Saving Selections**: The user clicks the 'Save Selected' button, which sends the selected and potentially edited suggestions to the backend to be persisted.

## 9. Conditions and Validation

-   **Text Length**: The 'Generate' button will be disabled if the text in the `Textarea` is less than 1,000 or more than 10,000 characters. A visual indicator (e.g., a character counter with color coding) should inform the user of the current length and requirement.
-   **Loading State**: While `isLoading` is `true`, the 'Generate' button should be disabled, and a loading spinner or skeleton loader should be displayed in the suggestions area.
-   **Empty State**: Before any suggestions are generated, the suggestions area should be empty or display a message prompting the user to generate flashcards.

## 10. Error Handling

-   **API Errors**: If the API call to `/api/ai/generate` fails, the `error` state variable will be populated with a user-friendly message. This message will be displayed prominently in the UI (e.g., using a `Toast` or an alert component).
    -   **400 Bad Request**: "The provided text must be between 1,000 and 10,000 characters."
    -   **502 Bad Gateway / 503 Service Unavailable**: "The AI service is currently unavailable. Please try again later."
    -   **Other Errors**: "An unexpected error occurred. Please try again."
-   **No Suggestions**: If the API returns a success status but an empty `suggestions` array, the UI should display a message like: "Could not generate flashcards from the provided text. Please try a different text."

## 11. Implementation Steps

1.  **Create the Astro Page**: Create the file `/src/pages/generate.astro` and ensure it's protected by authentication.
2.  **Develop `GenerateView.tsx`**: Create the main view component. Set up the basic layout with a `Textarea` and `Button`.
3.  **Implement `useGenerateFlashcards` Hook**: Create the custom hook to manage all state and logic. Implement the state variables (`text`, `suggestions`, `isLoading`, `error`).
4.  **Implement API Call**: Inside the hook, create the `handleGenerate` function that performs the `fetch` call to `POST /api/ai/generate`. Handle the success and error cases.
5.  **Develop `FlashcardSuggestionItem.tsx`**: Create the component to render a single suggestion. Add `Input` fields, a `Checkbox`, and a 'Delete' button.
6.  **Render the Suggestions List**: In `GenerateView.tsx`, map over the `suggestions` state array and render a `FlashcardSuggestionItem` for each item, passing the required props and callback functions for updates, selection, and removal.
7.  **Implement State Updates**: Implement the `onUpdate`, `onToggleSelect`, and `onRemove` callback functions in the `useGenerateFlashcards` hook to manage the `suggestions` array immutably.
8.  **Add Validation and UI Feedback**: Implement the text length validation and connect it to the 'Generate' button's `disabled` state. Add a character counter. Implement loading indicators (e.g., spinners) and display error messages.
9.  **Implement Batch Save**: Create the 'Save Selected' button and its corresponding handler in the hook. This function will filter for selected suggestions and make the `POST /api/flashcards/batch` API call.
10. **Refine Styling and UX**: Apply styles using Tailwind CSS and `shadcn/ui` components to match the two-column design described in the UI plan. Ensure the view is responsive and accessible.
