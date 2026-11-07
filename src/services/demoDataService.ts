import type { DbMember, DbMembershipPlan, DbPayment, DbAttendance } from '@/types/database';

export interface DemoDataset {
  members: DbMember[];
  plans: DbMembershipPlan[];
  payments: DbPayment[];
  attendance: DbAttendance[];
}

export function generateDemoDataset(): DemoDataset {
  const gymId = 'demo-gym-001';
  const partnerId = 'demo-partner-001';

  const plans: DbMembershipPlan[] = [
    {
      id: 'plan-monthly',
      gym_id: gymId,
      name: 'Monthly Standard',
      description: 'Full gym access, cardio & strength floor',
      price_paise: 150000, // ₹1,500
      billing_cycle: 'monthly',
      duration_days: 30,
      features: ['Gym Floor', 'Cardio Zone', 'Locker Room'],
      sort_order: 1,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'plan-quarterly',
      gym_id: gymId,
      name: 'Quarterly Value',
      description: '3 months full access + complimentary diet plan',
      price_paise: 380000, // ₹3,800
      billing_cycle: 'quarterly',
      duration_days: 90,
      features: ['Gym Floor', 'Cardio Zone', 'Diet Plan', 'Locker Room'],
      sort_order: 2,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'plan-yearly',
      gym_id: gymId,
      name: 'Annual Champion',
      description: '12 months unlimited access + locker facility',
      price_paise: 1200000, // ₹12,000
      billing_cycle: 'yearly',
      duration_days: 365,
      features: ['All Access', 'Diet Plan', 'Personal Locker', 'Guest Passes (x2)'],
      sort_order: 3,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const firstNames = ['Aarav', 'Vihaan', 'Aditya', 'Rohan', 'Pooja', 'Priya', 'Ananya', 'Neha', 'Kabir', 'Dev', 'Ishaan', 'Karan', 'Sneha', 'Tanvi', 'Manish', 'Kunal', 'Deepak', 'Simran'];
  const lastNames = ['Sharma', 'Verma', 'Patel', 'Singh', 'Kapoor', 'Gupta', 'Mehta', 'Chauhan', 'Reddy', 'Joshi', 'Bhatia', 'Malhotra'];

  const members: DbMember[] = [];
  const payments: DbPayment[] = [];
  const attendance: DbAttendance[] = [];

  for (let i = 0; i < 20; i++) {
    const fn = firstNames[i % firstNames.length];
    const ln = lastNames[(i * 3) % lastNames.length];
    const memberId = `demo-member-${i + 1}`;
    const isDue = i % 5 === 0;

    members.push({
      id: memberId,
      gym_id: gymId,
      full_name: `${fn} ${ln}`,
      phone: `98765432${(i + 10).toString().slice(0, 2)}`,
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}@example.com`,
      date_of_birth: '1998-05-15',
      gender: i % 2 === 0 ? 'male' : 'female',
      address: 'Civil Lines, Paradise City',
      emergency_contact: '9811223344',
      photo_url: null,
      status: i === 18 ? 'expired' : 'active',
      join_date: new Date(Date.now() - (30 + i * 5) * 86400000).toISOString(),
      notes: isDue ? 'Pending instalment ₹1,000' : null,
      archived_at: null,
      archived_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Seed payments
    payments.push({
      id: `demo-payment-${i + 1}`,
      gym_id: gymId,
      member_id: memberId,
      received_by: partnerId,
      method: i % 2 === 0 ? 'upi' : 'cash',
      amount_paise: i % 3 === 0 ? 380000 : 150000,
      status: 'completed',
      reference: i % 2 === 0 ? `UPI-REF-${100000 + i}` : null,
      note: 'Advance membership collection',
      paid_at: new Date(Date.now() - (i * 2) * 86400000).toISOString(),
      is_correction: false,
      original_id: null,
      corrected_by: null,
      corrected_at: null,
      correction_reason: null,
      created_at: new Date().toISOString(),
    });

    // Seed attendance
    if (i < 12) {
      attendance.push({
        id: `demo-att-${i + 1}`,
        gym_id: gymId,
        member_id: memberId,
        membership_id: 'plan-monthly',
        method: i % 3 === 0 ? 'manual' : 'qr_scan',
        checked_in_at: new Date(Date.now() - (i * 3600000)).toISOString(),
        checked_in_by: partnerId,
        device_id: 'device-demo-01',
        note: null,
        is_correction: false,
        original_id: null,
        corrected_by: null,
        corrected_at: null,
        correction_reason: null,
      });
    }
  }

  return { members, plans, payments, attendance };
}
