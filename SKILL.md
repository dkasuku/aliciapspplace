---
name: topduka-template
description: Build, customize, debug, or extend production storefronts and commerce integrations using the TopDuka Next.js template, typed server-side SDK, public REST API, and MCP server. Use for TopDuka catalog, category, cart, checkout, shipping, order, payment, booking, customer-agent, storefront UI, or API implementation tasks.
---

# TopDuka Storefront Template

Use this repository as the working storefront. Preserve its server-only API boundary while changing the replaceable UI freely.

## Start with the contract

1. Read `README.md` for deployment, environment, commerce flow, and project structure.
2. Read `GET_API_GUIDE.md` before implementing catalog feeds, product filters, pagination, carts, orders, or other GET requests.
3. Read `lib/topduka/routes.ts`, `types.ts`, and the feature module related to the request.
4. When a TopDuka MCP connection is available, read `topduka://api/reference` or call `topduka_api_reference` before adding an endpoint. Use the `implement_topduka_api` prompt for a new integration feature.
5. Do not invent endpoints, payload fields, payment states, shipping prices, or tax behavior.

## Preserve the security boundary

- Keep `TOPDUKA_API_KEY` and `TOPDUKA_API_URL` in server-only environment variables.
- Never introduce `NEXT_PUBLIC_TOPDUKA_API_KEY`, return the key to a browser, place it in a query string, or log it.
- Make browser components call Server Actions or same-origin `app/api` handlers.
- Make server code call the shared client in `lib/topduka/client.ts`.
- Preserve store scoping by using the configured API key on every TopDuka request.
- Verify payments server-side before completing a cart.
- Persist cart session IDs in secure HTTP-only same-site cookies.

## Implement a feature

1. Identify the API area and read its module:
   - catalog and bookings: `lib/topduka/products.ts`
   - cart and checkout: `lib/topduka/cart.ts`
   - shipping: `lib/topduka/shipping.ts`
   - orders: `lib/topduka/orders.ts`
   - payments: `lib/topduka/payments.ts`
   - store configuration: `lib/topduka/store.ts`
   - customer AI: `lib/topduka/agent.ts`
2. Add or refine contracts in `lib/topduka/types.ts` before composing UI.
3. Add route constants only in `lib/topduka/routes.ts`.
4. Add API operations to the relevant feature module through `topdukaRequest`; do not scatter raw authenticated fetch calls across components.
5. Put secure mutations and secret-dependent work in Server Actions or `app/api` handlers.
6. Keep components focused on rendering, interaction, loading, empty, validation, and error states.
7. Load currency, VAT, store identity, payment availability, and shipping rates from TopDuka instead of hard-coding them.

## Work with Next.js correctly

This repository may use a newer Next.js version than expected. Read the relevant file under `node_modules/next/dist/docs/` before changing framework APIs or conventions. Heed deprecation notices.

Prefer Server Components for catalog and store reads. Add client components only for interactive state such as cart controls, checkout forms, and chat. Keep API keys out of React props and serialized server-component output.

## Validate

Run:

```bash
npm run lint
npm run build
```

Exercise the affected flow end to end. For checkout work, cover cart creation, line updates, live shipping rates, VAT display, the selected payment path, order completion, and cookie cleanup.
