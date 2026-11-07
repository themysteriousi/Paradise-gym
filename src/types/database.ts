// Raw database row types — 1-to-1 with Postgres columns.
// Monetary values are INTEGER paise. Timestamps are ISO strings from Supabase.

export type MemberStatus = 'pending' | 'active' | 'paused' | 'expired' | 'archived';
export type MembershipStatus = 'active' | 'paused' | 'cancelled' | 'expired';
export type MembershipBillingCycle = 'monthly' | 'quarterly' | 'half_yearly' | 'yearly' | 'custom';
export type PaymentMethod = 'cash' | 'upi' | 'bank_transfer' | 'card' | 'cheque' | 'adjustment';
export type PaymentStatus = 'pending' | 'completed' | 'partially_refunded' | 'refunded' | 'void';
export type AttendanceMethod = 'qr_scan' | 'manual' | 'kiosk';
export type ExpenseCategory = 'rent' | 'salary' | 'utilities' | 'equipment' | 'maintenance' | 'marketing' | 'supplies' | 'other';
export type TransactionType = 'credit' | 'debit';
export type ChangeReason = 'upgrade' | 'downgrade' | 'renewal' | 'cancellation' | 'correction' | 'admin_override';
export type DiscountType = 'percentage' | 'flat';

export interface DbGym {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  gst_number: string | null;
  logo_url: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface DbPartner {
  id: string;
  gym_id: string;
  auth_user_id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbMember {
  id: string;
  gym_id: string;
  full_name: string;
  phone: string;
  email: string | null;
  date_of_birth: string | null;   // ISO date YYYY-MM-DD
  gender: string | null;
  address: string | null;
  emergency_contact: string | null;
  photo_url: string | null;
  status: MemberStatus;
  join_date: string | null;
  notes: string | null;
  archived_at: string | null;
  archived_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbMemberTag {
  id: string;
  gym_id: string;
  name: string;
  color: string;
}

export interface DbMemberTagAssignment {
  member_id: string;
  tag_id: string;
  assigned_at: string;
  assigned_by: string | null;
}

export interface DbRegistrationSubmission {
  id: string;
  gym_id: string;
  full_name: string;
  phone: string;
  email: string | null;
  date_of_birth: string | null;
  gender: string | null;
  address: string | null;
  notes: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  member_id: string | null;
  status: 'pending' | 'approved' | 'rejected';
}

export interface DbMembershipPlan {
  id: string;
  gym_id: string;
  name: string;
  description: string | null;
  billing_cycle: MembershipBillingCycle;
  duration_days: number | null;
  price_paise: number;
  features: string[] | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DbMembership {
  id: string;
  gym_id: string;
  member_id: string;
  plan_id: string;
  status: MembershipStatus;
  start_date: string;
  end_date: string;
  price_paise: number;
  paid_paise: number;
  balance_paise: number;    // generated column
  paused_at: string | null;
  paused_by: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  cancel_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbMembershipChange {
  id: string;
  membership_id: string;
  gym_id: string;
  changed_by: string;
  change_reason: ChangeReason;
  previous_plan_id: string | null;
  new_plan_id: string | null;
  previous_end_date: string | null;
  new_end_date: string | null;
  note: string | null;
  changed_at: string;
}

export interface DbDiscount {
  id: string;
  gym_id: string;
  name: string;
  description: string | null;
  type: DiscountType;
  value_paise: number | null;
  percentage: number | null;
  max_uses: number | null;
  uses_count: number;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
}

export interface DbMembershipDiscount {
  id: string;
  membership_id: string;
  discount_id: string;
  applied_by: string;
  discount_paise: number;
  applied_at: string;
}

export interface DbPayment {
  id: string;
  gym_id: string;
  member_id: string;
  received_by: string;
  method: PaymentMethod;
  amount_paise: number;
  status: PaymentStatus;
  reference: string | null;
  note: string | null;
  paid_at: string;
  is_correction: boolean;
  original_id: string | null;
  corrected_by: string | null;
  corrected_at: string | null;
  correction_reason: string | null;
  created_at: string;
}

export interface DbPaymentAllocation {
  id: string;
  payment_id: string;
  membership_id: string;
  amount_paise: number;
  allocated_at: string;
}

export interface DbCharge {
  id: string;
  gym_id: string;
  member_id: string;
  created_by: string;
  description: string;
  amount_paise: number;
  paid_paise: number;
  charged_at: string;
}

export interface DbInstalmentSchedule {
  id: string;
  membership_id: string;
  gym_id: string;
  instalment_no: number;
  due_date: string;
  amount_paise: number;
  paid_at: string | null;
  payment_id: string | null;
  created_at: string;
}

export interface DbRefund {
  id: string;
  gym_id: string;
  payment_id: string;
  processed_by: string;
  amount_paise: number;
  method: PaymentMethod;
  reason: string;
  reference: string | null;
  refunded_at: string;
}

export interface DbAttendance {
  id: string;
  gym_id: string;
  member_id: string;
  membership_id: string | null;
  method: AttendanceMethod;
  checked_in_at: string;
  checked_in_by: string | null;
  device_id: string | null;
  note: string | null;
  is_correction: boolean;
  original_id: string | null;
  corrected_by: string | null;
  corrected_at: string | null;
  correction_reason: string | null;
}

export interface DbQrToken {
  id: string;
  gym_id: string;
  member_id: string;
  token: string;
  issued_at: string;
  expires_at: string | null;
  revoked_at: string | null;
  revoked_by: string | null;
}

export interface DbExpense {
  id: string;
  gym_id: string;
  recorded_by: string;
  category: ExpenseCategory;
  description: string;
  amount_paise: number;
  expense_date: string;
  receipt_url: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbPartnerTransaction {
  id: string;
  gym_id: string;
  partner_id: string;
  type: TransactionType;
  amount_paise: number;
  description: string;
  reference_id: string | null;
  transaction_at: string;
}

export interface DbGymClosure {
  id: string;
  gym_id: string;
  created_by: string;
  start_date: string;
  end_date: string;
  reason: string;
  auto_extend: boolean;
  created_at: string;
}

export interface DbMembershipExtension {
  id: string;
  membership_id: string;
  gym_id: string;
  extended_by_id: string;
  days_added: number;
  reason: string;
  previous_end: string;
  new_end: string;
  extended_at: string;
}

export interface DbActivityLog {
  id: string;
  gym_id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  payload: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface DbGymSettings {
  id: string;
  gym_id: string;
  key: string;
  value: unknown;
  updated_by: string | null;
  updated_at: string;
}
