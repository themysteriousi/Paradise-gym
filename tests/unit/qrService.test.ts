import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateMemberQrToken,
  validateQrToken,
  revokeQrToken,
  isTokenZeroPII,
  getActiveTokenForMember,
} from '@/services/qrService';
import { useDemoStore } from '@/stores/demoStore';

describe('Secure Non-PII QR Token Service', () => {
  beforeEach(() => {
    useDemoStore.getState().resetToDefault();
  });

  const member = {
    id: 'demo-member-1',
    gym_id: 'demo-gym-001',
    full_name: 'Aarav Sharma',
    phone: '9876543210',
  };

  it('generates an opaque non-PII token string containing zero phone or name fragments', async () => {
    const tokenRecord = await generateMemberQrToken({
      gym_id: member.gym_id,
      member_id: member.id,
    });

    expect(tokenRecord.token).toBeDefined();
    expect(tokenRecord.token.startsWith('PGYM:v1:')).toBe(true);
    expect(tokenRecord.revoked_at).toBeNull();

    // Verify Zero PII: does NOT contain phone or name
    const isZeroPii = isTokenZeroPII(tokenRecord.token, member);
    expect(isZeroPii).toBe(true);
  });

  it('validates an active valid token and returns the corresponding member', async () => {
    const tokenRecord = await generateMemberQrToken({
      gym_id: member.gym_id,
      member_id: member.id,
    });

    const result = await validateQrToken(tokenRecord.token);
    expect(result.isValid).toBe(true);
    expect(result.member).toBeDefined();
    expect(result.member?.id).toBe(member.id);
    expect(result.member?.full_name).toBe(member.full_name);
  });

  it('revokes previous active tokens when regenerating a new token for a member', async () => {
    // Generate 1st token
    const token1 = await generateMemberQrToken({
      gym_id: member.gym_id,
      member_id: member.id,
    });

    // Generate 2nd token for the same member
    const token2 = await generateMemberQrToken({
      gym_id: member.gym_id,
      member_id: member.id,
    });

    // 1st token must now be invalid
    const check1 = await validateQrToken(token1.token);
    expect(check1.isValid).toBe(false);
    expect(check1.error).toContain('revoked');

    // 2nd token is valid
    const check2 = await validateQrToken(token2.token);
    expect(check2.isValid).toBe(true);
    expect(check2.member?.id).toBe(member.id);

    // Active token lookup returns token2
    const active = getActiveTokenForMember(member.id);
    expect(active?.token).toBe(token2.token);
  });

  it('allows explicit partner token revocation', async () => {
    const tokenRecord = await generateMemberQrToken({
      gym_id: member.gym_id,
      member_id: member.id,
    });

    const revokeResult = await revokeQrToken(tokenRecord.token, 'demo-partner-001');
    expect(revokeResult.success).toBe(true);

    const check = await validateQrToken(tokenRecord.token);
    expect(check.isValid).toBe(false);
    expect(check.error).toContain('revoked');
  });

  it('rejects an unknown or tampered token string', async () => {
    const check = await validateQrToken('PGYM:v1:fake-malformed-token-999');
    expect(check.isValid).toBe(false);
    expect(check.error).toContain('Invalid or unrecognized');
  });
});

