import { describe, it, expect } from 'vitest';
import { isValidEmail, isValidPhone, validateCheckoutForm } from './validation';
import { CheckoutFormData } from '@/constants/checkout';

describe('validation', () => {
  describe('isValidEmail', () => {
    it('validates correct email addresses', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('first.last@domain.co.uk')).toBe(true);
    });

    it('rejects invalid email formats', () => {
      expect(isValidEmail('plainaddress')).toBe(false);
      expect(isValidEmail('@missingusername.com')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('isValidPhone', () => {
    it('validates valid phone numbers', () => {
      expect(isValidPhone('0912345678')).toBe(true);
      expect(isValidPhone('+84 912 345 678')).toBe(true);
      expect(isValidPhone('(028) 3822-1234')).toBe(true);
    });

    it('rejects invalid phone numbers', () => {
      expect(isValidPhone('123')).toBe(false);
      expect(isValidPhone('abcdefghijk')).toBe(false);
      expect(isValidPhone('')).toBe(false);
    });
  });

  describe('validateCheckoutForm', () => {
    const validFormData: CheckoutFormData = {
      contact: 'athlete@jocksport.com',
      country: 'Vietnam',
      firstName: 'Alex',
      lastName: 'Morgan',
      address: '123 Sport Ave',
      apartment: 'Suite 400',
      city: 'Ho Chi Minh',
      postalCode: '70000',
      phone: '0901234567',
      keepUpdated: false,
    };

    it('returns no errors for valid form data', () => {
      const errors = validateCheckoutForm(validFormData);
      expect(Object.keys(errors).length).toBe(0);
    });

    it('validates contact with phone number as alternative', () => {
      const errors = validateCheckoutForm({
        ...validFormData,
        contact: '0901234567',
      });
      expect(errors.contact).toBeUndefined();
    });

    it('flags required missing fields', () => {
      const invalidData: CheckoutFormData = {
        contact: '',
        country: 'Vietnam',
        firstName: '',
        lastName: '',
        address: '',
        apartment: '',
        city: '',
        postalCode: '',
        phone: '',
        keepUpdated: false,
      };

      const errors = validateCheckoutForm(invalidData);
      expect(errors.contact).toBeDefined();
      expect(errors.firstName).toBeDefined();
      expect(errors.lastName).toBeDefined();
      expect(errors.address).toBeDefined();
      expect(errors.city).toBeDefined();
      expect(errors.phone).toBeDefined();
    });

    it('flags invalid contact and phone format', () => {
      const invalidFormats: CheckoutFormData = {
        ...validFormData,
        contact: 'not-an-email-or-phone',
        phone: '12',
      };

      const errors = validateCheckoutForm(invalidFormats);
      expect(errors.contact).toContain('valid email address or phone number');
      expect(errors.phone).toContain('valid phone number');
    });
  });
});
