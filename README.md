# TopDuka Storefront

A complete Next.js storefront starter for a TopDuka store: server-rendered catalog, product pages, persistent cart, one-page checkout, configured delivery rates, VAT, Cash on Delivery, Paystack, order completion, and a product-aware customer agent.

The UI is intentionally generic and easy to replace. The important commerce and API wiring is already done.

## What is included

- Product and category catalog loaded on the server
- Product detail pages and a server-backed cart session
- Single-page checkout with required name, email, and phone
- Delivery zones and rates read from TopDuka—no guessed shipping prices
- VAT calculated from store configuration
- Cash on Delivery and Paystack initialization, callback verification, and cart completion
- Store-specific AI chat using `/pb/v1/agent/chat/:agent_id`
- Markdown answers and clickable product attachments in chat
- Typed, server-only SDK coverage for every public API area

## 1. Deploy TopDuka on ScaleNodes

Sign in at [scalenodes.com](https://scalenodes.com), then:

1. Open **ScaleNodes Suite** and choose **Launch a ScaleApp**.
2. Enter an application name and select the **TopDuka** original app.
3. Choose the managed node that will run it and deploy.
4. Wait until the application and attached PostgreSQL service are running.
5. Under **Service endpoints**, copy the public endpoint for **port 8080**. That is the backend URL used by this storefront. Port 3000 is the bundled TopDuka dashboard.

In TopDuka, add products and categories, configure delivery zones and methods, set VAT, enable payment methods, create a public API key, and optionally configure a customer agent.

## 2. Connect this storefront

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
TOPDUKA_API_URL=https://your-app-port-8080.go.scalenodes.app
TOPDUKA_API_KEY=ak_your_store_api_key
TOPDUKA_AGENT_ID=optional_agent_uuid
```

You may paste either the ScaleNodes endpoint or the full endpoint ending in `/pb/v1`; the client normalizes both forms.

The project also accepts the legacy names `NEXT_TOPDUKA_API_URL`, `NEXT_TOPDUKA_API_KEY`, and `NEXT_TOPDUKA_AGENT_ID`. Do not use `NEXT_PUBLIC_` for the API key: browsers never need this secret.

## 3. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Commerce flow

The browser only calls same-origin Next.js routes and Server Actions. The TopDuka API key remains on the server.

1. Adding a product creates a TopDuka cart and saves its session ID in an HTTP-only cookie.
2. Checkout loads the zones configured for the store.
3. Selecting a zone requests current delivery methods and prices from TopDuka.
4. The summary adds the selected delivery price and configured VAT.
5. Cash orders complete immediately. Paystack orders redirect to Paystack, verify the callback server-side, and then complete the same cart.
6. Successful completion clears the cart cookie.

## Project map

```text
app/
  page.tsx                 server-rendered storefront
  products/[id]/page.tsx  product detail route
  checkout/               checkout page and secure Server Actions
  api/cart/route.ts        HTTP-only cart-session bridge
  api/agent/route.ts       server-only customer-agent bridge
components/
  storefront.tsx          replaceable catalog UI
  cart-provider.tsx       shared cart state
  cart-drawer.tsx         persistent cart controls
  checkout.tsx            delivery, VAT and payment flow
  agent-panel.tsx         markdown chat and product links
lib/topduka/
  client.ts               authentication, errors and fetch wrapper
  products.ts             catalog, collections and bookings
  cart.ts                 cart lifecycle
  shipping.ts             zones and live rates
  orders.ts               order lookup and tracking
  payments.ts             configuration, initialize and verify
  store.ts                store information and configuration
  agent.ts                generic or agent-specific conversation
```

## Public API coverage

All paths are relative to `/pb/v1`.

| Area | Routes |
| --- | --- |
| Products | `GET /products`, `/products/popular`, `/products/discounted`, `/products/new-arrivals`, `/products/most-sold`, `/products/best-selling` |
| Categories | `GET /categories`, `/categories/:id/products` |
| Bookings | `GET /products/:id/availability`, `POST /bookings` |
| Cart | `GET/POST/DELETE /cart`, `POST /cart/update`, `/cart/clear`, `/cart/complete` |
| Shipping | `GET /shipping/zones`, `POST /shipping/rates` |
| Orders | `GET /orders`, `/orders/:id`, `/orders/track` |
| Payments | `GET /payments/config`, `POST /payments/initialize`, `/payments/verify` |
| Store | `GET /config`, `/store-info` |
| AI | `POST /agent/chat`, `/agent/chat/:agent_id`, `/ai/discover` |

## Customize and deploy

Replace the components and Tailwind styles without changing `lib/topduka` or the secure server bridges. Before deploying:

```bash
npm run lint
npm run build
npm start
```

On ScaleNodes or another Node.js host, expose port `3000` and add the three environment variables as secrets. Use `npm ci && npm run build` as the build command and `npm start` as the start command.
# aliciapspplace
"# aliciapspplace" 
