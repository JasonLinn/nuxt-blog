# Coupon Archive Design

## Goal

Add a reversible archive feature for coupons. Archived coupons are disabled from all public surfaces and are visible only in the admin backend.

## Behavior

- Admins can archive an active coupon without deleting its record.
- Admins can restore an archived coupon.
- Archived coupons are hidden from public coupon listing, search, map data, hot tag calculation, Line coupon listing, and public detail pages.
- Archived coupons remain readable in the admin backend.
- Existing hard delete behavior should no longer be the primary admin action for coupons.

## Data Model

The canonical coupon data currently lives in the `article` table. Add:

```sql
archived_at TIMESTAMPTZ NULL
```

`archived_at IS NULL` means the coupon is active. A non-null value means the coupon is archived and records when the action happened.

## API Design

- Public coupon APIs filter out archived coupons by default.
- Public detail reads return 404 for archived coupons.
- Admin-only APIs can list active and archived coupons.
- Admin-only APIs can archive and restore coupons.

## Admin UI Design

Add a coupon management page at `/admin/coupons` with active and archived views. The active view offers an archive action. The archived view offers a restore action and links to the admin-readable coupon detail.

The existing coupon detail admin action changes from "delete" to "archive" so admins do not accidentally remove records.

## Testing

Add focused Node tests for source-level regression checks:

- Public list queries include an `archived_at IS NULL` filter.
- Public detail queries reject archived coupons.
- Admin coupon archive endpoints update `archived_at` instead of deleting rows.
- The coupon detail page no longer exposes a delete action.

## Out of Scope

- Bulk archive operations.
- Archive reasons or audit user tracking.
- A full redesign of coupon editing or creation.
