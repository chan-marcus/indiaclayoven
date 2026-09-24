# India Clay Oven — Website & Ordering Platform

A high-fidelity **customer-approval prototype** for India Clay Oven Restaurant & Bar,
2436 Clement Street, San Francisco.

It is a working front end, not the production application: no real payments,
authentication or email. Everything else — browsing, ordering, checkout, the owner
dashboard — behaves for real.

```bash
npm install
npm run dev     # http://localhost:3000
```

---

## What to look at

| Route | What it demonstrates |
| --- | --- |
| `/` | Homepage — hero, restaurant info, story, signature dishes, photo gallery |
| `/menu` | **The ordering experience.** Category sidebar, item detail, cart |
| `/checkout` → `/order/confirmation` | Full order flow with simulated payment |
| `/about` · `/reservations` · `/catering` | Editorial pages and simulated forms |
| `/dashboard` | **Owner dashboard** — overview, orders, menu manager, settings |

### The two demos worth running

**1. Customer → owner.** Add dishes on `/menu`, check out, then open
`/dashboard/orders`. Your order is at the top of the board, marked *New*, with the
order-email status beside it.

**2. Owner → customer.** In `/dashboard/menu`, toggle a dish to *Sold out*. Go to
`/menu`: it is greyed out, labelled **Sold Out**, and cannot be added to the cart.
That is the core pitch — *"I can change my menu myself."*

Both surfaces read from one store, so changes persist in the browser. To wipe it and
return to the seeded state, clear the site's local storage.

---

## Design system

Established first, in `src/app/globals.css`, then used by every page.

- **Type** — Playfair Display for editorial headings, Inter for UI. One display
  weight; hierarchy comes from size and spacing rather than bold everywhere.
- **Colour** — warm cream `#fbf7f1`, near-black `#1a1512`, deep clay `#6b2318`, and a
  **muted ochre** `#b4832f` used strictly as an accent. The Framer palette, not the
  Figma yellow. The site is never "a yellow website".
- **Restraint** — 2–4px radii, hairline borders instead of shadows, no emoji
  anywhere. Line icons in `components/ui/icons.tsx` replace them.
- **Motion** — image zoom, drawer slides, hover states. All ≤ 0.7s, and everything
  respects `prefers-reduced-motion`.

The logo mark (`components/site/OvenMark.tsx`) is a charcoal-fired clay oven, drawn
as a single-colour vector so it works on cream and clay backgrounds and at favicon
size.

## Architecture

```
src/
  app/(site)/…        customer website        app/dashboard/…   owner dashboard
  components/         ui · site · home · menu · cart · checkout · forms · dashboard
  lib/
    types.ts          Restaurant → Categories → MenuItems; Orders → OrderItems
    data/             the real menu (12 categories, ~100 dishes), seeded orders
    restaurant-data.tsx   shared store behind BOTH surfaces
    cart-context.tsx      cart, persisted to localStorage
```

Every record carries a `restaurantId` and no component hard-codes the restaurant, so
the multi-tenant model in the brief drops in later. `restaurant-data.tsx` is the seam:
replace its state with API calls and the components are unchanged.

## Content

Menu, prices, address, hours and phone number are the restaurant's real details,
taken from the two reference prototypes.

**Photography is placeholder** — licensed stock and Wikimedia Commons images, chosen
per dish. Replace `public/images/` with the restaurant's own photographs before
launch; the file names describe the dish, so it is a like-for-like swap.

## Not built (by design)

Real Stripe payments · order email delivery · authentication · reservation
integration · analytics · multi-restaurant admin. The brief excludes all of these
from the prototype. Order email is shown as a delivery status and a **Resend Email** control
in the dashboard, which is what the owner needs to understand.
