import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import dataSource from '../data-source';

// Entities
import { Tenant } from '../../tenants/entities/tenant.entity';
import { User } from '../../users/entities/user.entity';
import { UserRole } from '../../users/enums/user-role.enum';
import { Classroom } from '../../classrooms/entities/classroom.entity';
import { Student } from '../../students/entities/student.entity';
import { Attendance } from '../../attendance/entities/attendance.entity';
import { AttendanceStatus } from '../../attendance/enums/attendance-status.enum';
import { Observation } from '../../observations/entities/observation.entity';
import { MontessoriArea } from '../../observations/enums/montessori-area.enum';
import { ObservationProgress } from '../../observations/enums/observation-progress.enum';
import { Assessment } from '../../assessments/entities/assessment.entity';
import { AssessmentArea } from '../../assessments/enums/assessment-area.enum';
import { AssessmentLevel } from '../../assessments/enums/assessment-level.enum';
import { CurriculumLesson } from '../../curriculum/entities/curriculum-lesson.entity';
import { LessonPlan } from '../../curriculum/entities/lesson-plan.entity';
import { LessonPlanStatus } from '../../curriculum/enums/lesson-plan-status.enum';
import { Badge } from '../../gamification/entities/badge.entity';
import { BadgeCategory } from '../../gamification/enums/badge-category.enum';
import { StudentBadge } from '../../gamification/entities/student-badge.entity';
import { StudentPoints } from '../../gamification/entities/student-points.entity';
import { FeeStructure } from '../../finance/entities/fee-structure.entity';
import { FeeFrequency } from '../../finance/enums/fee-frequency.enum';
import { StudentFee } from '../../finance/entities/student-fee.entity';
import { FeeStatus } from '../../finance/enums/fee-status.enum';
import { Payment } from '../../finance/entities/payment.entity';
import { PaymentMethod } from '../../finance/enums/payment-method.enum';
import { Employee, EmployeeStatus, EmploymentType } from '../../hr/entities/employee.entity';
import { LeaveRequest, LeaveStatus, LeaveType } from '../../hr/entities/leave-request.entity';
import { InventoryItem, InventoryItemStatus } from '../../inventory/entities/inventory-item.entity';
import { InventoryTransaction, InventoryTransactionType } from '../../inventory/entities/inventory-transaction.entity';
import { Announcement, AnnouncementAudience, AnnouncementPriority } from '../../communication/entities/announcement.entity';

export async function runSeed() {
  console.log('🌱 Connecting to Montara PostgreSQL database...');
  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }
  console.log('✅ Connected to database.');

  // ==========================================
  // 1. CLEAN EXISTING DATABASE (Respecting FKs)
  // ==========================================
  console.log('🧹 Cleaning existing application data from tables...');
  const tables = [
    'announcements',
    'inventory_transactions',
    'inventory_items',
    'leave_requests',
    'employees',
    'student_badges',
    'gamification_points',
    'badges',
    'lesson_plans',
    'curriculum_lessons',
    'payments',
    'student_fees',
    'fee_structures',
    'assessments',
    'observations',
    'attendance',
    'students',
    'classrooms',
    'users',
    'tenants',
  ];

  for (const table of tables) {
    try {
      await dataSource.query(`TRUNCATE TABLE "${table}" CASCADE;`);
    } catch (err: any) {
      console.warn(`Warning truncating ${table}:`, err.message);
    }
  }
  console.log('✅ Database cleaned successfully.');

  // ==========================================
  // 2. TENANT & SCHOOL SETTINGS
  // ==========================================
  console.log('🏫 Seeding School Tenant...');
  const tenantRepo = dataSource.getRepository(Tenant);
  const tenant = tenantRepo.create({
    name: 'Montara International Montessori School',
    slug: 'montara-international',
    isActive: true,
    logoUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=256&q=80',
    phone: '+92 21 3584 9201',
    email: 'info@montara-school.pk',
    address: 'Plot 14-C, Khayaban-e-Ittehad, Phase 6, DHA, Karachi, Pakistan',
    timezone: 'Asia/Karachi',
    currency: 'PKR',
    academicYear: '2026-2027',
  });
  const savedTenant = await tenantRepo.save(tenant);
  const tenantId = savedTenant.id;
  console.log(`✅ Tenant created: ${savedTenant.name} (${tenantId})`);

  // ==========================================
  // 3. AUTHENTICATION & USERS
  // ==========================================
  console.log('👥 Seeding Users with hashed passwords...');
  const userRepo = dataSource.getRepository(User);
  const defaultPassword = 'Password123!';
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  const userData = [
    // Super Admin
    { name: 'Super Admin', email: 'admin@superadmin.com', role: UserRole.SUPER_ADMIN },
    // School Admin
    { name: 'Fatima Noor', email: 'fatima@admin.com', role: UserRole.SCHOOL_ADMIN },
    // Teachers
    { name: 'Hassan Ahmed', email: 'hassan@teacher.com', role: UserRole.TEACHER },
    { name: 'Ayesha Malik', email: 'ayesha@teacher.com', role: UserRole.TEACHER },
    { name: 'Maham Raza', email: 'maham@teacher.com', role: UserRole.TEACHER },
    { name: 'Tariq Mehmood', email: 'tariq@teacher.com', role: UserRole.TEACHER },
    { name: 'Nida Yasir', email: 'nida@teacher.com', role: UserRole.TEACHER },
    // Parents
    { name: 'Ali Hassan', email: 'ali@parent.com', role: UserRole.PARENT },
    { name: 'Hamza Sheikh', email: 'hamza@parent.com', role: UserRole.PARENT },
    { name: 'Zainab Tariq', email: 'zainab@parent.com', role: UserRole.PARENT },
    { name: 'Bilal Qureshi', email: 'bilal@parent.com', role: UserRole.PARENT },
    { name: 'Kamran Khan', email: 'kamran@parent.com', role: UserRole.PARENT },
    { name: 'Sadia Imran', email: 'sadia@parent.com', role: UserRole.PARENT },
    { name: 'Omar Farooq', email: 'omar@parent.com', role: UserRole.PARENT },
    // Accountant
    { name: 'Rafay Khan', email: 'rafay@accountant.com', role: UserRole.ACCOUNTANT },
    // HR Manager
    { name: 'Sana Javed', email: 'sana@hr.com', role: UserRole.HR_MANAGER },
    // Inventory Manager
    { name: 'Usman Ali', email: 'usman@inventory.com', role: UserRole.INVENTORY_MANAGER },
  ];

  const userMap = new Map<string, User>();
  for (const u of userData) {
    const user = userRepo.create({
      ...u,
      passwordHash,
      tenantId,
      isActive: true,
    });
    const savedUser = await userRepo.save(user);
    userMap.set(savedUser.email, savedUser);
  }
  console.log(`✅ Seeded ${userMap.size} users.`);

  // ==========================================
  // 4. CLASSROOMS
  // ==========================================
  console.log('🏛️ Seeding Classrooms...');
  const classroomRepo = dataSource.getRepository(Classroom);
  const classroomDefinitions = [
    {
      name: 'Toddler Community - Jasmine',
      description: 'Nido & Toddler Montessori environment designed for ages 18 months to 3 years.',
      teacherEmail: 'maham@teacher.com',
    },
    {
      name: 'Casa 1 - Gulmohar',
      description: 'Primary Children’s House environment emphasizing practical life, sensorial, and early math.',
      teacherEmail: 'hassan@teacher.com',
    },
    {
      name: 'Casa 2 - Rose',
      description: 'Primary Children’s House environment focusing on language development, cultural, and sensorial.',
      teacherEmail: 'ayesha@teacher.com',
    },
    {
      name: 'Lower Elementary - Oak',
      description: 'Cosmic education, advanced arithmetic, grammar, and scientific inquiries for ages 6–9.',
      teacherEmail: 'tariq@teacher.com',
    },
    {
      name: 'Upper Elementary - Jacaranda',
      description: 'Independent research, geometry, history, and creative projects for ages 9–12.',
      teacherEmail: 'nida@teacher.com',
    },
  ];

  const classroomMap = new Map<string, Classroom>();
  for (const c of classroomDefinitions) {
    const teacher = userMap.get(c.teacherEmail);
    const room = classroomRepo.create({
      name: c.name,
      description: c.description,
      tenantId,
      teacherId: teacher?.id,
      isActive: true,
    });
    const savedRoom = await classroomRepo.save(room);
    classroomMap.set(savedRoom.name, savedRoom);
  }
  console.log(`✅ Seeded ${classroomMap.size} classrooms.`);

  // ==========================================
  // 5. STUDENTS (18 Students)
  // ==========================================
  console.log('🎒 Seeding Students...');
  const studentRepo = dataSource.getRepository(Student);
  const studentDefinitions = [
    {
      firstName: 'Ahmed',
      lastName: 'Hassan',
      gender: 'Male',
      dob: '2021-04-12',
      adm: 'STD-2024-001',
      enrollDate: '2024-08-15',
      parentEmail: 'ali@parent.com',
      roomName: 'Casa 1 - Gulmohar',
    },
    {
      firstName: 'Zara',
      lastName: 'Ahmed',
      gender: 'Female',
      dob: '2023-01-15',
      adm: 'STD-2025-002',
      enrollDate: '2025-01-10',
      parentEmail: 'ali@parent.com',
      roomName: 'Toddler Community - Jasmine',
    },
    {
      firstName: 'Muhammad',
      lastName: 'Abdullah',
      gender: 'Male',
      dob: '2020-08-20',
      adm: 'STD-2023-003',
      enrollDate: '2023-08-15',
      parentEmail: 'bilal@parent.com',
      roomName: 'Casa 2 - Rose',
    },
    {
      firstName: 'Maryam',
      lastName: 'Qureshi',
      gender: 'Female',
      dob: '2018-05-10',
      adm: 'STD-2022-004',
      enrollDate: '2022-08-15',
      parentEmail: 'bilal@parent.com',
      roomName: 'Lower Elementary - Oak',
    },
    {
      firstName: 'Ibrahim',
      lastName: 'Sheikh',
      gender: 'Male',
      dob: '2021-11-03',
      adm: 'STD-2024-005',
      enrollDate: '2024-08-15',
      parentEmail: 'hamza@parent.com',
      roomName: 'Casa 1 - Gulmohar',
    },
    {
      firstName: 'Hania',
      lastName: 'Sheikh',
      gender: 'Female',
      dob: '2023-06-25',
      adm: 'STD-2025-006',
      enrollDate: '2025-01-10',
      parentEmail: 'hamza@parent.com',
      roomName: 'Toddler Community - Jasmine',
    },
    {
      firstName: 'Rayyan',
      lastName: 'Tariq',
      gender: 'Male',
      dob: '2017-09-14',
      adm: 'STD-2021-007',
      enrollDate: '2021-08-15',
      parentEmail: 'zainab@parent.com',
      roomName: 'Upper Elementary - Jacaranda',
    },
    {
      firstName: 'Ayesha',
      lastName: 'Khan',
      gender: 'Female',
      dob: '2020-03-22',
      adm: 'STD-2023-008',
      enrollDate: '2023-08-15',
      parentEmail: 'kamran@parent.com',
      roomName: 'Casa 2 - Rose',
    },
    {
      firstName: 'Ayan',
      lastName: 'Khan',
      gender: 'Male',
      dob: '2019-02-18',
      adm: 'STD-2023-009',
      enrollDate: '2023-08-15',
      parentEmail: 'kamran@parent.com',
      roomName: 'Lower Elementary - Oak',
    },
    {
      firstName: 'Zain',
      lastName: 'Imran',
      gender: 'Male',
      dob: '2021-07-30',
      adm: 'STD-2024-010',
      enrollDate: '2024-08-15',
      parentEmail: 'sadia@parent.com',
      roomName: 'Casa 1 - Gulmohar',
    },
    {
      firstName: 'Emaan',
      lastName: 'Imran',
      gender: 'Female',
      dob: '2018-12-05',
      adm: 'STD-2022-011',
      enrollDate: '2022-08-15',
      parentEmail: 'sadia@parent.com',
      roomName: 'Lower Elementary - Oak',
    },
    {
      firstName: 'Hamza',
      lastName: 'Farooq',
      gender: 'Male',
      dob: '2020-10-10',
      adm: 'STD-2024-012',
      enrollDate: '2024-08-15',
      parentEmail: 'omar@parent.com',
      roomName: 'Casa 2 - Rose',
    },
    {
      firstName: 'Mustafa',
      lastName: 'Ali',
      gender: 'Male',
      dob: '2023-09-18',
      adm: 'STD-2025-013',
      enrollDate: '2025-01-10',
      parentEmail: 'ali@parent.com',
      roomName: 'Toddler Community - Jasmine',
    },
    {
      firstName: 'Fatima',
      lastName: 'Zahra',
      gender: 'Female',
      dob: '2021-02-14',
      adm: 'STD-2024-014',
      enrollDate: '2024-08-15',
      parentEmail: 'zainab@parent.com',
      roomName: 'Casa 1 - Gulmohar',
    },
    {
      firstName: 'Bilal',
      lastName: 'Ahmed',
      gender: 'Male',
      dob: '2017-04-08',
      adm: 'STD-2021-015',
      enrollDate: '2021-08-15',
      parentEmail: 'bilal@parent.com',
      roomName: 'Upper Elementary - Jacaranda',
    },
    {
      firstName: 'Anaya',
      lastName: 'Sheikh',
      gender: 'Female',
      dob: '2020-05-19',
      adm: 'STD-2023-016',
      enrollDate: '2023-08-15',
      parentEmail: 'hamza@parent.com',
      roomName: 'Casa 2 - Rose',
    },
    {
      firstName: 'Danyal',
      lastName: 'Khan',
      gender: 'Male',
      dob: '2019-11-27',
      adm: 'STD-2023-017',
      enrollDate: '2023-08-15',
      parentEmail: 'kamran@parent.com',
      roomName: 'Lower Elementary - Oak',
    },
    {
      firstName: 'Mahnoor',
      lastName: 'Raza',
      gender: 'Female',
      dob: '2016-08-30',
      adm: 'STD-2020-018',
      enrollDate: '2020-08-15',
      parentEmail: 'sadia@parent.com',
      roomName: 'Upper Elementary - Jacaranda',
    },
  ];

  const students: Student[] = [];
  for (const s of studentDefinitions) {
    const parent = userMap.get(s.parentEmail);
    const room = classroomMap.get(s.roomName);
    const student = studentRepo.create({
      firstName: s.firstName,
      lastName: s.lastName,
      gender: s.gender,
      dateOfBirth: new Date(s.dob),
      admissionNumber: s.adm,
      enrollmentDate: new Date(s.enrollDate),
      tenantId,
      parentId: parent?.id,
      classroomId: room?.id,
      isActive: true,
    });
    const savedStudent = await studentRepo.save(student);
    students.push(savedStudent);
  }
  console.log(`✅ Seeded ${students.length} students.`);

  // ==========================================
  // 6. ATTENDANCE (Past 45 school days)
  // ==========================================
  console.log('📅 Seeding Attendance records for the last 45 school days...');
  const attendanceRepo = dataSource.getRepository(Attendance);
  const teacherUser = userMap.get('hassan@teacher.com')!;
  
  const attendanceEntities: Attendance[] = [];
  const now = new Date();
  
  // Generate dates for past 60 calendar days, filtering for weekdays (Mon-Fri)
  const schoolDates: string[] = [];
  for (let i = 60; i >= 1; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dayOfWeek = d.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Skip Saturday and Sunday
      schoolDates.push(d.toISOString().split('T')[0]);
    }
  }

  // Slice to last 45 school days
  const activeDates = schoolDates.slice(-45);

  for (const dateStr of activeDates) {
    for (const student of students) {
      if (!student.classroomId) continue;

      // Deterministic pseudo-random variation based on student & date
      const hash = (student.id.charCodeAt(0) + dateStr.charCodeAt(9)) % 100;
      let status = AttendanceStatus.PRESENT;
      let remarks: string | null = null;

      if (hash < 85) {
        status = AttendanceStatus.PRESENT;
      } else if (hash < 93) {
        status = AttendanceStatus.LATE;
        remarks = 'Arrived at 8:45 AM due to traffic on Shahrah-e-Faisal';
      } else if (hash < 97) {
        status = AttendanceStatus.ABSENT;
        remarks = 'Mild fever, resting at home';
      } else {
        status = AttendanceStatus.EXCUSED;
        remarks = 'Prior family leave approved';
      }

      const att = attendanceRepo.create({
        studentId: student.id,
        classroomId: student.classroomId,
        tenantId,
        date: dateStr,
        status,
        remarks,
        markedById: teacherUser.id,
      });
      attendanceEntities.push(att);
    }
  }

  // Save in chunks to avoid single massive query
  const chunkSize = 200;
  for (let i = 0; i < attendanceEntities.length; i += chunkSize) {
    await attendanceRepo.save(attendanceEntities.slice(i, i + chunkSize));
  }
  console.log(`✅ Seeded ${attendanceEntities.length} attendance records across ${activeDates.length} school days.`);

  // ==========================================
  // 7. OBSERVATIONS
  // ==========================================
  console.log('📝 Seeding Montessori Observations...');
  const observationRepo = dataSource.getRepository(Observation);
  const observationPool = [
    {
      area: MontessoriArea.PRACTICAL_LIFE,
      skill: 'Dry Pouring with Three-Finger Grasp',
      notes: 'Demonstrated high concentration while pouring lentils between glass jugs without spilling. Self-corrected posture.',
      progress: ObservationProgress.MASTERED,
    },
    {
      area: MontessoriArea.PRACTICAL_LIFE,
      skill: 'Buttoning & Unbuttoning Dressing Frame',
      notes: 'Practiced top-to-bottom sequencing on wooden dressing frame. Needed slight encouragement on smaller buttons.',
      progress: ObservationProgress.PRACTICING,
    },
    {
      area: MontessoriArea.PRACTICAL_LIFE,
      skill: 'Table Scrubbing and Cycle Completion',
      notes: 'Gathered apron, basin, sponge, and drying cloth independently. Completed the five-step cleaning routine.',
      progress: ObservationProgress.MASTERED,
    },
    {
      area: MontessoriArea.SENSORIAL,
      skill: 'Pink Tower Gradation (1cm to 10cm)',
      notes: 'Built the Pink Tower accurately from base to apex. Detected minor discrepancy on the 4th cube and rebuilt deliberately.',
      progress: ObservationProgress.MASTERED,
    },
    {
      area: MontessoriArea.SENSORIAL,
      skill: 'Broad Stair (Brown Stair) Pairing',
      notes: 'Explored tactile thickness variation and combined Brown Stair prisms with Pink Tower cubes in harmonic sequence.',
      progress: ObservationProgress.DEVELOPING,
    },
    {
      area: MontessoriArea.SENSORIAL,
      skill: 'Color Box 2 - Primary & Secondary Pairing',
      notes: 'Paired 11 color tablet pairs accurately in under 4 minutes. Named subtle shades of blue and orange confidently.',
      progress: ObservationProgress.MASTERED,
    },
    {
      area: MontessoriArea.LANGUAGE,
      skill: 'Sandpaper Letters Phonics Tracing ("m", "s", "a")',
      notes: 'Traced cursive sandpaper letters with index and middle fingers while vocalizing phonetic sounds clearly.',
      progress: ObservationProgress.PRACTICING,
    },
    {
      area: MontessoriArea.LANGUAGE,
      skill: 'Large Movable Alphabet (LMA) 3-Letter Words',
      notes: 'Built phonetic CVC words: "cat", "sun", "mat", and "box" using wooden letter cutouts independently.',
      progress: ObservationProgress.DEVELOPING,
    },
    {
      area: MontessoriArea.LANGUAGE,
      skill: 'Pink Series Object Box Matching',
      notes: 'Matched miniature objects to written name slips with 100% accuracy. Demonstrated early reading confidence.',
      progress: ObservationProgress.MASTERED,
    },
    {
      area: MontessoriArea.MATHEMATICS,
      skill: 'Number Rods (Quantities 1 to 10)',
      notes: 'Sequenced number rods 1 through 10. Accurately counted alternating red and blue sections with counting finger.',
      progress: ObservationProgress.MASTERED,
    },
    {
      area: MontessoriArea.MATHEMATICS,
      skill: 'Spindle Box & Concept of Zero',
      notes: 'Placed exact number of wooden spindles into compartments 0-9. Understood that the 0 compartment remains empty.',
      progress: ObservationProgress.MASTERED,
    },
    {
      area: MontessoriArea.MATHEMATICS,
      skill: 'Golden Beads Introduction to Decimal Categories',
      notes: 'Handled single unit bead, ten-bar, hundred-square, and thousand-cube. Grasped relative weight and hierarchy.',
      progress: ObservationProgress.INTRODUCED,
    },
    {
      area: MontessoriArea.CULTURAL,
      skill: 'Globe of Land & Water Sensorial Exploration',
      notes: 'Explored rough sandpaper landmasses and smooth painted ocean surfaces while reciting continent songs.',
      progress: ObservationProgress.MASTERED,
    },
    {
      area: MontessoriArea.CULTURAL,
      skill: 'Puzzle Map of Asia - Country Identification',
      notes: 'Identified Pakistan, China, Saudi Arabia, and Turkey on the wooden puzzle map using the control chart.',
      progress: ObservationProgress.DEVELOPING,
    },
    {
      area: MontessoriArea.ART,
      skill: 'Watercolor Brush Technique & Color Blending',
      notes: 'Explored mixing yellow and blue to create various tones of green. Cleaned brush in water between strokes.',
      progress: ObservationProgress.PRACTICING,
    },
    {
      area: MontessoriArea.MUSIC,
      skill: 'Montessori Bells Sensorial Pitch Discrimination',
      notes: 'Paired middle C and D bells accurately using the wooden mallet and felt dampener.',
      progress: ObservationProgress.DEVELOPING,
    },
    {
      area: MontessoriArea.MOVEMENT,
      skill: 'Walking on the Ellipse Line with Hand Bell',
      notes: 'Maintained balance heel-to-toe along the line while holding a bell without allowing the clapper to ring.',
      progress: ObservationProgress.MASTERED,
    },
    {
      area: MontessoriArea.SOCIAL_EMOTIONAL,
      skill: 'Grace & Courtesy: Table Etiquette & Greeting',
      notes: 'Greeted peer politely and offered help when materials fell. Replaced chair quietly under table after work.',
      progress: ObservationProgress.MASTERED,
    },
  ];

  const observationsToSave: Observation[] = [];
  for (let sIdx = 0; sIdx < students.length; sIdx++) {
    const student = students[sIdx];
    const obsCount = 3 + (sIdx % 3); // 3-5 observations per student
    for (let oIdx = 0; oIdx < obsCount; oIdx++) {
      const template = observationPool[(sIdx * 3 + oIdx) % observationPool.length];
      const dateOffset = (sIdx * 2 + oIdx * 3) % 40;
      const obsDate = new Date(now);
      obsDate.setDate(obsDate.getDate() - dateOffset);

      const obs = observationRepo.create({
        studentId: student.id,
        tenantId,
        teacherId: teacherUser.id,
        area: template.area,
        skill: template.skill,
        notes: template.notes,
        progress: template.progress,
        observedAt: obsDate.toISOString().split('T')[0],
      });
      observationsToSave.push(obs);
    }
  }
  await observationRepo.save(observationsToSave);
  console.log(`✅ Seeded ${observationsToSave.length} Montessori observations.`);

  // ==========================================
  // 8. ASSESSMENTS
  // ==========================================
  console.log('📊 Seeding Assessments across Montessori areas...');
  const assessmentRepo = dataSource.getRepository(Assessment);
  const areasList = [
    AssessmentArea.PRACTICAL_LIFE,
    AssessmentArea.SENSORIAL,
    AssessmentArea.LANGUAGE,
    AssessmentArea.MATHEMATICS,
    AssessmentArea.CULTURAL,
    AssessmentArea.ART,
    AssessmentArea.MUSIC,
    AssessmentArea.MOVEMENT,
    AssessmentArea.SOCIAL_EMOTIONAL,
  ];

  const assessmentsToSave: Assessment[] = [];
  for (let sIdx = 0; sIdx < students.length; sIdx++) {
    const student = students[sIdx];
    // 5-7 assessments across different areas for each student
    const numAssess = 5 + (sIdx % 4);
    for (let aIdx = 0; aIdx < numAssess; aIdx++) {
      const area = areasList[aIdx % areasList.length];
      const baseScore = 70 + ((sIdx * 7 + aIdx * 11) % 28); // Score between 70 and 97
      let level = AssessmentLevel.PROFICIENT;
      if (baseScore < 75) level = AssessmentLevel.DEVELOPING;
      else if (baseScore >= 90) level = AssessmentLevel.ADVANCED;

      const dateOffset = (sIdx * 3 + aIdx * 4) % 35;
      const aDate = new Date(now);
      aDate.setDate(aDate.getDate() - dateOffset);

      const assessment = assessmentRepo.create({
        studentId: student.id,
        tenantId,
        teacherId: teacherUser.id,
        area,
        skill: `${area.replace('_', ' ')} Core Competency Evaluation`,
        level,
        score: baseScore,
        comments: `Demonstrates ${level.toLowerCase()} understanding of foundational materials and consistent execution of presentations.`,
        assessedAt: aDate.toISOString().split('T')[0],
      });
      assessmentsToSave.push(assessment);
    }
  }
  await assessmentRepo.save(assessmentsToSave);
  console.log(`✅ Seeded ${assessmentsToSave.length} assessments.`);

  // ==========================================
  // 9. CURRICULUM CATALOG
  // ==========================================
  console.log('📚 Seeding Montessori Curriculum Catalog...');
  const curriculumRepo = dataSource.getRepository(CurriculumLesson);
  const curriculumLessons = [
    // Practical Life
    {
      area: MontessoriArea.PRACTICAL_LIFE,
      title: 'Dry Pouring with Grains',
      description: 'Development of wrist coordination, concentration, and independence through transferring pulses.',
      ageGroup: '18 months–3 years',
      sequence: 1,
      materialsNeeded: 'Two identical glass pouring jugs, green lentils, wooden tray',
    },
    {
      area: MontessoriArea.PRACTICAL_LIFE,
      title: 'Cloth Folding Along Creases',
      description: 'Hand-eye coordination and spatial awareness through folding square cloths along colored diagonals.',
      ageGroup: '3–6 years',
      sequence: 2,
      materialsNeeded: 'Set of four hemmed square napkins with stitched red guidelines',
    },
    {
      area: MontessoriArea.PRACTICAL_LIFE,
      title: 'Table Washing Exercise',
      description: 'Care of the classroom environment and multi-step sequence discipline.',
      ageGroup: '3–6 years',
      sequence: 3,
      materialsNeeded: 'Water basin, natural sea sponge, scrubbing brush, drying mitt, soap dish',
    },
    // Sensorial
    {
      area: MontessoriArea.SENSORIAL,
      title: 'Pink Tower (3D Volume Gradation)',
      description: 'Visual discrimination of three dimensions from 1 cubic cm to 1000 cubic cm.',
      ageGroup: '3–6 years',
      sequence: 1,
      materialsNeeded: 'Set of 10 solid pink wooden cubes',
    },
    {
      area: MontessoriArea.SENSORIAL,
      title: 'Broad Stair (Brown Stair)',
      description: 'Visual discrimination of thickness and preparation for mathematical concept of volume.',
      ageGroup: '3–6 years',
      sequence: 2,
      materialsNeeded: 'Set of 10 brown solid prisms 20cm in length',
    },
    {
      area: MontessoriArea.SENSORIAL,
      title: 'Cylinder Blocks (Set 1 to 4)',
      description: 'Visual discrimination of dimensions, diameter, and height with pincer grasp preparation.',
      ageGroup: '3–6 years',
      sequence: 3,
      materialsNeeded: 'Four solid beechwood blocks with 10 knobbed cylinders each',
    },
    {
      area: MontessoriArea.SENSORIAL,
      title: 'Geometric Cabinet & Insets',
      description: 'Sensorial recognition of geometric plane figures and tracing muscle memory.',
      ageGroup: '3–6 years',
      sequence: 4,
      materialsNeeded: 'Wooden cabinet with 6 drawers containing wooden insets and frames',
    },
    // Language
    {
      area: MontessoriArea.LANGUAGE,
      title: 'Sandpaper Letters Introduction',
      description: 'Tactile and phonetic association connecting sound symbol with muscular memory.',
      ageGroup: '3–6 years',
      sequence: 1,
      materialsNeeded: 'Wooden boards with sand-textured cursive letters (Pink consonants, Blue vowels)',
    },
    {
      area: MontessoriArea.LANGUAGE,
      title: 'Large Movable Alphabet (LMA)',
      description: 'Composition of phonetic words prior to pencil control.',
      ageGroup: '3–6 years',
      sequence: 2,
      materialsNeeded: 'Compartmentalized wooden box with cut-out wooden letters',
    },
    {
      area: MontessoriArea.LANGUAGE,
      title: 'Pink Reading Scheme - Three Letter Words',
      description: 'First decoding step for phonetic reading comprehension.',
      ageGroup: '3–6 years',
      sequence: 3,
      materialsNeeded: 'Pink word cards, phonetic picture cards, and miniature object box',
    },
    // Mathematics
    {
      area: MontessoriArea.MATHEMATICS,
      title: 'Number Rods (Quantities 1–10)',
      description: 'Concrete introduction to units of quantity from one to ten.',
      ageGroup: '3–6 years',
      sequence: 1,
      materialsNeeded: '10 wooden rods varying from 10cm to 100cm painted red and blue',
    },
    {
      area: MontessoriArea.MATHEMATICS,
      title: 'Spindle Boxes (Concept of Zero)',
      description: 'Understanding zero as an empty set and counting discrete loose quantities.',
      ageGroup: '3–6 years',
      sequence: 2,
      materialsNeeded: 'Two wooden boxes with compartments labeled 0 to 9, 45 wooden spindles',
    },
    {
      area: MontessoriArea.MATHEMATICS,
      title: 'Golden Beads - Introduction to the Decimal System',
      description: 'Concrete understanding of units, tens, hundreds, and thousands.',
      ageGroup: '3–6 years',
      sequence: 3,
      materialsNeeded: 'Single unit bead, ten-bar, hundred-square, thousand-cube',
    },
    {
      area: MontessoriArea.MATHEMATICS,
      title: 'Stamp Game (Addition & Subtraction)',
      description: 'Bridge from concrete golden beads to symbolic operational arithmetic.',
      ageGroup: '6–9 years',
      sequence: 4,
      materialsNeeded: 'Wooden tray with color-coded square stamps (1, 10, 100, 1000)',
    },
    // Cultural
    {
      area: MontessoriArea.CULTURAL,
      title: 'Sandpaper & Painted World Globes',
      description: 'Introduction to land and water distribution on Earth.',
      ageGroup: '3–6 years',
      sequence: 1,
      materialsNeeded: 'Sandpaper globe (Land/Water) and colored continent globe',
    },
    {
      area: MontessoriArea.CULTURAL,
      title: 'Puzzle Map of Pakistan & Asia',
      description: 'Political geography, provinces, and spatial location of neighboring countries.',
      ageGroup: '3–6 years',
      sequence: 2,
      materialsNeeded: 'Wooden puzzle maps with knobbed province/country pieces',
    },
    {
      area: MontessoriArea.CULTURAL,
      title: 'Botany Cabinet Leaf Shapes',
      description: 'Observation and nomenclature of natural botanical leaf margins and shapes.',
      ageGroup: '6–9 years',
      sequence: 3,
      materialsNeeded: 'Wooden cabinet with botanical leaf insets and 3-part nomenclature cards',
    },
    // Art, Music & Movement
    {
      area: MontessoriArea.ART,
      title: 'Clay Sculpting & Ceramic Pinch Pots',
      description: 'Development of fine hand muscle control and three-dimensional artistic expression.',
      ageGroup: '3–6 years',
      sequence: 1,
      materialsNeeded: 'Terracotta modeling clay, wooden sculpting tools, work board',
    },
    {
      area: MontessoriArea.MUSIC,
      title: 'Montessori Bells Pairing & Scale',
      description: 'Sensorial auditory discrimination of major musical scale notes.',
      ageGroup: '3–6 years',
      sequence: 1,
      materialsNeeded: 'Set of 13 pairs of Montessori bells, wooden mallet, damper',
    },
    {
      area: MontessoriArea.MOVEMENT,
      title: 'Walking on the Ellipse Line with Rhythm',
      description: 'Body equilibrium, controlled locomotion, and group cohesion.',
      ageGroup: '3–6 years',
      sequence: 1,
      materialsNeeded: 'Taped elliptical line on floor, rhythmic tambourine',
    },
  ];

  const savedLessons: CurriculumLesson[] = [];
  for (const l of curriculumLessons) {
    const lesson = curriculumRepo.create({
      ...l,
      tenantId,
      isActive: true,
    });
    const saved = await curriculumRepo.save(lesson);
    savedLessons.push(saved);
  }
  console.log(`✅ Seeded ${savedLessons.length} curriculum lessons.`);

  // ==========================================
  // 10. LESSON PLANS (30+ scheduled plans)
  // ==========================================
  console.log('🗓️ Seeding Scheduled Lesson Plans...');
  const lessonPlanRepo = dataSource.getRepository(LessonPlan);
  const planStatuses = [
    LessonPlanStatus.PLANNED,
    LessonPlanStatus.PRESENTED,
    LessonPlanStatus.PRACTICING,
    LessonPlanStatus.MASTERED,
    LessonPlanStatus.DEFERRED,
  ];

  const lessonPlansToSave: LessonPlan[] = [];
  for (let i = 0; i < 35; i++) {
    const student = students[i % students.length];
    const lesson = savedLessons[i % savedLessons.length];
    const status = planStatuses[i % planStatuses.length];
    
    // Scheduled between 15 days ago and 15 days in future
    const dayOffset = (i % 30) - 15;
    const planDate = new Date(now);
    planDate.setDate(planDate.getDate() + dayOffset);

    const plan = lessonPlanRepo.create({
      tenantId,
      lessonId: lesson.id,
      studentId: student.id,
      classroomId: student.classroomId,
      teacherId: teacherUser.id,
      scheduledDate: planDate,
      status,
      notes: `Target presentation focus: ${lesson.title} for ${student.firstName}.`,
    });
    lessonPlansToSave.push(plan);
  }
  await lessonPlanRepo.save(lessonPlansToSave);
  console.log(`✅ Seeded ${lessonPlansToSave.length} scheduled lesson plans.`);

  // ==========================================
  // 11. GAMIFICATION (Badges & Points Ledger)
  // ==========================================
  console.log('🏆 Seeding Gamification Badges and Points...');
  const badgeRepo = dataSource.getRepository(Badge);
  const studentBadgeRepo = dataSource.getRepository(StudentBadge);
  const pointsRepo = dataSource.getRepository(StudentPoints);

  const badgeDefinitions = [
    {
      name: 'Early Bird Explorer',
      description: 'Maintained 100% on-time attendance for the entire month.',
      icon: '⏰',
      category: BadgeCategory.ATTENDANCE,
    },
    {
      name: 'Master of Silence',
      description: 'Demonstrated complete concentration and reverence during silence exercises.',
      icon: '🕊️',
      category: BadgeCategory.BEHAVIOR,
    },
    {
      name: 'Math Whiz',
      description: 'Mastered the Golden Beads decimal system and four operations.',
      icon: '🔢',
      category: BadgeCategory.ACADEMIC,
    },
    {
      name: 'Language Maestro',
      description: 'Completed cursive sandpaper letters and built first phonetic story.',
      icon: '📖',
      category: BadgeCategory.ACADEMIC,
    },
    {
      name: 'Helping Hand',
      description: 'Assisted a younger peer with folding napkins and tidying classroom.',
      icon: '🤝',
      category: BadgeCategory.PARTICIPATION,
    },
    {
      name: 'Care of Environment',
      description: 'Tended to the classroom botanical plants and garden beds diligently.',
      icon: '🌱',
      category: BadgeCategory.SPECIAL,
    },
    {
      name: 'Pink Tower Virtuoso',
      description: 'Accurately paired Broad Stair and Pink Tower with blindfolded tactile test.',
      icon: '🏛️',
      category: BadgeCategory.ACADEMIC,
    },
    {
      name: 'Courteous Guide',
      description: 'Exemplified graceful greeting, conflict resolution, and empathy.',
      icon: '⭐',
      category: BadgeCategory.SPECIAL,
    },
  ];

  const savedBadges: Badge[] = [];
  for (const b of badgeDefinitions) {
    const badge = badgeRepo.create({
      ...b,
      tenantId,
      isActive: true,
    });
    const saved = await badgeRepo.save(badge);
    savedBadges.push(saved);
  }

  // Award badges and points to students
  const pointsToSave: StudentPoints[] = [];
  const badgesToSave: StudentBadge[] = [];

  const pointsReasons = [
    'Completed Pink Tower & Broad Stair harmonic building',
    'Perfect on-time attendance throughout the school week',
    'Demonstrated gracious conflict resolution with classmate',
    'Independently cleaned and put away table scrubbing basin',
    'Mastered three-digit static addition on the Stamp Game',
    'Helped a younger toddler student during lunch break',
    'Constructed 10 phonetic words on the Large Movable Alphabet',
    'Exceptional pitch discrimination on the Montessori Bells',
  ];

  for (let sIdx = 0; sIdx < students.length; sIdx++) {
    const student = students[sIdx];

    // Award 1 to 3 badges
    const numBadges = 1 + (sIdx % 3);
    for (let bIdx = 0; bIdx < numBadges; bIdx++) {
      const badge = savedBadges[(sIdx + bIdx) % savedBadges.length];
      const awardDate = new Date(now);
      awardDate.setDate(awardDate.getDate() - (sIdx * 3 + bIdx * 5));

      badgesToSave.push(
        studentBadgeRepo.create({
          tenantId,
          studentId: student.id,
          badgeId: badge.id,
          awardedById: teacherUser.id,
          notes: `Awarded for remarkable dedication in ${badge.name}`,
          awardedAt: awardDate,
        }),
      );
    }

    // Award 3 to 6 points transactions (creating healthy leaderboard diversity: 60 - 350 pts)
    const numPoints = 3 + (sIdx % 4);
    for (let pIdx = 0; pIdx < numPoints; pIdx++) {
      const pointsVal = 15 + ((sIdx * 5 + pIdx * 10) % 35); // 15 to 45 pts
      const reason = pointsReasons[(sIdx + pIdx) % pointsReasons.length];
      const pDate = new Date(now);
      pDate.setDate(pDate.getDate() - (sIdx * 2 + pIdx * 4));

      pointsToSave.push(
        pointsRepo.create({
          tenantId,
          studentId: student.id,
          points: pointsVal,
          reason,
          awardedById: teacherUser.id,
          awardedAt: pDate,
        }),
      );
    }
  }

  await studentBadgeRepo.save(badgesToSave);
  await pointsRepo.save(pointsToSave);
  console.log(`✅ Seeded ${savedBadges.length} Badges, ${badgesToSave.length} Student Badge awards, and ${pointsToSave.length} Points ledger entries.`);

  // ==========================================
  // 12. FINANCE & FEES (PKR Currency)
  // ==========================================
  console.log('💰 Seeding Fee Structures, Student Dues, and Payments in PKR...');
  const feeStructureRepo = dataSource.getRepository(FeeStructure);
  const studentFeeRepo = dataSource.getRepository(StudentFee);
  const paymentRepo = dataSource.getRepository(Payment);
  const accountantUser = userMap.get('rafay@accountant.com')!;

  const feeStructures = [
    {
      name: 'Monthly Montessori Tuition Fee',
      description: 'Comprehensive academic tuition covering all Montessori apparatus and guide instruction.',
      amount: 35000.0,
      frequency: FeeFrequency.MONTHLY,
    },
    {
      name: 'Annual Educational Resource & Lab Fee',
      description: 'Annual resource contribution for biological specimens, botany insets, and science materials.',
      amount: 25000.0,
      frequency: FeeFrequency.YEARLY,
    },
    {
      name: 'Montessori Material & Consumables Fee',
      description: 'Semester consumables charge for art paper, watercolor paints, polish, and organic gardening supplies.',
      amount: 15000.0,
      frequency: FeeFrequency.SEMESTER,
    },
    {
      name: 'Extracurricular Arts & Physical Rhythm Fee',
      description: 'Quarterly contribution for specialized gymnastics, rhythm percussion, and cultural guest workshops.',
      amount: 8000.0,
      frequency: FeeFrequency.QUARTERLY,
    },
  ];

  const savedFeeStructures: FeeStructure[] = [];
  for (const fs of feeStructures) {
    const structure = feeStructureRepo.create({
      ...fs,
      tenantId,
      isActive: true,
    });
    const saved = await feeStructureRepo.save(structure);
    savedFeeStructures.push(saved);
  }

  // Create student fee assignments and corresponding payment history
  for (let sIdx = 0; sIdx < students.length; sIdx++) {
    const student = students[sIdx];
    const structure = savedFeeStructures[sIdx % savedFeeStructures.length];

    // Determine realistic payment scenario
    let feeStatus = FeeStatus.PAID;
    if (sIdx % 4 === 1) feeStatus = FeeStatus.PARTIALLY_PAID;
    else if (sIdx % 4 === 2) feeStatus = FeeStatus.PENDING;
    else if (sIdx % 4 === 3) feeStatus = FeeStatus.OVERDUE;

    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + (feeStatus === FeeStatus.OVERDUE ? -15 : 15));

    const studentFee = studentFeeRepo.create({
      tenantId,
      studentId: student.id,
      feeStructureId: structure.id,
      amount: structure.amount,
      dueDate: dueDate.toISOString().split('T')[0],
      status: feeStatus,
    });
    const savedStudentFee = await studentFeeRepo.save(studentFee);

    // Record payments if PAID or PARTIALLY_PAID
    if (feeStatus === FeeStatus.PAID) {
      const payDate = new Date(now);
      payDate.setDate(payDate.getDate() - 8);
      
      const payment = paymentRepo.create({
        tenantId,
        studentId: student.id,
        studentFeeId: savedStudentFee.id,
        amount: structure.amount,
        paymentDate: payDate.toISOString().split('T')[0],
        paymentMethod: sIdx % 2 === 0 ? PaymentMethod.BANK_TRANSFER : PaymentMethod.ONLINE,
        reference: `MTR-PAY-${2026000 + sIdx}`,
        notes: `Full payment cleared via 1Link Online Transfer for ${structure.name}`,
        receivedById: accountantUser.id,
      });
      await paymentRepo.save(payment);
    } else if (feeStatus === FeeStatus.PARTIALLY_PAID) {
      const payDate = new Date(now);
      payDate.setDate(payDate.getDate() - 5);
      const partialAmount = Number((structure.amount / 2).toFixed(2));

      const payment = paymentRepo.create({
        tenantId,
        studentId: student.id,
        studentFeeId: savedStudentFee.id,
        amount: partialAmount,
        paymentDate: payDate.toISOString().split('T')[0],
        paymentMethod: PaymentMethod.CASH,
        reference: `MTR-CASH-${2026000 + sIdx}`,
        notes: `First installment of 50% paid in school finance office`,
        receivedById: accountantUser.id,
      });
      await paymentRepo.save(payment);
    }
  }
  console.log(`✅ Seeded ${savedFeeStructures.length} Fee Structures with assigned Student Fees and Payment ledgers.`);

  // ==========================================
  // 13. HR & EMPLOYEE MANAGEMENT
  // ==========================================
  console.log('👔 Seeding HR Employees and Leave Requests...');
  const employeeRepo = dataSource.getRepository(Employee);
  const leaveRepo = dataSource.getRepository(LeaveRequest);
  const hrManagerUser = userMap.get('sana@hr.com')!;

  const employeeData = [
    {
      userEmail: 'fatima@admin.com',
      employeeNumber: 'MTR-EMP-001',
      name: 'Fatima Noor',
      jobTitle: 'Head of School & Principal',
      department: 'Administration',
      employmentType: EmploymentType.FULL_TIME,
      salary: 220000.0,
      hireDate: new Date('2020-07-01'),
      status: EmployeeStatus.ACTIVE,
      phone: '+92 300 1234501',
      emergencyContact: 'Dr. Tariq Noor (Spouse) - +92 300 9876501',
    },
    {
      userEmail: 'hassan@teacher.com',
      employeeNumber: 'MTR-EMP-002',
      name: 'Hassan Ahmed',
      jobTitle: 'Senior Montessori Directress',
      department: 'Montessori Faculty',
      employmentType: EmploymentType.FULL_TIME,
      salary: 140000.0,
      hireDate: new Date('2021-08-15'),
      status: EmployeeStatus.ACTIVE,
      phone: '+92 321 4567802',
      emergencyContact: 'Zubair Ahmed (Brother) - +92 321 6543202',
    },
    {
      userEmail: 'ayesha@teacher.com',
      employeeNumber: 'MTR-EMP-003',
      name: 'Ayesha Malik',
      jobTitle: 'Primary Montessori Guide',
      department: 'Montessori Faculty',
      employmentType: EmploymentType.FULL_TIME,
      salary: 130000.0,
      hireDate: new Date('2022-01-10'),
      status: EmployeeStatus.ACTIVE,
      phone: '+92 333 7890103',
      emergencyContact: 'Farhan Malik (Spouse) - +92 333 1098703',
    },
    {
      userEmail: 'maham@teacher.com',
      employeeNumber: 'MTR-EMP-004',
      name: 'Maham Raza',
      jobTitle: 'Toddler Community Directress',
      department: 'Montessori Faculty',
      employmentType: EmploymentType.FULL_TIME,
      salary: 125000.0,
      hireDate: new Date('2022-08-01'),
      status: EmployeeStatus.ACTIVE,
      phone: '+92 345 2345604',
      emergencyContact: 'Rehan Raza (Father) - +92 345 6543204',
    },
    {
      userEmail: 'tariq@teacher.com',
      employeeNumber: 'MTR-EMP-005',
      name: 'Tariq Mehmood',
      jobTitle: 'Elementary Montessori Guide',
      department: 'Elementary Faculty',
      employmentType: EmploymentType.FULL_TIME,
      salary: 135000.0,
      hireDate: new Date('2021-03-01'),
      status: EmployeeStatus.ACTIVE,
      phone: '+92 301 3456705',
      emergencyContact: 'Saira Tariq (Spouse) - +92 301 7654305',
    },
    {
      userEmail: 'rafay@accountant.com',
      employeeNumber: 'MTR-EMP-006',
      name: 'Rafay Khan',
      jobTitle: 'Senior Finance Officer',
      department: 'Finance & Accounts',
      employmentType: EmploymentType.FULL_TIME,
      salary: 115000.0,
      hireDate: new Date('2023-01-15'),
      status: EmployeeStatus.ACTIVE,
      phone: '+92 312 9012306',
      emergencyContact: 'Kamran Khan (Father) - +92 312 3210906',
    },
    {
      userEmail: 'usman@inventory.com',
      employeeNumber: 'MTR-EMP-007',
      name: 'Usman Ali',
      jobTitle: 'Operations & Inventory Manager',
      department: 'Logistics & Inventory',
      employmentType: EmploymentType.FULL_TIME,
      salary: 95000.0,
      hireDate: new Date('2023-06-01'),
      status: EmployeeStatus.ACTIVE,
      phone: '+92 334 5678907',
      emergencyContact: 'Asad Ali (Brother) - +92 334 9876507',
    },
  ];

  const savedEmployees: Employee[] = [];
  for (const e of employeeData) {
    const user = userMap.get(e.userEmail);
    const emp = employeeRepo.create({
      tenantId,
      userId: user?.id,
      employeeNumber: e.employeeNumber,
      name: e.name,
      jobTitle: e.jobTitle,
      department: e.department,
      employmentType: e.employmentType,
      salary: e.salary,
      hireDate: e.hireDate,
      status: e.status,
      phone: e.phone,
      emergencyContact: e.emergencyContact,
    });
    const saved = await employeeRepo.save(emp);
    savedEmployees.push(saved);
  }

  // Seed Leave Requests
  const leaveData = [
    {
      empIdx: 1, // Hassan Ahmed
      leaveType: LeaveType.CASUAL,
      startDate: new Date('2026-08-10'),
      endDate: new Date('2026-08-11'),
      status: LeaveStatus.APPROVED,
      reason: 'Attending sibling wedding ceremony in Lahore.',
    },
    {
      empIdx: 2, // Ayesha Malik
      leaveType: LeaveType.SICK,
      startDate: new Date('2026-08-20'),
      endDate: new Date('2026-08-21'),
      status: LeaveStatus.APPROVED,
      reason: 'Severe seasonal viral flu and medical rest.',
    },
    {
      empIdx: 3, // Maham Raza
      leaveType: LeaveType.ANNUAL,
      startDate: new Date('2026-09-15'),
      endDate: new Date('2026-09-18'),
      status: LeaveStatus.PENDING,
      reason: 'Scheduled family vacation to northern areas.',
    },
    {
      empIdx: 4, // Tariq Mehmood
      leaveType: LeaveType.CASUAL,
      startDate: new Date('2026-08-25'),
      endDate: new Date('2026-08-25'),
      status: LeaveStatus.REJECTED,
      reason: 'Personal urgent bank errand (insufficient notice during assessment week).',
    },
  ];

  for (const l of leaveData) {
    const emp = savedEmployees[l.empIdx];
    const leave = leaveRepo.create({
      tenantId,
      employeeId: emp.id,
      leaveType: l.leaveType,
      startDate: l.startDate,
      endDate: l.endDate,
      status: l.status,
      approverId: hrManagerUser.id,
      reason: l.reason,
    });
    await leaveRepo.save(leave);
  }
  console.log(`✅ Seeded ${savedEmployees.length} Employee profiles and ${leaveData.length} Leave requests.`);

  // ==========================================
  // 14. INVENTORY & TRANSACTIONS
  // ==========================================
  console.log('📦 Seeding Inventory Items and Stock Transactions...');
  const inventoryRepo = dataSource.getRepository(InventoryItem);
  const transactionRepo = dataSource.getRepository(InventoryTransaction);
  const inventoryUser = userMap.get('usman@inventory.com')!;

  const inventoryItemsData = [
    {
      name: 'Pink Tower Apparatus (Solid Beechwood)',
      category: 'Sensorial Materials',
      description: '10 solid beechwood pink wooden cubes from 1cm to 10cm.',
      quantity: 5,
      minimumStock: 2,
      unit: 'sets',
      location: 'Cabinet S-1',
    },
    {
      name: 'Brown Stair (Broad Stair) Prisms',
      category: 'Sensorial Materials',
      description: '10 brown wooden prisms 20cm long with varying cross-sections.',
      quantity: 4,
      minimumStock: 2,
      unit: 'sets',
      location: 'Cabinet S-2',
    },
    {
      name: 'Sandpaper Letters (Urdu & English)',
      category: 'Language Materials',
      description: 'Tactile sandpaper letters mounted on sturdy wooden boards.',
      quantity: 6,
      minimumStock: 3,
      unit: 'boxes',
      location: 'Cabinet L-1',
    },
    {
      name: 'Large Movable Alphabet (LMA)',
      category: 'Language Materials',
      description: 'Wooden letters in partitioned trays for phonics and word construction.',
      quantity: 6,
      minimumStock: 3,
      unit: 'sets',
      location: 'Cabinet L-2',
    },
    {
      name: 'Golden Bead Material (Complete Set)',
      category: 'Mathematics Materials',
      description: 'Beads representing units, ten-bars, hundred-squares, and thousand-cubes.',
      quantity: 3,
      minimumStock: 2,
      unit: 'sets',
      location: 'Cabinet M-1',
    },
    {
      name: 'Number Rods (Red & Blue)',
      category: 'Mathematics Materials',
      description: '10 wooden rods partitioned into red and blue sections.',
      quantity: 5,
      minimumStock: 2,
      unit: 'sets',
      location: 'Cabinet M-2',
    },
    {
      name: 'Spindle Boxes (Set of 2 with 45 Spindles)',
      category: 'Mathematics Materials',
      description: 'Solid wooden spindle compartments with polished wooden counting spindles.',
      quantity: 4,
      minimumStock: 2,
      unit: 'sets',
      location: 'Cabinet M-3',
    },
    {
      name: 'Art Paper Heavyweight A4 (250 Sheets)',
      category: 'Art & Consumables',
      description: '200 GSM drawing paper suitable for painting and chalk pastels.',
      quantity: 2, // Low stock on purpose
      minimumStock: 10,
      unit: 'packs',
      location: 'Art Storage Shelf A',
    },
    {
      name: 'Non-Toxic Watercolor Paint Sets (12 Colors)',
      category: 'Art & Consumables',
      description: 'Child-safe watercolor pans with camel hair brushes.',
      quantity: 3, // Low stock on purpose
      minimumStock: 12,
      unit: 'sets',
      location: 'Art Storage Shelf B',
    },
    {
      name: 'Child-Safe Stainless Steel Scissors',
      category: 'Practical Life & Art',
      description: 'Blunt-tip ergonomic spring-assisted cutting scissors.',
      quantity: 24,
      minimumStock: 10,
      unit: 'units',
      location: 'Tool Box PL-1',
    },
    {
      name: 'Organic Liquid Handwash Refill (5 Liters)',
      category: 'Hygiene & Cleaning',
      description: 'Gentle, hypoallergenic hand soap for classroom washing basins.',
      quantity: 1, // Low stock on purpose
      minimumStock: 4,
      unit: 'bottles',
      location: 'Janitorial Room J-1',
    },
    {
      name: 'Microfiber Cleaning & Polishing Cloths',
      category: 'Care of Environment',
      description: 'Washable absorbent cloths for table scrubbing and mirror polishing.',
      quantity: 30,
      minimumStock: 15,
      unit: 'cloths',
      location: 'Janitorial Room J-2',
    },
    {
      name: 'Wooden Dressing Frames (Set of 6)',
      category: 'Practical Life',
      description: 'Buttons, zippers, snaps, buckles, bows, and lacing frames.',
      quantity: 8,
      minimumStock: 4,
      unit: 'sets',
      location: 'Cabinet PL-3',
    },
    {
      name: 'Botany Cabinet & Leaf Insets',
      category: 'Cultural Materials',
      description: 'Wooden cabinet with 3 drawers and 14 leaf shape control charts.',
      quantity: 2,
      minimumStock: 1,
      unit: 'cabinets',
      location: 'Science Corner C-1',
    },
    {
      name: 'World Puzzle Maps (Continents & Pakistan)',
      category: 'Cultural Materials',
      description: 'Laser-cut wooden geographic jigsaw puzzle maps with plastic knobs.',
      quantity: 5,
      minimumStock: 2,
      unit: 'maps',
      location: 'Science Corner C-2',
    },
    {
      name: 'Montessori Musical Bells (13 Pairs)',
      category: 'Sensorial & Music',
      description: 'Pitched bells with wooden mallets and felt dampers on beechwood bases.',
      quantity: 2,
      minimumStock: 1,
      unit: 'sets',
      location: 'Music Studio M-1',
    },
    {
      name: 'Student Handwriting Ruled Notebooks',
      category: 'Stationery',
      description: 'Four-line cursive writing notebooks for primary classes.',
      quantity: 85,
      minimumStock: 30,
      unit: 'notebooks',
      location: 'Stationery Depot D-1',
    },
    {
      name: 'Dry Erase Whiteboard Marker Packs',
      category: 'Stationery',
      description: 'Low-odor bullet-tip markers in assorted 4 colors (Black, Blue, Red, Green).',
      quantity: 3, // Low stock on purpose
      minimumStock: 10,
      unit: 'packs',
      location: 'Stationery Depot D-2',
    },
  ];

  const savedInventory: InventoryItem[] = [];
  for (const item of inventoryItemsData) {
    const inv = inventoryRepo.create({
      ...item,
      tenantId,
      status: InventoryItemStatus.ACTIVE,
    });
    const saved = await inventoryRepo.save(inv);
    savedInventory.push(saved);
  }

  // Seed inventory transactions
  const transactionsData = [
    {
      itemIdx: 0, // Pink Tower
      type: InventoryTransactionType.STOCK_IN,
      qty: 5,
      reason: 'Procured new authentic Nienhuis beechwood apparatus batch from authorized supplier.',
    },
    {
      itemIdx: 7, // Art Paper
      type: InventoryTransactionType.STOCK_IN,
      qty: 20,
      reason: 'Initial term bulk supply delivery from paper mill.',
    },
    {
      itemIdx: 7, // Art Paper
      type: InventoryTransactionType.STOCK_OUT,
      qty: 18,
      reason: 'Dispatched 18 packs across Casa 1, Casa 2, and Elementary art studios.',
    },
    {
      itemIdx: 8, // Watercolor
      type: InventoryTransactionType.STOCK_OUT,
      qty: 9,
      reason: 'Issued 9 paint sets to toddler and primary art guides.',
    },
    {
      itemIdx: 10, // Handwash Refill
      type: InventoryTransactionType.STOCK_OUT,
      qty: 3,
      reason: 'Refilled classroom dispensing stations in all 5 wings.',
    },
    {
      itemIdx: 16, // Notebooks
      type: InventoryTransactionType.STOCK_IN,
      qty: 100,
      reason: 'Annual textbook and notebook shipment received.',
    },
    {
      itemIdx: 16, // Notebooks
      type: InventoryTransactionType.STOCK_OUT,
      qty: 15,
      reason: 'Distributed to incoming Lower Elementary students.',
    },
  ];

  for (const t of transactionsData) {
    const item = savedInventory[t.itemIdx];
    const trans = transactionRepo.create({
      tenantId,
      itemId: item.id,
      type: t.type,
      quantity: t.qty,
      reason: t.reason,
      createdBy: inventoryUser.id,
    });
    await transactionRepo.save(trans);
  }
  console.log(`✅ Seeded ${savedInventory.length} Inventory items and ${transactionsData.length} stock transactions.`);

  // ==========================================
  // 15. COMMUNICATION & ANNOUNCEMENTS
  // ==========================================
  console.log('📢 Seeding Announcements & Bulletins...');
  const announcementRepo = dataSource.getRepository(Announcement);
  const adminUser = userMap.get('fatima@admin.com')!;

  const announcementsData = [
    {
      title: 'Term 1 Parent-Teacher Conferences & Portfolio Review',
      content: 'Dear Parents, Our individual Term 1 Montessori developmental review meetings are scheduled for next Friday, September 12th. Guides will share direct observation insights and work samples. Please book your 20-minute slot via the school portal.',
      audience: AnnouncementAudience.PARENTS,
      priority: AnnouncementPriority.IMPORTANT,
      isPublished: true,
      publishedAt: new Date('2026-08-28T09:00:00Z'),
    },
    {
      title: 'Montessori Parent Workshop: "Freedom Within Limits"',
      content: 'Join our Principal and Senior Directress for an interactive evening workshop exploring how the Montessori principles of order, movement, and autonomy can be reinforced seamlessly in home environments.',
      audience: AnnouncementAudience.ALL,
      priority: AnnouncementPriority.NORMAL,
      isPublished: true,
      publishedAt: new Date('2026-08-25T14:30:00Z'),
    },
    {
      title: 'Annual Sports & Rhythm Gala 2026 Date Announcement',
      content: 'We are thrilled to announce our Annual Sports & Physical Rhythm Gala will take place at the DHA Sports Complex on October 24th, 2026. Students are currently practicing walking the ellipse and balance relays.',
      audience: AnnouncementAudience.ALL,
      priority: AnnouncementPriority.NORMAL,
      isPublished: true,
      publishedAt: new Date('2026-08-20T11:00:00Z'),
    },
    {
      title: 'URGENT: Seasonal Monsoon Weather Advisory & School Timings',
      content: 'In light of the heavy rainfall forecasts across Karachi, the school administration has coordinated safe bus transit and adjusted dispersal timings. Please check emergency contact numbers.',
      audience: AnnouncementAudience.ALL,
      priority: AnnouncementPriority.URGENT,
      isPublished: true,
      publishedAt: new Date('2026-08-15T07:15:00Z'),
    },
    {
      title: 'Montessori Curriculum Material Audit & Refurbishment Notice',
      content: 'Guides are requested to submit apparatus maintenance logs and consumable requisition lists by end of week for restocking ahead of Term 2.',
      audience: AnnouncementAudience.TEACHERS,
      priority: AnnouncementPriority.NORMAL,
      isPublished: true,
      publishedAt: new Date('2026-08-29T16:00:00Z'),
    },
    {
      title: 'Quarterly Financial & Audit Governance Review Meeting',
      content: 'Internal school board audit and accounts reconciliations for Q1 2026 will be reviewed on Monday at 3:00 PM in the Conference Room.',
      audience: AnnouncementAudience.ADMINS,
      priority: AnnouncementPriority.IMPORTANT,
      isPublished: true,
      publishedAt: new Date('2026-08-30T10:00:00Z'),
    },
  ];

  for (const a of announcementsData) {
    const ann = announcementRepo.create({
      ...a,
      tenantId,
      createdBy: adminUser.id,
    });
    await announcementRepo.save(ann);
  }
  console.log(`✅ Seeded ${announcementsData.length} published announcements.`);

  console.log('🎉 ==============================================');
  console.log('🎉 MONTARA DATABASE SEEDING COMPLETED WITH SUCCESS!');
  console.log('🎉 ==============================================');
}

// Auto-run if executed directly via CLI
if (require.main === module) {
  runSeed()
    .then(() => {
      console.log('Seeding process finished.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Error during seeding:', err);
      process.exit(1);
    });
}
