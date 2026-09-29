import { CheckoutFormData, CheckoutFormErrors } from '@/constants/checkout';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9+\-\s()]{8,15}$/;

/**
 * Validates whether an email string is formatted correctly.
 */
export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

/**
 * Validates whether a phone number is formatted correctly (8-15 digits with optional standard symbols).
 */
export function isValidPhone(phone: string): boolean {
  return PHONE_REGEX.test(phone.trim());
}

/**
 * Validates the checkout form fields and returns field-level error messages.
 */
export function validateCheckoutForm(formData: CheckoutFormData): CheckoutFormErrors {
  const errors: CheckoutFormErrors = {};

  const trimmedContact = formData.contact.trim();
  if (!trimmedContact) {
    errors.contact = 'Email or phone number is required.';
  } else if (!isValidEmail(trimmedContact) && !isValidPhone(trimmedContact)) {
    errors.contact = 'Please enter a valid email address or phone number.';
  }

  if (!formData.firstName.trim()) {
    errors.firstName = 'First name is required.';
  }

  if (!formData.lastName.trim()) {
    errors.lastName = 'Last name is required.';
  }

  if (!formData.address.trim()) {
    errors.address = 'Street address is required.';
  }

  if (!formData.city.trim()) {
    errors.city = 'City is required.';
  }

  const trimmedPhone = formData.phone.trim();
  if (!trimmedPhone) {
    errors.phone = 'Phone number is required.';
  } else if (!isValidPhone(trimmedPhone)) {
    errors.phone = 'Please enter a valid phone number.';
  }

  return errors;
}
