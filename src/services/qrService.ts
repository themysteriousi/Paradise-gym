import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useDemoStore } from '@/stores/demoStore';
import { useAuthStore } from '@/stores/authStore';
import type { DbQrToken, DbMember } from '@/types/database';

export interface GenerateQrTokenOptions {
  gym_id: string;
  member_id: string;
  expires_in_days?: number; // Optional expiration
}

export interface ValidateQrTokenResult {
  isValid: boolean;
  member?: DbMember;
  tokenRecord?: DbQrToken;
  error?: string;
}

/**
 * Generate a cryptographically secure, random, non-identifying token string
 */
function createOpaqueTokenString(): string {
  // Use crypto.randomUUID or fallback with crypto.getRandomValues
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `PGYM:v1:${crypto.randomUUID()}`;
  }
  const randomBytes = new Uint8Array(16);
  crypto.getRandomValues(randomBytes);
  const hex = Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `PGYM:v1:${hex}`;
}

/**
 * Verify that a token string does NOT contain member's phone or name fragments (Zero PII).
 */
export function isTokenZeroPII(
  tokenString: string,
  member: { phone?: string | null; full_name?: string | null }
): boolean {
  if (member.phone && member.phone.length >= 6) {
    if (tokenString.includes(member.phone)) return false;
  }

  if (member.full_name) {
    const parts = member.full_name.toLowerCase().split(/\s+/).filter((p) => p.length > 2);
    const tokenLower = tokenString.toLowerCase();
    for (const part of parts) {
      if (tokenLower.includes(part)) return false;
    }
  }

  return true;
}

/**
 * Get active QR token for a member if one exists
 */
export function getActiveTokenForMember(memberId: string): DbQrToken | null {
  const isDemoMode = useAuthStore.getState().isDemoMode || !isSupabaseConfigured;

  if (isDemoMode) {
    const tokens = useDemoStore.getState().qrTokens;
    return (
      tokens.find((t) => t.member_id === memberId && t.revoked_at === null) || null
    );
  }

  return null;
}

/**
 * Generate a secure non-PII QR token for a member.
 * Automatically revokes any previously active token for the member so only 1 valid token exists.
 */
export async function generateMemberQrToken(
  options: GenerateQrTokenOptions
): Promise<DbQrToken> {
  const now = new Date();
  const expiresAt = options.expires_in_days
    ? new Date(now.getTime() + options.expires_in_days * 86400000).toISOString()
    : null;

  const tokenString = createOpaqueTokenString();

  const isDemoMode = useAuthStore.getState().isDemoMode || !isSupabaseConfigured;

  if (isDemoMode) {
    const demoStore = useDemoStore.getState();

    // 1. Revoke existing tokens for this member
    demoStore.revokeQrTokensForMember(options.member_id, 'system-rotation');

    // 2. Create new active token
    const tokenRecord: DbQrToken = {
      id: `token-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      gym_id: options.gym_id,
      member_id: options.member_id,
      token: tokenString,
      issued_at: now.toISOString(),
      expires_at: expiresAt,
      revoked_at: null,
      revoked_by: null,
    };

    demoStore.addQrToken(tokenRecord);
    return tokenRecord;
  }

  // Live Supabase Mode
  // 1. Revoke existing active tokens in DB
  await supabase
    .from('qr_tokens')
    .update({
      revoked_at: now.toISOString(),
      revoked_by: 'system-rotation',
    })
    .eq('member_id', options.member_id)
    .is('revoked_at', null);

  // 2. Insert new token
  const { data, error } = await supabase
    .from('qr_tokens')
    .insert({
      gym_id: options.gym_id,
      member_id: options.member_id,
      token: tokenString,
      issued_at: now.toISOString(),
      expires_at: expiresAt,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

/**
 * Validate a scanned QR token string:
 * - Checks existence
 * - Checks revocation status
 * - Checks expiration
 * - Resolves to member profile
 */
export async function validateQrToken(tokenString: string): Promise<ValidateQrTokenResult> {
  if (!tokenString || !tokenString.startsWith('PGYM:')) {
    return { isValid: false, error: 'Invalid or unrecognized QR token format' };
  }

  const isDemoMode = useAuthStore.getState().isDemoMode || !isSupabaseConfigured;

  if (isDemoMode) {
    const demoStore = useDemoStore.getState();
    const tokenRecord = demoStore.qrTokens.find((t) => t.token === tokenString);

    if (!tokenRecord) {
      return { isValid: false, error: 'Invalid or unrecognized token' };
    }

    if (tokenRecord.revoked_at !== null) {
      return {
        isValid: false,
        tokenRecord,
        error: `Token was revoked on ${new Date(tokenRecord.revoked_at).toLocaleDateString()}`,
      };
    }

    if (tokenRecord.expires_at && new Date(tokenRecord.expires_at) < new Date()) {
      return {
        isValid: false,
        tokenRecord,
        error: 'Token has expired. Please generate a new pass.',
      };
    }

    const member = demoStore.members.find((m) => m.id === tokenRecord.member_id);
    if (!member) {
      return { isValid: false, tokenRecord, error: 'Member record not found' };
    }

    return { isValid: true, member, tokenRecord };
  }

  // Live Supabase Mode
  const { data: tokenRecord, error } = await supabase
    .from('qr_tokens')
    .select('*, members(*)')
    .eq('token', tokenString)
    .single();

  if (error || !tokenRecord) {
    return { isValid: false, error: 'Invalid or unrecognized token' };
  }

  if (tokenRecord.revoked_at !== null) {
    return {
      isValid: false,
      tokenRecord,
      error: `Token was revoked on ${new Date(tokenRecord.revoked_at).toLocaleDateString()}`,
    };
  }

  if (tokenRecord.expires_at && new Date(tokenRecord.expires_at) < new Date()) {
    return {
      isValid: false,
      tokenRecord,
      error: 'Token has expired',
    };
  }

  return {
    isValid: true,
    member: tokenRecord.members as unknown as DbMember,
    tokenRecord,
  };
}

/**
 * Revoke an active QR token explicitly
 */
export async function revokeQrToken(
  tokenString: string,
  revokedBy: string
): Promise<{ success: boolean; error?: string }> {
  const isDemoMode = useAuthStore.getState().isDemoMode || !isSupabaseConfigured;

  if (isDemoMode) {
    useDemoStore.getState().revokeQrTokenByString(tokenString, revokedBy);
    return { success: true };
  }

  const { error } = await supabase
    .from('qr_tokens')
    .update({
      revoked_at: new Date().toISOString(),
      revoked_by: revokedBy,
    })
    .eq('token', tokenString);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

