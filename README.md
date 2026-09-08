# EMAN: Business Hub

Build a production-ready web application called EMAN (إيمان).

EMAN is a business accounting and shop/project management platform designed for business owners and their shop/project workers. The core idea is:

«One owner = multiple shops/projects = multiple workers = all transactions and financial information visible to the owner in one place.»

The business owner is called "البطرون" (Al Batron) throughout the application where appropriate.

The application must be designed as a real, functional SaaS application — not a static mockup.

---

1. CORE TECHNICAL REQUIREMENTS

Build the application with a modern, maintainable stack suitable for deployment through:

- GitHub
- Netlify
- Lovable hosting

Use:

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui where useful
- Supabase for authentication, database, storage, and realtime functionality

Keep the codebase clean and modular.

VERY IMPORTANT: NETLIFY DEPLOYMENT

This MUST be a proper Single Page Application and must work correctly when deployed to Netlify.

Configure the project so that refreshing ANY application route does NOT produce:

"Page not found"

For example, these routes must continue working after browser refresh:

- "/"
- "/login"
- "/register"
- "/dashboard"
- "/shops"
- "/shops/:id"
- "/transactions"
- "/profile"
- "/subscription"
- "/admin"

Add the appropriate Netlify SPA redirect configuration:

"public/_redirects"

with:

"/* /index.html 200"

Also make sure Vite's production configuration is compatible with Netlify.

Do NOT use broken relative asset paths.

All assets should resolve correctly from the deployed domain.

The application must build successfully using:

"npm run build"

and be ready for Netlify's standard Vite deployment.

Use environment variables for secrets and API keys.

Create a ".env.example" file showing required variables without exposing real secrets.

NEVER hardcode Supabase service-role keys, private credentials, or sensitive administrative secrets into frontend code.

---

2. APPLICATION IDENTITY

Name:

EMAN

Arabic:

إيمان

The app should feel like a serious financial/business management product.

The owner is called:

البطرون

Workers/shop managers are called:

العامل / الموظف

Use appropriate terminology depending on the selected language.

---

3. LANGUAGES

The entire application must support:

Arabic

RTL interface.

English

LTR interface.

French

LTR interface.

Create a proper internationalization system.

Do NOT simply translate a few labels.

All:

- buttons
- menus
- forms
- validation messages
- notifications
- dashboards
- transaction screens
- subscription screens
- admin screens
- empty states
- errors
- confirmation dialogs
- authentication screens

must use translation keys.

Allow the user to switch language from the interface.

When Arabic is selected:

- automatically switch the entire interface to RTL
- correctly align navigation, cards, forms and icons
- support Arabic typography properly

Store the user's language preference.

---

4. VISUAL DESIGN

Create a premium modern fintech/business dashboard.

Dark-mode focused.

Overall background:

"#0A0A0A"

The visual identity should feel:

- premium
- clean
- modern
- trustworthy
- financial
- professional
- slightly futuristic
- extremely smooth

Do NOT make it look like a generic accounting template.

Main palette

Deep Black:

"#0A0A0A"

Primary teal gradient:

Top:

"#0A4D7C"

Bottom:

"#004D4D"

Accent green:

"#00C853"

Dark green:

"#0C2A1F"

Text:

White / near white.

Secondary text:

Light gray.

Use subtle green/teal highlights.

Cards

Use:

- 12–16px rounded corners
- subtle borders
- soft shadows
- layered surfaces
- generous spacing

Featured cards should use a smooth vertical teal gradient.

Use subtle glass/transparent effects where appropriate, but don't overdo glassmorphism.

Typography

Large, bold white headings.

Smaller gray supporting text.

Arabic typography must look natural and polished.

Animation

Use subtle animations:

- card entrance
- hover
- button press
- modal transitions
- page transitions
- loading states
- dashboard number animations

Do NOT make the app distracting.

---

5. AUTHENTICATION

Create a complete authentication system using Supabase Auth.

Users can:

- Register
- Login
- Logout
- Reset password
- Change password
- Maintain a profile

During registration, the user must choose:

OWNER

or

WORKER

Do not allow a user to accidentally have both roles through the normal registration flow.

---

6. OWNER REGISTRATION

If the user selects OWNER:

Create their owner account.

Collect:

- Full name
- Username
- WhatsApp number
- Phone number
- Resident area
- Password
- Optional profile picture

The username must be unique.

The owner becomes the البطرون.

After registration they enter the owner dashboard.

---

7. WORKER REGISTRATION

If the user selects WORKER:

Collect:

- Full name
- Username
- WhatsApp number
- Phone number
- Resident area
- Password
- Optional profile picture

After registration, show:

"Find your owner"

The worker can search for an owner using their username.

Example:

"@salem"

Show matching owner profiles.

The worker selects an owner and sends a request.

The request should have:

- worker name
- worker username
- profile picture
- phone
- WhatsApp
- request date
- status

Status:

- Pending
- Approved
- Rejected

---

8. OWNER REQUEST SYSTEM

The owner receives a notification when someone requests to join them.

The owner can:

Approve

or

Reject

If approved:

The worker becomes connected to the owner.

If rejected:

The worker is informed that the request was rejected.

The owner should have a worker-management page showing:

- pending requests
- active workers
- rejected requests
- worker details
- shops assigned to each worker

Use Supabase realtime where practical so notifications update without requiring a manual refresh.

---

9. OWNER SHOP / PROJECT SYSTEM

The owner can create multiple shops/projects depending on their subscription plan.

Every shop/project must have:

- Shop/project name
- Profile picture
- Description
- Category
- Location/area
- Assigned workers
- Creation date
- Active/inactive status

Example:

Owner:

Salem

Shops:

- Salem Electronics
- Salem Clothing
- Salem Café

The owner must be able to switch between shops.

---

10. WORKER SHOP ACCESS

The owner decides which worker can manage which shop/project.

A worker can only see the shop/project(s) they have been assigned to.

Workers cannot see:

- other owners
- unrelated shops
- private owner information
- other workers' private information unless permitted

Use proper database Row Level Security in Supabase.

Security is extremely important.

Do NOT rely only on frontend hiding.

---

11. TRANSACTION SYSTEM

This is the core of EMAN.

Workers must be able to register everything happening in their shop/project.

Create a powerful transaction form.

Transaction fields:

- Transaction type
- Product/service
- Description
- Quantity
- Unit price
- Total amount
- Currency
- Payment method
- Customer name (optional)
- Customer phone (optional)
- Date
- Time
- Notes
- Receipt/image upload
- Worker who created it
- Shop/project

Transaction types should include:

- Sale
- Purchase
- Expense
- Income
- Refund
- Debt
- Payment received
- Payment sent
- Other

Calculate totals automatically.

Example:

Quantity: 3

Unit price: 500 MRU

Total:

1500 MRU

---

12. MRU CURRENCY

The primary currency is:

MRU

Display:

MRU

or appropriate localized Mauritanian currency formatting.

Make the currency system flexible so more currencies could be added later.

---

13. SHOP FINANCIAL DASHBOARD

Every shop/project gets its own dashboard.

Show:

- Total income
- Total expenses
- Net balance
- Number of transactions
- Sales
- Purchases
- Refunds
- Outstanding debts
- Money received
- Money sent

Use beautiful charts.

Examples:

- Income vs expenses
- Daily transactions
- Weekly revenue
- Monthly revenue
- Transaction categories
- Worker activity

Allow filtering:

- Today
- Yesterday
- This week
- This month
- This year
- Custom date range

---

14. OWNER MASTER DASHBOARD

The owner dashboard is the most important screen.

Show the financial situation of ALL shops/projects in one place.

Header:

Welcome back, البطرون

Show a large total balance/revenue card.

Example:

Total Revenue

"125,400 MRU"

Then:

- Total income
- Total expenses
- Net revenue
- Total transactions
- Number of shops
- Number of workers

Then show shop cards.

Each card:

- shop image
- shop name
- revenue
- expenses
- net
- transactions
- active workers

Clicking a shop opens its complete dashboard.

---

15. GLOBAL TRANSACTION VIEW

The owner should have a page showing ALL transactions from ALL connected shops.

Each transaction should show:

- Shop
- Worker
- Type
- Amount
- Date
- Time
- Description
- Payment method
- Receipt if uploaded

Allow filtering by:

- Shop
- Worker
- Transaction type
- Date
- Amount
- Payment method

Allow searching.

---

16. TRANSACTION DETAILS

Clicking a transaction should open a detailed view.

Show every piece of information entered by the worker.

Include:

- transaction ID
- shop
- worker
- date
- time
- amount
- quantity
- product
- description
- notes
- payment method
- uploaded receipt

Owner should be able to see the complete history.

Workers should only be able to edit/delete transactions according to permissions.

For security and accounting integrity, do not permanently erase important transaction records without an audit trail.

---

17. AUDIT LOG

Create an audit system.

Track important actions:

- transaction created
- transaction edited
- transaction deleted/voided
- worker added
- worker removed
- shop created
- shop edited
- subscription changed

Record:

- user
- action
- affected object
- timestamp

This is important for a financial application.

---

18. SHOP BALANCE / CASH TRACKING

Allow workers to record current shop money.

Show:

Current Cash

Expected Cash

Difference

Allow recording:

- cash added
- cash removed
- bank deposit
- withdrawal
- adjustment

The owner can see this information from the master dashboard.

---

19. SUBSCRIPTION SYSTEM

Owners subscribe yearly.

Create four plans.

BRONZE

5,000 MRU / year

Maximum:

3 shops

Includes:

- Owner account
- Up to 2 worker/shop accounts
- Basic transaction management
- Dashboard

SILVER

8,000 MRU / year

Maximum:

5 shops

Includes:

- Owner
- Up to 4 additional shop/worker accounts
- Advanced dashboard
- Reports
- Transaction history

GOLD

14,000 MRU / year

Maximum:

10 shops

Includes:

- Owner
- Up to 9 additional shop/worker accounts
- Advanced analytics
- Reports
- Advanced management

PLATINUM

20,000 MRU / year

Custom/high-tier plan.

Allow custom configuration.

---

20. SUBSCRIPTION BADGES

Show a badge on the owner's profile/dashboard:

- BRONZE
- SILVER
- GOLD
- PLATINUM

Make each badge visually distinct while staying within the overall design system.

Display:

Active until: [date]

Subscription lasts exactly one year from activation.

When expired, show:

Subscription expired

and prevent creation of additional shops/workers while retaining existing data.

Do NOT delete user data when a subscription expires.

---

21. PAYMENT ACTIVATION

Payment is manually verified by the EMAN administrator.

Payment methods:

1. Bankily
2. Sedad
3. Masrivi

I will upload the three logo images to Lovable.

Use them in exactly this sequence:

1 = Bankily

2 = Sedad

3 = Masrivi

Bank/payment number:

33313301

WhatsApp support:

33313301

Do not invent any other payment numbers.

---

22. SUBSCRIPTION REQUEST

When the owner chooses a plan, show the payment instructions.

Show:

- selected plan
- price
- payment methods
- payment number: 33313301
- WhatsApp: 33313301

Then collect:

- Full name
- Username
- Resident area
- WhatsApp number
- Phone number
- ID card OR passport photo
- Bank/payment receipt screenshot

Allow image uploads through Supabase Storage.

Clearly tell the user that these documents are being submitted for subscription verification.

After submission, show:

"Waiting for approval"

Message:

"Your subscription request has been submitted. Please wait for the EMAN administration team to review your payment."

Do NOT automatically activate the subscription.

---

23. ADMIN PANEL

Create a protected "/admin" dashboard.

Only the designated administrator account should be able to access it.

Admin email:

eman4real.new@gmail.com

IMPORTANT:

Do not make authorization depend only on hiding the Admin button.

Protect the admin functionality using proper server-side/database authorization and Supabase Row Level Security.

The admin dashboard should allow the administrator to:

- Search users by username
- View owners
- View subscription requests
- View submitted documents
- View payment receipt
- View selected plan
- View user information
- Approve subscription
- Reject subscription
- Grant subscription manually
- Cancel/revoke a subscription
- Change subscription plan
- Set subscription start/end dates
- View active subscriptions
- View expired subscriptions

---

24. ADMIN SUBSCRIPTION GRANT

Admin enters/searches:

"username"

Then sees the owner.

Admin chooses:

- Bronze
- Silver
- Gold
- Platinum

Then clicks:

Grant Subscription

The system creates an active subscription lasting one year.

Automatically assign:

- subscription plan
- subscription badge
- start date
- expiration date
- allowed shop count
- allowed worker count

If the admin accidentally grants a plan, provide:

Cancel Subscription

with confirmation.

Never silently remove a subscription.

Record the action in the audit log.

---

25. ADMIN REQUEST STATES

Subscription requests:

- Pending
- Approved
- Rejected
- Cancelled

When approved:

The owner receives an in-app notification.

When rejected:

The owner receives an in-app notification.

Allow an optional admin note/reason.

---

26. NOTIFICATIONS

Create a notification system.

Notifications for:

Owner:

- New worker request
- Worker approved/rejected
- Subscription submitted
- Subscription approved
- Subscription rejected
- Subscription expiring
- Subscription expired
- Important account notifications

Worker:

- Owner request approved
- Owner request rejected
- Shop assigned
- Shop removed
- Important shop notifications

Use realtime where appropriate.

Add unread notification count.

---

27. PROFILE

Create a profile page.

Show:

- Profile picture
- Full name
- Username
- Phone
- WhatsApp
- Resident area
- Role
- Connected owner if worker
- Subscription plan if owner
- Subscription expiration date

Allow profile editing.

---

28. OWNER SETTINGS

Settings should include:

- Language
- Account
- Security
- Notifications
- Subscription
- Workers
- Shops
- Privacy

---

29. RESPONSIVE DESIGN

The app must work beautifully on:

- Android phones
- iPhones
- tablets
- laptops
- desktop screens

Mobile should not simply be a scaled-down desktop.

Create a dedicated mobile-friendly layout.

Use:

- bottom navigation
- floating action buttons where useful
- mobile transaction forms
- collapsible sections

Desktop can use a sidebar.

Mobile can use bottom navigation.

---

30. NAVIGATION

Owner navigation:

- Dashboard
- Shops
- Transactions
- Workers
- Reports
- Subscription
- Notifications
- Profile
- Settings

Worker navigation:

- My Shop
- Transactions
- Add Transaction
- Notifications
- Profile
- Settings

Admin navigation:

- Admin Dashboard
- Users
- Subscription Requests
- Active Subscriptions
- Audit Logs
- Settings

---

31. ADD TRANSACTION BUTTON

Make adding transactions extremely easy.

Have a prominent:

+ Add Transaction

button.

On mobile, consider a floating action button.

The worker should be able to enter a transaction in seconds.

---

32. SEARCH

Implement global/local search where appropriate.

Owner can search:

- shops
- workers
- transactions

Worker can search:

- transactions
- products/services within their assigned shop

Worker searching for an owner should search usernames.

---

33. REPORTS

Owners should be able to generate reports.

Reports:

- revenue
- expenses
- net profit/revenue
- transactions
- shop performance
- worker activity

Filters:

- date
- shop
- worker
- transaction type

Provide export functionality where practical, such as CSV/PDF.

---

34. EMPTY STATES

Do not show ugly blank pages.

Examples:

No shops:

"Your business has no shops yet."

Button:

"Add your first shop"

No transactions:

"No transactions recorded yet."

Button:

"Add transaction"

No workers:

"You don't have any workers connected yet."

Button:

"Manage workers"

---

35. LOADING STATES

Use skeleton loaders rather than freezing the UI.

Every asynchronous action should have:

- loading state
- success state
- error state

Prevent duplicate submissions.

---

36. ERROR HANDLING

Never show raw technical errors to users.

Show understandable messages.

For example:

Instead of:

"Supabase error 23505"

show:

"That username is already being used. Please choose another one."

Log useful technical information appropriately for development.

---

37. DATABASE DESIGN

Design a proper relational Supabase database.

Suggested tables:

"profiles"

"shops"

"shop_members"

"transactions"

"cash_movements"

"worker_requests"

"subscriptions"

"subscription_requests"

"notifications"

"audit_logs"

"admin_actions"

Use UUID primary keys.

Include:

- created_at
- updated_at

where appropriate.

Create foreign-key relationships.

Use indexes for:

- usernames
- owner IDs
- shop IDs
- transaction dates
- subscription status

---

38. SUPABASE SECURITY

This is extremely important.

Implement Row Level Security.

Owner can access their own:

- profile
- shops
- workers
- transactions
- subscription

Workers can access only:

- their own profile
- approved owner relationship
- assigned shops
- permitted transactions

Admin can access administrative data through a secure authorization mechanism.

Never trust:

- frontend role
- URL parameters
- hidden buttons
- localStorage

for authorization.

All important authorization must be enforced at the database/server level.

---

39. FILE STORAGE

Use Supabase Storage for:

- profile pictures
- shop profile pictures
- transaction receipts
- ID/passport documents
- payment receipts

Sensitive documents such as ID/passport images must NOT be publicly accessible.

Use private buckets and signed URLs/access policies.

---

40. SECURITY & PRIVACY

Because the application handles financial and identity documents:

- never expose private documents publicly
- validate uploads
- restrict file types
- restrict file sizes
- protect database queries
- sanitize user-generated content
- use secure authentication
- prevent unauthorized shop access
- prevent users from modifying another user's data
- do not expose admin credentials
- do not expose Supabase service-role credentials

---

41. LANDING PAGE

Create a polished landing page.

Hero:

EMAN

Headline idea:

"Your entire business. One place."

Arabic equivalent:

"كل أعمالك في مكان واحد."

Explain:

- Manage multiple shops
- Track transactions
- Manage workers
- Monitor revenue
- Keep everything organized

Show premium dashboard previews/cards.

Include:

Pricing

Bronze — 5,000 MRU/year

Silver — 8,000 MRU/year

Gold — 14,000 MRU/year

Platinum — 20,000 MRU/year

Buttons:

Get Started

Login

---

42. DASHBOARD VISUAL STYLE

The owner dashboard should immediately communicate money and business performance.

Top:

Greeting + profile.

Large featured gradient card:

Total Business Revenue

Large MRU number.

Secondary metrics underneath.

Then:

Your Shops

with horizontal/vertical cards.

Then:

Recent Transactions

Then:

Performance

with charts.

The design should feel premium rather than crowded.

---

43. DARK MODE

The default design is dark.

Use the specified black/teal/green palette.

Avoid huge amounts of pure green.

Green is an accent.

Teal gradients should be used for important featured cards.

---

44. ACCESSIBILITY

Use:

- readable contrast
- keyboard navigation
- labels for inputs
- accessible buttons
- semantic HTML
- proper focus states
- alt text for images

---

45. DEMO DATA

During development, create safe demo/seed data if useful.

But clearly separate demo data from production data.

Do NOT insert fake payment or identity information into the production database.

---

46. ENVIRONMENT VARIABLES

Create:

".env.example"

with placeholders such as:

"VITE_SUPABASE_URL="

"VITE_SUPABASE_ANON_KEY="

Never commit ".env".

Make sure ".gitignore" excludes:

".env"

".env.local"

other secret environment files.

---

47. GITHUB FRIENDLINESS

The repository must be clean and understandable.

Use:

- meaningful folders
- reusable components
- reusable hooks
- clear database migrations
- clear README
- environment variable documentation
- no unnecessary generated junk
- no hardcoded secrets

Suggested structure:

"src/"

"components/"

"pages/"

"layouts/"

"hooks/"

"lib/"

"i18n/"

"integrations/"

"types/"

"supabase/"

"public/"

Keep business logic separate from UI components where practical.

---

48. NETLIFY CONFIGURATION

Include all required deployment files.

At minimum:

"public/_redirects"

containing:

"/* /index.html 200"

If additional Netlify configuration is necessary, create:

"netlify.toml"

with an appropriate build configuration.

Make sure the production app works when navigating directly to nested URLs.

For example:

Opening:

"https://example.netlify.app/dashboard"

directly must work.

Refreshing:

"https://example.netlify.app/shops/123"

must work.

Do NOT create a custom fake Page Not Found page as a workaround for broken routing.

Fix the actual SPA routing/deployment configuration.

---

49. ROUTING

Use React Router or an equivalent proper client-side router.

Create protected routes.

Examples:

Public:

"/"

"/login"

"/register"

"/forgot-password"

"/pricing"

Protected:

"/dashboard"

"/shops"

"/shops/:shopId"

"/transactions"

"/workers"

"/reports"

"/subscription"

"/notifications"

"/profile"

"/settings"

Admin:

"/admin"

"/admin/users"

"/admin/subscriptions"

"/admin/audit"

Redirect unauthorized users appropriately.

---

50. IMPORTANT ADMIN BUTTON

The Admin button should NOT be visible to normal users.

For the administrator account, show:

Admin

button in the appropriate menu.

But again, hiding the button is NOT the security mechanism.

The backend/database must enforce admin authorization.

---

51. NO BROKEN PLACEHOLDERS

Do not create buttons that appear functional but do nothing.

If a feature is included, implement its basic functionality.

Do not use:

- fake authentication
- fake transactions
- fake subscription activation
- fake admin approval
- fake worker requests

Use Supabase for the real application data.

---

52. DATA CONSISTENCY

When a worker creates a transaction:

The owner dashboard should eventually reflect it automatically.

When a worker is approved:

Their relationship should become active.

When a shop is assigned:

The worker should see it.

When an admin approves a subscription:

The owner should immediately see their active subscription and badge.

---

53. SUBSCRIPTION LIMIT ENFORCEMENT

The subscription limits must be real.

Bronze:

3 total shops/accounts.

Silver:

5. 

Gold:

10. 

Platinum:

custom.

Before creating a shop/worker, check the user's subscription limits.

If the limit is reached, show a clear upgrade message.

Do not rely only on frontend validation.

---

54. BUSINESS TERMINOLOGY

Where appropriate:

Owner = البطرون

Worker = العامل

Shop = المحل

Project = المشروع

Transaction = المعاملة

Revenue = الإيرادات

Expenses = المصاريف

Balance = الرصيد

Subscription = الاشتراك

Use the appropriate translation in Arabic, English and French.

---

55. FINAL QUALITY REQUIREMENT

Before considering the application complete:

Test:

1. Register owner.
2. Register worker.
3. Search owner username.
4. Send worker request.
5. Owner approves request.
6. Owner creates shop.
7. Owner assigns worker.
8. Worker sees assigned shop.
9. Worker creates transaction.
10. Owner sees transaction.
11. Owner sees updated totals.
12. Owner submits subscription request.
13. Admin searches username.
14. Admin grants subscription.
15. Owner receives subscription badge.
16. Admin cancels subscription.
17. Subscription limits work.
18. Arabic RTL works.
19. English works.
20. French works.
21. Mobile layout works.
22. Desktop layout works.
23. Browser refresh works on nested routes.
24. Netlify production build works.
25. GitHub repository contains no secrets.

Run the production build and fix all TypeScript/build errors before finishing.

Do not leave TODO placeholders for critical functionality.

The final application should feel like a real SaaS product called EMAN, not a prototype.

Build the UI first with realistic structure, then connect all functionality to Supabase properly.

Prioritize:

Security → Correct data relationships → Functional accounting → Subscription control → Responsive UX → Premium visual design.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://eman-account.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/cbcd0f1c-83d8-4cc2-8df4-ed143015fdc1).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
