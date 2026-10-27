# Plan purchases and admin overview

The `/admin` frontend reads `GET /api/admin/overview`, protected by the existing
`dashboard` admin permission. It refreshes every minute and on window focus.

Homepage plan checkout uses the existing `/payments/create-order` and
`/payments/verify` endpoints. Prices are resolved on the server. Only orders
verified against Razorpay as captured are reported. Verification stores `paidAt`
and `subscriptionExpiresAt` on the existing Payment document; retrying it does
not extend expiry or create another subscription. No database migration is
required. Older paid plan records use their creation date when a paid date is
not available.

Order creation requires `accountEmail` matching the authenticated user's email.
Typing another learner's email does not transfer the purchase: use checkout's
Switch account action to authenticate as that learner. Existing payments retain
their original owner. Checkout also rechecks the session before opening Razorpay.

Plans are prepaid monthly or yearly memberships, not recurring Razorpay billing.
The dashboard displays expiry, not an automatic next charge. Each purchase is a
separate period. This change reports purchases; course entitlements, team seats,
renewal charging, refunds and webhook reconciliation are separate workflows.
The existing checkout callback must complete verification for an order to appear.

The overview accepts `from`/`to` (inclusive UTC calendar dates), `months` (3, 6 or
12), `search`, `plan`, `status`, and `page` (10 rows per page). Revenue and recent
enrollments follow the date range. Registered students, published courses and
current active subscriber counts are academy-wide. Monthly growth counts unique
purchasers per plan; repeat payments still contribute their actual revenue.

Run frontend and backend using their existing development commands and environment
files. For Windows PowerShell, use `npm.cmd run dev` if script policy blocks npm.

Checks from the backend directory:

```sh
node --test src/utils/subscriptions.test.js src/controllers/dashboard.test.js src/controllers/payment.subscription.test.js
node src/scripts/checkDashboard.js
```

The first command uses isolated fixtures and a mocked payment provider; it does
not charge money. The second is a read-only integration check against the local
running API and configured MongoDB, requiring an existing active administrator.
It verifies authenticated access, anonymous rejection and filter validation.
