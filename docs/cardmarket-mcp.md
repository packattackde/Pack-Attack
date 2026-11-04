# Cardmarket fulfillment (browser — no API)

Cardmarket is **not granting new API access**. This project automates cart prep through a **logged-in browser session** (Playwright), not the MKM OAuth API.

## Setup

1. Install deps: `npm ci`
2. Save login once:

   ```bash
   npm run cardmarket:login
   ```

   Sign in in the opened window, then press Enter in the terminal. Session file defaults to `.cardmarket/storage.json` (gitignored).

3. Optional env in `.env.local`:

   - `CARDMARKET_BROWSER_STORAGE` — path to storage JSON
   - `CARDMARKET_BROWSER_HEADLESS=false` — show browser while debugging
   - `CARDMARKET_ALLOW_CHECKOUT` — leave unset/`false`; never enable in tests

## Dry run (add to cart + shipping, no checkout)

```bash
npm run test:cardmarket:unit
npm run test:cardmarket:live
```

## Cursor MCP

```json
{
  "mcpServers": {
    "pullforge-cardmarket": {
      "command": "npm",
      "args": ["run", "cardmarket:mcp"],
      "cwd": "/path/to/Pack-Attack"
    }
  }
}
```

Tools: `cardmarket_browser_status`, `cardmarket_get_cart`, `cardmarket_find_product_url`, `cardmarket_prepare_cart`, `cardmarket_plan_batches`, `cardmarket_notify_admin_cart_ready`.

End-to-end Pullforge flow (one cart vs many, admin email): [cardmarket-fulfillment-flow.md](./cardmarket-fulfillment-flow.md).

## Ops fallback

For manual fulfillment, use search links from `cardmarketProductSearchUrl(name)` or [Shopping Wizard](https://www.cardmarket.com/en/Magic/ShoppingWizard).

## Seller rules (warehouse buying)

Defaults (override in `.env.local`):

| Env | Default | Meaning |
|-----|---------|---------|
| `CARDMARKET_SELLER_COUNTRIES` | `Germany` | Comma-separated seller **item locations** |
| `CARDMARKET_MIN_SELLER_SALES` | `100` | Minimum **Sales** on the listing tooltip (Cardmarket’s completed-sales count) |

Automation applies the on-site **Seller Location → Germany** filter, then adds the **cheapest** row that still has ≥100 sales.

## Notes

- Selectors follow the public Cardmarket UI and may need updates if the site changes.
- Respect Cardmarket cart abuse rules; only keep items you intend to buy.
- Checkout is intentionally blocked unless `CARDMARKET_ALLOW_CHECKOUT=true`.
