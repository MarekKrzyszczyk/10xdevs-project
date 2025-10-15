# Authentication Module - Technical Specification

## 1. User Interface Architecture

### 1.1. New Pages

-   **/login**: Public page with a form for logging in. It will contain fields for email and password, along with a link to the registration page and password recovery.
-   **/register**: Public page with a form for creating a new account. It will include fields for email, password, and password confirmation.
-   **/forgot-password**: Public page with a form to initiate the password recovery process. The user will provide their email address to receive a password reset link.

### 1.2. Extended Components

-   **Layout (`src/layouts/Layout.astro`)**: The main layout will be updated to display "Login" and "Register" buttons for unauthenticated users, and a "Logout" button along with user information (e.g., email) for authenticated users.
-   **Navigation (`src/components/Navigation.astro`)**: The navigation component will be modified to conditionally render links based on the user's authentication status. Authenticated users will see links to protected pages like "My Flashcards" and "Study Session."

### 1.3. New Components (React)

-   **LoginForm (`src/components/auth/LoginForm.tsx`)**: A client-side component responsible for handling the login form, including input validation and communication with the backend.
-   **RegisterForm (`src/components/auth/RegisterForm.tsx`)**: A client-side component for the registration form, managing validation, and submitting data to the backend.
-   **ForgotPasswordForm (`src/components/auth/ForgotPasswordForm.tsx`)**: A component for the password recovery form.

### 1.4. Validation and Error Handling

-   Client-side validation will be implemented for all forms to provide immediate feedback to the user (e.g., required fields, valid email format, password complexity).
-   Server-side error messages (e.g., "Invalid credentials," "Email already in use") will be displayed in the respective forms.

## 2. Backend Logic

### 2.1. API Endpoints (Astro)

-   **POST /api/auth/login**: Handles user login. It will take email and password as input and, upon successful authentication, set a session cookie.
-   **POST /api/auth/register**: Manages new user registration. It will validate the input data and create a new user in Supabase Auth.
-   **POST /api/auth/logout**: Clears the user's session and logs them out.
-   **POST /api/auth/forgot-password**: Initiates the password recovery process by sending a reset link to the user's email.

### 2.2. Data Models

-   **User**: The user model will be managed by Supabase Auth and will include at least `id`, `email`, and `encrypted_password`.

### 2.3. Middleware

-   A middleware (`src/middleware/index.ts`) will be implemented to protect routes. It will check for a valid session on every request to a protected page and redirect unauthenticated users to the login page.

## 3. Authentication System

### 3.1. Supabase Auth Integration

-   The application will use the Supabase client library (`@supabase/supabase-js`) to interact with Supabase Auth.
-   User registration will be handled via `supabase.auth.signUp()`.
-   Login will be implemented using `supabase.auth.signInWithPassword()`.
-   Logout will use `supabase.auth.signOut()`.

### 3.2. Session Management

-   Astro's server-side rendering capabilities will be used in conjunction with Supabase to manage sessions.
-   Upon successful login, a session will be created and stored in a secure, HTTP-only cookie. The middleware will validate this cookie on subsequent requests.

### 3.3. Password Recovery

-   The password recovery feature will utilize Supabase's built-in functionality. The `/api/auth/forgot-password` endpoint will call `supabase.auth.resetPasswordForEmail()` to send a password reset link to the user.
