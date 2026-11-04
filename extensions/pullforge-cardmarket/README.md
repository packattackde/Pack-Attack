# Pullforge Cardmarket extension (required for one-click automation)

1. Chrome → `chrome://extensions` → Developer mode → **Load unpacked** → select this folder.
2. Copy the **extension ID** → add to server `.env` and your `.env.local`:
   `NEXT_PUBLIC_CARDMARKET_EXTENSION_ID=<id>`
3. On your PC, keep running: `npm run cardmarket:agent`
4. Log into Cardmarket in the Chrome window the agent opens (once).

Then on pack-attack.de **Admin → Orders** use **Automate Cardmarket order**.
