export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function validateLogin(email: string, password: string): string | null {
  if (!isValidEmail(email)) return "Enter a valid email address.";
  if (!password) return "Enter your password.";
  return null;
}

export function validateRegister(
  name: string,
  email: string,
  password: string,
  consent: boolean,
): string | null {
  if (name.trim().length < 2) return "Enter your name.";
  if (!isValidEmail(email)) return "Enter a valid email address.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!consent) return "Please accept the consent to continue.";
  return null;
}
