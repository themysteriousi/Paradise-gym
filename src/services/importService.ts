import type { DbMember } from '@/types/database';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useDemoStore } from '@/stores/demoStore';

export interface ValidatedImportRow {
  fullName: string;
  phone: string;
  email?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  notes?: string | null;
}

export interface ImportErrorRow {
  rowNumber: number;
  rawText: string;
  reason: string;
}

export interface ImportValidationResult {
  validRows: ValidatedImportRow[];
  errors: ImportErrorRow[];
}

export const importService = {
  parseAndValidateCSV(
    csvContent: string,
    existingMembers: Array<{ phone: string; full_name?: string }>
  ): ImportValidationResult {
    const lines = csvContent
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const validRows: ValidatedImportRow[] = [];
    const errors: ImportErrorRow[] = [];

    if (lines.length === 0) {
      return { validRows, errors };
    }

    // Check if first row is header
    const firstLine = lines[0].toLowerCase();
    const isHeader = firstLine.includes('name') || firstLine.includes('phone') || firstLine.includes('mobile');
    const dataLines = isHeader ? lines.slice(1) : lines;

    const seenPhonesInFile = new Set<string>();
    const existingPhoneSet = new Set(existingMembers.map((m) => m.phone.replace(/\D/g, '')));

    dataLines.forEach((line, index) => {
      const rowNumber = isHeader ? index + 2 : index + 1;
      const cols = line.split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));

      const fullName = cols[0] || '';
      const rawPhone = cols[1] || '';
      const email = cols[2] || null;
      const gender = cols[3] || null;
      const dateOfBirth = cols[4] || null;
      const notes = cols[5] || null;

      // Rule 1: Name is required
      if (!fullName) {
        errors.push({ rowNumber, rawText: line, reason: 'Name is required' });
        return;
      }

      // Rule 2: Phone is required
      if (!rawPhone) {
        errors.push({ rowNumber, rawText: line, reason: 'Phone is required' });
        return;
      }

      // Rule 3: Valid 10 digit mobile
      const digitsOnly = rawPhone.replace(/\D/g, '');
      const cleanPhone = digitsOnly.length === 12 && digitsOnly.startsWith('91')
        ? digitsOnly.slice(2)
        : digitsOnly;

      if (cleanPhone.length !== 10) {
        errors.push({
          rowNumber,
          rawText: line,
          reason: `Invalid phone format: expected 10 digits, got '${rawPhone}'`,
        });
        return;
      }

      // Rule 4: Duplicate in file
      if (seenPhonesInFile.has(cleanPhone)) {
        errors.push({
          rowNumber,
          rawText: line,
          reason: `Duplicate mobile number in uploaded file: ${cleanPhone}`,
        });
        return;
      }

      // Rule 5: Duplicate against existing active members
      if (existingPhoneSet.has(cleanPhone)) {
        errors.push({
          rowNumber,
          rawText: line,
          reason: `Already registered gym member with phone: ${cleanPhone}`,
        });
        return;
      }

      seenPhonesInFile.add(cleanPhone);
      validRows.push({
        fullName,
        phone: cleanPhone,
        email: email || null,
        gender: gender || null,
        dateOfBirth: dateOfBirth || null,
        notes: notes || null,
      });
    });

    return { validRows, errors };
  },

  async executeBatchImport(gymId: string, rows: ValidatedImportRow[]): Promise<number> {
    const isDemo = useAuthStore.getState().isDemoMode || !isSupabaseConfigured;
    const now = new Date().toISOString();

    if (isDemo) {
      const newMembers: DbMember[] = rows.map((r, i) => ({
        id: `demo-import-${Date.now()}-${i}`,
        gym_id: gymId,
        full_name: r.fullName,
        phone: r.phone,
        email: r.email || null,
        date_of_birth: r.dateOfBirth || null,
        gender: r.gender || null,
        address: null,
        emergency_contact: null,
        photo_url: null,
        status: 'active',
        join_date: now,
        notes: r.notes || 'Imported via CSV',
        archived_at: null,
        archived_by: null,
        created_at: now,
        updated_at: now,
      }));

      const store = useDemoStore.getState();
      useDemoStore.setState({ members: [...newMembers, ...store.members] });
      return newMembers.length;
    }

    const payload = rows.map((r) => ({
      gym_id: gymId,
      full_name: r.fullName,
      phone: r.phone,
      email: r.email || null,
      gender: r.gender || null,
      date_of_birth: r.dateOfBirth || null,
      notes: r.notes || 'Imported via CSV',
      status: 'active',
      join_date: now,
    }));

    const { data, error } = await supabase.from('members').insert(payload).select('id');
    if (error) throw error;
    return (data || []).length;
  },
};

