## What does this PR do?

This PR resolves four backend reliability and security issues (#584 – #587):

1. **#584 — Webhook retry jitter** (`src/services/webhook.ts`): Added ±20 % random jitter to `getNextRetryDelay()` so retries after a mass failure are spread across a window instead of all firing at the same instant (thundering-herd prevention).

2. **#585 — Canonical webhook signatures** (`src/services/webhook.ts`): Introduced `canonicalJsonStringify()` — a recursive, alphabetically-key-sorted JSON serialiser — and switched both `generateSignature()` and the payload body in `deliverWebhook()` to use it. Subscriber verification is now deterministic regardless of Node version or middleware insertion order.

3. **#586 — Separate recurring-support execution table** (`prisma/schema.prisma`, `src/services/drip-scheduler.ts`, `src/app.ts`): Instead of recording a fake `txHash = 'pending_…'` row in `SupportTransaction`, the drip scheduler now creates a `RecurringSupportExecution` row (status: `pending`). When the user later submits the real Stellar transaction via `POST /support-transactions`, the endpoint validates the execution details match the subscription and atomically marks it `success`. This keeps `SupportTransaction` clean and audit-ready.

4. **#587 — Stellar address as supporterAddress** (`prisma/schema.prisma`, `src/app.ts`): Added `supporterAddress` to `RecurringSupport` and now populate it from `req.auth!.walletAddress` (the verified Stellar public key), not `user.email`. Schema is resilient to future email/wallet-address separation.

### Supporting changes
- `drip-scheduler.test.ts` rewritten to cover the new `recurringSupportExecution.create` path (6 tests, all pass).
- `app.test.ts`: added Test 42b — integration test for `recurringSupportExecutionId` validation; corrected URL-normalisation and sanitize-array expectations.
- `src/middleware/sanitize.ts`: fixed `javascript:` / `data:` scheme blocking, normalised URLs to always return canonical `href` (with trailing slash), and enabled HTML sanitization for plain strings inside sanitised arrays.

## Related issue

Closes #584, #585, #586, #587

## Type of change

- [x] Bug fix
- [ ] New feature
- [x] Refactor
- [ ] Docs / config only

## How to test

1. **Webhook jitter**: Call `getNextRetryDelay(0)` (1 s base) multiple times — values will vary within [800 ms, 1 200 ms].
2. **Canonical signatures**: Sign a payload with keys in arbitrary order; verify with keys in a different order — HMAC should always match.
3. **Recurring execution flow**:
   - `POST /recurring-support` to create a subscription.
   - Inspect the drip-scheduler log — no `SupportTransaction` row is created; a `RecurringSupportExecution` row with `status = pending` appears instead.
   - `POST /support-transactions` with `recurringSupportExecutionId` — mismatched amount/asset/recipient returns `400`; matching details succeed and mark the execution `success`.
4. **Run tests**: `npm test` in `backend/` — all tests pass (DB-dependent tests require `DATABASE_URL`).

## Checklist

- [x] I have read the CONTRIBUTING guide
- [x] My branch is up to date with main
- [x] Linter passes (`npm run lint`)
- [x] Tests pass (`npm test`) if applicable
- [x] I have not committed `.env` files or secrets