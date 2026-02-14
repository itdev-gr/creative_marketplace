export class BookingError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = 'BookingError';
    Object.setPrototypeOf(this, BookingError.prototype);
  }
}

export class BookingNotAllowedError extends BookingError {
  constructor() {
    super('You are not allowed to create this booking.', 'booking-not-allowed');
    this.name = 'BookingNotAllowedError';
  }
}

export class PermissionDeniedError extends BookingError {
  constructor() {
    super('You do not have permission for this action.', 'permission-denied');
    this.name = 'PermissionDeniedError';
  }
}

export class BookingNotFoundError extends BookingError {
  constructor() {
    super('Booking not found.', 'booking-not-found');
    this.name = 'BookingNotFoundError';
  }
}

export class ValidationError extends BookingError {
  constructor(message: string) {
    super(message, 'validation');
    this.name = 'ValidationError';
  }
}
