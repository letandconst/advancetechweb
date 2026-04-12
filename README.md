# Advanced Tech Web

Advanced Tech Web is an auto repair shop management system focused on day-to-day workshop operations: job orders, service and mechanic management, inventory tracking, audit visibility, user access control, and operational reporting.

The app uses Supabase for authentication and data, React Query for server state, and role-based rules for admin-only features such as user management and settings.

## Core Stack

- Frontend: React 18, TypeScript, Vite
- Routing: React Router
- Data fetching/cache: TanStack React Query
- Backend services: Supabase (Auth, Postgres, RLS, RPC)
- State management: Zustand
- Styling/UI: Tailwind CSS, PostCSS, Lucide icons

## Feature Set

- Authentication
  - Login and forgot-password flow
  - Public signup is disabled (accounts are admin-managed)
  - Route protection for all authenticated pages

- Dashboard
  - Operational overview widgets
  - Low-stock insights based on configurable threshold

- Job Orders
  - Create, update, and manage job order lifecycle
  - Inventory auto-deduction integration when work starts

- Services
  - CRUD for service catalog and pricing references

- Mechanics
  - CRUD for mechanic records
  - Mechanic avatar support with storage policies

- Inventory
  - CRUD and stock adjustments
  - Low-stock indicators and filtering
  - Inventory movement logging support (manual restock and auto-deduct)

- Reports
  - Revenue and job-order trend analytics
  - Service and status breakdowns
  - Inventory movement and audit log views
  - CSV export support

- Users (Admin only)
  - User directory with create, edit, delete
  - Role assignment (`admin` / `user`)
  - Protected admin rules (no peer-admin edit/delete, no self-delete)

- Settings (Admin only)
  - Workshop name and contact defaults
  - Low-stock threshold (used by Dashboard and Inventory)
  - Default reports period
  - Persisted locally via app settings storage

- Profile
  - Personal profile updates
  - Avatar upload and profile-specific account edits

## Security and Access Model

- Row Level Security (RLS) is enabled on Supabase tables used by the app.
- Authenticated access is required for app modules.
- Admin-sensitive actions are enforced in backend SQL functions (`security definer`) and not only in UI.
- Users menu and settings access are admin-only in navigation and page-level checks.

## Project Structure

- `src/components`: shared UI building blocks
- `src/modules`: domain modules (`auth`, `inventory`, `job-orders`, `mechanics`, `services`, `users`, `settings`, `profile`, `reports`)
- `src/pages`: route-level pages
- `src/hooks`: shared hooks (`useAuth`, dashboard/theme helpers, avatar URL handling)
- `src/store`: Zustand stores for auth and UI state
- `src/lib`: Supabase client and query client setup
- `src/constants`: routes, storage keys, app constants
- `src/utils`: utilities (class names, CSV/export, storage helpers)
- `supabase`: SQL scripts for policies, functions, and table setup

## Environment Variables

Create a `.env` file (or copy from `.env.example`) and set:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Start development server:

```bash
npm run dev
```

3. Build for production:

```bash
npm run build
```

4. Preview production build:

```bash
npm run preview
```

## Supabase SQL Setup

Run relevant SQL scripts from the `supabase/` folder in Supabase SQL Editor based on the features you need:

- `services-table-policies.sql`
- `mechanic-avatars-policies.sql`
- `inventory-table-policies.sql`
- `job-orders-table-policies.sql`
- `inventory-logs-table.sql`
- `users-management-policies.sql`
- `inventory-logs-reference-label.sql` (optional reporting/reference enhancement)

Recommended: execute policy/function scripts in a controlled environment first, then validate role behavior using admin and standard user accounts.

## Current Route Map

- `/login`
- `/`
- `/job-orders`
- `/job-orders/new`
- `/job-orders/:id/edit`
- `/mechanics`
- `/users` (admin only)
- `/services`
- `/inventory`
- `/reports`
- `/settings` (admin only)
- `/profile`

## Notes

- Settings currently persist in client storage using `advanced-tech-app-settings`.
- Dark mode preference persists via `advanced-tech-dark-mode`.
