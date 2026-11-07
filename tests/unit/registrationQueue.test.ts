import { describe, it, expect, beforeEach } from 'vitest';
import { registrationService } from '@/services/registrationService';
import { useAuthStore } from '@/stores/authStore';
import { useDemoStore } from '@/stores/demoStore';

describe('Public Self-Registration & Approval Queue', () => {
  beforeEach(() => {
    useAuthStore.getState().enableDemoMode();
    useDemoStore.getState().resetToDefault();
    registrationService._resetDemo();
  });

  it('submits a public registration request with status pending', async () => {
    const submission = await registrationService.submitRegistration({
      gymId: 'demo-gym-001',
      fullName: 'Aayush Sharma',
      phone: '9811223399',
      selectedPlanId: 'plan-monthly',
      gender: 'male',
      dateOfBirth: '1999-04-10',
    });

    expect(submission.id).toBeDefined();
    expect(submission.status).toBe('pending');
    expect(submission.full_name).toBe('Aayush Sharma');
  });

  it('rejects duplicate submissions with same phone if already pending or registered', async () => {
    await registrationService.submitRegistration({
      gymId: 'demo-gym-001',
      fullName: 'Test One',
      phone: '9800000001',
      selectedPlanId: 'plan-monthly',
    });

    await expect(
      registrationService.submitRegistration({
        gymId: 'demo-gym-001',
        fullName: 'Test Duplicate',
        phone: '9800000001',
        selectedPlanId: 'plan-monthly',
      })
    ).rejects.toThrow('already been submitted');
  });

  it('allows partners to approve a pending submission into an active member', async () => {
    const sub = await registrationService.submitRegistration({
      gymId: 'demo-gym-001',
      fullName: 'Pooja Hegde',
      phone: '9876500001',
      selectedPlanId: 'plan-monthly',
    });

    const approvedMember = await registrationService.approveSubmission(sub.id, 'demo-partner-001');
    expect(approvedMember.status).toBe('active');
    expect(approvedMember.full_name).toBe('Pooja Hegde');

    // Submission status should be approved
    const list = await registrationService.getPendingSubmissions('demo-gym-001');
    expect(list.some((s) => s.id === sub.id)).toBe(false);
  });

  it('allows partners to reject a pending submission', async () => {
    const sub = await registrationService.submitRegistration({
      gymId: 'demo-gym-001',
      fullName: 'Spam User',
      phone: '9876500099',
      selectedPlanId: 'plan-monthly',
    });

    await registrationService.rejectSubmission(sub.id, 'demo-partner-001', 'Incomplete details');
    const list = await registrationService.getPendingSubmissions('demo-gym-001');
    expect(list.some((s) => s.id === sub.id)).toBe(false);
  });
});
