import { describe, it, expect, beforeEach } from 'vitest';
import {
  convertToCsv,
  formatPaiseToRupeesString,
  generateMembersExportData,
  generatePaymentsExportData,
  generateExpensesExportData,
  generateAttendanceExportData,
  generateFullDatabaseBackupJson,
} from '@/services/exportService';
import { useAuthStore } from '@/stores/authStore';
import { useDemoStore } from '@/stores/demoStore';

describe('exportService', () => {
  const gymId = 'demo-gym-001';

  beforeEach(() => {
    useAuthStore.setState({ isDemoMode: true });
    useDemoStore.getState().resetToDefault();
  });

  describe('formatPaiseToRupeesString', () => {
    it('formats paise into two-decimal string', () => {
      expect(formatPaiseToRupeesString(150000)).toBe('1500.00');
      expect(formatPaiseToRupeesString(99)).toBe('0.99');
      expect(formatPaiseToRupeesString(0)).toBe('0.00');
    });
  });

  describe('convertToCsv', () => {
    it('generates valid UTF-8 BOM CSV string with escaped fields', () => {
      const headers = ['Name', 'Phone', 'Notes'];
      const rows = [
        ['John Doe', '9876543210', 'No issues'],
        ['Jane, "The Rock" Smith', '9876543211', 'Loves cardio, weights\nand rowing'],
      ];

      const csv = convertToCsv(headers, rows);
      // Verify UTF-8 BOM
      expect(csv.charCodeAt(0)).toBe(0xfeff);

      // Verify header
      expect(csv).toContain('Name,Phone,Notes');

      // Verify quotes escaping
      expect(csv).toContain('"Jane, ""The Rock"" Smith"');
    });
  });

  describe('generateMembersExportData', () => {
    it('extracts member rows with formatted values', async () => {
      const { headers, rows } = await generateMembersExportData(gymId);
      expect(headers).toContain('Full Name');
      expect(headers).toContain('Phone');
      expect(headers).toContain('Status');
      expect(rows.length).toBeGreaterThanOrEqual(10);
      expect(rows[0].length).toBe(headers.length);
    });
  });

  describe('generatePaymentsExportData', () => {
    it('extracts payments with rupee amounts and methods', async () => {
      const { headers, rows } = await generatePaymentsExportData(gymId);
      expect(headers).toContain('Amount (₹)');
      expect(headers).toContain('Method');
      expect(headers).toContain('Payment Date');
      expect(rows.length).toBeGreaterThanOrEqual(10);
    });
  });

  describe('generateExpensesExportData', () => {
    it('extracts expenses headers and rows', async () => {
      const { headers, rows } = await generateExpensesExportData(gymId);
      expect(headers).toContain('Category');
      expect(headers).toContain('Amount (₹)');
      expect(Array.isArray(rows)).toBe(true);
    });
  });

  describe('generateAttendanceExportData', () => {
    it('extracts attendance log with member names and timestamps', async () => {
      const { headers, rows } = await generateAttendanceExportData(gymId);
      expect(headers).toContain('Member ID');
      expect(headers).toContain('Method');
      expect(headers).toContain('Check-In Time');
      expect(rows.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('generateFullDatabaseBackupJson', () => {
    it('generates full JSON dump object with metadata', async () => {
      const backup = await generateFullDatabaseBackupJson(gymId);
      expect(backup.gym_id).toBe(gymId);
      expect(backup.exported_at).toBeDefined();
      expect(Array.isArray(backup.members)).toBe(true);
      expect(Array.isArray(backup.payments)).toBe(true);
      expect(Array.isArray(backup.plans)).toBe(true);
      expect(backup.members.length).toBeGreaterThanOrEqual(10);
    });
  });
});
