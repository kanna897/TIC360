import { createClient } from '@supabase/supabase-js';

const url = 'https://yxwuigbjvqypluoepgje.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4d3VpZ2JqdnF5cGx1b2VwZ2plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNjA3OTIsImV4cCI6MjEwMzkzNjc5Mn0.q51MJ1V_ulXydptFaJiWtp-L3wCY6zuaiXWPZrKnvnE';

const supabase = createClient(url, anonKey);

const initialCourses = [
  {
    code: 'TIC-WD-01',
    name: 'Full-Stack Web Development',
    description: 'Comprehensive web architecture with React, Next.js, Node.js, and SQL',
    duration_months: 6,
    is_active: true,
  },
  {
    code: 'TIC-UI-02',
    name: 'UI/UX Design & Product Strategy',
    description: 'Modern user interface design, Figma workflows, wireframing, and user testing',
    duration_months: 4,
    is_active: true,
  },
  {
    code: 'TIC-DA-03',
    name: 'Data Analytics & Business Intelligence',
    description: 'Data transformation, Python, Power BI, Excel mastery, and statistical modeling',
    duration_months: 6,
    is_active: true,
  },
  {
    code: 'TIC-CS-04',
    name: 'Cybersecurity Fundamentals & Network Security',
    description: 'Defensive security, Linux administration, ethical hacking, and threat mitigation',
    duration_months: 6,
    is_active: true,
  },
  {
    code: 'TIC-DM-05',
    name: 'Digital Marketing & Content Strategy',
    description: 'SEO, SEM, social media growth engineering, analytics, and branding',
    duration_months: 3,
    is_active: true,
  },
];

async function seed() {
  console.log('--- Seeding Supabase Database ---');

  // 1. Courses
  console.log('Seeding courses...');
  for (const c of initialCourses) {
    const { error } = await supabase.from('courses').upsert(c, { onConflict: 'code' });
    if (error) console.error('Error course:', error.message);
  }
  console.log('✓ Courses seeded successfully.');

  // Fetch created courses to get IDs
  const { data: dbCourses } = await supabase.from('courses').select('id, code, name');
  const courseMap = {};
  dbCourses?.forEach((c) => { courseMap[c.code] = c.id; });

  // 2. Batches
  console.log('Seeding batches...');
  const initialBatches = [
    {
      name: 'Batch 2026-A (Morning)',
      course_id: courseMap['TIC-WD-01'] || dbCourses?.[0]?.id,
      start_date: '2026-01-10',
      end_date: '2026-07-10',
      status: 'Active',
    },
    {
      name: 'Batch 2026-B (Evening)',
      course_id: courseMap['TIC-UI-02'] || dbCourses?.[1]?.id,
      start_date: '2026-02-01',
      end_date: '2026-06-01',
      status: 'Active',
    },
    {
      name: 'Batch 2026-C (Weekend)',
      course_id: courseMap['TIC-DA-03'] || dbCourses?.[2]?.id,
      start_date: '2026-01-15',
      end_date: '2026-07-15',
      status: 'Active',
    },
  ];

  for (const b of initialBatches) {
    if (b.course_id) {
      await supabase.from('batches').insert(b);
    }
  }
  console.log('✓ Batches seeded.');

  // 3. Students
  console.log('Seeding sample students...');
  const students = [
    {
      ut_number: 'UT-2026-001',
      full_name: 'Kavitha Sivarajah',
      nic: '200178401923',
      dob: '2001-04-12',
      gender: 'Female',
      phone: '+94 77 123 4567',
      whatsapp: '+94 77 123 4567',
      email: 'kavitha.s@unicomtic.lk',
      address: 'No. 45, Station Road, Jaffna',
      district: 'Jaffna',
      emergency_contact_name: 'Sivarajah (Father)',
      emergency_contact_phone: '+94 77 987 6543',
      emergency_contact_relationship: 'Father',
      course_id: courseMap['TIC-WD-01'],
      is_blossom_trust: true,
      current_status: 'Active',
    },
    {
      ut_number: 'UT-2026-002',
      full_name: 'Mohamed Rizwan',
      nic: '200019203948',
      dob: '2000-08-23',
      gender: 'Male',
      phone: '+94 71 456 7890',
      whatsapp: '+94 71 456 7890',
      email: 'm.rizwan@unicomtic.lk',
      address: '12 Main Street, Batticaloa',
      district: 'Batticaloa',
      emergency_contact_name: 'Farook (Brother)',
      emergency_contact_phone: '+94 71 888 9999',
      emergency_contact_relationship: 'Brother',
      course_id: courseMap['TIC-DA-03'],
      is_blossom_trust: false,
      current_status: 'Active',
    },
    {
      ut_number: 'UT-2026-003',
      full_name: 'Tharushi Perera',
      nic: '200289102938',
      dob: '2002-11-05',
      gender: 'Female',
      phone: '+94 76 345 6789',
      whatsapp: '+94 76 345 6789',
      email: 'tharushi.p@unicomtic.lk',
      address: '78 Kandy Road, Kurunegala',
      district: 'Kurunegala',
      emergency_contact_name: 'Kamala Perera (Mother)',
      emergency_contact_phone: '+94 76 111 2222',
      emergency_contact_relationship: 'Mother',
      course_id: courseMap['TIC-UI-02'],
      is_blossom_trust: true,
      current_status: 'Active',
    },
  ];

  for (const s of students) {
    const { data: inserted, error } = await supabase
      .from('students')
      .upsert(s, { onConflict: 'ut_number' })
      .select('id')
      .single();

    if (error) {
      console.error('Error student:', error.message);
    } else if (inserted && s.is_blossom_trust) {
      // Bank details
      await supabase.from('student_bank_details').upsert({
        student_id: inserted.id,
        bank_name: 'Bank of Ceylon',
        branch_name: 'Jaffna Main Branch',
        account_number: '7891234560',
        beneficiary_name: s.full_name,
        district: s.district,
      }, { onConflict: 'student_id' });
    }
  }

  console.log('✓ Students and Blossom Bank Details seeded.');
  console.log('🎉 Supabase Database is ready and fully operational!');
}

seed();
