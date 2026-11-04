# Pullforge → Cardmarket fulfillment flow

## Intended workflow

1. Customer completes a **Pullforge** order (shipping fields on `Order`).
2. **Admin** opens [Order Management](/admin/orders), expands a **PENDING** order (not shop-assigned), clicks **Send to Cardmarket** → order becomes **Processing** with `fulfillmentChannel = CARDMARKET`.
3. An **MCP agent** (optional) or **`CARDMARKET_RUN_BROWSER=true`** worker uses the saved Cardmarket browser session to:
   - Find each card (German seller, ≥100 sales, cheapest match).
   - Add lines to the **Cardmarket shopping cart**.
   - Set **ship-to** on each seller block to the Pullforge customer address.
   - **Does not pay** — checkout stays manual.
4. **Admin** receives email + admin UI link with:
   - Pullforge order id(s) covered by this cart
   - [Cardmarket shopping cart](https://www.cardmarket.com/en/Magic/ShoppingCart) URL to finish payment
5. Admin pays on Cardmarket; marks Pullforge order shipped when done.

API: `POST /api/admin/orders/:id/cardmarket`

## One cart vs one order at a time

Cardmarket’s cart is split **by seller**. Each seller section has **one** “Choose Shipping Address” for **all** items from that seller in the cart.

| Situation | One shared cart? |
|-----------|------------------|
| Two Pullforge orders, **different** MKM sellers, **different** customer addresses | **Yes** — set address per seller block |
| Two Pullforge orders, **same** MKM seller, **different** customer addresses | **No** — checkout batch 1, empty cart, then batch 2 |
| Two Pullforge orders, **same** customer address | **Yes** (even if same seller) |
| Unknown sellers until cards are picked | **Plan after add**, or default **one Pullforge order per cart** |

**Recommended default:** `resetCart: true` → prepare **one Pullforge order** → email admin → human checkout → empty cart → next order. Safest and matches Cardmarket’s cart-abuse guidance.

**Optional batching:** After lines are added, run `planCartBatches()` (see `src/lib/cardmarket-browser/cart-batching.ts`) using chosen `sellerUsernames` per order. Only merge orders when no seller needs two addresses.

Checkout on Cardmarket typically settles **everything currently in the cart** for that session — treat each batch as “one admin checkout trip.”

## MCP / env

- Session: `npm run cardmarket:login`
- Notify: `FULFILLMENT_NOTIFY_EMAIL` (comma-separated) or all `ADMIN` users in DB
- Seller rules: `CARDMARKET_SELLER_COUNTRIES`, `CARDMARKET_MIN_SELLER_SALES`

## Not built yet (product)

- Automatic trigger on new Pullforge `Order` status
- Card name → MKM product mapping (Scryfall set/number)
- Persisting MKM cart batch id on Pullforge orders

Those can be added once manual MCP runs are stable.
