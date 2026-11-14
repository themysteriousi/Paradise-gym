import type { DbMember } from '@/types/database';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuthStore, DEFAULT_GYM } from '@/stores/authStore';
import { useDemoStore } from '@/stores/demoStore';
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

function toValidGymUuid(gymId?: string | null): string {
  if (!gymId) return DEFAULT_GYM.id;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(gymId);
  return isUuid ? gymId : DEFAULT_GYM.id;
}

export const registrationService = {
  async submitRegistration(input: SubmitRegistrationInput): Promise<RegistrationSubmission> {
    const isExplicitDemo = useAuthStore.getState().isDemoMode || !isSupabaseConfigured;
    const cleanPhone = input.phone.trim();
    const targetGymId = toValidGymUuid(input.gymId);

    // Check duplicate phone in existing members if possible
    try {
      const existingMembers = await memberService.getMembers({ gymId: input.gymId });
      if (existingMembers.some((m) => m.phone === cleanPhone && m.status !== 'archived')) {
        throw new Error('A member with this mobile number is already registered.');
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('already registered')) throw err;
    }

    // Check duplicate in local store
    const storeSubmissions = useDemoStore.getState().registrationSubmissions || [];
    if (storeSubmissions.some((s) => s.phone === cleanPhone && s.status === 'pending')) {
      throw new Error('A registration request with this mobile number has already been submitted or registered.');
    }

    const now = new Date().toISOString();
    const submissionId = crypto.randomUUID();
    const submission: RegistrationSubmission = {
      id: submissionId,
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

    // If Supabase is configured and not in explicit demo mode, insert directly into database
    // CRITICAL: We do NOT call .select() here because PostgreSQL RLS allows anon to INSERT but forbids anon SELECT,
    // which would cause "new row violates row-level security policy for table registration_submissions"
    if (isSupabaseConfigured && !isExplicitDemo) {
      try {
        const { error } = await supabase
          .from('registration_submissions')
          .insert({
            id: submissionId,
            gym_id: targetGymId,
            full_name: submission.full_name,
            phone: submission.phone,
            email: submission.email,
            notes: JSON.stringify({ selected_plan_id: submission.selected_plan_id }),
            gender: submission.gender,
            date_of_birth: submission.date_of_birth,
            status: submission.status,
          });

        if (error) {
          console.warn('Supabase submission insert returned error:', error);
          if (error.code === '23505') {
            throw new Error('A registration request with these details has already been submitted.');
          }
        }
      } catch (insertErr) {
        if (insertErr instanceof Error && insertErr.message.includes('already been submitted')) {
          throw insertErr;
        }
        console.warn('Insert to Supabase registration_submissions failed, saving locally:', insertErr);
      }
    }

    // Always cache in local store on this device as well
    useDemoStore.getState().addRegistrationSubmission(submission);
    return submission;
  },

  async getPendingSubmissions(gymId: string): Promise<RegistrationSubmission[]> {
    const targetGymId = toValidGymUuid(gymId);

    // Local cached submissions
    const localPending = (useDemoStore.getState().registrationSubmissions || []).filter(
      (s) => s.status === 'pending'
    );

    if (!isSupabaseConfigured) {
      return localPending;
    }

    try {
      const timeoutPromise = new Promise<{ data: null; error: Error }>((_, reject) =>
        setTimeout(() => reject(new Error('Queue query timeout')), 3500)
      );

      const queryPromise = supabase
        .from('registration_submissions')
        .select('*')
        .or(`gym_id.eq.${targetGymId},gym_id.eq.${DEFAULT_GYM.id}`)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      const { data, error } = (await Promise.race([queryPromise, timeoutPromise])) as {
        data: any[] | null;
        error: any;
      };

      if (!error && data) {
        const remote: RegistrationSubmission[] = data.map((row) => {
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

        // Merge remote with any local pending submissions without duplicates
        const map = new Map<string, RegistrationSubmission>();
        for (const r of remote) map.set(r.id, r);
        for (const l of localPending) {
          if (!map.has(l.id)) map.set(l.id, l);
        }
        return Array.from(map.values());
      }
    } catch (err) {
      console.warn('Error reading pending submissions from Supabase:', err);
    }

    return localPending;
  },

  async approveSubmission(submissionId: string, partnerId: string): Promise<DbMember> {
    const now = new Date().toISOString();

    let sub: RegistrationSubmission | undefined;
    const storeSubmissions = useDemoStore.getState().registrationSubmissions || [];
    sub = storeSubmissions.find((s) => s.id === submissionId);

    if (!sub && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('registration_submissions')
          .select('*')
          .eq('id', submissionId)
          .maybeSingle();

        if (!error && data) {
          let selectedPlan = 'plan-monthly';
          try {
            const parsed = JSON.parse(data.notes || '{}');
            if (parsed.selected_plan_id) selectedPlan = parsed.selected_plan_id;
          } catch (_) {}
          sub = { ...data, selected_plan_id: selectedPlan } as RegistrationSubmission;
        }
      } catch (_) {}
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
    useDemoStore.getState().updateRegistrationSubmission(submissionId, {
      status: 'approved',
      reviewed_by: partnerId,
      reviewed_at: now,
    });

    if (isSupabaseConfigured && !submissionId.startsWith('demo-')) {
      try {
        await supabase
          .from('registration_submissions')
          .update({ status: 'approved', reviewed_by: partnerId, reviewed_at: now, member_id: newMember.id })
          .eq('id', submissionId);
      } catch (_) {}
    }

    return newMember;
  },

  async rejectSubmission(submissionId: string, partnerId: string, reason?: string): Promise<void> {
    const isDemo =
      useAuthStore.getState().isDemoMode ||
      !isSupabaseConfigured ||
      submissionId.startsWith('demo-');
    const now = new Date().toISOString();

    useDemoStore.getState().updateRegistrationSubmission(submissionId, {
      status: 'rejected',
      reviewed_by: partnerId,
      reviewed_at: now,
      rejection_reason: reason || null,
    });

    if (!isDemo && !submissionId.startsWith('demo-')) {
      try {
        await supabase
          .from('registration_submissions')
          .update({
            status: 'rejected',
            reviewed_by: partnerId,
            reviewed_at: now,
            rejection_reason: reason || null,
          })
          .eq('id', submissionId);
      } catch (_) {}
    }
  },

  _resetDemo() {
    useDemoStore.setState({ registrationSubmissions: [] });
  },
};
