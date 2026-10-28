# Attrangii Storefront

Public e-commerce storefront (plus a small staff admin) for Attrangii. It is a static single-page app that talks directly to Supabase. It shares tables with the Attrangii CRM (`products`, `customers`, `invoices`, `invoice_items`), so every web order shows up as a `WEB-*` invoice in the CRM.

Design documentation: [`../docs/DESIGN.md`](../docs/DESIGN.md).

## Features

- Catalog: home (categories + new arrivals), shop with search, category chips, in-stock filter and sort, product page with gallery and full-screen lightbox, related products.
- Cart: slide-in drawer, persisted in `localStorage`, quantities clamped to stock, free-shipping nudge.
- Checkout: guest or signed-in, server-priced totals (`quote_order`), coupon codes, Indian mobile validation, order placed via the `place_order` RPC.
- Catalogue page: the owner's product catalogue (PDF) shown as phone-friendly pages with zoom and a download link. To replace it, re-render the pages to `public/catalogue/` (900px JPEGs named `page-01.jpg` …) and update `PAGES` in `src/pages/Catalog.tsx`.
- Order tracking: by invoice number + phone (public) or from "My account" (signed in). Shipping timeline, courier/tracking link, payment status.
- Accounts: email/password sign-up and sign-in (Supabase Auth), profile prefill at checkout, order history.
- Admin (staff only): orders list with filters, order detail panel (shipping and payment form, cancel/reopen with stock restore), coupon manager.

## Tech stack

React 19, TypeScript 5.8, Vite 6, Tailwind CSS v4 (`@tailwindcss/vite`, tokens in `src/index.css`), react-router-dom v7, `@supabase/supabase-js` v2, `lucide-react` icons. Fonts (Epilogue, Plus Jakarta Sans) load from Google Fonts via a CSS `@import`.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server on **http://localhost:3100** (`--port=3100`) |
| `npm run build` | `tsc --noEmit` then `vite build` into `dist/` |
| `npm run preview` | Serve the built `dist/` locally |
| `npm run lint` | Type-check only (`tsc --noEmit`); there is no ESLint or test runner |

## Environment variables

Defined in `storefront/.env` (git-ignored). Both are required; `src/lib/supabase.ts` creates the client from them.

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Only the public anon key belongs here. Never put a service-role key in a `VITE_*` variable (it would ship to the browser).

## Local development

1. `cd storefront && npm install`
2. Create `.env` with the two variables above.
3. Run the SQL files once, in this order, in the Supabase SQL Editor: `supabase/storefront.sql`, `supabase/accounts-admin.sql`, `supabase/shipping-coupons.sql`, then optionally `supabase/seed-products.sql`.
4. `npm run dev` and open http://localhost:3100.
5. To get an admin: sign up on `/login`, then set that user's `profiles.role` to something other than `customer` (for example `admin`) in Supabase. Role changes from the client are blocked by a trigger.

## Project structure

```
storefront/
  index.html                  Vite entry; title, favicon (/logo.png), meta description
  package.json                Scripts and dependencies (name: attrangii-storefront)
  vite.config.ts              Vite + React + Tailwind plugins
  tsconfig.json               TypeScript config
  vercel.json                 SPA rewrite: every path -> /
  .gitignore                  node_modules, dist, .env, .impeccable, upload-staging
  public/
    logo.png                  Favicon and header logo
  supabase/
    storefront.sql            storefront_products view (hides cost price, excludes Pins) + track_order v1
    accounts-admin.sql        profiles table, role guard, is_staff/is_admin, staff-only RLS, my_account, admin_orders, admin_set_order_status
    shipping-coupons.sql      Run last. Shipping/payment columns on invoices, coupons table, quote_order, place_order,
                              track_order, admin_update_fulfilment, admin_coupons (supersedes earlier function versions)
    seed-products.sql         26 starter products, images from the public `product-images` bucket; safe to re-run
  src/
    main.tsx                  Mounts StrictMode > BrowserRouter > AuthProvider > CartProvider > App
    App.tsx                   Route table
    index.css                 Tailwind import, @theme tokens, base body/heading styles
    vite-env.d.ts             Vite client types
    lib/
      supabase.ts             Supabase client from env vars
      api.ts                  All data access (views, RPCs, coupon table writes)
      auth.tsx                AuthProvider/useAuth: session, profile role, isStaff, signIn/signUp/signOut
      cart.tsx                CartProvider/useCart: lines, drawer open state, add/setQty/remove/clear
      types.ts                Product, CartLine, Customer, Quote, OrderResult, TrackedOrder, Coupon, AdminOrder, ...
      format.ts               inr(): en-IN rupee formatter, no decimals
      orderStatus.ts          Shipping steps/labels, payment labels, payment methods
    components/
      Layout.tsx              Sticky header, nav, mobile menu, footer, mounts CartDrawer; scroll-to-top on navigation
      CartDrawer.tsx          Right-hand cart dialog, qty controls, free-shipping hint, Checkout button
      ProductCard.tsx         Grid card: image/initials, stock badge, price, quick add-to-cart
      Gallery.tsx             Product carousel, thumbnails, keyboard nav, full-screen lightbox, broken-image fallback
      OrderTracking.tsx       Shipping timeline, shipment details, payment badge, items and totals; exports payTone
    pages/
      Home.tsx                Hero, category tiles, new arrivals (retry on error)
      Shop.tsx                Search, sort, category chips, in-stock filter (query params q, category)
      ProductPage.tsx         Product detail, quantity, Add to cart / Buy now, related items
      Checkout.tsx            Form, order summary, coupon, debounced server quote, place order
      OrderSuccess.tsx        Confirmation with copyable order number (totals arrive via router state)
      TrackOrder.tsx          Invoice + phone lookup (prefills ?invoice=)
      Login.tsx               Sign in / Create account tabs; honours ?next=
      Account.tsx             Profile, expandable order history, link to admin for staff
      admin/
        AdminLogin.tsx        Staff sign-in, "no admin access" state
        AdminOrders.tsx       Stats, filters, table/cards, order Detail panel, Fulfilment form
        AdminCoupons.tsx      Coupon table/cards, active toggle, delete confirm, CouponForm drawer
```

## Routes

| Path | Page | Auth |
|---|---|---|
| `/` | Home | Public |
| `/shop` | Shop (`?category=`, `?q=`) | Public |
| `/product/:id` | ProductPage | Public |
| `/checkout` | Checkout | Public (guest allowed; signed-in prefills) |
| `/order/:invoice` | OrderSuccess | Public |
| `/catalog` | Catalog (`?page=N`) | Public. 89-page product catalogue: scrollable pages from `public/catalogue/page-NN.jpg`, jump-to-page, tap-to-zoom viewer with swipe, PDF download (`public/attrangii-products-catalogue.pdf`) |
| `/track` | TrackOrder (`?invoice=`) | Public (needs invoice + phone) |
| `/login` | Login (`?next=`) | Public; redirects away if already signed in |
| `/account` | Account | Signed-in; otherwise redirect to `/login?next=/account` |
| `/admin/login` | AdminLogin | Public form; non-staff accounts see "no admin access" |
| `/admin` | AdminOrders | Staff; otherwise redirect to `/admin/login` |
| `/admin/coupons` | AdminCoupons | Staff; otherwise redirect to `/admin/login` |
| `*` | "Page not found" text | Public |

Admin pages are outside `Layout` (no storefront header/footer). Client-side guards are UX only; real enforcement is RLS and `is_staff()` inside the RPCs.

## Data layer (`src/lib/api.ts`)

| Function | Supabase call | Notes |
|---|---|---|
| `getProducts()` | view `storefront_products` (select all, newest first) | Also filters Pins client-side; merges `image_url` + `images` into `images[]` |
| `getProduct(id)` | view `storefront_products` by id | `null` if missing or Pin |
| `quoteOrder(lines, coupon?, phone?)` | RPC `quote_order` | Server pricing; a bad coupon returns `coupon_error`, it does not throw |
| `placeOrder(customer, lines, coupon?)` | RPC `place_order` | Decrements stock, returns `invoice_number` and totals; throws readable errors |
| `trackOrder(invoice, phone)` | RPC `track_order` | `null` when no match |
| `getMyAccount()` | RPC `my_account` | Saved customer + order history |
| `adminOrders()` | RPC `admin_orders` | Staff only, `WEB-*` orders |
| `adminSetStatus(invoice, status)` | RPC `admin_set_order_status` | Cancelling restores stock |
| `adminUpdateFulfilment(invoice, f)` | RPC `admin_update_fulfilment` | Shipping status, courier, tracking, payment method/reference |
| `adminCoupons()` | RPC `admin_coupons` | Includes usage count |
| `saveCoupon(c)` | table `coupons` insert/update | Code upper-cased; RLS restricts to staff |
| `deleteCoupon(id)` | table `coupons` delete | RLS restricts to staff |

`auth.tsx` additionally reads `profiles.role` for the signed-in user and uses Supabase Auth (`signInWithPassword`, `signUp`, `signOut`).

Pricing rules live in SQL (`shipping-coupons.sql`): shipping Rs 80, free when subtotal minus coupon is at least Rs 1500 (`_shipping_fee`); max 20 lines per cart, max 10 per item. The cart drawer hard-codes the same 1500 threshold (`FREE_SHIP_MIN` in `CartDrawer.tsx`); keep them in sync.

## State

- **Cart**: React context, persisted to `localStorage` key `attrangii-cart`. It stores full product objects, so price/stock can be stale; checkout re-prices on the server.
- **Auth**: React context over the Supabase session. `role` comes from `profiles.role` (defaults to `customer`); `isStaff` is true for any role other than `customer`. `ready` is false until the session and role are resolved.
- Everything else is local component state; the Shop filters `q` and `category` live in the URL (sort and in-stock do not).

## How to

**Add a page**: create `src/pages/Foo.tsx`, import it in `src/App.tsx`, and add `<Route path="foo" element={<Foo />} />` inside the `Layout` route (or alongside the admin routes for chrome-less pages). Add a link in `Layout.tsx` `links` if it belongs in the nav. Reuse the `ring` focus class and `field` input class patterns (see DESIGN.md).

**Add a product**: the storefront has no product editor. Add it in the CRM inventory or insert into `public.products` (name, sku, category, selling_price, stock_level, image_url, images). It appears automatically through `storefront_products` unless its category is `pin`/`pins`. Upload images to the public `product-images` bucket and store the public URLs; the main image should be `image_url` (it is placed first in the gallery).

**Add a coupon**: sign in as staff, go to `/admin/coupons`, click "New coupon". Code is 3-32 chars (A-Z, 0-9, `_`, `-`); type is percent (max 100) or flat rupees; optional min order, start/expiry, max uses; one-per-customer and active flags.

**Change shipping fee/threshold**: edit `_shipping_fee()` and the numbers in `quote_order` in `shipping-coupons.sql`, re-run it, and update `FREE_SHIP_MIN` in `CartDrawer.tsx`.

## Build and deploy (Vercel)

1. Import the repo into Vercel and set **Root Directory** to `storefront`.
2. Framework preset: Vite. Build command `npm run build`, output directory `dist`.
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for Production and Preview.
4. `vercel.json` rewrites every path to `/` so deep links (`/product/...`, `/admin`) work on refresh.
5. In Supabase Auth settings, add the deployed URL to the Site URL / redirect URLs so confirmation emails return correctly.

## Troubleshooting

- **Shop is empty / "couldn't load products"**: `storefront.sql` has not been run (no `storefront_products` view), or there are no products (run `seed-products.sql`). Check the network tab for a 404/permission error on `storefront_products`.
- **Product images broken or showing initials/placeholder**: `image_url` is null, the file is missing from the `product-images` bucket, or the bucket is not public. The gallery hides broken images and falls back to a letter placeholder.
- **"function ... not found" / "Could not find the function public.quote_order"** (or `admin_update_fulfilment`, `admin_coupons`): `shipping-coupons.sql` has not been run. Run the three files in order. If it just ran, reload the Supabase schema cache.
- **Admin redirects back to login**: the account's `profiles.role` is still `customer`, or `accounts-admin.sql` was not run.
- **404 or blank page on a deep link after deploy**: Root Directory is not `storefront`, so `vercel.json` is not applied.
- **Supabase client throws on load**: env vars missing; restart `npm run dev` after editing `.env`.
