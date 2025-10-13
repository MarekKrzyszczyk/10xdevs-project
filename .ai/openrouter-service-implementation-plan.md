# OpenRouter Service Implementation Plan

## 1. Service Description

The `OpenRouterService` is a TypeScript module responsible for all communication with the OpenRouter.ai API. It provides a streamlined interface for sending chat completion requests to various Large Language Models (LLMs) and handling their responses. The service will manage API authentication, request formatting, response parsing, and error handling, ensuring a robust and reliable integration.

This service will be located in `src/lib/openrouter/openrouter.service.ts`.

## 2. Constructor Description

The service is designed to be a stateless collection of functions rather than a class that requires instantiation. This approach simplifies its usage within the Astro and Supabase backend environment. Configuration, such as the API key, will be retrieved from environment variables at the time a function is called, adhering to security best practices.

## 3. Public Methods and Fields

### `getChatCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResponse>`

This is the primary method for interacting with the OpenRouter API.

#### Parameters (`ChatCompletionOptions`)

- **`userMessage`** (`string`, required): The message from the end-user.
- **`systemMessage`** (`string`, optional): A message to define the assistant's persona or provide context. Defaults to a generic helpful assistant prompt.
- **`model`** (`string`, optional): The name of the model to use (e.g., `openai/gpt-4o`). Defaults to a project-wide default model defined in a central configuration file.
- **`responseFormat`** (`ResponseFormat`, optional): An object to enforce a structured JSON response from the model. See details below.
- **`parameters`** (`ModelParameters`, optional): An object to specify model parameters like `temperature`, `max_tokens`, etc.

#### Returns (`ChatCompletionResponse`)

A promise that resolves to an object containing:
- **`success`** (`boolean`): `true` if the request was successful, `false` otherwise.
- **`data`** (`T | null`): The parsed content from the model's response. If `responseFormat` was used, this will be a typed object. Otherwise, it will be a string.
- **`error`** (`string | null`): A user-friendly error message if the request failed.

--- 

## 4. Private Methods and Fields

### `buildRequestBody(options: ChatCompletionOptions): object`

- **Description**: Constructs the JSON payload for the OpenRouter API. It merges default parameters with user-provided options, formats the `messages` array, and correctly structures the `response_format` object.

### `sendRequest(body: object): Promise<any>`

- **Description**: Sends the HTTP POST request to the OpenRouter API endpoint (`https://openrouter.ai/api/v1/chat/completions`). It handles setting the `Authorization` header with the API key retrieved from environment variables (`process.env.OPENROUTER_API_KEY`).

### `parseResponse(response: any): ChatCompletionResponse`

- **Description**: Parses the raw API response. If the response is successful, it extracts and, if necessary, parses the JSON content from the `choices[0].message.content`. If the response indicates an error, it formats it into the standard `ChatCompletionResponse` error format.

### `handleApiError(error: any): ChatCompletionResponse`

- **Description**: A dedicated function to process errors caught during the API call (e.g., network issues, invalid status codes). It logs the detailed error for debugging purposes and returns a standardized, user-friendly error response.

--- 

## 5. Error Handling

Error handling is critical and will be implemented using a combination of `try...catch` blocks and dedicated error-handling functions.

1.  **API Key Not Found**: If `process.env.OPENROUTER_API_KEY` is missing, the service will immediately throw a `ConfigurationError` to prevent further execution.
2.  **Invalid Input**: The `getChatCompletion` function will perform basic validation on its inputs. For example, ensuring `userMessage` is a non-empty string.
3.  **API Errors (4xx/5xx)**: The `handleApiError` function will catch errors from `axios`/`fetch`. It will inspect the error object for a response status and body, log the technical details, and return a generic error message to the caller (e.g., "The AI service is currently unavailable. Please try again later.").
4.  **Network Errors**: If the request fails due to network issues (e.g., DNS lookup failure), a standard error response indicating a connectivity problem will be returned.
5.  **JSON Parsing Errors**: If `responseFormat` is used but the model returns a malformed JSON string, the `parseResponse` function will catch the `JSON.parse` error and return a `ChatCompletionResponse` indicating a data format mismatch.

--- 

## 6. Security Considerations

1.  **API Key Management**: The OpenRouter API key is stored in .env (`OPENROUTER_API_KEY`).
2.  **Input Sanitization**: While the primary risk is low, all user-provided input (`userMessage`) should be treated as untrusted. Avoid using this input in any server-side logic that could be vulnerable to injection attacks (e.g., database queries).

--- 

## 7. Step-by-Step Implementation Plan

**Step 1: Setup and Configuration**

1.  Create the service file at `src/lib/openrouter/openrouter.service.ts`.
2.  Define the necessary types (`ChatCompletionOptions`, `ChatCompletionResponse`, etc.) in a shared types file like `src/types.ts` or directly within the service file if they are not used elsewhere.

**Step 2: Implement `getChatCompletion`**

This will be the main exported function. It will orchestrate calls to the private helper functions.

```typescript
// src/lib/openrouter/openrouter.service.ts

import type { ChatCompletionOptions, ChatCompletionResponse } from '@/types';

export async function getChatCompletion<T>(options: ChatCompletionOptions): Promise<ChatCompletionResponse<T>> {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY is not configured.');
    }

    const body = buildRequestBody(options);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return handleApiError(errorData);
    }

    const data = await response.json();
    return parseResponse<T>(data);

  } catch (error) {
    return handleApiError(error);
  }
}
```

**Step 3: Implement `buildRequestBody`**

This function will assemble the request payload.

```typescript
// In src/lib/openrouter/openrouter.service.ts

function buildRequestBody(options: ChatCompletionOptions): object {
  const { userMessage, systemMessage, model, responseFormat, parameters } = options;

  const messages = [
    { role: 'system', content: systemMessage || 'You are a helpful assistant.' },
    { role: 'user', content: userMessage },
  ];

  const body: any = {
    model: model || 'openai/gpt-4o', // Or another default
    messages,
    ...parameters, // Spread optional parameters like temperature, max_tokens
  };

  // Example of handling response_format
  if (responseFormat) {
    body.response_format = {
      type: 'json_schema',
      json_schema: {
        name: responseFormat.json_schema.name,
        strict: true,
        schema: responseFormat.json_schema.schema
      }
    };
  }

  return body;
}
```

**Step 4: Implement `parseResponse`**

This function will handle successful responses.

```typescript
// In src/lib/openrouter/openrouter.service.ts

function parseResponse<T>(data: any): ChatCompletionResponse<T> {
  try {
    const content = data.choices[0]?.message?.content;
    if (!content) {
      return { success: false, data: null, error: 'Received an empty response from the AI.' };
    }

    // If the content is expected to be JSON, try parsing it.
    // This assumes the caller knows to expect JSON.
    try {
      const parsedData = JSON.parse(content) as T;
      return { success: true, data: parsedData, error: null };
    } catch {
      // If parsing fails, but a string response is acceptable, return the string.
      // This part needs to be robust based on usage.
      return { success: true, data: content as unknown as T, error: null };
    }
  } catch (e) {
    return { success: false, data: null, error: 'Failed to parse the AI response.' };
  }
}
```

**Step 5: Implement `handleApiError`**

This function centralizes error reporting.

```typescript
// In src/lib/openrouter/openrouter.service.ts

function handleApiError<T>(error: any): ChatCompletionResponse<T> {
  console.error('OpenRouter API Error:', error);

  const message = error?.error?.message || 'An unexpected error occurred with the AI service.';

  return {
    success: false,
    data: null,
    error: message,
  };
}
```

**Step 6: Create an API Endpoint for Testing**

Create a new file `src/pages/api/chat.ts` to expose the service.

```typescript
// src/pages/api/chat.ts
import type { APIRoute } from 'astro';
import { getChatCompletion } from '@/lib/openrouter';

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();

  if (!body.message) {
    return new Response(JSON.stringify({ error: 'Message is required' }), { status: 400 });
  }

  // Example with structured response
  const result = await getChatCompletion<any>({
    userMessage: body.message,
    model: 'openai/gpt-4o',
    responseFormat: {
      type: 'json_schema',
      json_schema: {
        name: 'user_details',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            age: { type: 'number' }
          },
          required: ['name', 'age']
        }
      }
    }
  });

  if (!result.success) {
    return new Response(JSON.stringify({ error: result.error }), { status: 500 });
  }

  return new Response(JSON.stringify(result.data), { status: 200 });
};
```
