import Stripe from "stripe";

export interface IStripeService {
  createCheckoutSession(
    input: CreateCheckoutSessionInput
  ): Promise<{ url: string; sessionId: string }>;

  getCheckoutSession(
    input: GetCheckoutSessionInput
  ): Promise<Stripe.Checkout.Session>;

  handleWebhook(
    payload: string | Buffer,
    signature: string
  ): Promise<StripeWebhookEvent | null>;
}

export interface CreateCheckoutSessionInput {
  amount: number;
  currency: "usd" | "eur";
  successUrl: string;
  cancelUrl: string;
}

export interface GetCheckoutSessionInput {
  sessionId: string;
}

export interface PaymentIntentCreatedEvent extends Stripe.EventBase {
  type: "payment_intent.created";
  data: { object: Stripe.PaymentIntent };
}

export interface PaymentIntentSucceededEvent extends Stripe.EventBase {
  type: "payment_intent.succeeded";
  data: { object: Stripe.PaymentIntent };
}

export interface ChargeUpdatedEvent extends Stripe.EventBase {
  type: "charge.updated";
  data: { object: Stripe.Charge };
}

export interface ChargeSucceededEvent extends Stripe.EventBase {
  type: "charge.succeeded";
  data: { object: Stripe.Charge };
}

export interface CheckoutSessionCompletedEvent extends Stripe.EventBase {
  type: "checkout.session.completed";
  data: { object: Stripe.Checkout.Session };
}

export type StripeWebhookEvent =
  | PaymentIntentCreatedEvent
  | PaymentIntentSucceededEvent
  | ChargeUpdatedEvent
  | ChargeSucceededEvent
  | CheckoutSessionCompletedEvent
  | Stripe.EventBase;
