<conversation_summary>
<decisions>
1. A top navigation bar will be implemented using the `Navigation Menu` component from `shadcn/ui`.
2. AI-generated flashcard suggestions will be discarded if the user navigates away from the generator page, in line with MVP scope.
3. The "Study Session" feature and its associated views and API endpoints are deferred for a future stage.
4. API errors (e.g., `502`, `429`) will be communicated to the user via a global notification system (toasts).
5. Editing of AI-generated suggestions will be done inline within the suggestion list before they are saved.
6. The "My Flashcards" view will default to sorting flashcards by creation date in descending order.
7. A confirmation dialog (`AlertDialog`) will be required before a flashcard is permanently deleted.
8. The "AI Generator" view will use a two-column layout (input on the left, suggestions on the right) which stacks vertically on mobile.
9. The "My Flashcards" view will display flashcards as a list of `<Card>` components, with "Edit" and "Delete" actions.
10. Pagination controls will be implemented in the "My Flashcards" view using the `Pagination` component.
11. A modal dialog (`Dialog`) will be used for the manual creation of new flashcards.
12. The application will redirect users to the "AI Generator" page after a successful login or registration.
13. Specific UI components from `shadcn/ui` will be used for forms and displaying data (`Textarea`, `Button`, `Card`, `Checkbox`, `Input`, `Dialog`, `Pagination`).
14. A "Save" button will appear during flashcard editing; changes are saved explicitly on click, not automatically.
15. Validation errors for flashcard character limits will be handled by disabling the "Save" button if the content is invalid.
</decisions>
<matched_recommendations>
1. **Navigation:** Use a persistent top navigation bar (`NavigationMenu` from `shadcn/ui`) for primary navigation between "AI Generator" and "My Flashcards".
2. **State Management:** For the MVP, temporarily store AI-generated suggestions in the client-side state; they will be lost if the user navigates away.
3. **Error Handling:** Implement a global notification system (toasts) to display descriptive messages for API errors like `502 Bad Gateway` or `429 Too Many Requests`.
4. **AI Generator View:** Use a two-column layout: a `<Textarea>` for input on the left and a list of `<Card>` components for suggestions on the right. Allow inline editing of suggestions using `<Input>` fields within each card.
5. **My Flashcards View:** Display flashcards as a list of `<Card>` components. Each card should have "Edit" and "Delete" buttons. Use the `Pagination` component to handle navigation between pages of flashcards.
6. **CRUD Operations:**
   - Use a `Dialog` for the manual creation form.
   - For editing, replace the "Edit" button with "Save" and "Cancel" buttons, triggering the `PATCH` request only on "Save".
   - Use an `AlertDialog` to confirm deletion before sending a `DELETE` request.
   - For batch creation, use a "Save Selected" button that shows a loading state and provides feedback via toast notifications.
7. **User Flow:** After login/registration, redirect the user to the "AI Generator" page to encourage immediate engagement.
8. **Responsiveness:** The top navigation should collapse into a "hamburger" menu on mobile. Two-column layouts should stack vertically.
9. **Empty States:** Display user-friendly messages and calls-to-action when there is no data to show (e.g., no flashcards created, no AI suggestions generated).
10. **Validation:** Provide real-time feedback for input validation by disabling the "Save" button if character limits (1-1000) are not met.
</matched_recommendations>
<ui_architecture_planning_summary>
The UI architecture for the 10x-cards MVP will be built using Astro with React for interactive islands, and styled with Tailwind CSS leveraging the `shadcn/ui` component library.

**Key Views and User Flows:**
- **Navigation:** A top navigation bar will provide access to the two primary views: "AI Generator" and "My Flashcards".
- **Authentication:** Standard Login and Registration pages will be created. After authenticating, users are redirected to the "AI Generator".
- **AI Generator (`/generate`):** This view will feature a two-column layout with a text area for input and a list for AI-generated suggestions. Users can edit suggestions inline, select them, and save them in a batch. Suggestions are not persisted if the user navigates away.
- **My Flashcards (`/flashcards`):** This view will display a paginated list of the user's flashcards. Users can create new cards via a modal, edit existing cards inline, and delete cards (with confirmation).

**API Integration and State Management:**
- The UI will interact with the defined REST API for all data operations.
- **`POST /api/ai/generate`:** Used by the AI Generator to get suggestions.
- **`POST /api/flashcards/batch`:** Used to save selected AI suggestions.
- **`GET /api/flashcards`:** Fetches cards for the "My Flashcards" view, with client-side controls for pagination.
- **`POST /api/flashcards`:** Creates a single manual flashcard.
- **`PATCH /api/flashcards/:id`:** Updates an existing flashcard.
- **`DELETE /api/flashcards/:id`:** Deletes a flashcard.
- Client-side state will be managed within React components. For the MVP, complex state management libraries are not required.

**Responsiveness and Feedback:**
- The application will be responsive, with layouts adapting to mobile screen sizes (e.g., stacked columns, hamburger menu).
- User feedback is critical: loading states on buttons, toast notifications for API success/error, and clear empty-state messages will be implemented.
- Form validation will provide real-time feedback by disabling submission buttons if constraints are not met.
</ui_architecture_planning_summary>
<unresolved_issues>
- **Study Session:** The entire "Study Session" feature, including the view and necessary API endpoints (`GET /api/study/due`, `POST /api/study/review/:id`), is deferred.
- **Authentication State Management:** The specific implementation details for handling JWTs and managing user sessions with Supabase helpers were deferred.
- **User Settings:** The user settings page, including the "Log Out" functionality and the "Delete Account" option, was deferred.
- **Loading Indicators:** A general strategy for indicating when data is being fetched (e.g., skeleton loaders for card lists) was not decided upon.
- **Login/Registration Page Structure:** The detailed component structure for the Login and Registration pages was deferred.
</unresolved_issues>
</conversation_summary>
