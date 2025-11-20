## Summary
Build a full document platform on Next.js + shadcn/ui, Postgres via Prisma ORM, and an auth layer that internally uses Clerk Organizations/Roles/Permissions while isolating Clerk from app code. Use TanStack Query (with Axios) for client-side server state. Design all major tools (editor, viewer, variables panel, approvals UI, redline diff, comments) as reusable, pluggable components and services.

## Doc Access Policy (MCP)
- Context7 MCP: Always use to fetch and reference official docs (Next.js App Router, Prisma, Clerk, TanStack Query, Resend/SES, PDF generation). Resolve library ID first, then pull focused topics.
- shadcn MCP: Always use for component documentation, examples, and CLI add commands; audit checklists after adding components.
- Integrate these MCP calls into development and verification steps for accuracy and up‑to‑date guidance.

## Auth & Access (Clerk-Isolated)
- `src/auth`:
  - `client.tsx`: `AuthProvider`, hooks (`useAuth`,`useUser`,`useOrg`,`useSession`), UI wrappers (`SignIn`,`SignUp`,`UserButton`).
  - `server.ts`: `getAuth(req)`, `requireAuth()`, `hasRole(roleKey)`, `hasPermission(permKey)`, `requireRole(roleKey)`.
  - `types.ts`: normalized `User`, `Organization`, `Role`, `Permission`, `Session`.
  - `adapters/clerk/*`: only place importing `@clerk/*`; maps our interface to Clerk orgs/roles/permissions.
- Middleware: `src/auth/middleware.ts` consumed by `src/middleware.ts` for route protection and role/permission gating.
- Providers: Replace `ClerkProvider` in `src/components/layout/providers.tsx` with `AuthProvider` while keeping theme appearance (dark/light).
- Data linkage: Prisma records store Clerk `orgId`/`userId`; RBAC enforced via adapter at runtime.

## Reusable Tools & Pluginability
- Component-first APIs: All tools expose stable props/events and can be reused across features.
- Block Registry: `src/features/editor/blocks` defines a registry interface (`type`,`schema`,`renderer`,`inspector`).
- Custom Features Upload: Allow orgs to upload custom block definitions (JSON schema + assets) safely—no arbitrary code execution. Version and validate definitions; store in `content_blocks`.
- Services: Shared engines in `src/server/services/*` (render, rule evaluator, merge, audit, analytics). Pluggable senders and CRM adapters.

## Document Creation & Content Management
- Drag-and-Drop Block Editor:
  - Blocks: Text (rich), Image, Video, PricingTable, FileEmbed, CustomBlocks from content library.
  - DnD: `@dnd-kit` with keyboard accessibility.
  - Inspector: shadcn forms for styling, bindings, visibility rules.
  - Persist `doc_json` `{blocks:[{type,props,bindings,visible_if,children}]}` in `documents`.
- Template Library:
  - Seed system templates (`is_system=true`) for proposals/contracts/quotes; preview and “Use Template”.
- Custom Templates:
  - Save any doc as template (`is_system=false`), org-scoped; manage publish/unpublish.
- Content Library:
  - Org reusable blocks in `content_blocks`; searchable insert panel.
- Custom Branding:
  - `branding` table (logo/fonts/colors), applied to Viewer/export.
- File Uploads:
  - Storage adapter abstraction (e.g., S3/R2). Embed PDFs/DOCX/Sheets; server‑side preview thumbnails.
- Conditional Logic:
  - Block `visible_if` via rule builder; shared evaluator for preview/render.
- Data Merge / Variables:
  - Variables panel with `{{client.name}}`, `{{deal.value}}`; bindings resolved at render/send.
  - CRM adapters under `src/server/integrations/*` (start with CSV/manual; add HubSpot/Salesforce later).

## Document Creation Wizard (3 Steps)
- Step 1 — Get Started
  - Options: Start from Template (library grid + search), Upload File (local/Drive/Dropbox/OneDrive), or Blank Document.
  - Components: shadcn Tabs, Card grid, Input for search, file uploader (reuse `src/components/file-uploader.tsx`).
  - Flow: Selecting a template clones into a draft; uploading creates a draft and queues preview generation; blank creates an empty draft.
- Step 2 — Add Recipients
  - Fields: Document name, recipient list with role tags (Sender/Client/Approver), delivery method (Email/SMS/Link).
  - Components: shadcn Form, Combobox (org users via Clerk), Badge for role labels, segmented controls for delivery type.
  - Flow: Persist draft, upsert recipients; pre-assign fillable fields by role where applicable.
- Step 3 — Review Content
  - Opens editor with header actions (Undo/Redo, Invite, Send menu, document menu for properties/duplicate/merge/add to content library/delete).
  - Page ops: add, duplicate, delete, merge, reorder; breadcrumbs and page count.
  - Right sidebar: Fillable fields (Text field, Signature, Initials, Date, Checkbox, Radio, Dropdown, Billing details, Stamp) and Blocks (Text, Image, Video, Table, Pricing table, Quote builder, Page break, Table of contents).
  - Inline assignment toolbar near selection (assign to recipient/role).
  - Variables panel and conditional visibility per block.
  - Autosave, snapshots/versioning, keyboard shortcuts.

## Editor Architecture & UX
- Layout: Header (actions), left page navigator (optional), center canvas (multi-page), right sidebar (Fields/Blocks/Properties).
- Renderer: Abstraction that supports PDF/Docx imported pages and editable blocks; start with pdf.js client previews and block overlays; consider server-generated thumbnails for performance.
- Blocks & Fields: Registry extends with PandaDoc-style fields and content blocks; inspectors configured via shadcn forms.
- Pages Model: Per-page array with properties; operations (add/delete/duplicate/merge/reorder) and undo/redo stack.
- Assignment & Roles: Assign fields/blocks to recipients/roles; enforce lock rules; respect Clerk roles.
- Send & Invite: Menu with Email/SMS/Link; validates approvals complete; records delivery intent.
- Performance: Virtualize page list, throttle layout recalcs, debounce autosave, snapshot diffing for redlines.

## Data Model Additions (Prisma)
- `documents` gains structured `docJson` with `pages: Page[]`, `blocks`, `fields`, and `variables`.
- `document_pages (id, doc_id, order, meta_json)` if normalized; otherwise pages live in `docJson`.
- `document_fields (id, doc_id, page_id, type, props_json, assigned_to_user_id/role_key)` when normalized.
- `recipients (id, doc_id, email, name, role_key, delivery_method)`.
- `versions/snapshots` table for editor history; alternatively keep in `docJson.snapshots` for draft.

## API Endpoints & Hooks
- Wizard:
  - `POST /api/documents` create draft (templateId|upload|blank).
  - `PUT /api/documents/:id/recipients` upsert recipients & delivery.
  - `GET /api/templates` list with search; `GET /api/templates/:id`.
- Editor:
  - `GET /api/documents/:id` load doc;
  - `PUT /api/documents/:id` save `docJson` (pages/blocks/fields/variables);
  - `POST /api/documents/:id/snapshots` record version.
- Sending:
  - `POST /api/documents/:id/send` (Email/SMS/Link) with validation hooks.
- Client hooks (TanStack Query + Axios): `useCreateDocument`, `useDocument`, `useUpdateDocument`, `useDeleteDocument`, `useTemplates`, `useRecipients`.

## Workflow & Collaboration
- Approval Workflows:
  - `workflows`, `workflow_steps` where approver roles are Clerk role keys; enforce lifecycle `draft`→`in_review`→`approved`.
- Redlining:
  - Text block diffs stored in `redlines`; show/hide; accept/reject with audit events.
- Comments:
  - `comments` (doc/block); @mentions via org users; real-time via a provider adapter (e.g., Ably/Pusher/WebSockets).
- Content Locking:
  - `locks` mapping blocks→role keys; editor disables for non-authorized roles.
- Workspaces:
  - Clerk organizations as workspaces; optional sub-teams via org metadata.

## Sending & Distribution
- Email Sending:
  - Pluggable provider (Resend/SES) with brand-aware templates; `deliveries` for status/events.
- Secure Link Sharing:
  - Signed tokens linked to `signing_sessions`; expiration, single/multi-use; watermarking.
- Bulk Sending:
  - Materialize per-recipient docs from templates and datasets; progress and rate limiting.
- Signing Order:
  - Sequential/parallel via `signers.order` and gating logic; visual configurator.

## eSignatures & Compliance
- Capture:
  - Type, Draw (canvas), Upload; normalized per signer.
- Mobile:
  - Responsive signing pages with touch-friendly controls.
- Certificate:
  - PDF appendix with doc hash, signer data, IP/device, timestamps, audit events; attach to final PDF.
- 2FA:
  - Optional SMS OTP providers via adapter; per session/signer config.
- ID Verification:
  - Optional gov ID upload; restricted storage; manual/automated hooks.
- Regulations:
  - ESIGN/UETA/GDPR: explicit consent, immutable logs, retention policies, data subject tooling.

## Analytics & Audit
- Real-Time Notifications:
  - Opened/viewed/commented/signed events; in-app/email alerts.
- Detailed Analytics:
  - `analytics_events` capture page-time, device/location; org dashboards.
- Engagement Feed:
  - Timeline per document/session.
- Audit Trail:
  - Immutable events across lifecycle; appended to certificate and stored in Postgres via Prisma.

## Data Layer (Prisma)
- Prisma schema and migrations for `documents`, `templates`, `content_blocks`, `branding`, `workflows`, `workflow_steps`, `comments`, `redlines`, `locks`, `signing_sessions`, `signers`, `signature_events`, `analytics_events`.
- Client singleton at `src/server/db/prisma.ts` and typed query helpers; server actions only access DB.
- Storage handled via adapter (e.g., S3/R2) with signed URLs and server proxies for protected files.

## Refactors
- `src/components/layout/providers.tsx`: replace `ClerkProvider` with `AuthProvider` preserving theme.
- `src/components/layout/providers.tsx`: add TanStack Query `QueryClientProvider` with sensible defaults.
- `src/middleware.ts`: delegate protection/role gates to `auth/middleware`.
- `src/app/auth/*` and `src/features/auth/*`: use `Auth.SignIn`/`Auth.SignUp` wrappers.
- Remove direct `@clerk/*` imports outside `src/auth/*`.
- Extracted all documents data fetching/mutations into centralized hooks `src/features/documents/queries.ts` using Axios (`src/lib/http.ts`), improving reuse and avoiding ad-hoc fetch logic.
- Fixed NUQS usage by parsing search params at the page level (`searchParamsCache.parse`) before nested server components consume cache; Documents page now mirrors Products page pattern.
- Fixed sign-out UX using programmatic `useAuth().signOut` with Radix `onSelect` to avoid Slot composition errors.
- Added post-auth user sync endpoint (`/api/users/sync`) and client hook to upsert the user into Prisma immediately after sign-in.

## Milestones
1) Auth Layer & Refactor
- Clerk adapter behind auth; providers/middleware/auth views refactored; role/permission checks via auth layer; app compiles. Completed.
2) Prisma Bootstrap & Repos
- Schema/migrations; repositories/services; CRUD UIs for templates/content/branding; storage adapter. In progress (Documents repo and schema done).
3) Editor & Variables/Logic
- DnD editor; variables panel; conditional visibility; content library insert; custom block upload. Editor and basic block registry implemented.
4) Collaboration & Workflows
- Approval steps; realtime comments; redlining; content locking.
5) Sending & eSignatures
- Email sending; secure links; signer order; mobile signing; certificate; optional 2FA/IDV.
6) Analytics & Audit
- Event capture; dashboards; full audit trail attached to final PDFs.

## Implementation Progress & Learnings
- Auth Isolation: Completed. All app code consumes our auth layer; Clerk usage is confined to adapters. Protected routes and theming preserved.
- Prisma Schema: Added `User` model and `Document.ownerId` relation for referential integrity. Migrations applied; `DATABASE_URL` configured.
- Post-Sign-In Sync: A lightweight client-side sync (`/api/users/sync`) upserts the current user into Prisma right after sign-in/sign-up.
- Documents Table: Rebuilt with the same DataTable stack as Products (filters, pagination, sorting). Server-side listing reads `page`, `perPage`, `name`, `status` via NUQS cache.
- Create Flow: Inline “Create Document” button in the table toolbar uses TanStack Query hooks and redirects to the editor upon success.
- Editor & Viewer: Implemented a reusable block registry (text, image, pricing), drag-and-drop reorder, inspector edits, and persistence via Axios-backed hooks.
- Error Handling: API routes now use robust guards and try/catch, returning clear `401/400/404/500` responses.
- Org Scope Fallback: When no org is selected, endpoints use personal scope `user:{userId}`; switching orgs automatically scopes data via session.
- TanStack Query + Axios: Centralized client-side server state with Axios for consistent request semantics and future interceptors.

## Verification & Docs
- Use Context7 MCP for official docs per milestone (Next.js server actions, middleware, Prisma, Clerk org/roles APIs, TanStack Query, Resend/SES, PDF generation).
- Use shadcn MCP for component docs, examples, add commands, and audit checklists.
- Add tests and manual checks each milestone; verify role gates and org scoping.

## Next Steps
- Templates & Content Library: CRUD interfaces and insertion into editor; seeded system templates.
- Variables & Conditional Logic: Variables panel with bindings; extend visibility rules; render resolution.
- Workflow & Collaboration: Approval steps tied to Clerk roles; redlining; realtime comments; content locking.
- Sending & eSignatures: Secure sharing, signer order, capture methods, certificate generation; optional 2FA/IDV.
- Analytics & Audit: Event capture, dashboards, and full audit trail attached to final PDFs.
- Storage Adapter: S3/R2 integration for uploads and secure file access.
