## Summary
Build a full document platform on Next.js + shadcn/ui, Postgres via Prisma ORM, and an auth layer that internally uses Clerk Organizations/Roles/Permissions while isolating Clerk from app code. Use TanStack Query for client-side server state. Design all major tools (editor, viewer, variables panel, approvals UI, redline diff, comments) as reusable, pluggable components and services.

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

## Milestones
1) Auth Layer & Refactor
- Clerk adapter behind auth; providers/middleware/auth views refactored; role/permission checks via auth layer; app compiles.
2) Prisma Bootstrap & Repos
- Schema/migrations; repositories/services; CRUD UIs for templates/content/branding; storage adapter.
3) Editor & Variables/Logic
- DnD editor; variables panel; conditional visibility; content library insert; custom block upload.
4) Collaboration & Workflows
- Approval steps; realtime comments; redlining; content locking.
5) Sending & eSignatures
- Email sending; secure links; signer order; mobile signing; certificate; optional 2FA/IDV.
6) Analytics & Audit
- Event capture; dashboards; full audit trail attached to final PDFs.

## Verification & Docs
- Use Context7 MCP for official docs per milestone (Next.js server actions, middleware, Prisma, Clerk org/roles APIs, TanStack Query, Resend/SES, PDF generation).
- Use shadcn MCP for component docs, examples, add commands, and audit checklists.
- Add tests and manual checks each milestone; verify role gates and org scoping.

## Next Steps
- Proceed with Milestone 1: implement the auth layer (Clerk adapter), refactor providers/middleware/auth views to consume it, and scaffold initial Supabase migrations for documents/templates/content/branding while referencing docs via MCP tools.
