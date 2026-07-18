# TopDuka storefront template

A production-shaped Next.js storefront starter for the TopDuka public API. It includes a server-rendered catalog, responsive editorial UI, a server-only typed API client, and a product-aware customer agent.

## Start in two minutes

1. Copy `.env.example` to `.env.local`.
2. Add the API key from your TopDuka store:

```env
NEXT_TOPDUKA_API_KEY=ak_your_store_api_key
```

3. Install and run:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). That single key is all you need when using the hosted TopDuka API.

For a local or self-hosted backend, optionally set:

```env
NEXT_TOPDUKA_API_URL=http://localhost:8000/pb/v1
```

Do not prefix the key with `NEXT_PUBLIC_`. The SDK imports `server-only`, and the browser talks to same-origin Route Handlers when it needs an interactive API call.

## Project map

```text
app/
  page.tsx             SSR catalog data loader
  api/agent/route.ts   safe browser-to-server customer agent bridge
components/
  storefront.tsx       catalog filters and storefront interactions
  agent-panel.tsx      customer-facing shopping assistant
lib/topduka/
  client.ts            authentication, errors, base URL and fetch wrapper
  routes.ts            one registry for every public endpoint
  products.ts          products, categories and bookings
  cart.ts              cart lifecycle
  orders.ts            order list, detail and tracking
  payments.ts          payment configuration and flow
  store.ts             store information and public configuration
  agent.ts             customer agent
  types.ts             request and response types
```

Import API groups only in Server Components, Server Actions, or Route Handlers:

```ts
import { products, store } from "@/lib/topduka";

const [storeInfo, catalog] = await Promise.all([
  store.info(),
  products.list({ status: "active", limit: 24 }),
]);
```

## Complete public API coverage

All registered `/pb/v1` routes are represented in `lib/topduka`. The client automatically sends `NEXT_TOPDUKA_API_KEY` as `x-api-key`.

| Area | Method | Public route | SDK method |
| --- | --- | --- | --- |
| Products | GET | `/products` | `products.list()` |
| Categories | GET | `/categories` | `products.categories()` |
| Categories | GET | `/categories/:id/products` | `products.byCategory()` |
| Products | GET | `/products/popular` | `products.popular()` |
| Products | GET | `/products/discounted` | `products.discounted()` |
| Products | GET | `/products/new-arrivals` | `products.newArrivals()` |
| Products | GET | `/products/most-sold` | `products.mostSold()` |
| Products | GET | `/products/best-selling` | `products.bestSelling()` |
| Bookings | GET | `/products/:id/availability` | `products.availability()` |
| Bookings | POST | `/bookings` | `products.createBooking()` |
| Cart | GET | `/cart` | `cart.get()` |
| Cart | POST | `/cart` | `cart.create()` |
| Cart | POST | `/cart/update` | `cart.update()` |
| Cart | POST | `/cart/complete` | `cart.complete()` |
| Cart | POST | `/cart/clear` | `cart.clear()` |
| Cart | DELETE | `/cart` | `cart.remove()` |
| Orders | GET | `/orders` | `orders.list()` |
| Orders | GET | `/orders/track` | `orders.track()` |
| Orders | GET | `/orders/:id` | `orders.get()` |
| Payments | GET | `/payments/config` | `payments.config()` |
| Payments | POST | `/payments/initialize` | `payments.initialize()` |
| Payments | POST | `/payments/verify` | `payments.verify()` |
| Store | GET | `/config` | `store.configuration()` |
| Store | GET | `/store-info` | `store.info()` |
| Agent | POST | `/agent/chat` | `agent.chat()` |

Types reflect the current Go handlers and can be extended in `types.ts` as your storefront grows.

## Customer agent

The floating “Ask the shop” panel posts to `/api/agent` in this Next.js app. That handler calls TopDuka from the server, so the API key is never sent to the customer. The backend builds the agent context from the authenticated store and its active catalog; customers cannot supply system prompts or another store ID.

Use it elsewhere on the server with:

```ts
import { agent } from "@/lib/topduka";

const answer = await agent.chat({
  message: "Which products are currently discounted?",
  session_id: existingSessionId,
});
```

## Customize

- Change storefront composition and styling in `components/storefront.tsx`.
- Replace the preview products in `app/page.tsx`; they only appear when an API catalog cannot be loaded.
- Keep secrets and checkout mutations in Server Actions or Route Handlers.
- Use the cart, order, booking, and payment modules to add your preferred checkout flow.

## Production checks

```bash
npm run lint
npm run build
npm start
```

The home route is rendered dynamically on the server, preserving SSR for store and catalog data.

## Deploy on ScaleNodes

You can deploy this storefront on [ScaleNodes](https://scalenodes.com):

1. Push the template to your Git repository and create a Node.js web service on ScaleNodes.
2. Use `npm ci && npm run build` as the build command.
3. Use `npm start` as the start command and expose port `3000`.
4. Add `NEXT_TOPDUKA_API_KEY` as a secret environment variable.
5. Deploy and attach your domain.

Set `NEXT_TOPDUKA_API_URL` only when the storefront should use a different TopDuka API origin.
