import { topdukaRequest } from "./client";
import { routes } from "./routes";
import type { ShippingRateRequest, ShippingRateResponse, ShippingZone } from "./types";

export const shipping = {
  zones: () => topdukaRequest<ShippingZone[]>(routes.shippingZones),
  rates: (input: ShippingRateRequest) =>
    topdukaRequest<ShippingRateResponse>(routes.shippingRates, { method: "POST", body: input }),
};
