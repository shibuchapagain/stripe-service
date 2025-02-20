import CustomError from "./customError";

class StripeInitializationError extends CustomError {
  constructor(message: string) {
    super(message, 400);
    this.name = "StripeInitializationError";
  }
}

class MissingRequiredParameterError extends CustomError {
  constructor(message: string) {
    super(message, 422);
    this.name = "MissingRequiredParameterError";
  }
}

class CheckoutSessionCreationError extends CustomError {
  constructor(message: string) {
    super(message, 400);
    this.name = "CheckoutSessionCreationError";
  }
}

class SessionRetrievalError extends CustomError {
  constructor(message: string) {
    super(message, 400);
    this.name = "SessionRetrievalError";
  }
}

class WebhookSignatureVerificationError extends CustomError {
  constructor(message: string) {
    super(message, 400);
    this.name = "WebhookSignatureVerificationError";
  }
}

class WebhookProcessingError extends CustomError {
  constructor(message: string) {
    super(message, 400);
    this.name = "WebhookProcessingError";
  }
}

//
export {
  StripeInitializationError,
  MissingRequiredParameterError,
  CheckoutSessionCreationError,
  SessionRetrievalError,
  WebhookSignatureVerificationError,
  WebhookProcessingError,
};
