import { describe, it, expect } from 'vitest';
import { whatsappService } from '@/services/whatsappService';

describe('WhatsApp Formatting & Digital Card Service', () => {
  it('formats personalized welcome message for WhatsApp sharing', () => {
    const message = whatsappService.formatWelcomeMessage({
      memberName: 'Arjun Das',
      gymName: 'Paradise Gym',
      planName: 'Monthly Standard',
      expiryDate: '31/12/2026',
    });

    expect(message).toContain('Arjun Das');
    expect(message).toContain('Paradise Gym');
    expect(message).toContain('Monthly Standard');
    expect(message).toContain('31/12/2026');
  });

  it('formats clean WhatsApp wa.me link with encoded phone and text', () => {
    const link = whatsappService.getWhatsAppLink({
      phone: '9876543210',
      message: 'Hello from Paradise Gym!',
    });

    expect(link).toContain('https://wa.me/919876543210');
    expect(link).toContain('text=Hello%20from%20Paradise%20Gym!');
  });

  it('formats renewal reminder message with expiry date', () => {
    const msg = whatsappService.formatExpiryReminder({
      memberName: 'Pooja',
      gymName: 'Paradise Gym',
      daysLeft: 3,
      expiryDate: '15/12/2026',
    });

    expect(msg).toContain('Pooja');
    expect(msg).toContain('3 days');
    expect(msg).toContain('15/12/2026');
  });
});
