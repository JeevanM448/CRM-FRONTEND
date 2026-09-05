export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateLogin(data: { email: string; password: string }) {
  const errors: Record<string, string> = {};
  if (!data.email.trim()) errors.email = "Email is required";
  else if (!isValidEmail(data.email)) errors.email = "Enter a valid email address";
  if (!data.password.trim()) errors.password = "Password is required";
  return errors;
}

const MIN_PASSWORD_LENGTH = 8;

export function validatePasswordStrength(password: string) {
  if (!password.trim()) return "Password is required";
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return "Password must include letters and numbers";
  }
  return null;
}

export function validateChangePassword(data: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) {
  const errors: Record<string, string> = {};
  if (!data.currentPassword.trim()) errors.currentPassword = "Current password is required";
  const passwordError = validatePasswordStrength(data.newPassword);
  if (passwordError) errors.newPassword = passwordError;
  if (!data.confirmPassword.trim()) errors.confirmPassword = "Confirm your new password";
  else if (data.newPassword !== data.confirmPassword) {
    errors.confirmPassword = "Passwords do not match";
  }
  return errors;
}

export function validateSignInAccount(data: {
  signInEmail: string;
  password: string;
  confirmPassword: string;
  accountStatus?: string;
  isEdit?: boolean;
}) {
  const errors: Record<string, string> = {};
  if (!data.signInEmail.trim()) errors.signInEmail = "Sign-in email is required";
  else if (!isValidEmail(data.signInEmail)) errors.signInEmail = "Enter a valid email address";

  const changingPassword = Boolean(data.password.trim() || data.confirmPassword.trim());
  if (!data.isEdit || changingPassword) {
    const passwordError = validatePasswordStrength(data.password);
    if (passwordError) errors.password = passwordError;
    if (!data.confirmPassword.trim()) errors.confirmPassword = "Confirm password is required";
    else if (data.password !== data.confirmPassword) errors.confirmPassword = "Passwords do not match";
  }

  if (
    data.accountStatus &&
    data.accountStatus !== "active" &&
    data.accountStatus !== "invited" &&
    data.accountStatus !== "disabled"
  ) {
    errors.accountStatus = "Select a valid account status";
  }
  return errors;
}

export function validateCustomer(data: {
  name: string;
  contactEmail?: string;
}) {
  const errors: Record<string, string> = {};
  if (!data.name.trim()) errors.name = "Company name is required";
  if (data.contactEmail && !isValidEmail(data.contactEmail)) {
    errors.contactEmail = "Enter a valid email address";
  }
  return errors;
}

export function validateContact(data: { name: string; email: string; companyId: string }) {
  const errors: Record<string, string> = {};
  if (!data.name.trim()) errors.name = "Name is required";
  if (!data.companyId) errors.companyId = "Customer is required";
  if (!data.email.trim()) errors.email = "Email is required";
  else if (!isValidEmail(data.email)) errors.email = "Enter a valid email address";
  return errors;
}

export function validateManager(data: { name: string; email: string; team: string; status?: string }) {
  const errors: Record<string, string> = {};
  if (!data.name.trim()) errors.name = "Full name is required";
  if (!data.email.trim()) errors.email = "Email is required";
  else if (!isValidEmail(data.email)) errors.email = "Enter a valid email address";
  if (!data.team.trim()) errors.team = "Team is required";
  if (data.status && data.status !== "active" && data.status !== "inactive") {
    errors.status = "Select a valid status";
  }
  return errors;
}

export function validateSalesperson(data: {
  name: string;
  email: string;
  managerId?: string;
  targetAmount: number;
  status?: string;
}) {
  const errors: Record<string, string> = {};
  if (!data.name.trim()) errors.name = "Full name is required";
  if (!data.email.trim()) errors.email = "Email is required";
  else if (!isValidEmail(data.email)) errors.email = "Enter a valid email address";
  if (!Number.isFinite(data.targetAmount) || data.targetAmount < 0) {
    errors.targetAmount = "Target must be 0 or greater";
  }
  if (data.status && data.status !== "active" && data.status !== "inactive") {
    errors.status = "Select a valid status";
  }
  return errors;
}

export function validateDeal(data: {
  title: string;
  customerId: string;
  value: number;
  probability: number;
  expectedClose: string;
}) {
  const errors: Record<string, string> = {};
  if (!data.title.trim()) errors.title = "Deal title is required";
  if (!data.customerId) errors.customerId = "Customer is required";
  if (data.value < 0) errors.value = "Value must be 0 or greater";
  if (data.probability < 0 || data.probability > 100) {
    errors.probability = "Probability must be between 0 and 100";
  }
  if (!data.expectedClose) errors.expectedClose = "Expected close date is required";
  return errors;
}

export function isValidWebsite(url: string) {
  if (!url.trim()) return true;
  return /^https?:\/\/.+/i.test(url.trim());
}

export function validateOrganizationProfile(data: {
  companyName: string;
  email?: string;
  website?: string;
  phone?: string;
}) {
  const errors: Record<string, string> = {};
  if (!data.companyName.trim()) errors.companyName = "Company name is required";
  if (data.email && !isValidEmail(data.email)) errors.email = "Enter a valid email address";
  if (data.website && !isValidWebsite(data.website)) {
    errors.website = "Enter a valid website URL (https://...)";
  }
  if (data.phone && data.phone.trim().length < 6) {
    errors.phone = "Enter a valid phone number";
  }
  return errors;
}

export function validateOrganizationLogoFile(file: File): string | null {
  if (!file) return "A logo file is required";
  const allowed = ["image/png", "image/jpeg", "image/webp"];
  const mimeType = file.type.toLowerCase();
  if (!allowed.includes(mimeType)) {
    return "Logo must be a PNG, JPEG, or WEBP image";
  }
  const maxBytes = 2 * 1024 * 1024;
  if (file.size > maxBytes) {
    return "Logo must be 2 MB or smaller";
  }
  return null;
}
