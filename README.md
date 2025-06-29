
---
description: Framework-specific coding standards for Next 15, React 19, and ShadCN  
globs: **/*.ts, **/*.tsx, **/*.js, **/*.jsx  
alwaysApply: false  
---

You are a senior Next.js (v15) developer with extensive expertise in modern React (v19) development, TypeScript, and ShadCN best practices for 2025. Follow these optimized coding standards for all Next 15 development in 2025, incorporating the latest best practices.

## Project Structure

- Maintain Next.js's app directory structure (if using the new App Router). For Next.js v15, lean toward the App Router.
- Organize components within `components/`, categorized by feature or domain.
- Store shared logic in `lib/` or `utils/`.
- Place static assets in `public/`.
- Use `app/layout.tsx` for global layout.
- Keep route segments in `app/` for file-based routing, leveraging nested folders for hierarchical routes.

## Code Style

- Use TypeScript consistently for type safety and maintainability.
- Prefer React 19 functional components with hooks and server components (Next.js 15) for server-side rendering and static site generation.
- Adhere to PascalCase for component filenames and names (e.g., `MyComponent.tsx`).
- Use kebab-case or snake_case for directories and other non-component filenames.
- Leverage ESLint and Prettier for code consistency.

## TypeScript Usage

- Enforce strict mode in TypeScript configuration.
- Define explicit types for component props, server actions (if using Next 15 server actions), and application programming interfaces.
- Avoid the `any` type; utilize generics for reusable and type-safe code.
- Leverage type inference where appropriate but remain explicit in complex cases.
- Use interfaces or type aliases for defining object structures.

## ShadCN UI Integration

- Structure: Keep ShadCN UI components in `@/components/ui/`.
- Tailwind CSS: ShadCN relies on Tailwind for styles, so ensure Tailwind is configured properly in `postcss.config.js` and `tailwind.config.js`. Use consistent class naming and purge unused CSS.
- Always use `npx shadcn@latest add <component>` and not the outdated `shadcn-ui` command.

## Components

- Use Next.js Server Components for most of your user interface if possible, falling back to Client Components for interactive elements.
- For stateful or interactive pieces, define your components as client components (e.g., `"use client";`) at the top of the file.
- Keep components small, focused, and reusable.
- Implement clear prop validation with TypeScript.
- Use ShadCN components to create a consistent design system.

## Icon Usage

- **NEVER use react-icons library** - This is strictly prohibited in this project.
- Instead, use one of the following approaches:
  - Lucide React icons (preferred, already included with ShadCN)
  - Custom SVG components stored in `components/icons/`
  - Inline SVG for simple, one-off icons
- For Discord-specific icons, create custom SVG components that match Discord's design language.
- Example of proper icon usage:
  ```tsx
  import { User, Settings, MessageSquare } from 'lucide-react';
  // NOT: import { FaUser, FaSettings } from 'react-icons/fa';
  ```

## State Management

- Rely on React hooks (`useState`, `useReducer`, `useContext`) for local or small-scale global state.
- Ensure you keep server and client state in sync if dealing with server-side rendering.

## Data Fetching and Server Actions

- Next.js version 15: Use the new Server Actions for server-side logic in forms and actions.
- Use React Suspense to handle loading states.
- For parallel or sequential data fetching, rely on built-in Next.js features (such as `fetch` in Server Components or `use` in React 19 for streaming data).

## Routing

- Adopt the App Router structure (`app/`) with nested folders for route segments.
- Use Route Groups to organize related routes or exclude them from the URL.
- Provide loading states using `loading.tsx` or error boundaries with `error.tsx` in nested layouts.

## Firebase Integration

- Firebase Real Time Database will be used as the primary backend.
- All reads and writes must go through Firebase's Realtime Database SDK.
- Firebase configuration should be centralized and initialized only once per session, ideally in `lib/firebase.ts`.
- Ensure secure, authenticated access using Firebase rules and authenticated user tokens where applicable.

## Discord Authentication and Permissions

- Users will log in using Discord Login (OAuth) for authentication.
- Upon login, user data including Discord roles and permissions will be fetched.
- Users will be sorted and ranked based on their Discord permissions (for example, administrators > moderators > members).
- The homepage will not contain any section displaying Discord users. It should focus only on shared games, planned announcements, or related content.
- Use `next-auth` with a Discord provider to handle authentication securely and efficiently.

## Theme and Visual Identity

- The theme and design language must match Discord’s dark mode palette.
- Primary color scheme should utilize black and dark gray tones similar to Discord’s interface.
- Tailwind’s color palette may be extended in `tailwind.config.ts` to reflect Discord-like values.
- ShadCN components must be customized to feel native within a Discord-styled environment.
- Ensure consistent visual branding throughout all components and pages.

## Performance Optimization

- Take advantage of Next.js Route Segment Configuration for caching and revalidation strategies (`revalidate` option in metadata files).
- Use the minimal set of ShadCN components and purge unused Tailwind CSS classes.
- Avoid blocking the main thread with large client-side JavaScript bundles—leverage code splitting or Server Components wherever possible.

## User Interface

- Use Tailwind CSS for utility-based styling across the application.
- Maintain consistent theming using ShadCN’s design tokens and component system.
- Test all interactive elements and visual components for accessibility, including ARIA labels and proper semantic roles.
- Use a color palette that meets contrast accessibility guidelines.

## Search Engine Optimization

- Use the `metadata` configuration or `Head` in Next.js version 15 for built-in search engine optimization handling.
- Provide `title`, `description`, and other relevant metadata in your layout or page configuration.
- For advanced SEO needs, use Next.js Static Site Generation or Server-Side Rendering metadata updates.

## Development Setup

- Place static assets in the `public/` directory for direct browser access.
- Keep sensitive environment variables in `.env` files and access them using `process.env`.
- Use TypeScript for all source code files.
- Set up ESLint for linting and Prettier for formatting to ensure consistency.
- Consider a monorepo structure (such as `pnpm workspaces` or `Turborepo`) if multiple applications are included in the same repository.

## Best Practices

- Do: Embrace Server Components to reduce client-side JavaScript.
- Do: Use as few dependencies as possible and keep all packages updated.
- Do: Enable TypeScript’s strict mode and utilize advanced features like generics and type guards for safer code.
- Do not: Combine too many state management approaches—begin with simple React hooks.
- Do not: Overuse client components—only use them for truly interactive parts of the application.
- Do not: Hard-code secrets or environment variables directly in source files.

