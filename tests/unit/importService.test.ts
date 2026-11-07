import { describe, it, expect, beforeEach } from 'vitest';
import { importService } from '@/services/importService';
import { useAuthStore } from '@/stores/authStore';
import { useDemoStore } from '@/stores/demoStore';

describe('CSV Member Import & Validation Service', () => {
  beforeEach(() => {
    useAuthStore.getState().enableDemoMode();
    useDemoStore.getState().resetToDefault();
  });

  it('parses valid CSV string and returns validated rows', () => {
    const csvContent = `Name,Phone,Email,Gender
Amitabh Bachchan,9876543210,amitabh@example.com,male
Rekha Ganesan,9876543211,rekha@example.com,female`;

    const result = importService.parseAndValidateCSV(csvContent, []);
    expect(result.validRows.length).toBe(2);
    expect(result.errors.length).toBe(0);
    expect(result.validRows[0].fullName).toBe('Amitabh Bachchan');
    expect(result.validRows[0].phone).toBe('9876543210');
  });

  it('flags rows with missing mandatory phone or name as invalid', () => {
    const csvContent = `Name,Phone,Email
,9876543210,missingname@example.com
Valid Name,,missingphone@example.com
Too Short Phone,12345,short@example.com`;

    const result = importService.parseAndValidateCSV(csvContent, []);
    expect(result.validRows.length).toBe(0);
    expect(result.errors.length).toBe(3);
    expect(result.errors[0].reason).toContain('Name is required');
    expect(result.errors[1].reason).toContain('Phone is required');
    expect(result.errors[2].reason).toContain('10 digits');
  });

  it('detects duplicate phone numbers within the imported file', () => {
    const csvContent = `Name,Phone
First Person,9876543210
Second Person,9876543210`;

    const result = importService.parseAndValidateCSV(csvContent, []);
    expect(result.validRows.length).toBe(1);
    expect(result.errors.length).toBe(1);
    expect(result.errors[0].reason).toContain('Duplicate mobile number');
  });

  it('detects duplicate phone numbers against existing database members', () => {
    const existing = [{ phone: '9876543210', full_name: 'Existing Member' }];
    const csvContent = `Name,Phone
New Member,9876543210`;

    const result = importService.parseAndValidateCSV(csvContent, existing);
    expect(result.validRows.length).toBe(0);
    expect(result.errors.length).toBe(1);
    expect(result.errors[0].reason).toContain('Already registered');
  });

  it('executes batch import and adds records to database', async () => {
    const rows = [
      { fullName: 'Batch Member One', phone: '9890001111', email: 'one@batch.com' },
      { fullName: 'Batch Member Two', phone: '9890002222', email: 'two@batch.com' },
    ];

    const count = await importService.executeBatchImport('demo-gym-001', rows);
    expect(count).toBe(2);

    const members = useDemoStore.getState().members;
    expect(members.some((m) => m.full_name === 'Batch Member One')).toBe(true);
    expect(members.some((m) => m.full_name === 'Batch Member Two')).toBe(true);
  });
});

