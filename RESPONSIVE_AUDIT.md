# Responsive layout verification - 28 October 2026

## Changes

- Removed the global 320px body minimum that caused horizontal scrolling when a browser scrollbar reduced the usable viewport.
- Reworked the chess hero at tablet widths; removed overlapping grid placement and doubled counselling form padding.
- Stacked compact-phone form fields and actions, retained readable 16px inputs, and enlarged touch targets.
- Improved narrow course headings/search, course cards and module/project grids.
- Constrained dialogs to the dynamic viewport with internal scrolling, including phone landscape.
- Fixed admin certificate page overflow caused by an absolutely positioned screen-reader label escaping the table scrolling region. The wide table still scrolls inside its own region.
- Improved reduced-motion behavior.

## Verification

The production build passes. The final portrait run passed 85 route/control combinations at 320, 390, 768, 1024 and 1440px. The final 667x375 landscape run passed 11 combinations. Both reported zero detected horizontal-overflow cases and zero JavaScript exceptions.

The final five-width checks cover home, landing, course catalog, a populated course detail page, about, plans, login, signup, cart, student dashboard, settings, admin overview, admin certificates and admin subscriptions. Mobile interactions cover public navigation, counselling dialog, course customizer, student navigation and admin navigation.

A wider audit also exercised the remaining public, student and admin routes at 320, 768 and 1440px. It identified the certificate overflow, subsequently repaired and rechecked above. A subscription fixture was corrected to include the real API's settings response.

Screenshots reviewed included phone/tablet heroes, narrow course details, home tools/community, counselling/customizer dialogs, student navigation, signup and dashboards. The updated checker measures usable client width, includes document scroll width, uses three course fixtures, supports a landscape height override and saves screenshots/results locally under frontend/responsive-checks (excluded from Git).

## Reproduce

Run from frontend after npm run build:

```powershell
$env:RESPONSIVE_ROUTES='/,/landing,/courses,/courses/507f1f77bcf86cd799439011,/about,/plans,/login,/signup,/cart,/dashboard,/admin,/settings,/admin/certificates,/admin/subscriptions'
$env:RESPONSIVE_WIDTHS='320,390,768,1024,1440'
node scripts/check-responsive.mjs
```

For landscape set RESPONSIVE_WIDTHS=667 and RESPONSIVE_HEIGHT=375. Remove RESPONSIVE_ROUTES to run the default full-route sweep.

## Limits

These checks use headless Chrome viewport emulation and intercepted fixture data. They do not submit forms, change real accounts or verify payments/live backend behavior. They do not replace testing physical iOS/Android browsers, their keyboards, every device or every possible data state.

The Cloudflare site needs deployment of this commit to receive the changes.

## Follow-up from physical-phone screenshots

- Bundled the open-source Inter variable font and its OFL license, rather than relying only on a phone's installed font.
- Reduced mobile hero/grid contrast, portrait height and section spacing; kept text readable without excessive weight.
- Removed an older `!important` footer rule that defeated the intended two-column phone layout.
- Adjusted portrait badges so the rotating course selector does not cover the lower badge, including narrow 320px screens.
- Added actual section screenshots and layout assertions for loaded fonts, side-by-side footer columns and badge/selector separation. API responses remain fixtures; physical Android/iOS rendering is not claimed.
- The production Worker served `/assets/index-9YphZLC-.css` before these changes, without the new bundled font. Publishing the latest frontend build is required for the live site.

Follow-up validation: production build passed; 33 route, control and layout checks passed at 320, 390, 430, 768, 1024 and 1440px with no detected overflow or JavaScript errors. Font loading, two-column footer alignment and hero-badge separation passed at all three phone widths. Reviewed the 390px hero, career workspace and footer screenshots.
