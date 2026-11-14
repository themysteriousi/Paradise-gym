import type { DbMember, MemberStatus } from '@/types/database';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuthStore, DEFAULT_GYM } from '@/stores/authStore';
import { useDemoStore } from '@/stores/demoStore';

function toValidGymUuid(gymId?: string | null): string {
  if (!gymId) return DEFAULT_GYM.id;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(gymId);
  return isUuid ? gymId : DEFAULT_GYM.id;
}

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
    const isDemo = useAuthStore.getState().isDemoMode || !isSupabaseConfigured || options.gymId === 'demo-gym-001' || options.gymId.startsWith('demo-');

    const filterList = (list: DbMember[]) => {
      let filtered = [...list];
      if (options.status && options.status !== 'all') {
        filtered = filtered.filter((m) => m.status === options.status);
      }
      if (options.query) {
        const q = options.query.toLowerCase().trim();
        filtered = filtered.filter(
          (m) =>
            m.full_name.toLowerCase().includes(q) ||
            m.phone.includes(q) ||
            (m.email && m.email.toLowerCase().includes(q))
        );
      }
      if (options.limit) {
        filtered = filtered.slice(0, options.limit);
      }
      return filtered;
    };

    if (isDemo) {
      const list = useDemoStore.getState().members.filter((m) => m.gym_id === options.gymId || options.gymId === 'demo-gym-001');
      return filterList(list.length > 0 ? list : useDemoStore.getState().members);
    }

    try {
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
      if (!error && data && data.length > 0) {
        // Cache fetched members into local store without overwriting
        const store = useDemoStore.getState();
        const map = new Map<string, DbMember>();
        for (const m of store.members) map.set(m.id, m);
        for (const m of data) map.set(m.id, m as DbMember);
        useDemoStore.setState({ members: Array.from(map.values()) });
        return data as DbMember[];
      }
    } catch (err) {
      console.warn('Supabase getMembers error, falling back to local store:', err);
    }

    return filterList(useDemoStore.getState().members);
  },

  async getMemberById(id: string): Promise<DbMember | null> {
    const local = useDemoStore.getState().members.find((m) => m.id === id);
    if (local) return local;

    if (!isSupabaseConfigured) return null;

    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (!error && data) {
        useDemoStore.getState().addMember(data as DbMember);
        return data as DbMember;
      }
    } catch (_) {}

    return null;
  },

  async createMember(input: CreateMemberInput): Promise<DbMember> {
    const isExplicitDemo = useAuthStore.getState().isDemoMode || !isSupabaseConfigured;
    const targetGymId = toValidGymUuid(input.gymId);
    const now = new Date().toISOString();
    const today = now.slice(0, 10);

    // Normalize phone number (strip +91, spaces, leading 0)
    let cleanPhone = input.phone.trim().replace(/\D/g, '');
    if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
      cleanPhone = cleanPhone.slice(2);
    } else if (cleanPhone.length === 11 && cleanPhone.startsWith('0')) {
      cleanPhone = cleanPhone.slice(1);
    }
    const finalPhone = cleanPhone.length === 10 ? cleanPhone : input.phone.trim();

    // Ensure valid date format YYYY-MM-DD for PostgreSQL DATE type
    const sanitizedDob = input.dateOfBirth && input.dateOfBirth.trim()
      ? input.dateOfBirth.trim().slice(0, 10)
      : null;

    const newRecordId = isExplicitDemo ? `demo-member-${Date.now()}` : crypto.randomUUID();

    const newRecord: DbMember = {
      id: newRecordId,
      gym_id: input.gymId,
      full_name: input.fullName.trim(),
      phone: finalPhone,
      email: input.email ? input.email.trim() : null,
      date_of_birth: sanitizedDob,
      gender: input.gender || null,
      address: input.address || null,
      emergency_contact: input.emergencyContact || null,
      photo_url: null,
      status: 'active',
      join_date: today,
      notes: input.notes ? input.notes.trim() : null,
      archived_at: null,
      archived_by: null,
      created_at: now,
      updated_at: now,
    };

    // Always save in local store immediately for instant UI feedback
    useDemoStore.getState().addMember(newRecord);

    // If Supabase is connected, persist to cloud database with valid UUID
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('members')
          .insert({
            id: newRecord.id.startsWith('demo-') ? crypto.randomUUID() : newRecord.id,
            gym_id: targetGymId,
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
          .maybeSingle();

        if (!error && data) {
          const cloudMember = data as DbMember;
          const store = useDemoStore.getState();
          useDemoStore.setState({
            members: store.members.map((m) => (m.id === newRecord.id ? cloudMember : m)),
          });
          return cloudMember;
        }
      } catch (err) {
        console.warn('Supabase member insertion skipped or restricted, stored locally:', err);
      }
    }

    return newRecord;
  },

  async updateMember(id: string, input: UpdateMemberInput): Promise<DbMember> {
    const now = new Date().toISOString();
    const store = useDemoStore.getState();
    const existing = store.members.find((m) => m.id === id);

    let cleanPhone = input.phone;
    if (cleanPhone) {
      let rawP = cleanPhone.trim().replace(/\D/g, '');
      if (rawP.length === 12 && rawP.startsWith('91')) rawP = rawP.slice(2);
      else if (rawP.length === 11 && rawP.startsWith('0')) rawP = rawP.slice(1);
      cleanPhone = rawP.length === 10 ? rawP : cleanPhone.trim();
    }

    const updated: DbMember = {
      ...(existing || ({} as DbMember)),
      id,
      gym_id: existing?.gym_id || DEFAULT_GYM.id,
      full_name: input.fullName !== undefined ? input.fullName : (existing?.full_name || ''),
      phone: cleanPhone !== undefined ? cleanPhone : (existing?.phone || ''),
      email: input.email !== undefined ? input.email : (existing?.email || null),
      date_of_birth: input.dateOfBirth !== undefined ? input.dateOfBirth : (existing?.date_of_birth || null),
      gender: input.gender !== undefined ? input.gender : (existing?.gender || null),
      address: input.address !== undefined ? input.address : (existing?.address || null),
      emergency_contact: input.emergencyContact !== undefined ? input.emergencyContact : (existing?.emergency_contact || null),
      notes: input.notes !== undefined ? input.notes : (existing?.notes || null),
      status: input.status !== undefined ? input.status : (existing?.status || 'active'),
      archived_at: input.status === 'archived' ? now : (input.status === 'active' ? null : existing?.archived_at || null),
      archived_by: input.status === 'archived' ? existing?.archived_by || null : (input.status === 'active' ? null : existing?.archived_by || null),
      updated_at: now,
    };

    useDemoStore.setState({
      members: store.members.map((m) => (m.id === id ? updated : m)),
    });

    if (isSupabaseConfigured && !id.startsWith('demo-')) {
      try {
        const updates: Record<string, unknown> = { updated_at: now };
        if (input.fullName !== undefined) updates.full_name = input.fullName;
        if (cleanPhone !== undefined) updates.phone = cleanPhone;
        if (input.email !== undefined) updates.email = input.email;
        if (input.dateOfBirth !== undefined) updates.date_of_birth = input.dateOfBirth;
        if (input.gender !== undefined) updates.gender = input.gender;
        if (input.address !== undefined) updates.address = input.address;
        if (input.emergencyContact !== undefined) updates.emergency_contact = input.emergencyContact;
        if (input.notes !== undefined) updates.notes = input.notes;
        if (input.status !== undefined) updates.status = input.status;

        await supabase.from('members').update(updates).eq('id', id);
      } catch (err) {
        console.warn('Supabase updateMember warning:', err);
      }
    }

    return updated;
  },

  async archiveMember(id: string, partnerId: string): Promise<void> {
    const now = new Date().toISOString();
    await this.updateMember(id, { status: 'archived' });

    const isDemo = useAuthStore.getState().isDemoMode || !isSupabaseConfigured || id.startsWith('demo-');
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

    if (error) {
      console.error('Supabase archiveMember error:', error);
      throw new Error(error.message || error.details || 'Failed to archive member in database.');
    }
  },
};
