import { describe, it, expect, beforeEach } from 'vitest';
import { useDemoStore } from '@/stores/demoStore';
import { generateDemoDataset } from '@/services/demoDataService';

describe('Demo Mode Isolation & Data Generator', () => {
  beforeEach(() => {
    useDemoStore.getState().resetToDefault();
  });

  it('generates a rich set of realistic demo members and plans', () => {
    const dataset = generateDemoDataset();
    expect(dataset.members.length).toBeGreaterThanOrEqual(15);
    expect(dataset.plans.length).toBeGreaterThanOrEqual(3);
    expect(dataset.payments.length).toBeGreaterThanOrEqual(10);
    expect(dataset.attendance.length).toBeGreaterThanOrEqual(10);
  });

  it('keeps demo mutations completely local in demoStore without affecting production state', () => {
    const initialCount = useDemoStore.getState().members.length;

    useDemoStore.getState().addMember({
      id: 'demo-member-new',
      gym_id: 'demo-gym-001',
      full_name: 'Test Member',
      phone: '9898989898',
      email: null,
      date_of_birth: null,
      gender: null,
      address: null,
      emergency_contact: null,
      photo_url: null,
      status: 'active',
      join_date: new Date().toISOString(),
      notes: null,
      archived_at: null,
      archived_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    expect(useDemoStore.getState().members.length).toBe(initialCount + 1);
  });
});
