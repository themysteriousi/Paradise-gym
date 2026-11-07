import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useDemoStore } from '@/stores/demoStore';
import type {
  DbMember,
  DbPayment,
  DbExpense,
  DbAttendance,
  DbMembershipPlan,
  DbMembership,
  DbPartnerTransaction,
  DbGymClosure,
} from '@/types/database';

/**
 * Format integer paise to rupees string with 2 decimals (e.g. 150000 -> "1500.00")
 */
export function formatPaiseToRupeesString(paise: number): string {
  const rupees = paise / 100;
  return rupees.toFixed(2);
}

/**
 * Escape a CSV field value RFC 4180 style
 */
export function escapeCsvField(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Converts headers and row arrays into a UTF-8 BOM CSV text string
 */
export function convertToCsv(
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][]
): string {
  const headerLine = headers.map(escapeCsvField).join(',');
  const rowLines = rows.map((row) => row.map(escapeCsvField).join(','));
  // Prepend UTF-8 BOM for full Microsoft Excel compatibility
  return '\uFEFF' + [headerLine, ...rowLines].join('\r\n');
}

/**
 * Triggers a browser download of a file string
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// DATA GENERATORS
// ---------------------------------------------------------------------------

export async function generateMembersExportData(gymId: string): Promise<{
  headers: string[];
  rows: (string | number | null)[][];
}> {
  const isDemo = useAuthStore.getState().isDemoMode || !isSupabaseConfigured;
  let members: DbMember[] = [];

  if (isDemo) {
    members = useDemoStore.getState().members.filter((m) => m.gym_id === gymId);
  } else {
    const { data } = await supabase.from('members').select('*').eq('gym_id', gymId);
    members = (data || []) as DbMember[];
  }

  const headers = [
    'Member ID',
    'Full Name',
    'Phone',
    'Email',
    'Status',
    'Join Date',
    'Gender',
    'DOB',
    'Emergency Contact',
    'Address',
    'Notes',
  ];

  const rows = members.map((m) => [
    m.id,
    m.full_name,
    m.phone,
    m.email || '',
    m.status,
    m.join_date ? m.join_date.slice(0, 10) : '',
    m.gender || '',
    m.date_of_birth || '',
    m.emergency_contact || '',
    m.address || '',
    m.notes || '',
  ]);

  return { headers, rows };
}

export async function generatePaymentsExportData(gymId: string): Promise<{
  headers: string[];
  rows: (string | number | null)[][];
}> {
  const isDemo = useAuthStore.getState().isDemoMode || !isSupabaseConfigured;
  let payments: DbPayment[] = [];
  let members: DbMember[] = [];

  if (isDemo) {
    payments = useDemoStore.getState().payments.filter((p) => p.gym_id === gymId);
    members = useDemoStore.getState().members.filter((m) => m.gym_id === gymId);
  } else {
    const { data: pData } = await supabase.from('payments').select('*').eq('gym_id', gymId);
    const { data: mData } = await supabase.from('members').select('id, full_name, phone').eq('gym_id', gymId);
    payments = (pData || []) as DbPayment[];
    members = (mData || []) as DbMember[];
  }

  const memberMap = new Map(members.map((m) => [m.id, m]));

  const headers = [
    'Receipt / Payment ID',
    'Member Name',
    'Member Phone',
    'Amount (₹)',
    'Amount (Paise)',
    'Method',
    'Status',
    'Reference',
    'Payment Date',
    'Note',
    'Is Correction',
  ];

  const rows = payments.map((p) => {
    const member = memberMap.get(p.member_id);
    return [
      p.id,
      member ? member.full_name : p.member_id,
      member ? member.phone : '',
      formatPaiseToRupeesString(p.amount_paise),
      p.amount_paise,
      p.method.toUpperCase(),
      p.status,
      p.reference || '',
      p.paid_at ? new Date(p.paid_at).toLocaleString() : '',
      p.note || '',
      p.is_correction ? 'YES' : 'NO',
    ];
  });

  return { headers, rows };
}

export async function generateExpensesExportData(gymId: string): Promise<{
  headers: string[];
  rows: (string | number | null)[][];
}> {
  const isDemo = useAuthStore.getState().isDemoMode || !isSupabaseConfigured;
  let expenses: DbExpense[] = [];

  if (isDemo) {
    expenses = useDemoStore.getState().expenses.filter((e) => e.gym_id === gymId);
  } else {
    const { data } = await supabase.from('expenses').select('*').eq('gym_id', gymId);
    expenses = (data || []) as DbExpense[];
  }

  const headers = [
    'Expense ID',
    'Expense Date',
    'Category',
    'Description',
    'Amount (₹)',
    'Amount (Paise)',
    'Note',
    'Recorded At',
  ];

  const rows = expenses.map((e) => [
    e.id,
    e.expense_date,
    e.category.toUpperCase(),
    e.description,
    formatPaiseToRupeesString(e.amount_paise),
    e.amount_paise,
    e.note || '',
    new Date(e.created_at).toLocaleString(),
  ]);

  return { headers, rows };
}

export async function generateAttendanceExportData(gymId: string): Promise<{
  headers: string[];
  rows: (string | number | null)[][];
}> {
  const isDemo = useAuthStore.getState().isDemoMode || !isSupabaseConfigured;
  let attendance: DbAttendance[] = [];
  let members: DbMember[] = [];

  if (isDemo) {
    attendance = useDemoStore.getState().attendance.filter((a) => a.gym_id === gymId);
    members = useDemoStore.getState().members.filter((m) => m.gym_id === gymId);
  } else {
    const { data: aData } = await supabase.from('attendance').select('*').eq('gym_id', gymId);
    const { data: mData } = await supabase.from('members').select('id, full_name, phone').eq('gym_id', gymId);
    attendance = (aData || []) as DbAttendance[];
    members = (mData || []) as DbMember[];
  }

  const memberMap = new Map(members.map((m) => [m.id, m]));

  const headers = [
    'Attendance ID',
    'Member ID',
    'Member Name',
    'Member Phone',
    'Method',
    'Check-In Time',
    'Device / Partner ID',
    'Note',
  ];

  const rows = attendance.map((a) => {
    const member = memberMap.get(a.member_id);
    return [
      a.id,
      a.member_id,
      member ? member.full_name : a.member_id,
      member ? member.phone : '',
      a.method,
      new Date(a.checked_in_at).toLocaleString(),
      a.device_id || a.checked_in_by || '',
      a.note || '',
    ];
  });

  return { headers, rows };
}

export interface FullDatabaseBackup {
  gym_id: string;
  version: string;
  exported_at: string;
  members: DbMember[];
  plans: DbMembershipPlan[];
  memberships: DbMembership[];
  payments: DbPayment[];
  expenses: DbExpense[];
  attendance: DbAttendance[];
  partner_transactions: DbPartnerTransaction[];
  closures: DbGymClosure[];
}

export async function generateFullDatabaseBackupJson(
  gymId: string
): Promise<FullDatabaseBackup> {
  const isDemo = useAuthStore.getState().isDemoMode || !isSupabaseConfigured;

  if (isDemo) {
    const demo = useDemoStore.getState();
    return {
      gym_id: gymId,
      version: '1.0.0',
      exported_at: new Date().toISOString(),
      members: demo.members.filter((m) => m.gym_id === gymId),
      plans: demo.plans.filter((p) => p.gym_id === gymId),
      memberships: demo.memberships.filter((m) => m.gym_id === gymId),
      payments: demo.payments.filter((p) => p.gym_id === gymId),
      expenses: demo.expenses.filter((e) => e.gym_id === gymId),
      attendance: demo.attendance.filter((a) => a.gym_id === gymId),
      partner_transactions: demo.partnerTransactions.filter((pt) => pt.gym_id === gymId),
      closures: demo.closures.filter((c) => c.gym_id === gymId),
    };
  }

  // Live Supabase export
  const [
    { data: members },
    { data: plans },
    { data: memberships },
    { data: payments },
    { data: expenses },
    { data: attendance },
    { data: partnerTransactions },
    { data: closures },
  ] = await Promise.all([
    supabase.from('members').select('*').eq('gym_id', gymId),
    supabase.from('membership_plans').select('*').eq('gym_id', gymId),
    supabase.from('memberships').select('*').eq('gym_id', gymId),
    supabase.from('payments').select('*').eq('gym_id', gymId),
    supabase.from('expenses').select('*').eq('gym_id', gymId),
    supabase.from('attendance').select('*').eq('gym_id', gymId),
    supabase.from('partner_transactions').select('*').eq('gym_id', gymId),
    supabase.from('gym_closures').select('*').eq('gym_id', gymId),
  ]);

  return {
    gym_id: gymId,
    version: '1.0.0',
    exported_at: new Date().toISOString(),
    members: (members || []) as DbMember[],
    plans: (plans || []) as DbMembershipPlan[],
    memberships: (memberships || []) as DbMembership[],
    payments: (payments || []) as DbPayment[],
    expenses: (expenses || []) as DbExpense[],
    attendance: (attendance || []) as DbAttendance[],
    partner_transactions: (partnerTransactions || []) as DbPartnerTransaction[],
    closures: (closures || []) as DbGymClosure[],
  };
}

// ---------------------------------------------------------------------------
// ONE-TAP DOWNLOAD ACTIONS
// ---------------------------------------------------------------------------

export async function exportMembersCsv(gymId: string): Promise<void> {
  const { headers, rows } = await generateMembersExportData(gymId);
  const csv = convertToCsv(headers, rows);
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadFile(csv, `paradise-gym-members-${dateStr}.csv`, 'text/csv;charset=utf-8;');
}

export async function exportPaymentsCsv(gymId: string): Promise<void> {
  const { headers, rows } = await generatePaymentsExportData(gymId);
  const csv = convertToCsv(headers, rows);
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadFile(csv, `paradise-gym-payments-${dateStr}.csv`, 'text/csv;charset=utf-8;');
}

export async function exportExpensesCsv(gymId: string): Promise<void> {
  const { headers, rows } = await generateExpensesExportData(gymId);
  const csv = convertToCsv(headers, rows);
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadFile(csv, `paradise-gym-expenses-${dateStr}.csv`, 'text/csv;charset=utf-8;');
}

export async function exportAttendanceCsv(gymId: string): Promise<void> {
  const { headers, rows } = await generateAttendanceExportData(gymId);
  const csv = convertToCsv(headers, rows);
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadFile(csv, `paradise-gym-attendance-${dateStr}.csv`, 'text/csv;charset=utf-8;');
}

export async function exportFullDatabaseJson(gymId: string): Promise<void> {
  const backup = await generateFullDatabaseBackupJson(gymId);
  const json = JSON.stringify(backup, null, 2);
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadFile(
    json,
    `paradise-gym-full-backup-${dateStr}.json`,
    'application/json;charset=utf-8;'
  );
}
