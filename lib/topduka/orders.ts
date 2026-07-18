import { topdukaRequest } from "./client";
import { routes } from "./routes";
import type { Order } from "./types";

export const orders = {
  list: (params: { skip?: number } = {}) =>
    topdukaRequest<Order[]>(routes.orders, { query: params }),
  track: (orderNumber: number | string) =>
    topdukaRequest<Order>(routes.orderTracking, { query: { order_number: orderNumber } }),
  get: (orderNumber: number | string) => topdukaRequest<Order>(routes.order(String(orderNumber))),
};
