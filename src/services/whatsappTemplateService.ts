export type TemplateType =
  | 'welcome'
  | 'expiry_reminder'
  | 'due_reminder'
  | 'payment_receipt'
  | 'closure_announcement';

export interface WelcomeTemplateParams {
  gymName: string;
  memberName: string;
  planName: string;
  expiryDate: string;
  timings?: string;
}

export interface ExpiryReminderTemplateParams {
  gymName: string;
  memberName: string;
  daysLeft: number;
  expiryDate: string;
}

export interface DueReminderTemplateParams {
  gymName: string;
  memberName: string;
  dueAmountFormatted: string;
  dueDate: string;
  vpa?: string;
}

export interface PaymentReceiptTemplateParams {
  gymName: string;
  memberName: string;
  amountFormatted: string;
  method: string;
  receiptId: string;
  remainingBalanceFormatted?: string;
}

export interface ClosureAnnouncementTemplateParams {
  gymName: string;
  reason: string;
  startDate: string;
  endDate: string;
  daysAdded: number;
}

/**
 * Sanitize and normalize Indian phone number to international E.164 without leading plus
 */
export function sanitizeIndianPhoneNumber(rawPhone: string): string {
  // Strip non-digit characters
  let digits = rawPhone.replace(/\D/g, '');

  // Strip leading 0 if present (e.g. 09876543210 -> 9876543210)
  if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  // Prepend 91 if standard 10 digit Indian number
  if (digits.length === 10) {
    digits = `91${digits}`;
  }

  return digits;
}

/**
 * Render standardized WhatsApp business message templates
 */
export function renderWhatsAppTemplate(
  type: TemplateType,
  params: Record<string, any>
): string {
  const gym = params.gymName || 'Paradise Gym';

  switch (type) {
    case 'welcome':
      return (
        `💪 Welcome to ${gym}, ${params.memberName}!\n\n` +
        `Your membership has been successfully registered:\n` +
        `• Plan: ${params.planName}\n` +
        `• Valid Until: ${params.expiryDate}\n` +
        (params.timings ? `• Gym Timings: ${params.timings}\n\n` : `\n`) +
        `Please scan your QR code at the desk upon arrival. Let's smash your fitness goals! 🚀`
      );

    case 'expiry_reminder':
      return (
        `🔔 ${gym} Membership Expiry Notice\n\n` +
        `Hi ${params.memberName}, your membership expires in ${params.daysLeft} days on ${params.expiryDate}.\n\n` +
        `Renew today to lock in your current package rates and maintain continuous gym floor access. 🏋️`
      );

    case 'due_reminder':
      return (
        `🔔 ${gym} Pending Fee Reminder\n\n` +
        `Dear ${params.memberName}, this is a gentle reminder that an amount of ${params.dueAmountFormatted} is pending (due: ${params.dueDate}).\n\n` +
        `You can clear this at the reception desk via Cash or UPI (${params.vpa || 'paradisegym@upi'}). Thank you for your support! 💪`
      );

    case 'payment_receipt':
      return (
        `🧾 Payment Receipt — ${gym}\n\n` +
        `Receipt #${params.receiptId.slice(0, 10)}\n` +
        `Member: ${params.memberName}\n` +
        `• Amount Paid: ${params.amountFormatted}\n` +
        `• Mode: ${params.method.toUpperCase()}\n` +
        (params.remainingBalanceFormatted && params.remainingBalanceFormatted !== '₹0'
          ? `• Remaining Dues: ${params.remainingBalanceFormatted}\n\n`
          : `\n`) +
        `Thank you for training with us! 🥊`
      );

    case 'closure_announcement':
      return (
        `📢 ${gym} Notice: Temporary Gym Closure\n\n` +
        `Dear Member,\n` +
        `The gym will remain closed from ${params.startDate} to ${params.endDate} due to: ${params.reason}.\n\n` +
        `✨ Auto-Extension Guarantee: Your active membership has been automatically extended by ${params.daysAdded} days so you never lose any workout days!\n\n` +
        `We look forward to seeing you back stronger! 💪`
      );

    default:
      return `Message from ${gym}`;
  }
}

/**
 * Generate full wa.me deep link with pre-encoded message body
 */
export function generateWhatsAppUrl(phone: string, text: string): string {
  const cleanPhone = sanitizeIndianPhoneNumber(phone);
  const encoded = encodeURIComponent(text);
  return `https://wa.me/${cleanPhone}?text=${encoded}`;
}
