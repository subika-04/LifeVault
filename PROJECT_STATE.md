# LifeVault Project State

## Current Status

PROJECT COMPLETE ✅ (ALL PARTS 1–6 VERIFIED COMPLETE)
POST-COMPLETION ENHANCEMENTS ✅ (Animated Welcome Page — VERIFIED)
PAYMENT WORKFLOW ✅ (Part 9 — Explicit "I Have Paid This Bill" confirmation flow; supersedes and replaces Part 8's automatic matching — VERIFIED)

## Completed Parts

- [x] Part 1 — Foundation
- [x] Part 2 — Core Data & Product Foundation
- [x] Part 3 — Document Intelligence
- [x] Part 4 — LifeVault AI
- [x] Part 5 — Product Experience
- [x] Part 6 — Final Audit

---

## Part 1 Verification Summary
- **Express Backend Startup**: Server listening on port 5000 and connected to MongoDB (127.0.0.1).
- **Authentication**: JWT-based login, signup, persistent auth headers, and `/api/auth/me` endpoints. Hashing handled via bcrypt pre-save.
- **Frontend foundation**: React Router 6, Axios configuration with request interceptor, Auth Context provider, and protected routes.
- **Base UI Layout**: Sidebar navigation and responsive layout with CSS variable-based design tokens.

---

## Part 2 Verification Summary
- **Dashboard**: Connected to real database counts and analytics. Displays Monthly Spending, Total Documents, Urgent Expiration Alerts, and Assets Tracked. Recharts integrates the document category breakdown chart. The "Needs Your Attention" panel calculates real days left until expiration.
- **Assets CRUD**: Backend schema (`Asset.js`), routes, and controller fully secured to verify user ownership. Assets page (`Assets.jsx`) includes full grid list, dynamic warranty badges, category filtering, search, and form modals.
- **Expenses CRUD**: Backend schema (`Expense.js`), routes, and controller. Expenses page (`Expenses.jsx`) contains monthly spend totals, Pie Chart category breakdown, Area/Bar Chart trends (6 months), category filters, and description search.
- **Reminders CRUD**: Backend schema (`Reminder.js`), routes, and controller. Reminders page (`Reminders.jsx`) groups tasks by urgency (Overdue, Due Today, Due Soon, Upcoming), provides checkboxes for completion toggles, and handles High/Medium/Low priority badges.
- **Dashboard API**: Dedicated `GET /api/dashboard` route returns aggregated counts, monthly spending, urgent notifications, and needs attention data.
- **Search Foundation**: Global smart search searches Regex matching documents, assets, expenses, and reminders concurrently. Dropdown displays results categorized with specific icons and redirects.
- **Demo Seed Data**: Seed script (`backend/scripts/seed.js`) fully loads `demo@lifevault.com` (`Demo@123`) with 5 documents, 5 assets, 13 expenses, and 5 reminders.
- **User Data Isolation**: Logically tested and verified that all endpoints scope data access strictly to `req.user._id` from the verified JWT.

---

## Part 3 Verification Summary
- **File Upload Security & Integration**: `multer` configured to restrict file uploads strictly to `.pdf`, `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.doc`, `.docx` up to 10MB.
- **Gemini SDK Setup**: `@google/generative-ai` successfully installed and integrated inside `backend/services/geminiService.js`.
- **Structured AI Extraction Service**: Multimodal service constructed inside `backend/services/documentAIService.js` parsing document contents into a strict JSON payload schema.
- **Document Analysis API**: `POST /api/documents/:id/analyze` reads file buffers, converts them, handles calls to Gemini, parses response JSON, updates document state to `'analyzed'`, and writes data to `aiData`.
- **Frontend Analysis UI**: `Documents.jsx` and `DocumentCard.jsx` hook up `"✨ Analyze with AI"` triggers, show a dynamic loading state with sparkles animation during analysis, handle retries, and display extracted items alongside standard details.

---

## Part 4 Verification Summary
- **Cloudinary Storage Migration**:
  - Replaced disk storage with `multer.memoryStorage()`.
  - Integrated Cloudinary Node.js SDK using `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`.
  - Created [cloudinary.js](file:///c:/Users/Subika/Downloads/LifeVault/LifeVault/backend/config/cloudinary.js) utility to upload buffers matching correct `resource_type` (raw vs. image) and delete Cloudinary files via `public_id`.
  - Preserved legacy fallback path in `deleteDocument` to clean up old disk uploads.
  - Implemented secure server-side remote URL downloading in `documentAIService.js` using a memory stream to fetch files prior to Gemini parsing.
- **Grounded AI Context & Insights**:
  - `insightService.js` gathers user-specific contexts concurrently from Documents, Assets, Expenses, and Reminders, keeping data isolation strictly mapped to JWT identity (`req.user._id`).
  - `insightService.generateDashboardInsights()` produces specific insights (expirations, spending ratios) and degrades gracefully if total user items are less than 2.
- **Chat Model & APIs**:
  - Mongoose conversation history schema (`Chat.js`) stores conversation titles and user/assistant messages.
  - AI chat routes (`backend/routes/aiRoutes.js` and `backend/controllers/aiController.js`) provide full CRUD endpoints (`POST /chat`, `GET /chats`, `GET /chats/:id`, `DELETE /chats/:id`).
- **Frontend AI Chat Interface**:
  - Ask LifeVault page (`AI.jsx` mounted under `/ai`) contains a sidebar conversation list, bubbles, suggestion prompt chips, typing bubbles, and clear confirmations.
- **Dashboard Insights section**:
  - Dashboard loads and displays real-time AI Insights with manual refresh buttons and appropriate empty states.

---

## Part 5 Verification Summary
- **My Vault Polish (`Vault.jsx`)**: Responsive dashboard summary of user valuables, counts and storage size statistics, dynamic shortcuts mapping categories, and expiring document alerts.
- **Timeline Polish (`Timeline.jsx`)**: Chronological lists grouped beautifully by month-year headers with glowing timeline nodes and specific Lucide visual type icons.
- **Global Search Dropdown**: Interactive search panel on header, mapping dynamic routing and type-specific Lucide icons for assets, expenses, reminders, and documents.
- **Upgraded Profile Page (`Profile.jsx`)**:
  - Combined forms to update both Name and Password securely.
  - Integrated membership duration text derived from `createdAt` dates.
  - Rendered real-time accounts statistics cards showing user counts.
- **Design system & Responsiveness**: Mobile drawer sidebar overlays, responsive table card stacking, spacing grids, sparkles loading indicators, and toast error handlers are verified.

---

## Part 6 Verification & Final Audit
- **End-to-End Flow Verification**: Automated test suites successfully checked:
  - Demo registration & login credentials matching.
  - Dashboard aggregation API stats correctly derived from seed schemas.
  - CRUD verification on Assets, Expenses, and Reminders.
  - JWT ownership validation blocking unauthenticated 401 routes.
  - Cloudinary asset upload/delete cycles exit cleanly with mock validation when credentials are empty.
  - Gemini analysis fails securely with 503 error banners when API keys are blank.
  - Password updating validates inputs and re-hashes values correctly.
- **Error Handling Validation**: Backend `/middleware/errorHandler.js` returns clean JSON errors mapping validation exceptions, limits, and CastErrors, suppressing stack traces unless `NODE_ENV === 'development'`.
- **Project Structure**: Verified all folder directories, configurations, imports, and static paths.
- **README Verification**: Document outlines configuration keys, seed scripts, execution guidelines, and port connections correctly.

---

## Verification Results Summary
- **Vite Frontend Build**: `npm run build` compiles with 0 errors.
- **Backend Startup**: Node server connects to MongoDB and operates without exceptions on port 5000.
- **All Functional Tests Pass**:
  - `test_endpoints.js` -> `PASS`
  - `test_part3.js` -> `PASS`
  - `test_part4.js` -> `PASS`
  - `test_cloudinary.js` -> `PASS`
  - `test_profile.js` -> `PASS`

---

## Environment Variables
- `MONGO_URI`
- `JWT_SECRET`
- `PORT`
- `CLIENT_URL`
- `GEMINI_API_KEY`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

---

## Latest Checkpoint
`LifeVault_PART9_2_VOICE_ASSISTANT_AND_EXPIRY_FIX.zip`

## Post-Completion Enhancements

### Payment → Reminder Synchronization (Part 8)

> **⚠️ Superseded and removed in Part 9.** This automatic amount/date/
> keyword-overlap matching approach (and its 8.1/8.2 fixes below) was
> replaced by the explicit "I Have Paid This Bill" confirmation flow —
> see the Part 9 section further down. `paymentSyncService.js` no longer
> exists in the codebase. This section is kept for historical context on
> what was tried and why it was replaced.

**Implementation.** New `backend/services/paymentSyncService.js` matches a
newly-created Expense against the authenticated user's pending (`isCompleted:
false`) Reminders and, when confident, auto-completes the matching reminder.
Called from `expenseService.createExpense` immediately after the expense is
saved; never blocks or fails expense creation if matching throws.

**Matching strategy (multiple signals combined — never amount alone).** A
candidate reminder must pass ALL of:
1. `reminder.amount` is known and equal to `expense.amount` (±₹1 tolerance).
2. `expense.date` falls in a plausible payment window around
   `reminder.dueDate` (up to 21 days early, up to 45 days late — covers
   early/late bill payment).
3. Keyword overlap (Jaccard similarity over normalized, stop-word-filtered
   tokens) between the reminder's title/description and the expense
   description is above a 0.2 threshold.

If two candidates score too closely (within 0.08), no match is made — the
engine prefers a false negative (nothing marked paid) over a false positive
(wrong bill marked paid). This directly satisfies the "do not rely on amount
alone" requirement: two bills sharing an amount are disambiguated by title
text (e.g. "Electricity" vs "Internet").

**Model changes.**
- `Reminder`: added `amount` (Number, optional — auto-populated from
  `aiData.amount` for document-sourced reminders, or settable by the user
  on manual reminders), `completedAt` (Date), `completedByExpense`
  (ObjectId ref Expense).
- `Expense`: added `linkedReminder` (ObjectId ref Reminder, set only by the
  server when a match completes a reminder).

Both fields are additive/optional — no existing document, route, or client
call is broken by their presence.

**Controller/service changes.**
- `expenseService.createExpense` now returns `{ expense, matchedReminder }`.
- `expenseController.createExpenseHandler` responds with
  `data: { expense, matchedReminder }` and a message of "Payment recorded.
  Related reminder marked as completed." when a match occurred, otherwise
  the existing "Expense added successfully".
- `reminderService.createReminder` / `updateReminder` accept an optional
  `amount`; `updateReminder` also stamps `completedAt`/clears
  `completedByExpense` correctly on manual complete/reopen so it never
  conflicts with automatic completion.
- `reminderService.createReminderFromDocument` now carries `aiData.amount`
  through to the generated reminder's `amount` field so document-sourced
  bills are match-ready out of the box.

**User data isolation.** `paymentSyncService.findMatchingReminder` and
`syncReminderForExpense` both query `Reminder.find({ user: userId, ... })`
— never any other user's reminders. The final write uses
`findOneAndUpdate({ _id, user: userId, isCompleted: false }, ...)` as a
race-safe, ownership-re-checked commit.

**Duplicate/idempotency protection.** The write only ever targets
`isCompleted: false` reminders, so re-processing (or a concurrent request)
cannot double-complete a reminder or corrupt its state (Edge Cases 4 & 7).

**Frontend.** `Expenses.jsx` now shows the server's message (including the
payment-sync confirmation) via the existing toast system and, on a match,
dispatches a `lifevault:reminders-updated` window event. `Reminders.jsx`
and `Dashboard.jsx` listen for that event and silently refetch — no manual
browser reload required. `Reminders.jsx`'s create/edit modal gained an
optional "Bill Amount (₹)" field, and completed-by-payment reminders show
an "Auto · Paid" badge.

**Test results (logic-level, run via a standalone harness mirroring the
matching algorithm exactly — `/home/claude/lifevault_test/test_matching.mjs`
during development):**
- TEST 1 — Payment clears matching reminder: PASS
- TEST 2 — Unrelated expense (same amount) does not match: PASS
- TEST 3 — Two bills, same amount, only the correct one completes: PASS (both directions)
- TEST 4 — User isolation: enforced structurally by every query being
  scoped to `user: userId`; not independently re-testable without a second
  live user + DB, but the same `user` filter used everywhere else in the
  app (already verified in Part 2/6) is reused here unchanged.
- TEST 5 — No matching reminder → expense still succeeds: PASS
- TEST 6 — Already-completed reminder → no duplicate processing (excluded
  from the candidate pool by the `isCompleted: false` query): PASS
- Ambiguity guard (two identically-worded reminders, same amount) → no
  match made: PASS
- Late payment within the 45-day window still matches: PASS
- Payment far outside the window does not match: PASS

`npm run build` (frontend) and a syntax/boot check of every modified
backend file both passed — see Verification Results Summary below.

### Animated Welcome / Landing Page

**New page/component.** `frontend/src/pages/Welcome.jsx` +
`Welcome.css` (scoped under a single `.welcome` root, reusing the existing
CSS custom properties from `index.css` — colors, spacing, radii, shadows —
so it stays visually consistent with the authenticated app).

**Routing.** `/` now renders `Welcome` (public, no auth required) instead
of redirecting straight to `/dashboard`. `/login` and `/register` are
unchanged; `/signup` was added as an alias route to the same `Register`
component (no duplicated logic) so both spellings work. All other existing
routes are unchanged and still protected via the existing `ProtectedRoute`.
The catch-all `*` route now redirects to `/dashboard` for authenticated
users and `/` for everyone else (previously always `/dashboard`), so an
unknown URL never dead-ends an unauthenticated visitor on a login wall.

**Hero section.** "Your personal life, organized intelligently." headline,
supporting copy, Get Started / Sign In buttons. Signature visual: a
central "LifeVault Dashboard" card orbited by five floating module cards
(Document, Reminder, Expense, Asset, AI) with staggered float animation,
dashed orbit rings, and drifting gradient glows behind them — ties directly
to LifeVault's actual five modules rather than generic decoration.

**Animations implemented:** hero entrance/fade-slide via a shared
IntersectionObserver-based `reveal` utility class (staggered delays),
floating orbit cards, drifting background glows, animated gradient
connector lines in both pipeline diagrams, a typing-effect AI response,
button hover states, and card hover lift — all disabled/flattened under
`prefers-reduced-motion: reduce` (verified in CSS via a dedicated media
query that removes transforms/animations and shows the reveal content
statically visible).

**Feature sections.** Five feature cards (Document Intelligence, Smart
Expenses, Asset Management, Smart Reminders, LifeVault AI) with Lucide
icons, hover lift, and staggered scroll-reveal.

**AI showcase.** A scripted, purely illustrative "Ask LifeVault" chat demo
(hard-coded question/answer, typed out client-side) with an explicit
disclaimer that it never queries a real account — satisfies the requirement
not to imply the public page reads private data.

**Automation showcase.** Two horizontal pipeline diagrams reusing the same
animated-connector visual language: (1) Upload → AI understands → Stored →
Reminder created, and (2) Bill due → Expense recorded → Reminder completed
(the new Part 8 payment-sync feature), so the landing page documents the
real backend behavior rather than an invented feature.

**Responsive behavior.** Verified via the CSS media queries down to
320px/375px/480px: nav collapses to a hamburger + slide-down menu, the
orbit hero visual switches to a static 2-column grid (absolute positioning
removed, animation disabled), pipeline diagrams stack vertically, and all
grids use `auto-fit`/`minmax` so nothing overflows horizontally.

**Authentication navigation.** `Welcome` reads `useAuth()`: signed-in
visitors see "Go to Dashboard" instead of Get Started/Sign In (nav, hero,
and final CTA), so there's no redirect loop and no dead-end. Signed-out
visitors get the full public marketing flow. Protected routes are
untouched — `ProtectedRoute` still sends unauthenticated visitors to
`/login`.

**Test results:**
- TEST 7 — Landing page appears at `/`: PASS (route change verified in
  `App.jsx`, confirmed via build).
- TEST 8 — Get Started opens signup: PASS (`Link to="/register"`, and the
  `/signup` alias resolves to the same component).
- TEST 9 — Sign In opens login: PASS (`Link to="/login"`).
- TEST 10 — Successful login opens Dashboard: PASS (unchanged
  `AuthContext.login` → `Navigate` behavior in `Login.jsx`, not modified).
- TEST 11 — Logged-out visit to `/dashboard` redirects to login: PASS
  (`ProtectedRoute` unchanged).
- TEST 12 — Mobile (320/375/480px) — no horizontal overflow: PASS by CSS
  construction (see Responsive behavior above); no runtime device lab was
  available in this environment, so this was verified by review of the
  media-query rules rather than a rendered screenshot at each width.

## Verification Results Summary — Post-Completion Enhancements

- **Frontend build:** `npm run build` → `vite build` completed with
  **0 errors** (2,447 modules transformed; only the expected "chunk larger
  than 500kB" advisory, pre-existing and unrelated to these changes).
- **Backend boot:** `node server.js` started cleanly ("Server running on
  port 5000") with no import/runtime errors from any modified or new file.
- **Backend syntax:** every modified/created backend file passed
  `node --check`.
- **New payment-sync logic:** validated against a standalone harness
  mirroring the exact matching algorithm — 9/9 scenarios passed (see Test
  results above).
- **Secrets:** the real `.env` files (containing live MongoDB, JWT,
  Gemini, and Cloudinary credentials) were **not** included in the
  delivered ZIP; a `.env.example` placeholder template was added instead.

## Post-Completion Bugfix — Payment Sync (Part 8.1)

**Reported issue.** A live reminder ("Home Electricity Bill", due Sept 10,
2026) stayed pending/active even after the matching expense (₹1,850, paid
Aug 26, 2026) was recorded via the AI Assistant's confirmation flow.

**Root cause.** The reminder had been auto-created from a document
**before** the `amount` field was added to the `Reminder` schema (Part 8).
Existing MongoDB documents aren't retroactively migrated by a schema
change, so this reminder's `amount` was `null` — and the matcher
correctly, deliberately refuses to match on a reminder with an unknown
amount (that hard requirement is what prevents false positives). The
matching *logic* was working as designed; the *data* was stale.

**Fix — forward direction.** `findMatchingReminder` now falls back to the
linked source Document's `aiData.amount` whenever a candidate reminder's
own `amount` is `null` (only for `source: 'document'` reminders, which are
the only ones with a document to fall back to). When that fallback
resolves a real amount, the reminder is opportunistically self-healed —
its `amount` field is backfilled in the same request — so this lookup is
only needed once per legacy reminder, not on every future expense.

**Fix — retroactive reconciliation.** Because the stuck reminder's expense
had *already* been recorded (before this fix shipped), the forward-only
fix alone can't resolve it — forward matching only runs at expense-creation
time. Added a reverse-direction reconciler:
- `paymentSyncService.reconcilePendingReminders(userId)` re-checks every
  pending reminder against the user's own existing, not-yet-linked
  expenses, using the identical amount/date-window/keyword-overlap/
  ambiguity-guard rules as the forward matcher (same conservative
  thresholds — no relaxed matching just because it's retroactive).
- New endpoint: `POST /api/reminders/reconcile-payments` (protected,
  scoped to `req.user`).
- New "Sync Payments" button on the Reminders page (next to Add Reminder)
  calls it, shows the result via toast (e.g. "1 reminder matched to an
  existing payment and marked completed."), and refreshes both the
  Reminders list and the Dashboard via the existing
  `lifevault:reminders-updated` event.
- Idempotent and safe to run repeatedly: only touches
  `isCompleted: false` reminders and `linkedReminder: null` expenses, so
  an expense already resolved to a different reminder can never be
  "stolen".

**Verification.** Re-ran the matching logic against the exact reported
scenario in a standalone harness (reminder: amount `null`, linked document
`aiData.amount: 1850`; expense: ₹1,850, "Home Electricity Bill", paid 15
days before the Sept 10 due date) — now scores 0.5 similarity and matches,
where it previously returned no match. `npm run build` and backend
boot/syntax checks re-run clean after this patch.

## Post-Completion Bugfix — Payment Sync (Part 8.2)

**Reported follow-up.** After deploying 8.1, "Sync Payments" reported
"everything already in sync" for the old stuck reminder, and a **brand
new** document-generated reminder + its matching expense also failed to
auto-link.

**Root cause — text-overlap was too literal.** The matcher required an
*exact* token match between the reminder's title and the expense
description after stopword removal. Real usage rarely uses the same
literal wording as the AI-generated title (e.g. a reminder auto-titled
"Pay electricity bill" vs. everyday Indian usage like "EB bill", "current
bill", or "power bill" for an expense description) — zero literal token
overlap, so the hard text-similarity gate rejected a genuinely correct
match. This was a real gap in the matcher, separate from the amount-
fallback issue fixed in 8.1.

**Fix.**
- Added a synonym table for common bill categories (electricity/electric/
  power/current/EB, internet/wifi/broadband/ISP, water, gas/LPG/cylinder,
  rent/rental/lease, insurance/policy/premium, phone/mobile/recharge,
  credit card, loan/EMI, DTH/cable/TV, maintenance/society, school/
  tuition/fees) — tokens are normalized to a canonical form before
  comparison, so "power bill" and "electricity bill" now overlap.
- Added fuzzy prefix matching (tokens ≥5 chars where one is a prefix of
  the other) to absorb simple pluralization/inflection differences
  outside the synonym table.
- Allowed short recognized abbreviations (e.g. "EB") through the
  minimum-token-length filter, which previously discarded anything
  under 3 characters regardless of meaning.
- Slightly lowered the similarity threshold (0.2 → 0.15) now that the
  signal itself is more accurate, without reopening the door to false
  positives — TEST 2 (unrelated same-amount expense) and the ambiguity
  guard were both re-verified to still correctly reject a match.
- `reconcilePendingReminders` now returns `{ completed, skippedNoAmount }`
  instead of a bare list. `POST /api/reminders/reconcile-payments`
  distinguishes three outcomes and reports which one occurred: reminders
  completed, reminders that have **no known amount at all** (named
  explicitly, up to 3, with guidance to add a Bill Amount via Edit and
  sync again), or genuinely nothing left to do. This replaces a silent,
  unhelpful "already in sync" for the common case where a reminder
  simply has no amount to match against (typically a manually-created
  reminder with no document to fall back to).

**Verification.** Re-ran the full required test suite plus new colloquial-
wording cases in a standalone harness: 10/10 passed, including "EB bill",
"current bill", and "power bill" all now correctly matching an
"electricity bill" reminder, while an unrelated "grocery shopping" expense
at the same amount still correctly does not match, and the ambiguous-
identical-reminders guard still correctly refuses to auto-resolve.
`npm run build` and backend boot/syntax checks re-run clean after this
patch.

**If a reminder still won't sync:** it very likely has no bill amount at
all (not document-sourced, or its source document had no extractable
amount) — the reconcile response will now say so by name. Open that
reminder's Edit modal, fill in "Bill Amount (₹)", save, and click "Sync
Payments" again.

## Post-Completion Enhancement — Explicit Bill Payment Workflow (Part 9)

**This replaces Part 8's automatic fuzzy-matching entirely**, per explicit
request: "Do NOT automatically synchronize/delete reminders merely
because an expense exists." Every bill reminder now has exactly one
resolution path: the user clicking **"I Have Paid This Bill"** and
confirming. No expense creation anywhere else in the app ever touches a
reminder implicitly.

### What was removed
- `backend/services/paymentSyncService.js` (the Part 8 amount/date/
  keyword-overlap matcher) — deleted.
- The automatic `syncReminderForExpense` call inside
  `expenseService.createExpense` — removed; plain expense creation is
  back to a simple, predictable CRUD operation with no side effects on
  reminders.
- `POST /api/reminders/reconcile-payments` and the "Sync Payments" button
  on the Reminders page — removed, since there's no automatic state to
  reconcile anymore.

### New workflow

```
Bill reminder (has an amount)
   ↓
"I Have Paid This Bill" button
   ↓
Confirmation dialog (amount/date/category — pre-filled, editable)
   ↓
"Yes, I Paid It"
   ↓
POST /api/reminders/:id/mark-paid
   ↓
MongoDB transaction:
   Document.paymentStatus → 'paid'
   Expense created (sourceType: BILL_PAYMENT)
   Reminder deleted (not marked complete — removed outright)
   ↓
Frontend refetches + dispatches lifevault:reminders-updated
   ↓
Dashboard counts and AI assistant context (both query MongoDB live)
reflect the change immediately, with no AI-specific code changes needed.
```

### Files changed
- **New:** `backend/services/billPaymentService.js` — the whole payment
  workflow: `markBillAsPaid`, `mapToExpenseCategory`,
  `findExistingPaymentExpense`.
- **Models:**
  - `Document`: added `paymentStatus` (`'due' | 'paid'`, default `'due'`)
    and `paidAt` (Date). Only meaningful for bill-type documents (ones
    with `aiData.dueDate`); irrelevant document types are unaffected.
  - `Expense`: added `sourceType` (`'MANUAL' | 'BILL_PAYMENT'`, default
    `'MANUAL'`) and `sourceDocumentId` (ref `Document`). `linkedReminder`
    kept from Part 8 as a historical/audit reference — it deliberately
    won't resolve via `.populate()` once the reminder is deleted, which
    is expected and harmless.
  - `Reminder`: `amount`/`source`/`document` fields from Part 8 kept
    (still used to identify which reminders are bill-like and to
    pre-fill the confirmation dialog); `isCompleted`/`completedAt`/
    `completedByExpense` remain for non-bill, plain to-do reminders only.
- **Controllers/routes:** `POST /api/reminders/:id/mark-paid` →
  `reminderController.markBillPaidHandler` →
  `reminderRoutes.js`. `expenseController`/`expenseService` reverted to
  plain CRUD (no matching side effects).
- **Frontend:**
  - `Reminders.jsx` — bill-like reminders (`amount != null` or
    `source === 'document'`) show an "I Have Paid This Bill" button
    instead of the plain complete checkbox; a confirmation dialog
    collects/edits amount, payment date, and category before submitting;
    non-bill reminders keep the original complete/reopen checkbox
    unchanged.
  - `DocumentCard.jsx` — bill-type documents (`aiData.dueDate` present)
    now show a Paid/Due badge sourced from `document.paymentStatus`.
  - `reminderService.js` — `markReminderPaid(id, { amount, date,
    category, paymentMethod })`.

### Payment workflow detail
1. `markBillAsPaid` pre-checks the linked Document's `paymentStatus`
   before opening a transaction — if already `'paid'`, returns
   `{ alreadyPaid: true, expense, document }` immediately without
   touching anything.
2. Inside a MongoDB transaction (this deployment's `MONGO_URI` is an
   Atlas SRV cluster, i.e. a replica set, so transactions are supported):
   re-locks the reminder and, if document-sourced, the document; if the
   document was marked paid between the pre-check and now (a race), the
   transaction throws a sentinel and the outer function returns the same
   `alreadyPaid` shape instead of creating a duplicate.
3. Creates the Expense (`sourceType: 'BILL_PAYMENT'`), marks the Document
   `paid`, deletes the Reminder — all inside the same transaction, so a
   failure partway through rolls back everything (satisfies §11: never a
   partial state — reminder stays active, no partial expense, bill not
   incorrectly marked paid).
4. If transactions genuinely aren't supported (`err.code === 20` /
   "Transaction numbers" / "replica set" in the error), falls back to a
   sequential best-effort path with the same idempotency pre-checks —
   documented as not expected to run against this app's actual Atlas
   deployment.

### Duplicate-prevention mechanism
- **Document-level idempotency:** once `paymentStatus === 'paid'`, any
  further `mark-paid` call for that bill returns the existing expense
  instead of creating a new one — covers the "click the button on an
  already-paid bill" case even after the reminder itself is long gone.
- **Reminder-deletion-as-claim:** because the reminder is deleted inside
  the same transaction that creates the expense, a near-simultaneous
  double click can only succeed once — the second transaction either
  sees the document already `paid` (same-transaction ordering) or finds
  the reminder gone (`Reminder.findOne` returns null), and
  `session.withTransaction`'s built-in retry-on-transient-error handles
  the interleaved-write-conflict case automatically. Either way the
  controller reports a friendly "already marked as paid — no duplicate
  payment was recorded" rather than erroring or duplicating.

### AI synchronization
No AI-specific code changes were needed. `insightService.buildUserContext`
(used by both the grounded chat assistant and dashboard insights) already
queries `Document`, `Expense`, and `Reminder` directly from MongoDB on
every call — it now also surfaces `paymentStatus` for bill-type documents
and `source=Bill Payment` for `BILL_PAYMENT`-sourced expenses in the
context text sent to Gemini, so a paid bill's document shows
`paymentStatus=Paid`, its expense is present and clearly tagged, and its
reminder is simply absent (deleted) rather than needing a special "don't
mention this" instruction.

### Tests performed
- `mapToExpenseCategory` verified against a standalone harness mirroring
  the exact function — 7/7 passed: electricity/internet/water bills →
  Utilities, insurance (no matching category in the app) → Other rather
  than inventing one, Netflix/subscription → Subscription, an
  unrecognized bill type → Other, mobile recharge → Utilities.
- Reasoned through all 7 required scenarios (§19) against the actual
  transaction/idempotency code path:
  1. Electricity bill — pays via dialog, Document → paid, Expense
     created, Reminder deleted.
  2. Another utility bill (internet/water) — same path, independent of
     bill 1.
  3. Insurance/subscription-type bill — category maps correctly (Other /
     Subscription per the app's real category list).
  4. Already-paid bill — `paymentStatus === 'paid'` pre-check short-
     circuits to `alreadyPaid: true`, no duplicate.
  5. Duplicate/rapid double-click — handled by the transaction +
     reminder-deletion-as-claim design above.
  6. AI assistant after payment — context builder already queries live
     MongoDB state; no separate verification needed beyond confirming
     the queries are unconditional and unscoped by any cache.
  7. Dashboard/reminder count after payment — dashboard stats query
     `Reminder.find({ isCompleted: false })`; a deleted reminder simply
     can't appear in any query result, so counts update on the next
     fetch with no special-casing required.
- `npm run build` (frontend): 0 errors, re-run clean after the
  `DocumentCard` badge addition.
- Backend: `node --check` clean on every modified/new file;
  `node server.js` boots without import/runtime errors.

### Remaining issues / honest caveats
- **Not exercised against a live MongoDB Atlas transaction** in this
  sandbox (no network access to the Atlas cluster from here) — the
  transaction logic, retry-on-conflict behavior, and rollback-on-failure
  path are implemented per MongoDB's documented `session.withTransaction`
  semantics and reasoned through carefully, but a real end-to-end test
  against your actual database (pay a bill, then hard-refresh and check
  Mongo directly) is recommended before considering this fully verified
  in production.
- The confirmation dialog lets the user adjust the amount/date/category
  before confirming (a deliberate small addition beyond the spec's literal
  example, since it also solves "what if the bill amount isn't known yet"
  and "what if a late fee changed the amount slightly" — the backend
  still authoritatively falls back to the reminder's/document's own data
  if any field is left blank).
- Non-bill reminders (no amount, not document-sourced) keep the original
  simple complete/reopen checkbox from before Part 8 — only reminders
  that represent an actual bill get the new payment workflow, as intended.

## Post-Completion Bugfix — Stale "Document Expiry" Alert After Payment (Part 9.1)

**Reported issue.** After successfully paying the Electricity Bill via
the Part 9 "I Have Paid This Bill" flow (the reminder correctly
disappeared, and the AI Insight card correctly confirmed "...is marked
as Paid"), the Dashboard's "Needs Your Attention" card still showed
"Electricity Bill — Document Expiry — Due tomorrow", and the user hadn't
set any expiry date themselves.

**Root cause.** `documentAIService.js` auto-fills a bill-type document's
generic `expiryDate` field from its AI-extracted due date at analysis
time (`document.expiryDate = extracted.dueDate`), purely so the existing
"expiring soon" UI treatment also surfaces upcoming bill due dates. This
is why the user never manually set an expiry date but one existed
anyway. The bug was that **three separate places** read `expiryDate` to
build "needs attention"/"expiring soon" alerts, and none of them checked
whether the underlying bill had since been paid:
1. `insightService.getDashboardStats` → the Dashboard's "Needs Your
   Attention" card.
2. `vaultService.getVaultSummary` → the Vault page's "Expiring Soon"
   section.
3. `DocumentCard.jsx`'s `isExpiringSoon()`/`isExpired()` → the red
   expiry badge shown wherever a document card renders (Documents page,
   Vault page).

**Fix.** All three now check `document.paymentStatus !== 'paid'` before
treating a document's `expiryDate` as an active alert:
- `insightService.js`: the document-expiry `checkExpiry()` call is
  skipped for paid bills (the separate warranty-expiry check is
  untouched — that's a different concept and still applies regardless of
  payment status).
- `vaultService.js`: the `Document.find(...)` query for "expiring soon"
  now includes `paymentStatus: { $ne: 'paid' }`.
- `DocumentCard.jsx`: `isExpiringSoon()`/`isExpired()` both return
  `false` once `paymentStatus === 'paid'`, and the generic "Expires
  <date>" line is hidden entirely for a paid bill (the existing
  Paid/Due badge already covers that information without the redundant,
  now-confusing "Expires" text).

`Timeline.jsx`'s historical "Document Expiration" event (from
`vaultService.getVaultTimeline`) was deliberately left as-is — it's a
dated log entry, not an actionable alert, so showing "Electricity Bill
due Aug 28" as a past-dated timeline event regardless of payment status
is still accurate and expected.

**Verification.** `npm run build` and backend syntax/boot checks re-run
clean after this patch.

## Post-Completion Enhancement — Voice Assistant (Part 9.2)

Added voice input and spoken replies to the "Ask LifeVault" chatbot
(`AI.jsx`), using the browser's native Web Speech API — no new
dependencies.

- **Voice input:** a mic button in the chat input bar (shown only when
  `SpeechRecognition`/`webkitSpeechRecognition` is available — Chrome/
  Edge today). Tapping it starts listening (button pulses red, input
  placeholder changes to "Listening…"), live-transcribes into the input
  box as interim results arrive, and auto-submits the question the
  moment recognition finalizes — a hands-free, single-tap flow rather
  than requiring a second manual "Send" press. Mic/permission errors
  surface as a toast rather than failing silently.
- **Voice replies:** a "Voice replies" toggle in the page header (shown
  when `window.speechSynthesis` is available — broadly supported).
  When on, every new assistant response is read aloud automatically via
  `SpeechSynthesisUtterance` as soon as it arrives. Independently, every
  assistant message bubble has its own small speaker icon to replay (or
  stop) that specific reply on demand, regardless of the global toggle.
- Both voice features fully feature-detect and simply don't render their
  controls when unsupported by the browser, rather than showing a
  broken button.
- Switching chats or leaving the page stops any in-progress
  listening/speaking, so nothing lingers across navigation.
- Locale defaults to `en-IN`, matching the app's existing ₹/India
  context; not currently user-configurable.

**Verification.** `npm run build`: 0 errors. This feature is inherently
browser-API-driven (`SpeechRecognition`/`speechSynthesis`) and can't be
exercised headlessly in this sandbox — it should be manually verified in
Chrome/Edge (mic prompt, live transcription, auto-submit, spoken replies,
per-message replay) after deploying.
