# User Reports

`GET /api/admin/user-reports` requires the `reports` admin permission and includes
the mentor options needed by that page, without requiring instructor-management
permission. It returns one row per registered student and any other account with
verified purchases, including purchasing admins. Students without purchases and
plan-only customers are included. Payment data is restricted to paid orders.

The table groups purchased courses and displays every purchased plan as a badge.
Plan/status filters match individual memberships, including older plans. The
summary status/expiry columns describe the most recent active membership, or the
latest expired membership if none remain active.
The student report dialog includes every membership and verified payment.
Expiring Soon means an active membership expires within 14 days. Memberships are
prepaid; an expiry does not schedule a renewal charge.

Summary cards show academy totals. Search, plan, status, mentor and UTC date filters
control the table and CSV export. Dates match any verified purchase, or registration
for a student who has no purchases. Selection spans pages; export uses selected
filtered students when selected, and all matching students otherwise.

Mentor assignment uses the existing enrollment-specific PATCH endpoint and updates
the selected student's course, upcoming mentor sessions and submitted projects.
Cancelled enrollments cannot be assigned. The course's global instructor is unchanged.

Validation from the backend directory:

```sh
node --test src/controllers/userReports.test.js src/controllers/userReports.mentor.test.js
node src/scripts/checkDashboard.js
```

The integration script only reads the configured database and running local API.
