import type { DbMember, MemberStatus } from '@/types/database';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useDemoStore } from '@/stores/demoStore';

export interface GetMembersOptions {
  gymId: string;
  query?: string;
  status?: MemberStatus | 'all';
  limit?: number;
  offset?: number;
}

export interface CreateMemberInput {
  gymId: string;
  fullName: string;
  phone: string;
  email?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  address?: string | null;
  emergencyContact?: string | null;
  notes?: string | null;
}

export interface UpdateMemberInput {
  fullName?: string;
  phone?: string;
  email?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  address?: string | null;
  emergencyContact?: string | null;
  notes?: string | null;
  status?: MemberStatus;
}

export const memberService = {
  async getMembers(options: GetMembersOptions): Promise<DbMember[]> {
    const isDemo = useAuthStore.getState().isDemoMode || !isSupabaseConfigured;

    if (isDemo) {
      let list = useDemoStore.getState().members.filter((m) => m.gym_id === options.gymId);

      if (options.status && options.status !== 'all') {
        list = list.filter((m) => m.status === options.status);
      }

      if (options.query) {
        const q = options.query.toLowerCase().trim();
        list = list.filter(
          (m) =>
            m.full_name.toLowerCase().includes(q) ||
            m.phone.includes(q) ||
            (m.email && m.email.toLowerCase().includes(q))
        );
      }

      return list;
    }

    let query = supabase
      .from('members')
      .select('*')
      .eq('gym_id', options.gymId)
      .order('created_at', { ascending: false });

    if (options.status && options.status !== 'all') {
      query = query.eq('status', options.status);
    }

    if (options.query) {
      const q = options.query.trim();
      query = query.or(`full_name.ilike.%${q}%,phone.ilike.%${q}%`);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as DbMember[];
  },

  async getMemberById(id: string): Promise<DbMember | null> {
    const isDemo = useAuthStore.getState().isDemoMode || !isSupabaseConfigured;

    if (isDemo) {
      return useDemoStore.getState().members.find((m) => m.id === id) || null;
    }

    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as DbMember;
  },

  async createMember(input: CreateMemberInput): Promise<DbMember> {
    const isDemo = useAuthStore.getState().isDemoMode || !isSupabaseConfigured;
    const now = new Date().toISOString();

    const newRecord: DbMember = {
      id: isDemo ? `demo-member-${Date.now()}` : crypto.randomUUID(),
      gym_id: input.gymId,
      full_name: input.fullName,
      phone: input.phone,
      email: input.email || null,
      date_of_birth: input.dateOfBirth || null,
      gender: input.gender || null,
      address: input.address || null,
      emergency_contact: input.emergencyContact || null,
      photo_url: null,
      status: 'active',
      join_date: now,
      notes: input.notes || null,
      archived_at: null,
      archived_by: null,
      created_at: now,
      updated_at: now,
    };

    if (isDemo) {
      useDemoStore.getState().addMember(newRecord);
      return newRecord;
    }

    const { data, error } = await supabase
      .from('members')
      .insert({
        gym_id: newRecord.gym_id,
        full_name: newRecord.full_name,
        phone: newRecord.phone,
        email: newRecord.email,
        date_of_birth: newRecord.date_of_birth,
        gender: newRecord.gender,
        address: newRecord.address,
        emergency_contact: newRecord.emergency_contact,
        status: newRecord.status,
        join_date: newRecord.join_date,
        notes: newRecord.notes,
      })
      .select()
      .single();

    if (error) throw error;
    return data as DbMember;
  },

  async updateMember(id: string, input: UpdateMemberInput): Promise<DbMember> {
    const isDemo = useAuthStore.getState().isDemoMode || !isSupabaseConfigured;
    const now = new Date().toISOString();

    if (isDemo) {
      const store = useDemoStore.getState();
      const existing = store.members.find((m) => m.id === id);
      if (!existing) throw new Error('Member not found');

      const updated: DbMember = {
        ...existing,
        full_name: input.fullName !== undefined ? input.fullName : existing.full_name,
        phone: input.phone !== undefined ? input.phone : existing.phone,
        email: input.email !== undefined ? input.email : existing.email,
        date_of_birth: input.dateOfBirth !== undefined ? input.dateOfBirth : existing.date_of_birth,
        gender: input.gender !== undefined ? input.gender : existing.gender,
        address: input.address !== undefined ? input.address : existing.address,
        emergency_contact: input.emergencyContact !== undefined ? input.emergencyContact : existing.emergency_contact,
        notes: input.notes !== undefined ? input.notes : existing.notes,
        status: input.status !== undefined ? input.status : existing.status,
        updated_at: now,
      };

      const updatedList = store.members.map((m) => (m.id === id ? updated : m));
      useDemoStore.setState({ members: updatedList });
      return updated;
    }

    const updates: Record<string, unknown> = { updated_at: now };
    if (input.fullName !== undefined) updates.full_name = input.fullName;
    if (input.phone !== undefined) updates.phone = input.phone;
    if (input.email !== undefined) updates.email = input.email;
    if (input.dateOfBirth !== undefined) updates.date_of_birth = input.dateOfBirth;
    if (input.gender !== undefined) updates.gender = input.gender;
    if (input.address !== undefined) updates.address = input.address;
    if (input.emergencyContact !== undefined) updates.emergency_contact = input.emergencyContact;
    if (input.notes !== undefined) updates.notes = input.notes;
    if (input.status !== undefined) updates.status = input.status;

    const { data, error } = await supabase
      .from('members')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as DbMember;
  },

  async archiveMember(id: string, partnerId: string): Promise<void> {
    const now = new Date().toISOString();
    await this.updateMember(id, { status: 'archived' });

    const isDemo = useAuthStore.getState().isDemoMode || !isSupabaseConfigured;
    if (isDemo) {
      const store = useDemoStore.getState();
      const updatedList = store.members.map((m) =>
        m.id === id ? { ...m, archived_at: now, archived_by: partnerId } : m
      );
      useDemoStore.setState({ members: updatedList });
      return;
    }

    const { error } = await supabase
      .from('members')
      .update({ archived_at: now, archived_by: partnerId, status: 'archived' })
      .eq('id', id);

    if (error) throw error;
  },
};
