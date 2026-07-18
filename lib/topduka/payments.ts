import { topdukaRequest } from "./client";
import { routes } from "./routes";
import type {
  InitializePaymentInput,
  InitializePaymentResponse,
  PaymentConfig,
  VerifyPaymentInput,
  VerifyPaymentResponse,
} from "./types";

export const payments = {
  config: () => topdukaRequest<PaymentConfig>(routes.paymentConfig),
  initialize: (input: InitializePaymentInput) =>
    topdukaRequest<InitializePaymentResponse>(routes.paymentInitialize, {
      method: "POST",
      body: input,
    }),
  verify: (input: VerifyPaymentInput) =>
    topdukaRequest<VerifyPaymentResponse>(routes.paymentVerify, {
      method: "POST",
      body: input,
    }),
};
