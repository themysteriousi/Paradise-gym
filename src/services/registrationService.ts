import type { DbMember } from '@/types/database';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { memberService } from './memberService';
import { membershipService } from './membershipService';
import { generateMemberQrToken } from './qrService';

export interface RegistrationSubmission {
  id: string;
  gym_id: string;
  full_name: string;
  phone: string;
  email: string | null;
  selected_plan_id: string;
  gender: string | null;
  date_of_birth: string | null;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
}

export interface SubmitRegistrationInput {
  gymId: string;
  fullName: string;
  phone: string;
  selectedPlanId: string;
  email?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
}

// In-memory demo store for submissions
let demoSubmissions: RegistrationSubmission[] = [];

export const registrationService = {
  async submitRegistration(input: SubmitRegistrationInput): Promise<RegistrationSubmission> {
    const isDemo = useAuthStore.getState().isDemoMode || !isSupabaseConfigured || input.gymId === 'demo-gym-001' || input.gymId.startsWith('demo-');
    const cleanPhone = input.phone.trim();

    // Check duplicate phone in existing members
    const existingMembers = await memberService.getMembers({ gymId: input.gymId });
    if (existingMembers.some((m) => m.phone === cleanPhone && m.status !== 'archived')) {
      throw new Error('A member with this mobile number is already registered.');
    }

    // Check duplicate in pending submissions
    if (demoSubmissions.some((s) => s.phone === cleanPhone && s.status === 'pending')) {
      throw new Error('A registration request with this mobile number has already been submitted or registered.');
    }

    const now = new Date().toISOString();
    const submission: RegistrationSubmission = {
      id: isDemo ? `demo-sub-${Date.now()}` : crypto.randomUUID(),
      gym_id: input.gymId,
      full_name: input.fullName.trim(),
      phone: cleanPhone,
      email: input.email ? input.email.trim() : null,
      selected_plan_id: input.selectedPlanId,
      gender: input.gender || null,
      date_of_birth: input.dateOfBirth || null,
      status: 'pending',
      created_at: now,
    };

    if (isDemo) {
      demoSubmissions.push(submission);
      return submission;
    }

    const { data, error } = await supabase
      .from('registration_submissions')
      .insert({
        gym_id: submission.gym_id,
        full_name: submission.full_name,
        phone: submission.phone,
        email: submission.email,
        notes: JSON.stringify({ selected_plan_id: submission.selected_plan_id }),
        gender: submission.gender,
        date_of_birth: submission.date_of_birth,
        status: submission.status,
      })
      .select()
      .single();

    if (error) throw error;
    return {
      ...(data as RegistrationSubmission),
      selected_plan_id: submission.selected_plan_id,
    };
  },

  async getPendingSubmissions(gymId: string): Promise<RegistrationSubmission[]> {
    const isDemo = useAuthStore.getState().isDemoMode || !isSupabaseConfigured || gymId === 'demo-gym-001' || gymId.startsWith('demo-');

    if (isDemo) {
      return demoSubmissions.filter((s) => s.gym_id === gymId && s.status === 'pending');
    }

    const { data, error } = await supabase
      .from('registration_submissions')
      .select('*')
      .eq('gym_id', gymId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map((row) => {
      let selectedPlan = 'plan-monthly';
      try {
        const parsed = JSON.parse(row.notes || '{}');
        if (parsed.selected_plan_id) selectedPlan = parsed.selected_plan_id;
      } catch (_) {}

      return {
        ...row,
        selected_plan_id: selectedPlan,
      } as RegistrationSubmission;
    });
  },

  async approveSubmission(submissionId: string, partnerId: string): Promise<DbMember> {
    const isDemo = useAuthStore.getState().isDemoMode || !isSupabaseConfigured || submissionId.startsWith('demo-');
    const now = new Date().toISOString();

    let sub: RegistrationSubmission | undefined;
    if (isDemo) {
      sub = demoSubmissions.find((s) => s.id === submissionId);
    } else {
      const { data, error } = await supabase
        .from('registration_submissions')
        .select('*')
        .eq('id', submissionId)
        .single();
      if (error) throw error;

      let selectedPlan = 'plan-monthly';
      try {
        const parsed = JSON.parse(data.notes || '{}');
        if (parsed.selected_plan_id) selectedPlan = parsed.selected_plan_id;
      } catch (_) {}

      sub = { ...data, selected_plan_id: selectedPlan } as RegistrationSubmission;
    }

    if (!sub) throw new Error('Submission not found');
    if (sub.status !== 'pending') throw new Error(`Submission already ${sub.status}`);

    // 1. Create active member record
    const newMember = await memberService.createMember({
      gymId: sub.gym_id,
      fullName: sub.full_name,
      phone: sub.phone,
      email: sub.email,
      gender: sub.gender,
      dateOfBirth: sub.date_of_birth,
      notes: 'Approved from public self-registration',
    });

    // 2. Generate initial QR token for attendance scanning
    try {
      await generateMemberQrToken({
        gym_id: sub.gym_id,
        member_id: newMember.id,
        expires_in_days: 365,
      });
    } catch (tokenErr) {
      console.warn('Failed to generate initial QR token for approved member:', tokenErr);
    }

    // 3. Attach their selected membership plan (fee marked due until paid at desk)
    try {
      const plans = await membershipService.getPlans(sub.gym_id);
      const chosenPlan =
        plans.find((p) => p.id === sub?.selected_plan_id) || plans[0];

      if (chosenPlan) {
        await membershipService.createMembership({
          gymId: sub.gym_id,
          memberId: newMember.id,
          planId: chosenPlan.id,
          pricePaise: chosenPlan.price_paise,
          paidPaise: 0, // due until collected
          startDate: new Date(),
          durationDays: chosenPlan.duration_days || 30,
          partnerId,
        });
      }
    } catch (planErr) {
      console.warn('Failed to assign initial plan for approved member:', planErr);
    }

    // 4. Mark submission as approved
    if (isDemo) {
      sub.status = 'approved';
      sub.reviewed_by = partnerId;
      sub.reviewed_at = now;
    } else {
      await supabase
        .from('registration_submissions')
        .update({ status: 'approved', reviewed_by: partnerId, reviewed_at: now, member_id: newMember.id })
        .eq('id', submissionId);
    }

    return newMember;
  },

  async rejectSubmission(submissionId: string, partnerId: string, reason?: string): Promise<void> {
    const isDemo = useAuthStore.getState().isDemoMode || !isSupabaseConfigured || submissionId.startsWith('demo-');
    const now = new Date().toISOString();

    if (isDemo) {
      const sub = demoSubmissions.find((s) => s.id === submissionId);
      if (!sub) throw new Error('Submission not found');
      sub.status = 'rejected';
      sub.reviewed_by = partnerId;
      sub.reviewed_at = now;
      sub.rejection_reason = reason || null;
      return;
    }

    const { error } = await supabase
      .from('registration_submissions')
      .update({
        status: 'rejected',
        reviewed_by: partnerId,
        reviewed_at: now,
        rejection_reason: reason || null,
      })
      .eq('id', submissionId);

    if (error) throw error;
  },

  _resetDemo() {
    demoSubmissions = [];
  },
};
