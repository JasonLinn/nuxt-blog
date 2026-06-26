# Coupon Archive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a reversible coupon archive flow where archived coupons are disabled publicly and visible only in the admin backend.

**Architecture:** Store archive state in `article.archived_at`. Public coupon reads filter out archived rows, while admin-only endpoints expose active and archived rows plus archive/restore mutations. The admin UI gets a compact coupon management page and replaces public-detail hard delete with archive.

**Tech Stack:** Nuxt 3, Nitro server routes, PostgreSQL via `pg`, Vue SFC pages, Node built-in test runner.

## Global Constraints

- Archived coupons must be hidden from all public surfaces.
- Archived coupons must remain visible in the admin backend.
- Archived coupons must be restorable.
- Do not introduce new dependencies.
- Keep changes scoped to coupon archive behavior.

---

### Task 1: Data Model and Public Filtering

**Files:**
- Create: `scripts/add-coupon-archive.sql`
- Modify: `server/api/articles.get.js`
- Modify: `server/api/articles/[id].get.js`
- Modify: `server/api/hot-tags.get.js`
- Modify: `server/api/webhook.post.js`
- Test: `tests/coupon-archive-source.test.mjs`

**Interfaces:**
- Produces: `article.archived_at TIMESTAMPTZ NULL`
- Produces: public SQL filters using `"archived_at" IS NULL`

- [ ] Write failing source tests that assert public coupon queries filter archived coupons.
- [ ] Run `node --test tests/coupon-archive-source.test.mjs` and confirm the new tests fail.
- [ ] Add the migration SQL and public filters.
- [ ] Run `node --test tests/coupon-archive-source.test.mjs` and confirm the tests pass.

### Task 2: Admin Archive API

**Files:**
- Create: `server/utils/admin-auth.js`
- Create: `server/api/admin/coupons.get.js`
- Create: `server/api/admin/coupons/[id]/archive.post.js`
- Create: `server/api/admin/coupons/[id]/restore.post.js`
- Test: `tests/coupon-archive-source.test.mjs`

**Interfaces:**
- Produces: `requireAdmin(event)` that throws 401 unless `admin_access_token` is valid.
- Produces: `GET /api/admin/coupons?status=active|archived`
- Produces: `POST /api/admin/coupons/:id/archive`
- Produces: `POST /api/admin/coupons/:id/restore`

- [ ] Write failing source tests for archive and restore SQL.
- [ ] Run `node --test tests/coupon-archive-source.test.mjs` and confirm the new tests fail.
- [ ] Implement the admin auth helper and admin coupon endpoints.
- [ ] Run `node --test tests/coupon-archive-source.test.mjs` and confirm the tests pass.

### Task 3: Admin UI

**Files:**
- Modify: `components/AdminHeader.vue`
- Create: `pages/admin/coupons.vue`
- Modify: `pages/articles/[id].vue`
- Modify: `components/couponInfo.vue`
- Test: `tests/coupon-archive-source.test.mjs`

**Interfaces:**
- Consumes: `GET /api/admin/coupons?status=active|archived`
- Consumes: `POST /api/admin/coupons/:id/archive`
- Consumes: `POST /api/admin/coupons/:id/restore`

- [ ] Write failing source tests that the detail page uses archive copy/API instead of delete copy/API.
- [ ] Run `node --test tests/coupon-archive-source.test.mjs` and confirm the new tests fail.
- [ ] Add `/admin/coupons`, add the nav item, and change detail admin actions to archive.
- [ ] Run `node --test tests/coupon-archive-source.test.mjs` and confirm the tests pass.

### Task 4: Full Verification

**Files:**
- No new files.

**Interfaces:**
- Consumes all previous tasks.

- [ ] Run `node --test tests/coupon-archive-source.test.mjs tests/layout-header.test.mjs`.
- [ ] Run `npm run build`.
- [ ] Inspect `git diff --check`.
