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
