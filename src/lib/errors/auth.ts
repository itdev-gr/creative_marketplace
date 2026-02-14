export class AuthError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'email-already-in-use'
      | 'invalid-credential'
      | 'weak-password'
      | 'network'
      | 'unknown'
  ) {
    super(message);
    this.name = 'AuthError';
    Object.setPrototypeOf(this, AuthError.prototype);
  }
}

export class EmailAlreadyInUseError extends AuthError {
  constructor() {
    super('This email is already registered.', 'email-already-in-use');
    this.name = 'EmailAlreadyInUseError';
  }
}

export class InvalidCredentialError extends AuthError {
  constructor() {
    super('Invalid email or password.', 'invalid-credential');
    this.name = 'InvalidCredentialError';
  }
}

export class WeakPasswordError extends AuthError {
  constructor() {
    super('Password should be at least 6 characters.', 'weak-password');
    this.name = 'WeakPasswordError';
  }
}

export class AuthNetworkError extends AuthError {
  constructor() {
    super('Network error. Please try again.', 'network');
    this.name = 'AuthNetworkError';
  }
}
