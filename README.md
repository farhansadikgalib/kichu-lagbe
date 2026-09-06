# KichuLagbe

**KichuLagbe** is a production-grade, e-commerce-focused web application.

From this point forward, treat KichuLagbe as a **production-grade application** — not a prototype or a temporary project. Every implementation should strengthen the four core principles: **Consistency, Reusability, Scalability, and Maintainability.**

## Core Goals

- Clean and maintainable architecture
- Scalability
- Consistency
- Reusability
- Performance
- Accessibility
- Type safety
- Strong UX
- Production-grade code quality
- Minimal code duplication
- Easy long-term maintenance

---

## Application Modules

KichuLagbe follows the module structure of the reference product ([https://deliverylagbe-xyz.web.app/](https://deliverylagbe-xyz.web.app/)) — a late-night food, cigarettes, and daily-essentials delivery service for Badda, Dhaka.

### 1. Storefront / Catalog Module
- Homepage with hero, service highlights (avg. ~30 min delivery, 8:00 PM – 3:00 AM service window, Badda coverage)
- Homepage sections are data-driven: the layout lives in `app_settings.homeLayout` (see `src/lib/home/schema.ts`) and falls back to the shipped defaults
- Product browsing by category: **Food**, **Cigarettes**, **Daily Products** (milk, eggs, bread, etc.)
- Products may carry priced options (`product_variants`); the card shows a "from" price and an option picker
- Product search and category navigation

### 2. Cart Module
- Add/remove/update cart items with live cart count
- Subtotal, delivery charge, and total calculation
- Coupon/discount code application with validation feedback

### 3. Checkout & Order Module
- Checkout form with delivery details
- Order summary and order placement
- Order tracking (pending → completed states)
- Order history with total orders and total spending

### 4. Authentication & Account Module
- Email/password registration and login
- Google Sign-In (OAuth)
- Email verification and verification status
- Forgot-password / password-reset flow
- Profile management (name, phone, avatar, password change)

### 5. Rider Module
- Dedicated rider access/login
- Rider-side order handling and delivery workflow

### 6. Admin Module
- Admin access/login
- Management of products (with image upload and priced options), orders, coupons, and users
- Home page builder (`/admin/home`): reorder, show/hide, add and edit sections with a live preview of the real storefront (`/preview/home` in an iframe, fed by `postMessage`); publishing revalidates `/`
- Image uploads are stored in Postgres (`media` table) and served from `/api/media/[id]` with immutable caching — no extra storage service required

### 7. Notifications & Engagement Module
- Push notifications (order status updates)
- Promotional popups/announcements

### 8. Platform Module
- Installable PWA (manifest, app shortcuts, standalone mode)
- Mobile footer navigation and fully responsive UI
- SEO (metadata, Open Graph, structured data) and analytics

Each module should be implemented as a clearly separated, reusable feature area following the architecture, consistency, and reusability standards defined below.

---

## 1. Documentation & Source of Truth

Before making major architectural or implementation decisions, study and follow the **official documentation** for the technologies used in this project. Use these as the primary technical references:

| Technology | Documentation |
|------------|---------------|
| Next.js | https://nextjs.org/docs |
| GSAP | https://gsap.com/docs/v3/ |
| Tailwind CSS | https://tailwindcss.com/docs/installation/using-vite |
| shadcn/ui | https://ui.shadcn.com/docs/installation |
| Motion | https://motion.dev/docs |
| Lenis | https://github.com/darkroomengineering/lenis/blob/main/README.md |
| Zustand | https://zustand.docs.pmnd.rs/ |
| SWR | https://swr.vercel.app/docs/getting-started |

Always prefer official documentation and current recommended patterns over outdated tutorials, deprecated APIs, or arbitrary implementation patterns. If a technology's recommended architecture or API changes, follow the **current** official recommendation.

---

## 2. Project Documentation / AI Guidelines

Create and maintain project-level documentation that enforces these standards. When appropriate, create or update:

- `AGENTS.md`
- `CONTRIBUTING.md`
- Architecture documentation
- Component guidelines
- Styling guidelines
- State-management guidelines
- Data-fetching guidelines
- Animation guidelines

These documents act as a source of truth for future development. **Do not create documentation just for the sake of creating files** — documentation should be useful, concise, and actionable. Whenever an important architectural decision is made, document it so future development stays consistent.

---

## 3. Architecture & Folder Structure

Use a production-grade, scalable folder structure that:

- Clearly separates responsibilities
- Keeps business logic separate from UI where appropriate
- Avoids unnecessary coupling
- Supports feature growth
- Makes components easy to discover
- Makes shared functionality reusable
- Prevents large monolithic files
- Avoids unnecessary nesting
- Follows Next.js App Router best practices

Do not introduce a folder structure simply because it is popular. Choose the structure based on the actual needs of KichuLagbe. Before introducing a new architectural pattern, check whether an existing project pattern already solves the problem.

---

## 4. Reusability — Do Not Repeat Code

Reusability is a **core requirement**. Do not duplicate code unnecessarily. Before creating a new component, hook, utility, or helper:

1. Check whether an existing implementation can be reused.
2. Check whether an existing component can be extended.
3. Check whether the functionality belongs in a shared abstraction.

Only create something new when it provides a clear architectural benefit.

**Reusable abstractions include:** UI components, layout components, section components, cards, buttons, forms, modals, navigation elements, animation wrappers, custom hooks, API utilities, validation utilities, formatting utilities, constants, types, and data-fetching helpers.

Build components to be reusable **without** turning simple components into unnecessarily complex abstractions.

---

## 5. Consistency Is Mandatory

The same design or functionality should not be implemented differently across the project without a valid reason. Maintain consistency in:

- Component APIs, naming conventions, folder structure
- Typography, spacing, colors, responsive behavior
- Buttons, forms, cards, modals
- Loading states, error states, empty states
- Animations and transitions
- Accessibility
- Data fetching, state management, API handling

If an established project pattern exists, follow it instead of introducing another approach.

---

## 6. Styling & Design System

- Use **Tailwind CSS** as the primary styling solution.
- Use **shadcn/ui** for accessible, reusable UI primitives where appropriate.
- Do not create arbitrary one-off styling when an existing design-system token or utility can be reused.

Maintain centralized design tokens for: colors, typography, spacing, border radius, shadows, transitions, and layout constraints. The UI should feel like **one coherent product** — an e-commerce storefront where every page, from catalog to checkout, shares the same visual language.

---

## 7. Animation Architecture

Use the correct animation library for the use case.

**GSAP** — complex timelines, scroll-driven animations, cinematic animations, advanced sequencing, high-control animations.

**Motion** — component animations, micro-interactions, enter/exit animations, layout animations, UI state transitions.

**Lenis** — smooth scrolling and scroll-related experiences where appropriate.

Do not use multiple animation libraries for the same simple interaction without a clear reason. Animations must never compromise **performance, accessibility, responsiveness, user interaction, or maintainability**. Respect `prefers-reduced-motion` where appropriate.

---

## 8. State Management

Use **Zustand** for genuinely shared client-side global state — and only when global state is actually required. Do not put everything into Zustand.

- **Local React state** for local UI state
- **SWR** for server state / data fetching
- **Zustand** for genuinely shared client-side state (e.g. cart, auth session, UI shell)

Keep stores modular and focused. Avoid a single massive global store.

---

## 9. Data Fetching

Use **SWR** as the standard data-fetching solution for client-side / server-state fetching. Follow SWR's recommended patterns for fetching, caching, revalidation, error handling, loading states, mutations, and optimistic updates where appropriate.

Do not build a custom data-fetching abstraction when SWR already provides the functionality. Keep API-related logic organized and reusable — **avoid scattering raw `fetch()` calls throughout UI components** (product listings, cart, orders, and checkout should all consume shared data hooks).

---

## 10. TypeScript

Use TypeScript strictly and properly:

- Avoid `any` unless genuinely unavoidable.
- Define reusable types/interfaces where appropriate.
- Keep API response types explicit (products, orders, users, carts, coupons).
- Type component props, hooks, and utilities.
- Avoid unnecessary type duplication.
- Prefer inferred types when explicit typing provides no value.
- Keep domain types organized and reusable.

Treat type safety as **part of the architecture**, not an afterthought.

---

## 11. Next.js Best Practices

Follow current Next.js App Router best practices, paying particular attention to:

- Server Components vs Client Components
- Server-side, static, and dynamic rendering
- Metadata, SEO, and structured data (critical for e-commerce product pages)
- Image and font optimization
- Route organization
- Loading states, error boundaries, not-found handling
- Caching and performance

Do not add `"use client"` unless the component actually requires client-side functionality. Keep the client bundle as small as reasonably possible.

---

## 12. Performance

Performance is a **first-class requirement**. Always consider: bundle size, client JavaScript, image optimization, lazy loading, code splitting, rendering strategy, animation performance, layout shifts, unnecessary re-renders, expensive computations, network requests, and caching.

Do not optimize prematurely — but do not introduce obvious performance problems.

---

## 13. Accessibility

Accessibility must be considered **during** implementation, not added later. Follow appropriate practices for: semantic HTML, keyboard navigation, focus management, ARIA where necessary, color contrast, form labels, interactive elements, modals/dialogs, navigation, and reduced motion.

Prefer **shadcn/ui** primitives where they provide the required accessible behavior.

---

## 14. Error, Loading & Empty States

Every data-driven or asynchronous UI must properly consider **loading, error, empty, and success** states. Do not leave users with blank screens or broken UI when data is loading or unavailable (empty carts, no search results, failed checkout, etc.). Create reusable patterns for common states instead of reimplementing them on every page.

---

## 15. Code Quality

Write code another professional developer can understand and maintain.

**Avoid:** duplicate logic, giant components/hooks/stores, hardcoded repeated values, magic numbers, unnecessary abstractions, deeply coupled components, dead code, unused imports, deprecated APIs, temporary hacks, and copy-pasted implementations.

**Prefer:** small focused components, clear naming, single responsibility, composition, reusable utilities, strong typing, predictable data flow, and explicit boundaries.

---

## 16. Before Making Changes

Before implementing or modifying a feature:

1. Inspect the existing project structure.
2. Understand the current architecture.
3. Search for existing reusable components/utilities.
4. Check existing conventions.
5. Identify whether the functionality already exists elsewhere.
6. Reuse existing patterns whenever possible.
7. Determine the correct architectural location for the change.
8. Implement the smallest clean solution that fits the existing architecture.
9. Check for unintended duplication or inconsistency.
10. Verify the change does not unnecessarily affect unrelated parts of the app.

**Do not blindly create new files or abstractions.**

---

## 17. When Existing Code Is Poor

If existing code does not follow these standards, do **not** automatically rewrite the entire project. Instead:

- Preserve working functionality.
- Improve the affected area incrementally.
- Refactor when it provides clear value.
- Avoid unnecessary breaking changes.
- Maintain consistency with the newer architecture.
- Gradually move legacy patterns toward the project's established standards.

---

## 18. Production-Grade Mindset

Always think beyond "make it work." For every implementation ask:

> *"Would this still be a good solution if KichuLagbe grows significantly?"*

Consider maintainability, scalability, reusability, performance, accessibility, developer experience, future feature requirements, and long-term consistency. Do not over-engineer simple requirements — but do not take shortcuts that create unnecessary technical debt.

---

## 19. Decision Priority

When making implementation decisions, prioritize in this order:

1. Correctness
2. Existing project architecture
3. Official framework/library best practices
4. Reusability
5. Maintainability
6. Performance
7. Accessibility
8. Developer experience
9. Simplicity

---

## 20. Golden Rules for KichuLagbe

- Do not duplicate code.
- Reuse existing components whenever possible.
- Do not create multiple solutions for the same problem.
- Follow established project patterns.
- Keep architecture scalable.
- Keep components focused and composable.
- Use the correct library for the correct problem.
- Prefer official documentation over outdated patterns.
- Do not introduce unnecessary dependencies.
- Do not over-engineer.
- Do not sacrifice maintainability for speed.
- Keep UI/UX consistent across the entire project.
- Treat performance and accessibility as first-class requirements.
- Before adding something new, search the existing codebase first.

---

## Most Important Principle

**Consistency + Reusability + Scalability + Maintainability**

Every implementation in KichuLagbe should strengthen these four principles rather than work against them.

From now on, treat these guidelines and the official documentation above as the project's development standards, and apply them consistently to every future task.
