# 🛡️ Paradise Gym Management PWA — Disaster Recovery Runbook

> **Audience:** Gym Owners, Technical Operators, or Developers assisting Paradise Gym.  
> **Last Verified:** 2026-11-07  
> **RTO (Recovery Time Objective):** < 15 minutes  
> **RPO (Recovery Point Objective):** < 24 hours (or instantaneous with live Supabase backups)

---

## 1. Overview & Failure Scenarios

Paradise Gym is architected with a **₹0 recurring software cost**, leveraging Supabase PostgreSQL with Row Level Security (RLS) and Cloudflare Pages static hosting. In normal operation, all mutations are instantly synchronized to PostgreSQL. However, three key failure modes are planned for:

1. **Local Device Loss or Physical Damage:** A phone or tablet running the PWA is dropped, broken, or stolen at the gym reception desk.
2. **Cloud Outage / Account Lockout:** Supabase free-tier project pause, maintenance window, or inadvertent database table corruption.
3. **Internet Disconnection at Gym:** Gym broadband / cellular network is completely down for hours or days.

---

## 2. Scenario A: Restoring from Full JSON Backup

When partners use the **Business Data Export** screen in the PWA, a complete JSON file named `paradise-gym-full-backup-YYYY-MM-DD.json` is generated.

### JSON Backup Structure:
```json
{
  "gym_id": "00000000-0000-0000-0000-000000000001",
  "version": "1.0.0",
  "exported_at": "2026-11-07T12:00:00.000Z",
  "members": [...],
  "plans": [...],
  "memberships": [...],
  "payments": [...],
  "expenses": [...],
  "attendance": [...],
  "partner_transactions": [...],
  "closures": [...]
}
```

### Steps to Restore Data into Supabase:
1. Open the Supabase Dashboard: `https://supabase.com/dashboard/project/<project-id>/sql`
2. If restoring into a brand new project, first execute the database migrations from:
   - `supabase/migrations/20261107000000_initial_schema.sql`
   - `supabase/migrations/20261107000001_rls_policies.sql`
3. Use the developer import script or run a PostgreSQL JSON population script:
   ```sql
   -- Example member table restore
   INSERT INTO public.members (id, gym_id, full_name, phone, email, date_of_birth, gender, address, status, join_date, notes)
   SELECT 
     (m->>'id')::UUID,
     (m->>'gym_id')::UUID,
     m->>'full_name',
     m->>'phone',
     m->>'email',
     (m->>'date_of_birth')::DATE,
     m->>'gender',
     m->>'address',
     (m->>'status')::public.member_status,
     (m->>'join_date')::TIMESTAMPTZ,
     m->>'notes'
   FROM json_array_elements('[...JSON members array...]') AS m
   ON CONFLICT (id) DO UPDATE 
   SET status = EXCLUDED.status, updated_at = now();
   ```

---

## 3. Scenario B: Device Stolen or Lost (Extracting Queued Offline Check-Ins)

If an offline device is recovered or can still open a browser:
1. Open Chrome DevTools (`F12` or `Cmd+Option+I`) -> Application -> IndexedDB -> `paradise_gym_offline_db`.
2. Inspect the `offline_attendance` object store.
3. Any records with `synced: 0` can be exported directly via console:
   ```javascript
   const req = indexedDB.open('paradise_gym_offline_db');
   req.onsuccess = () => {
     const db = req.result;
     const tx = db.transaction('offline_attendance', 'readonly');
     const store = tx.objectStore('offline_attendance');
     store.getAll().onsuccess = (e) => {
       console.log(JSON.stringify(e.target.result));
     };
   };
   ```
4. Paste the JSON into the Supabase attendance table.

---

## 4. Scenario C: Prolonged Gym Internet Outage

The PWA is designed with an offline-first service worker architecture:
1. The app functions completely without internet once installed.
2. QR attendance scanner uses the locally cached member roster.
3. Check-ins are stored in IndexedDB and marked with pending status.
4. When internet connectivity is restored, the `offlineSyncService` automatically re-connects and flushes all queued records without partner intervention.
5. In the event of conflicting timestamps, the database upsert policy preserves the earliest check-in timestamp (`ON CONFLICT (device_id, member_id, checked_in_at) DO NOTHING`).

---

## 5. Security & Secret Rotation Emergency Checklist

If Supabase credentials (`SUPABASE_ANON_KEY`) are ever exposed:
1. Navigate to **Supabase Dashboard -> Project Settings -> API**.
2. Click **Reset Secret** under Project API Keys.
3. Update the environment variables in Cloudflare Pages:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Trigger an immediate deployment in Cloudflare Pages.
5. All connected client PWA service workers will automatically update on next reload.

