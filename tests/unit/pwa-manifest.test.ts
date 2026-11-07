import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('PWA Manifest & Headers Verification', () => {
  it('contains valid manifest.webmanifest with required PWA standalone attributes', () => {
    const manifestPath = path.resolve(__dirname, '../../public/manifest.webmanifest');
    expect(fs.existsSync(manifestPath)).toBe(true);

    const manifestContent = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    expect(manifestContent.name).toBe('Paradise Gym Management');
    expect(manifestContent.short_name).toBe('Paradise Gym');
    expect(manifestContent.display).toBe('standalone');
    expect(manifestContent.start_url).toBe('/');
    expect(manifestContent.theme_color).toBe('#0f172a');
  });

  it('contains Cloudflare Pages _headers file with strict security controls', () => {
    const headersPath = path.resolve(__dirname, '../../public/_headers');
    expect(fs.existsSync(headersPath)).toBe(true);

    const headersContent = fs.readFileSync(headersPath, 'utf-8');
    expect(headersContent).toContain('Strict-Transport-Security');
    expect(headersContent).toContain('X-Frame-Options');
    expect(headersContent).toContain('Permissions-Policy');
  });
});
