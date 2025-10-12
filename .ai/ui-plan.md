# UI Architecture for 10x-cards

## 1. UI Structure Overview

The UI architecture is designed around a simple, user-centric workflow focused on two primary activities: generating flashcards with AI and managing them. The structure is built for a web application and prioritizes ease of use and a clear path for the user's main tasks.

The application consists of four main views:
- **Authentication Views (`/login`, `/register`)**: Standard forms for user access. To implement at further stages.
- **AI Generator View (`/generate`)**: The core feature where users input text to receive AI-generated flashcard suggestions.
- **My Flashcards View (`/flashcards`)**: A dashboard for users to view, create, edit, and delete their saved flashcards.

A persistent top navigation bar ensures seamless movement between the "AI Generator" and "My Flashcards" views for authenticated users. The design uses modal dialogs for creating and editing flashcards to keep the user in context, and toast notifications for non-intrusive feedback on actions.

## 2. View List

### Authentication Views

- **View Names**: Login, Register
- **View Paths**: `/login`, `/register`
- **Main Purpose**: To provide secure access for new and returning users.
- **Key Information to Display**: Input fields for email and password, links to toggle between login and registration.
- **Key View Components**: `Card`, `Input`, `Button`, `Label`.
- **UX, Accessibility, and Security Considerations**:
  - **UX**: Clear error messages for invalid credentials or registration failures. Redirect to the "AI Generator" view upon successful authentication.
  - **Accessibility**: All form fields will have associated labels. Focus management will guide users through the forms.
  - **Security**: Communication with the authentication endpoint must be over HTTPS. No sensitive data is stored on the client side.

### AI Generator View

- **View Name**: AI Generator
- **View Path**: `/generate`
- **Main Purpose**: To allow users to generate flashcard suggestions from a piece of text using an LLM.
- **Key Information to Display**: A large text area for input, a list of generated flashcard suggestions, and controls for managing suggestions.
- **Key View Components**: `Textarea`, `Button` (for generation), `Card` (for each suggestion), `Input` (for inline editing), `Checkbox` (for selection), `Toast` (for notifications).
- **UX, Accessibility, and Security Considerations**:
  - **UX**: A two-column layout for easy comparison of input text and output suggestions (stacks on mobile). Loading indicators during generation. Inline editing of suggestions before saving. Users can select multiple suggestions to save in a batch.
  - **Accessibility**: Suggestions will be presented in a structured list. All interactive elements will be keyboard-accessible.
  - **Security**: Input text is sent to a secure backend endpoint. The client does not interact directly with the LLM API.

### My Flashcards View

- **View Name**: My Flashcards
- **View Path**: `/flashcards`
- **Main Purpose**: To provide a central place for users to manage all their created flashcards.
- **Key Information to Display**: A paginated list of the user's flashcards, showing the front and back content.
- **Key View Components**: `Card` (for each flashcard), `Button` (for "New Flashcard", "Edit", "Delete"), `Pagination`, `Dialog` (for manual creation/editing), `AlertDialog` (for delete confirmation), `Toast`.
- **UX, Accessibility, and Security Considerations**:
  - **UX**: Flashcards are displayed in a clean, scannable list. Manual creation and editing occur in a modal to avoid page reloads. A confirmation step prevents accidental deletion. An empty state with a call-to-action is shown if no flashcards exist.
  - **Accessibility**: Proper headings and ARIA attributes will be used for the flashcard list and modals. All actions will be accessible via keyboard.
  - **Security**: Users can only view and manage their own flashcards, enforced by the backend API.

## 3. User Journey Map

1.  **Registration/Login**:
    - A new user lands on the `/register` page, enters their credentials, and is redirected to the `/generate` page upon success.
    - A returning user lands on the `/login` page, enters their credentials, and is redirected to the `/generate` page.

2.  **Main Use Case: AI Flashcard Generation**:
    - **Step 1**: The user navigates to the **AI Generator View** (`/generate`).
    - **Step 2**: The user pastes a block of text (1,000-10,000 characters) into the `Textarea`.
    - **Step 3**: The user clicks the "Generate Flashcards" `Button`.
    - **Step 4**: The UI shows a loading state while waiting for the API response.
    - **Step 5**: The view displays a list of AI-generated suggestions as individual `Card` components.
    - **Step 6**: The user reviews the suggestions. They can edit the front/back of any suggestion inline using `Input` fields.
    - **Step 7**: The user selects the desired flashcards using `Checkbox` controls.
    - **Step 8**: The user clicks the "Save Selected" `Button`, which triggers a batch creation API call (`POST /api/flashcards/batch`).
    - **Step 9**: A `Toast` notification confirms that the flashcards have been saved.

3.  **Flashcard Management**:
    - The user navigates to the **My Flashcards View** (`/flashcards`).
    - **To View**: The user sees a paginated list of their flashcards and can navigate between pages using the `Pagination` component.
    - **To Create Manually**: The user clicks the "New Flashcard" `Button`, which opens a `Dialog` with a form. They fill it out and save, and the new flashcard appears in the list.
    - **To Edit**: The user clicks the "Edit" `Button` on a flashcard, which opens a `Dialog` to modify its content. Saving the changes updates the flashcard in the list.
    - **To Delete**: The user clicks the "Delete" `Button`, confirms the action in an `AlertDialog`, and the flashcard is removed from the list.

## 4. Layout and Navigation Structure

- **Main Layout**: A primary layout component will wrap all authenticated views. It will contain the top navigation bar and a main content area where the different views (`/generate`, `/flashcards`) are rendered.
- **Top Navigation**: A persistent horizontal navigation bar at the top of the page will be the primary means of navigation. It will contain:
  - A logo/brand name on the left.
  - Links to "AI Generator" (`/generate`) and "My Flashcards" (`/flashcards`).
  - A user menu on the right with a "Log Out" option.
- **Responsiveness**: On smaller screens (mobile), the top navigation will collapse into a hamburger menu.

## 5. Key Components

These `shadcn/ui` components will be used across multiple views to ensure a consistent and high-quality user experience.

- **Card**: The primary container for displaying individual flashcards and AI suggestions.
- **Button**: Used for all primary actions (e.g., Generate, Save, Edit, Delete, New Flashcard).
- **Input & Textarea**: Standard form elements for all text entry.
- **Dialog**: For modal experiences like creating or editing a flashcard, preventing the user from losing context.
- **AlertDialog**: A specific type of modal used to confirm destructive actions, such as deleting a flashcard.
- **Toast**: For providing asynchronous, non-blocking feedback to the user (e.g., "Flashcards saved successfully," "API error").
- **Pagination**: For navigating through the list of flashcards in the "My Flashcards" view.
- **Checkbox**: For selecting AI-generated suggestions to be saved in a batch.
