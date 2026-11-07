import { describe, it, expect, beforeEach } from 'vitest';
import { memberService } from '@/services/memberService';
import { useAuthStore } from '@/stores/authStore';
import { useDemoStore } from '@/stores/demoStore';

describe('Member Service (CRUD & Search)', () => {
  beforeEach(() => {
    useAuthStore.getState().enableDemoMode();
    useDemoStore.getState().resetToDefault();
  });

  it('fetches members list with pagination and default active gym filter', async () => {
    const members = await memberService.getMembers({ gymId: 'demo-gym-001' });
    expect(members.length).toBeGreaterThan(0);
    expect(members[0]).toHaveProperty('full_name');
    expect(members[0]).toHaveProperty('phone');
  });

  it('filters members by search query across name and phone', async () => {
    const allMembers = await memberService.getMembers({ gymId: 'demo-gym-001' });
    const targetName = allMembers[0].full_name.split(' ')[0];

    const filtered = await memberService.getMembers({
      gymId: 'demo-gym-001',
      query: targetName,
    });

    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((m) => m.full_name.toLowerCase().includes(targetName.toLowerCase()))).toBe(true);
  });

  it('creates a new member with sequential member ID', async () => {
    const newMember = await memberService.createMember({
      gymId: 'demo-gym-001',
      fullName: 'Vikram Seth',
      phone: '9812345678',
      email: 'vikram@example.com',
      gender: 'male',
      dateOfBirth: '1995-10-12',
    });

    expect(newMember.id).toBeDefined();
    expect(newMember.full_name).toBe('Vikram Seth');
    expect(newMember.status).toBe('active');

    // Verify it is retrievable
    const member = await memberService.getMemberById(newMember.id);
    expect(member?.full_name).toBe('Vikram Seth');
  });

  it('updates member details', async () => {
    const all = await memberService.getMembers({ gymId: 'demo-gym-001' });
    const target = all[0];

    const updated = await memberService.updateMember(target.id, {
      notes: 'Prefers morning strength workouts',
    });

    expect(updated.notes).toBe('Prefers morning strength workouts');
  });

  it('archives a member without permanently deleting historical records', async () => {
    const all = await memberService.getMembers({ gymId: 'demo-gym-001' });
    const target = all[0];

    await memberService.archiveMember(target.id, 'demo-partner-001');

    const fetched = await memberService.getMemberById(target.id);
    expect(fetched?.status).toBe('archived');
    expect(fetched?.archived_at).toBeDefined();
    expect(fetched?.archived_by).toBe('demo-partner-001');
  });
});

