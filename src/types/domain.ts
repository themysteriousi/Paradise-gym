/**
 * Application-level types.
 *
 * Money type: INTEGER paise (1 INR = 100 paise).
 * Always store and pass as paise; format for display using utils/money.ts.
 */

/** Monetary amount in paise (1 INR = 100 paise). Never use floating-point math. */
export type Money = number;

/** ISO date string YYYY-MM-DD */
export type ISODate = string;

/** ISO datetime string with timezone (from Supabase) */
export type ISODatetime = string;

// Re-export status enums from database types for use in domain logic
export type {
  MemberStatus,
  MembershipStatus,
  PaymentMethod,
  AttendanceMethod,
  ExpenseCategory,
  DiscountType,
  ChangeReason,
} from './database';

/** Gym as used in the application */
export interface Gym {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  gstNumber: string | null;
  logoUrl: string | null;
  timezone: string;
}

/** Partner (authenticated user) */
export interface Partner {
  id: string;
  gymId: string;
  authUserId: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
}

/** Member with optional eager-loaded relations */
export interface Member {
  id: string;
  gymId: string;
  fullName: string;
  phone: string;
  email: string | null;
  dateOfBirth: ISODate | null;
  gender: string | null;
  address: string | null;
  emergencyContact: string | null;
  photoUrl: string | null;
  status: import('./database').MemberStatus;
  joinDate: ISODate | null;
  notes: string | null;
  archivedAt: ISODatetime | null;
  createdAt: ISODatetime;
  // Optionally joined
  activeMembership?: Membership | null;
  tags?: MemberTag[];
}

export interface MemberTag {
  id: string;
  gymId: string;
  name: string;
  color: string;
}

export interface MembershipPlan {
  id: string;
  gymId: string;
  name: string;
  description: string | null;
  billingCycle: import('./database').MembershipBillingCycle;
  durationDays: number | null;
  /** Price in paise */
  pricePaise: Money;
  features: string[];
  isActive: boolean;
  sortOrder: number;
}

export interface Membership {
  id: string;
  gymId: string;
  memberId: string;
  planId: string;
  status: import('./database').MembershipStatus;
  startDate: ISODate;
  endDate: ISODate;
  /** Snapshot price at purchase time, in paise */
  pricePaise: Money;
  /** Total paid so far, in paise */
  paidPaise: Money;
  /** Outstanding balance = pricePaise - paidPaise, in paise */
  balancePaise: Money;
  pausedAt: ISODatetime | null;
  cancelledAt: ISODatetime | null;
  cancelReason: string | null;
  createdAt: ISODatetime;
}

export interface Payment {
  id: string;
  gymId: string;
  memberId: string;
  receivedBy: string;
  method: import('./database').PaymentMethod;
  /** Amount in paise */
  amountPaise: Money;
  status: import('./database').PaymentStatus;
  reference: string | null;
  note: string | null;
  paidAt: ISODatetime;
  isCorrection: boolean;
  originalId: string | null;
}

export interface PaymentAllocation {
  id: string;
  paymentId: string;
  membershipId: string;
  /** Amount allocated, in paise */
  amountPaise: Money;
  allocatedAt: ISODatetime;
}

export interface Expense {
  id: string;
  gymId: string;
  recordedBy: string;
  category: import('./database').ExpenseCategory;
  description: string;
  /** Amount in paise */
  amountPaise: Money;
  expenseDate: ISODate;
  receiptUrl: string | null;
  note: string | null;
  createdAt: ISODatetime;
}

export interface AttendanceRecord {
  id: string;
  gymId: string;
  memberId: string;
  membershipId: string | null;
  method: import('./database').AttendanceMethod;
  checkedInAt: ISODatetime;
  checkedInBy: string | null;
  deviceId: string | null;
  note: string | null;
}

export interface QrToken {
  id: string;
  gymId: string;
  memberId: string;
  token: string;
  issuedAt: ISODatetime;
  expiresAt: ISODatetime | null;
  revokedAt: ISODatetime | null;
}

/** Financial summary for dashboard / reports */
export interface FinancialSummary {
  period: { from: ISODate; to: ISODate };
  /** Total revenue collected in paise */
  totalRevenuePaise: Money;
  /** Total expenses in paise */
  totalExpensesPaise: Money;
  /** Net = revenue - expenses, in paise */
  netPaise: Money;
  /** Outstanding dues across all active memberships, in paise */
  outstandingPaise: Money;
  newMembersCount: number;
  renewalsCount: number;
  attendanceCount: number;
}

/** Offline attendance record pending sync */
export interface PendingAttendance {
  localId: string;         // IDB key
  gymId: string;
  memberId: string;
  membershipId: string | null;
  method: import('./database').AttendanceMethod;
  checkedInAt: ISODatetime;
  deviceId: string;
  retryCount: number;
  createdAt: ISODatetime;
}

/** Member data cached for offline QR validation */
export interface CachedMember {
  id: string;
  gymId: string;
  fullName: string;
  phone: string;
  photoUrl: string | null;
  status: import('./database').MemberStatus;
  activeMembershipEndDate: ISODate | null;
  qrToken: string | null;
  cachedAt: ISODatetime;
}
