export interface WelcomeMessageOptions {
  memberName: string;
  gymName: string;
  planName: string;
  expiryDate: string;
}

export interface ExpiryReminderOptions {
  memberName: string;
  gymName: string;
  daysLeft: number;
  expiryDate: string;
}

export interface PaymentReceiptOptions {
  memberName: string;
  gymName: string;
  amountFormatted: string;
  method: string;
  paymentDate: string;
  remainingBalanceFormatted?: string;
}

export const whatsappService = {
  formatWelcomeMessage({ memberName, gymName, planName, expiryDate }: WelcomeMessageOptions): string {
    return (
      `💪 Welcome to ${gymName}, ${memberName}!\n\n` +
      `Your membership has been activated:\n` +
      `• Plan: ${planName}\n` +
      `• Valid Until: ${expiryDate}\n\n` +
      `Please save this number for quick QR attendance check-in and updates. Let's achieve your fitness goals together! 🚀`
    );
  },

  formatExpiryReminder({ memberName, gymName, daysLeft, expiryDate }: ExpiryReminderOptions): string {
    return (
      `🔔 ${gymName} Membership Reminder\n\n` +
      `Hi ${memberName}, your gym membership expires in ${daysLeft} days on ${expiryDate}.\n\n` +
      `Renew today to avoid any interruption in your workout routine and keep your current membership benefits active. Contact the desk for 1-tap renewal! 🏋️`
    );
  },

  formatPaymentReceipt({
    memberName,
    gymName,
    amountFormatted,
    method,
    paymentDate,
    remainingBalanceFormatted,
  }: PaymentReceiptOptions): string {
    let msg =
      `🧾 Payment Receipt — ${gymName}\n\n` +
      `Received with thanks from ${memberName}:\n` +
      `• Amount Paid: ${amountFormatted}\n` +
      `• Payment Mode: ${method.toUpperCase()}\n` +
      `• Date: ${paymentDate}\n`;

    if (remainingBalanceFormatted && remainingBalanceFormatted !== '₹0') {
      msg += `• Outstanding Dues: ${remainingBalanceFormatted}\n`;
    }

    msg += `\nThank you for choosing ${gymName}! 💪`;
    return msg;
  },

  formatDueReminder({
    memberName,
    gymName,
    dueAmountFormatted,
    dueDate,
  }: {
    memberName: string;
    gymName: string;
    dueAmountFormatted: string;
    dueDate: string;
  }): string {
    return (
      `🔔 ${gymName} Fee Reminder\n\n` +
      `Hi ${memberName}, this is a friendly reminder that an instalment of ${dueAmountFormatted} is pending (due date: ${dueDate}).\n\n` +
      `Please clear the pending dues during your next visit at the desk or via UPI. Thank you! 💪`
    );
  },

  getWhatsAppLink({ phone, message }: { phone: string; message: string }): string {
    // Strip all non-digit characters
    let cleanPhone = phone.replace(/\D/g, '');

    // Default to India (+91) if 10-digit number is passed
    if (cleanPhone.length === 10) {
      cleanPhone = `91${cleanPhone}`;
    }

    const encodedText = encodeURIComponent(message);
    return `https://wa.me/${cleanPhone}?text=${encodedText}`;
  },
};
