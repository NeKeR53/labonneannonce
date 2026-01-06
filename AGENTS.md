# AGENTS.md - La Bonne Annonce Development Guide

This file provides guidelines for AI agents working on the La Bonne Annonce codebase.

## Project Overview

La Bonne Annonce is a React + Vite application that helps users create Leboncoin listings using Google Gemini AI for image analysis, text generation, and image variation. The app allows users to upload product photos, generate titles, descriptions, pricing suggestions, and lifestyle images.

## Build Commands

```bash
# Development server with hot reload (opens at localhost:3000)
npm start

# Development server exposed on network
npm run dev

# Production build (outputs to dist/)
npm run build

# Preview production build locally
npm run preview
```

**Note:** There are currently no test or lint commands configured in this project.

## Tech Stack

- React 18.2.0 (functional components, hooks)
- Vite 4.4.5 (build tool)
- Tailwind CSS 3.3.3 (styling)
- Lucide React 0.263.1 (icons)
- Google Gemini API (AI features)

## Code Style Guidelines

### Imports

- Place React imports first: `import React, { useState, useEffect } from 'react';`
- Then third-party library imports (lucide-react, etc.)
- Finally local imports (App.css, etc.)
- Use named imports for icons from lucide-react, sorted alphabetically:
```javascript
import { 
  ArrowRight,
  Copy,
  Download,
  Wand2,
  X
} from 'lucide-react';
```

### Component Structure

- Use functional components with hooks (useState, useEffect)
- Single main component per file (App.js pattern)
- Define helper functions outside the main component
- Use early returns for validation/error conditions
- Organize state variables at the top of the component

### State Management

- Use `useState` for component-level state
- Use descriptive state names: `setOriginalImage`, `setGeneratedImages`
- Initialize state with appropriate defaults (null, [], {}, etc.)
- Group related state into objects when appropriate (e.g., `adData` object)

### Naming Conventions

- **Variables/functions:** camelCase (`handleFileUpload`, `fileToBase64`)
- **Constants:** UPPER_SNAKE_CASE for config values (`TEXT_MODEL`, `IMAGE_MODEL`)
- **Component props:** camelCase (`onClick`, `onChange`)
- **CSS classes:** kebab-case (`text-[#FF6E14]`, `bg-slate-50`)
- **IDs:** descriptive with hyphens (`neutral`, `action-0`)

### Error Handling

- Use try/catch for async operations
- Set error state for user-facing errors
- Provide fallback values (e.g., `price: adInfo.price || ""`)
- Use retry logic for network calls:
```javascript
const fetchWithRetry = async (url, options, retries = 5, backoff = 1000) => {
  try {
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, backoff));
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    throw error;
  }
};
```

### Tailwind CSS Guidelines

- Use the LBC brand color `#FF6E14` for primary actions
- Follow the existing pattern: `bg-[#FF6E14]`, `text-[#FF6E14]`
- Use Tailwind's spacing, colors, and utility classes
- Responsive design with `md:` and `lg:` prefixes
- Use `group-hover` for hover effects on parent elements
- Maintain consistent border radius (`rounded-xl`, `rounded-3xl`)
- Use `transition-all` for smooth animations

### Async/Await Patterns

- Always handle loading states (`setLoading(true/false)`)
- Provide user feedback during async operations (`processingStatus`)
- Clean up in `finally` blocks
- Use optional chaining for nested API responses:
```javascript
return `data:image/png;base64,${response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data}`;
```

### API Integration

- Google Gemini API keys stored in `apiKey` constant (empty by default)
- Model names as constants: `TEXT_MODEL`, `IMAGE_MODEL`
- Construct API URLs with template literals
- Set appropriate `Content-Type` headers for JSON payloads
- Use `responseMimeType: "application/json"` for structured responses

### UI/UX Patterns

- Multi-step workflow (step 1: upload, step 2: results)
- Loading overlays with spinner and status messages
- Modal dialogs for user input
- Fullscreen image viewer
- Toast-style feedback for copy actions
- Disabled states for actions that require prerequisites

### File Organization

```
src/
  ├── App.js         # Main component with all business logic
  ├── App.css        # Tailwind directives and custom styles
  └── index.js       # Entry point
public/
  └── index.html     # HTML template
config files:
  ├── vite.config.js     # Vite configuration
  ├── tailwind.config.js # Tailwind configuration
  └── postcss.config.js  # PostCSS configuration
```

### Security Considerations

- API keys should never be committed; use environment variables
- Validate file inputs before processing
- Sanitize user inputs in prompts
- Handle clipboard operations with proper error fallbacks

### TypeScript Note

This project uses plain JavaScript, not TypeScript. If adding types is desired, convert files to `.tsx` and add proper type annotations.

## Common Tasks

### Adding a New Feature
1. Create new state variables at component top
2. Add handler functions before the return statement
3. Update JSX with new UI elements
4. Add Tailwind classes following existing patterns

### Modifying API Calls
- Update the `fetchWithRetry` function for retry logic changes
- Adjust model constants for API version updates
- Modify request body structure in each API call function

### Styling Changes
- Use existing Tailwind color palette (`#FF6E14`, `slate-*`)
- Follow the rounded design language (`rounded-2xl`, `rounded-3xl`)
- Maintain brand consistency across all interactive elements
