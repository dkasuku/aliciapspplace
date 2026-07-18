import { topdukaRequest } from "./client";
import { routes } from "./routes";
import type { StoreConfiguration, StoreInfo } from "./types";

export const store = {
  configuration: () => topdukaRequest<StoreConfiguration>(routes.configuration),
  info: () => topdukaRequest<StoreInfo>(routes.storeInfo),
};
