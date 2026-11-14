import type {
  DbMember,
  DbMembershipPlan,
  DbPayment,
  DbAttendance,
  DbMembership,
} from '@/types/database';

export interface DemoDataset {
  members: DbMember[];
  plans: DbMembershipPlan[];
  payments: DbPayment[];
  attendance: DbAttendance[];
  memberships: DbMembership[];
}

export function generateDemoDataset(): DemoDataset {
  const gymId = 'demo-gym-001';
  const partnerId = 'demo-partner-001';

  const plans: DbMembershipPlan[] = [
    // --- Diwali & Opening Offer (Special Promotional Rates) ---
    {
      id: 'plan-offer-gym-1m',
      gym_id: gymId,
      name: '1 Month Gym (Diwali Offer)',
      description: 'Diwali Offer: Weight training & fitness floor',
      price_paise: 120000, // ₹1,200
      billing_cycle: 'monthly',
      duration_days: 30,
      features: ['Modern Equipment', 'Gym Floor', 'Clean & Spacious'],
      sort_order: 1,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'plan-offer-cardio-1m',
      gym_id: gymId,
      name: '1 Month Gym + Cardio (Diwali Offer)',
      description: 'Diwali Offer: Gym floor + cardio zone access',
      price_paise: 150000, // ₹1,500
      billing_cycle: 'monthly',
      duration_days: 30,
      features: ['Cardio Zone', 'Strength Equipment', 'Clean & Spacious'],
      sort_order: 2,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'plan-offer-gym-3m',
      gym_id: gymId,
      name: '3 Months Gym (Diwali Offer)',
      description: 'Diwali Offer: 3 months strength & fitness access',
      price_paise: 300000, // ₹3,000
      billing_cycle: 'quarterly',
      duration_days: 90,
      features: ['Modern Equipment', 'Gym Floor', 'Trainer Guidance'],
      sort_order: 3,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'plan-offer-cardio-3m',
      gym_id: gymId,
      name: '3 Months Gym + Cardio (Diwali Offer)',
      description: 'Diwali Offer: 3 months full gym + cardio access',
      price_paise: 400000, // ₹4,000
      billing_cycle: 'quarterly',
      duration_days: 90,
      features: ['Gym Floor', 'Cardio Zone', 'Nutrition Guide'],
      sort_order: 4,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'plan-offer-gym-6m',
      gym_id: gymId,
      name: '6 Months Gym (Diwali Offer)',
      description: 'Diwali Offer: 6 months gym membership',
      price_paise: 550000, // ₹5,500
      billing_cycle: 'half_yearly',
      duration_days: 180,
      features: ['Modern Equipment', 'Trainer Guidance', 'Nutrition Guide'],
      sort_order: 5,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'plan-offer-cardio-6m',
      gym_id: gymId,
      name: '6 Months Gym + Cardio (Diwali Offer)',
      description: 'Diwali Offer: 6 months complete access with cardio',
      price_paise: 700000, // ₹7,000
      billing_cycle: 'half_yearly',
      duration_days: 180,
      features: ['All Access', 'Cardio Zone', 'Nutrition Guide', 'Expert Trainers'],
      sort_order: 6,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'plan-offer-gym-1y',
      gym_id: gymId,
      name: '1 Year Gym (Diwali Offer)',
      description: 'Diwali Offer: 12 months full gym floor access',
      price_paise: 900000, // ₹9,000
      billing_cycle: 'yearly',
      duration_days: 365,
      features: ['Gym Floor', 'Modern Equipment', 'Expert Trainers'],
      sort_order: 7,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'plan-offer-cardio-1y',
      gym_id: gymId,
      name: '1 Year Gym + Cardio (Diwali Offer)',
      description: 'Diwali Offer: 12 months VIP all-inclusive gym + cardio',
      price_paise: 1200000, // ₹12,000
      billing_cycle: 'yearly',
      duration_days: 365,
      features: ['All Access', 'Cardio Zone', 'Nutrition Guide', 'Expert Trainers'],
      sort_order: 8,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },

    // --- Standard Normal Rates ---
    {
      id: 'plan-gym-1m',
      gym_id: gymId,
      name: '1 Month Gym (Regular)',
      description: 'Standard monthly gym floor access',
      price_paise: 150000, // ₹1,500
      billing_cycle: 'monthly',
      duration_days: 30,
      features: ['Modern Equipment', 'Gym Floor'],
      sort_order: 9,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'plan-cardio-1m',
      gym_id: gymId,
      name: '1 Month Gym + Cardio (Regular)',
      description: 'Standard monthly gym floor with cardio zone',
      price_paise: 180000, // ₹1,800
      billing_cycle: 'monthly',
      duration_days: 30,
      features: ['Gym Floor', 'Cardio Zone'],
      sort_order: 10,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'plan-gym-3m',
      gym_id: gymId,
      name: '3 Months Gym (Regular)',
      description: 'Standard quarterly gym access',
      price_paise: 400000, // ₹4,000
      billing_cycle: 'quarterly',
      duration_days: 90,
      features: ['Modern Equipment', 'Gym Floor'],
      sort_order: 11,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'plan-cardio-3m',
      gym_id: gymId,
      name: '3 Months Gym + Cardio (Regular)',
      description: 'Quarterly gym floor with cardio zone',
      price_paise: 500000, // ₹5,000
      billing_cycle: 'quarterly',
      duration_days: 90,
      features: ['Gym Floor', 'Cardio Zone', 'Nutrition Guide'],
      sort_order: 12,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'plan-gym-6m',
      gym_id: gymId,
      name: '6 Months Gym (Regular)',
      description: 'Half-yearly gym access',
      price_paise: 700000, // ₹7,000
      billing_cycle: 'half_yearly',
      duration_days: 180,
      features: ['Modern Equipment', 'Gym Floor'],
      sort_order: 13,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'plan-cardio-6m',
      gym_id: gymId,
      name: '6 Months Gym + Cardio (Regular)',
      description: 'Half-yearly gym floor with cardio zone',
      price_paise: 900000, // ₹9,000
      billing_cycle: 'half_yearly',
      duration_days: 180,
      features: ['Gym Floor', 'Cardio Zone', 'Nutrition Guide'],
      sort_order: 14,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'plan-gym-1y',
      gym_id: gymId,
      name: '1 Year Gym (Regular)',
      description: 'Annual gym floor pass',
      price_paise: 1200000, // ₹12,000
      billing_cycle: 'yearly',
      duration_days: 365,
      features: ['All Access', 'Modern Equipment'],
      sort_order: 15,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'plan-cardio-1y',
      gym_id: gymId,
      name: '1 Year Gym + Cardio (Regular)',
      description: 'Annual complete gym and cardio membership',
      price_paise: 1500000, // ₹15,000
      billing_cycle: 'yearly',
      duration_days: 365,
      features: ['All Access', 'Cardio Zone', 'Nutrition Guide', 'Expert Trainers'],
      sort_order: 16,
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
  const memberships: DbMembership[] = [];

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
      address: 'Lakshay Sarovar Kidana, Front of Lake',
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
        checked_in_at: new Date(Date.now() - i * 3600000).toISOString(),
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

    // Seed membership
    const startDaysAgo = (20 - i) * 2;
    const startDate = new Date(Date.now() - startDaysAgo * 86400000);
    const endDate = new Date(startDate.getTime() + 30 * 86400000);
    memberships.push({
      id: `demo-membership-${i + 1}`,
      gym_id: gymId,
      member_id: memberId,
      plan_id: 'plan-monthly',
      status: i === 18 ? 'expired' : 'active',
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      price_paise: 150000,
      paid_paise: 150000,
      balance_paise: 0,
      paused_at: null,
      paused_by: null,
      cancelled_at: null,
      cancelled_by: null,
      cancel_reason: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  return { members, plans, payments, attendance, memberships };
}
