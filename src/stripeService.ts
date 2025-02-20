import Stripe from "stripe";
import { v4 as uuidv4 } from "uuid";

import {
  CheckoutSessionCreationError,
  MissingRequiredParameterError,
  SessionRetrievalError,
  StripeInitializationError,
  WebhookProcessingError,
  WebhookSignatureVerificationError,
} from "./utils/errors";

import type {
  ChargeSucceededEvent,
  ChargeUpdatedEvent,
  CheckoutSessionCompletedEvent,
  CreateCheckoutSessionInput,
  GetCheckoutSessionInput,
  IStripeService,
  PaymentIntentCreatedEvent,
  PaymentIntentSucceededEvent,
  StripeWebhookEvent,
} from "./types/stripe-types";

export class StripeService implements IStripeService {
  private stripe: Stripe;
  private webhookSecret: string;

  constructor(stripeSecretKey: string, webhookSecret: string) {
    if (!stripeSecretKey) {
      throw new StripeInitializationError("Stripe secret key is required.");
    }

    if (!webhookSecret) {
      throw new StripeInitializationError("Stripe webhook secret is required.");
    }

    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2025-01-27.acacia",
      maxNetworkRetries: 3, // Example
    });
    this.webhookSecret = webhookSecret;
  }

  public async createCheckoutSession(
    input: CreateCheckoutSessionInput
  ): Promise<{ url: string; sessionId: string }> {
    try {
      const { amount, currency, successUrl, cancelUrl, ...otherLineItemData } =
        input;

      if (!amount || !currency || !successUrl || !cancelUrl) {
        throw new MissingRequiredParameterError(
          "Amount, currency, successUrl, and cancelUrl are required."
        );
      }

      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency,
              product_data: {
                name: "Your Product Name",
              },
              unit_amount: amount,
            },
            quantity: 1,
            ...otherLineItemData,
          },
        ],
        mode: "payment",
        success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl,
        client_reference_id: uuidv4(), // Crucial: Unique ID for your system
      });

      return { url: session.url!, sessionId: session.id };
    } catch (error) {
      console.error("Error creating checkout session:", error);
      throw new CheckoutSessionCreationError(
        "Failed to create checkout session."
      );
    }
  }

  public async getCheckoutSession(
    input: GetCheckoutSessionInput
  ): Promise<Stripe.Checkout.Session> {
    try {
      const { sessionId } = input;

      if (!sessionId) {
        throw new MissingRequiredParameterError("Session ID is required.");
      }

      const session = await this.stripe.checkout.sessions.retrieve(sessionId);
      return session;
    } catch (error) {
      console.error("Error retrieving session:", error);
      throw new SessionRetrievalError("Failed to retrieve session.");
    }
  }

  public async handleWebhook(
    payload: string | Buffer,
    signature: string
  ): Promise<StripeWebhookEvent | null> {
    // Accept raw payload and signature
    let event: StripeWebhookEvent;

    try {
      event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.webhookSecret
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      throw new WebhookSignatureVerificationError(
        `Webhook signature verification failed: ${err}`
      );
    }

    try {
      const processedEvent = await this.processWebhookEvent(event);
      return processedEvent; // Return the processed event if needed
    } catch (error) {
      console.error("Webhook processing error:", error);
      throw new WebhookProcessingError(`Webhook processing error: ${error}`);
    }
  }

  private async processWebhookEvent(
    event: StripeWebhookEvent
  ): Promise<StripeWebhookEvent | null> {
    switch (event.type) {
      case "payment_intent.created":
        if (event.type === "payment_intent.created") {
          return this.handlePaymentIntentCreated(
            event as PaymentIntentCreatedEvent
          );
        }
      case "payment_intent.succeeded":
        return this.handlePaymentIntentSucceeded(
          event as PaymentIntentSucceededEvent
        );
      case "charge.updated":
        return this.handleChargeUpdated(event as ChargeUpdatedEvent);
      case "charge.succeeded":
        return this.handleChargeSucceeded(event as ChargeSucceededEvent);
      case "checkout.session.completed":
        return this.handleCheckoutSessionCompleted(
          event as CheckoutSessionCompletedEvent
        );
      default:
        console.log(`Unhandled event type: ${event.type}`);
        return null;
    }
  }

  // --- Event Handlers (Return the event for further processing if needed) ---
  private async handlePaymentIntentCreated(
    event: PaymentIntentCreatedEvent
  ): Promise<PaymentIntentCreatedEvent> {
    const paymentIntent = event.data.object;
    console.log("Payment Intent Created:", {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      created_at: paymentIntent.created,
    });
    // ... your logic (e.g., database update) ...
    return event;
  }

  private async handlePaymentIntentSucceeded(
    event: PaymentIntentSucceededEvent
  ): Promise<PaymentIntentSucceededEvent> {
    const paymentIntent = event.data.object;
    console.log("Payment Intent Succeeded:", {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      receipt_email: paymentIntent.receipt_email,
    });
    // ... your logic ...
    return event;
  }

  private async handleChargeUpdated(
    event: ChargeUpdatedEvent
  ): Promise<ChargeUpdatedEvent> {
    const charge = event.data.object;
    console.log("Charge Updated:", {
      id: charge.id,
      amount: charge.amount,
      paid: charge.paid,
      status: charge.status,
    });
    // ... your logic ...
    return event;
  }

  private async handleChargeSucceeded(
    event: ChargeSucceededEvent
  ): Promise<ChargeSucceededEvent> {
    const charge = event.data.object;
    console.log("Charge Succeeded:", {
      id: charge.id,
      amount: charge.amount,
      payment_method: charge.payment_method,
      status: charge.status,
    });
    // ... your logic ...
    return event;
  }

  private async handleCheckoutSessionCompleted(
    event: CheckoutSessionCompletedEvent
  ): Promise<CheckoutSessionCompletedEvent> {
    const session = event.data.object;
    console.log("Checkout Session Completed:", {
      id: session.id,
      customer: session.customer,
      payment_status: session.payment_status,
      amount_total: session.amount_total,
      currency: session.currency,
      session_url: session.url,
      client_reference_id: session.client_reference_id,
    });
    // CRITICAL: Add your logic here (e.g., database update) ...
    return event;
  }
}
