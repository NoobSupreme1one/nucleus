interface ValidationResult {
  isValid: boolean;
  messages: string[];
}

export function isUnauthorizedError(error: Error): boolean {
  return /^401: .*Unauthorized/.test(error.message);
}

export function validatePassword(password: string): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    messages: []
  };

  if (password.length < 8) {
    result.isValid = false;
    result.messages.push("At least 8 characters");
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  if (!hasUpperCase) {
    result.isValid = false;
    result.messages.push("1 uppercase letter");
  }

  if (!hasLowerCase) {
    result.isValid = false;
    result.messages.push("1 lowercase letter");
  }

  if (!hasNumber) {
    result.isValid = false;
    result.messages.push("1 number");
  }

  if (!hasSpecialChar) {
    result.isValid = false;
    result.messages.push("1 special character");
  }

  return result;
}

export function formatAuthError(error: string): string {
  const messages: Record<string, string> = {
    "InvalidPasswordException": "Password requirements: 8+ characters with uppercase, lowercase, number, and special character",
    "UsernameExistsException": "Account already exists",
    "NotAuthorizedException": "Invalid email or password",
    "CodeMismatchException": "Invalid verification code",
    "ExpiredCodeException": "Verification code expired"
  };

  return messages[error] || error.replace(/^.*?: /, '');
}

export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message.replace(/^.*?: /, '');
  }
  return 'An unexpected error occurred';
}