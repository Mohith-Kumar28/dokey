## Summary
Build a full document platform on Next.js + shadcn/ui, Postgres via Prisma ORM, and an auth layer that internally uses Clerk Organizations/Roles/Permissions while isolating Clerk from app code. Use TanStack Query (with Axios) for client-side server state. Design all major tools (editor, viewer, variables panel, approvals UI, redline diff, comments) as reusable, pluggable components and services. The Document Editor/Viewer is the core experience: replicate PandaDoc-level functionality with a block palette, fillable fields, recipient assignment, send flows, and robust page/canvas tooling—implemented with shadcn components, not custom-styled elements.

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

## Document Editor & Viewer (Detailed Blueprint)

### Core UX Structure (PandaDoc-like)
- Canvas & Pages:
  - Scrollable canvas with page frames; page size presets (A4/Letter) and zoom controls.
  - Page management: add/remove/reorder pages; page break block.
- Top Bar Actions:
  - Invite collaborators; Send menu (Email/SMS/Link); Document status indicator (Draft/In Review/Approved).
  - Undo/Redo, version history, export (PDF), and More actions (duplicate, delete).
- Right Sidebar Panels:
  - Fillable Fields: Text field, Signature, Initials, Date, Checkbox, Radio group, Dropdown, Billing details, Stamp.
  - Blocks: Text, Image, Video, Table, Pricing table, Quote builder, Page break, Table of contents.
  - Recipients: list, roles (sender, client, etc.), assignment targets.
  - Variables: searchable data merge variables; bindings preview.
  - Properties: styling, branding, alignment, spacing.
- Inline Assignment Toolbar:
  - Appears when selecting a field; controls: Assign recipient, Required, Formatting, Duplicate, Delete, Move layer.
- Left Sidebar (optional):
  - Page thumbnails and quick navigation; document outline.

### Data Model (Prisma)
- `documents (id, orgId, ownerId, title, status, docJson, createdAt, updatedAt)`
- `document_pages (id, docId, order, size, backgroundJson)` — optional for complex paging
- `recipients (id, docId, roleKey, name, email, auth_method, order)`
- `fields (id, docId, pageId nullable, type, rectJson, propsJson, required, assignedRecipientId nullable)`
  - types: text, signature, initials, date, checkbox, radio, dropdown, billing, stamp
  - rectJson: x/y/width/height
  - propsJson: settings/style
- `blocks (id, docId, pageId nullable, type, rectJson, propsJson)`
  - types: text, image, video, table, pricing, quote, page_break, toc
- `variables (id, docId, key, valueJson, source)`
- `deliveries (id, docId, channel, status, metaJson, createdAt)`
- `signing_sessions (id, docId, status, token, createdAt)`
- `signers (id, sessionId, recipientId, order, status)`
- `signature_events (id, sessionId, signerId, type, metaJson, createdAt)`
- Indices and FKs between `documents`, `recipients`, `fields`, `blocks`, `signers`.

### API & Hooks
- Axios client (`src/lib/http.ts`), TanStack Query hooks (`src/features/documents/queries.ts`).
- Endpoints:
  - `/api/documents`: list/create
  - `/api/documents/[id]`: get/update/delete
  - `/api/documents/[id]/recipients`: list/create/update/delete
  - `/api/documents/[id]/fields`: list/create/update/delete; batch updates for drag/resizing
  - `/api/documents/[id]/blocks`: list/create/update/delete
  - `/api/send/[id]`: initiate delivery (email/SMS/link) and return session/link
- Hooks:
  - `useDocument`, `useUpdateDocument`, `useDeleteDocument`, `useCreateDocument`
  - `useRecipients`, `useUpsertRecipient`, `useDeleteRecipient`
  - `useFields`, `useUpsertField`, `useDeleteField`
  - `useBlocks`, `useUpsertBlock`, `useDeleteBlock`
  - `useSendDocument`

### Component Map (shadcn/ui)
- Layout: `Sidebar`, `ScrollArea`, `Card`, `Tabs`, `Button`, `DropdownMenu`, `Dialog`, `Sheet`.
- Inputs: `Input`, `Textarea`, `Select`, `Checkbox`, `RadioGroup`, `Date Picker`.
- Tooling: `Popover`, `Tooltip`, `Menubar`, `Badge`, `Separator`.
- Table/Pricing: use existing `table/*` utilities; pricing as block with configurable items and currency.
- Drag-and-drop: `@dnd-kit` for selection/reorder; field/block resizing via handles.
- Icons: shared `Icons` component; avoid hardcoded sizes and classes.

### Interaction & Editing
- Selection & Editing:
  - Click to select; Inspector shows contextual controls (type-specific props & styles).
  - Assignment: choose recipient from dropdown; quick add recipient within toolbar.
- Drag & Resize:
  - Drag blocks/fields; resize via corners; snap-to-grid and guides.
  - Keyboard nudge and multi-select move.
- Variables & Conditional Logic:
  - Insert variables into text; preview resolved values; block `visible_if` evaluated live.
- Branding:
  - Apply org branding (logo, colors, fonts) via a branding layer; no custom CSS beyond tokens.

### Sending & Recipients
- Wizard (Dialog/Sheet): Get started → Add recipients → Review content.
- Delivery options: Email/SMS/Link; 2FA per recipient; signing order (sequential/parallel).
- Assignment auto-fill: roles help auto-assign common fields.

### Viewer & Signing
- Viewer renders resolved blocks/fields; mobile responsive; scrollable pages.
- Signing flows for type/draw/upload signatures; final certificate appended.

### Analytics & Audit
- Track open/view/sign/download events; dashboards; full audit trail persisted.

### Performance & Safety
- Debounced batch updates for drags/resizes.
- Role/permission gates via auth adapter.
- Avoid custom styles; rely on shadcn components and design tokens.

## Editor Implementation Phases (Step-by-Step)

### Phase A: Shell & Panels
1. Editor page layout: canvas with page frame, right sidebar tabs (Fillable Fields, Blocks, Recipients, Variables, Properties), top bar actions.
2. Implement block palette and field palette lists using shadcn components.
3. Selection model and inline toolbar shell.
Acceptance: Can add blocks/fields to the canvas and select them; sidebar shows basic inspectors.

### Phase B: Drag, Resize, Inspector
1. Drag-and-drop placement; grid/snap; keyboard nudge.
2. Resizable handles; bounds checking.
3. Inspector controls per type (text, image, pricing, field types).
Acceptance: Move/resize/save blocks/fields; inspector changes persist.

### Phase C: Recipients & Assignment
1. Recipients tab with add/edit/delete; role keys.
2. Assign fields to recipients; inline toolbar assignment control.
Acceptance: Add recipients; assign fillable fields; show badges for assignment.

### Phase D: Variables & Conditional Logic
1. Variables tab; insert variables into text blocks.
2. Block `visible_if` rules; live evaluation.
Acceptance: Variables resolve; conditionally hide/show blocks.

### Phase E: Sending Wizard & Link/Email/SMS
1. Send dialog with steps; select channel; signing order; optional 2FA.
2. Create `signing_sessions` and return link/token.
Acceptance: Can initiate a send and retrieve a working share link.

### Phase F: Viewer & Signing
1. Viewer page rendering; mobile-friendly.
2. Signature capture; final certificate generation and attachment.
Acceptance: Signers complete documents; certificate appended in export.

### Phase G: Analytics & Audit
1. Record events; dashboards.
Acceptance: Engagement metrics visible; full audit trail present.

## Build Instructions (Principles)
- Use shadcn components for all UI (Buttons, Lists, Dialogs, Sheets, Tabs, Toolbars) instead of ad-hoc styles.
- Centralize server-state in TanStack Query hooks; use Axios client; no inline fetch logic inside components.
- Keep editor interactions accessible: keyboard navigation, focus states, tooltips.
- Ensure types for blocks/fields/recipients; avoid `any` where possible.
- Start small and iterate: implement shell, then DnD/resize, then inspectors, then recipients, then variables, then sending, then viewer/signing.

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
