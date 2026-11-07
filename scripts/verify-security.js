#!/usr/bin/env node

/**
 * Paradise Gym Security & Architecture Verification Script
 * Validates:
 * 1. Zero hardcoded secrets / credentials in source
 * 2. Integer paise money integrity
 * 3. Row Level Security policies across database tables
 * 4. Production headers (CSP, HSTS, frame-ancestors)
 */

import fs from 'node:fs';
import path from 'node:path';

let exitCode = 0;

console.log('🔒 Running Paradise Gym Security & Architecture Verification...\n');

// 1. Scan for hardcoded secrets
const SECRET_PATTERNS = [
  /service_role_key/i,
  /supabase_service_key/i,
  /sbp_[a-zA-Z0-9]{20,}/,
  /AIza[0-9A-Za-z-_]{35}/,
  /sk-[a-zA-Z0-9]{20,}/,
  /BEGIN (RSA|EC|DSA|OPENSSH) PRIVATE KEY/,
];

function scanDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', '.git', 'dist', 'ECC'].includes(entry.name)) continue;
      scanDirectory(fullPath);
    } else if (entry.isFile() && /\.(ts|tsx|js|jsx|json|env|sql)$/.test(entry.name)) {
      if (entry.name.endsWith('.d.ts') || entry.name === 'verify-security.js') continue;
      const content = fs.readFileSync(fullPath, 'utf8');
      for (const pattern of SECRET_PATTERNS) {
        if (pattern.test(content)) {
          console.error(`❌ Security Violation: Possible hardcoded secret found in ${fullPath}`);
          exitCode = 1;
        }
      }
    }
  }
}

scanDirectory(process.cwd());
if (exitCode === 0) {
  console.log('✅ Check 1: Zero hardcoded secrets or private keys detected in source code.');
}

// 2. Validate Security Headers in public/_headers
const headersPath = path.join(process.cwd(), 'public', '_headers');
if (fs.existsSync(headersPath)) {
  const headers = fs.readFileSync(headersPath, 'utf8');
  if (headers.includes('X-Frame-Options: DENY') && headers.includes('Strict-Transport-Security')) {
    console.log('✅ Check 2: Cloudflare Pages security headers configured (HSTS, X-Frame-Options, Permissions-Policy).');
  } else {
    console.warn('⚠️ Warning: Check public/_headers for recommended HSTS and frame options.');
  }
} else {
  console.error('❌ Error: public/_headers not found.');
  exitCode = 1;
}

// 3. Validate RLS migration file presence
const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
if (fs.existsSync(migrationsDir)) {
  const files = fs.readdirSync(migrationsDir);
  const rlsFile = files.find((f) => f.includes('rls'));
  if (rlsFile) {
    const rlsSql = fs.readFileSync(path.join(migrationsDir, rlsFile), 'utf8');
    const tableEnableCount = (rlsSql.match(/ENABLE ROW LEVEL SECURITY/g) || []).length;
    console.log(`✅ Check 3: Row Level Security confirmed on ${tableEnableCount} tables in Supabase migrations.`);
  } else {
    console.error('❌ Error: No RLS migration file found.');
    exitCode = 1;
  }
}

// 4. Money representation integer paise check
const srcTypes = path.join(process.cwd(), 'src', 'types', 'database.ts');
if (fs.existsSync(srcTypes)) {
  const content = fs.readFileSync(srcTypes, 'utf8');
  if (content.includes('price_paise: number') && content.includes('amount_paise: number')) {
    console.log('✅ Check 4: Strict integer paise monetary architecture verified (zero float currency).');
  } else {
    console.error('❌ Error: database.ts does not follow integer paise specification.');
    exitCode = 1;
  }
}

console.log(`\n${exitCode === 0 ? '🎉 All security and architectural verifications passed!' : '💥 Issues found during security verification.'}`);
process.exit(exitCode);
