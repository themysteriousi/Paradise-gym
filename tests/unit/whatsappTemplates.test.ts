import { describe, it, expect } from 'vitest';
import {
  generateWhatsAppUrl,
  renderWhatsAppTemplate,
  sanitizeIndianPhoneNumber,
} from '@/services/whatsappTemplateService';

describe('WhatsApp Template Engine & Deep-Link Service', () => {
  describe('Indian Phone Number Sanitization', () => {
    it('normalizes 10-digit local number to E.164 with India country code 91', () => {
      expect(sanitizeIndianPhoneNumber('9876543210')).toBe('919876543210');
    });

    it('handles numbers with spaces, hyphens, and +91 prefix', () => {
      expect(sanitizeIndianPhoneNumber('+91 98765-43210')).toBe('919876543210');
      expect(sanitizeIndianPhoneNumber('919876543210')).toBe('919876543210');
      expect(sanitizeIndianPhoneNumber('09876543210')).toBe('919876543210');
    });
  });

  describe('Template Rendering', () => {
    it('renders Welcome message with member name, plan, and gym details', () => {
      const rendered = renderWhatsAppTemplate('welcome', {
        gymName: 'Paradise Gym',
        memberName: 'Rohan Sharma',
        planName: 'Quarterly Value',
        expiryDate: '2026-05-15',
      });

      expect(rendered).toContain('Welcome to Paradise Gym, Rohan Sharma');
      expect(rendered).toContain('Quarterly Value');
      expect(rendered).toContain('2026-05-15');
    });

    it('renders Expiry Reminder with dynamic days remaining', () => {
      const rendered = renderWhatsAppTemplate('expiry_reminder', {
        gymName: 'Paradise Gym',
        memberName: 'Pooja Verma',
        daysLeft: 3,
        expiryDate: '2026-02-14',
      });

      expect(rendered).toContain('Pooja Verma');
      expect(rendered).toContain('expires in 3 days');
      expect(rendered).toContain('2026-02-14');
    });

    it('renders Due Reminder with amount in Rupees and UPI VPA', () => {
      const rendered = renderWhatsAppTemplate('due_reminder', {
        gymName: 'Paradise Gym',
        memberName: 'Aditya Patel',
        dueAmountFormatted: '₹1,500',
        dueDate: '2026-02-01',
        vpa: 'paradisegym@upi',
      });

      expect(rendered).toContain('Aditya Patel');
      expect(rendered).toContain('₹1,500');
      expect(rendered).toContain('paradisegym@upi');
    });

    it('renders Closure Announcement with auto-extension details', () => {
      const rendered = renderWhatsAppTemplate('closure_announcement', {
        gymName: 'Paradise Gym',
        reason: 'Annual Diwali Holiday & Equipment Maintenance',
        startDate: '2026-11-01',
        endDate: '2026-11-04',
        daysAdded: 4,
      });

      expect(rendered).toContain('Annual Diwali Holiday');
      expect(rendered).toContain('automatically extended by 4 days');
    });
  });

  describe('Direct Deep Link Generation', () => {
    it('generates encoded wa.me URL ready for browser or mobile WhatsApp launch', () => {
      const url = generateWhatsAppUrl('9876543210', 'Hello from Paradise Gym!');
      expect(url.startsWith('https://wa.me/919876543210?text=')).toBe(true);
      expect(url).toContain(encodeURIComponent('Hello from Paradise Gym!'));
    });
  });
});
