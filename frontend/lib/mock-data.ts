import { Assessment, MontessoriArea, Observation, Payment, Student, Classroom, AttendanceRecord, FeeStructure, StudentFee, FinanceSummary, User, ChildSummary, LearningProgress, AreaProgress } from '@/types';

export const montessoriAreas: MontessoriArea[] = [
  'Practical Life', 'Sensorial', 'Language', 'Mathematics', 'Cultural', 'Art', 'Music', 'Movement', 'Social Emotional',
];

export const users: User[] = [
  { id: 'u1', name: 'Amina Mensah', email: 'amina@montara.school', role: 'SCHOOL_ADMIN', initials: 'AM', avatarColor: 'bg-primary/15 text-primary', schoolName: 'Montara Academy' },
  { id: 'u2', name: 'Sofia Adeyemi', email: 'sofia@montara.school', role: 'TEACHER', initials: 'SA', avatarColor: 'bg-sky-400/15 text-sky-300', schoolName: 'Montara Academy' },
  { id: 'u3', name: 'Nneka Okafor', email: 'nneka@email.com', role: 'PARENT', initials: 'NO', avatarColor: 'bg-rose-400/15 text-rose-300', schoolName: 'Montara Academy' },
  { id: 'u4', name: 'Daniel Ortega', email: 'daniel@montara.school', role: 'SUPER_ADMIN', initials: 'DO', avatarColor: 'bg-amber-400/15 text-amber-300', schoolName: 'Montara Academy' },
];

export const currentUser: User = users[0];

export const students: Student[] = [
  { id: 's1', name: 'Amara Okafor', initials: 'AO', classroomId: 'c1', classroom: 'Cedar House', age: '4 yrs', dateOfBirth: '2020-03-15', status: 'Active', guardian: 'Nneka Okafor', guardianEmail: 'nneka@email.com', guardianPhone: '(555) 123-4567', joined: 'Sep 2023', color: 'bg-rose-400/20 text-rose-200', address: '12 Birch Lane, Springfield' },
  { id: 's2', name: 'Theo Bennett', initials: 'TB', classroomId: 'c2', classroom: 'Willow Room', age: '5 yrs', dateOfBirth: '2019-07-22', status: 'Active', guardian: 'James Bennett', guardianEmail: 'james@email.com', guardianPhone: '(555) 234-5678', joined: 'Aug 2023', color: 'bg-sky-400/20 text-sky-200', address: '45 Maple Ave, Riverside' },
  { id: 's3', name: 'Maya Chen', initials: 'MC', classroomId: 'c1', classroom: 'Cedar House', age: '3 yrs', dateOfBirth: '2021-01-10', status: 'Active', guardian: 'Lina Chen', guardianEmail: 'lina@email.com', guardianPhone: '(555) 345-6789', joined: 'Jan 2024', color: 'bg-amber-400/20 text-amber-200', address: '78 Oak St, Springfield' },
  { id: 's4', name: 'Noah Williams', initials: 'NW', classroomId: 'c3', classroom: 'Oak Studio', age: '5 yrs', dateOfBirth: '2019-11-05', status: 'Pending', guardian: 'Sarah Williams', guardianEmail: 'sarah@email.com', guardianPhone: '(555) 456-7890', joined: 'Feb 2024', color: 'bg-emerald-400/20 text-emerald-200', address: '90 Pine Rd, Greenville' },
  { id: 's5', name: 'Zara Patel', initials: 'ZP', classroomId: 'c2', classroom: 'Willow Room', age: '4 yrs', dateOfBirth: '2020-05-18', status: 'Active', guardian: 'Ravi Patel', guardianEmail: 'ravi@email.com', guardianPhone: '(555) 567-8901', joined: 'Sep 2023', color: 'bg-cyan-400/20 text-cyan-200', address: '33 Cedar Ct, Riverside' },
  { id: 's6', name: 'Elias Morgan', initials: 'EM', classroomId: 'c3', classroom: 'Oak Studio', age: '6 yrs', dateOfBirth: '2018-09-30', status: 'Active', guardian: 'Evelyn Morgan', guardianEmail: 'evelyn@email.com', guardianPhone: '(555) 678-9012', joined: 'Aug 2022', color: 'bg-orange-400/20 text-orange-200', address: '56 Willow Way, Greenville' },
];

export const classrooms: Classroom[] = [
  { id: 'c1', name: 'Cedar House', ageRange: '3–6 years', leadTeacher: 'Sofia Adeyemi', studentCount: 24, capacity: 28, status: 'Active', tone: 'bg-emerald-400/10 text-emerald-300', description: 'A calm, child-led environment for the primary years.' },
  { id: 'c2', name: 'Willow Room', ageRange: '3–6 years', leadTeacher: 'Daniel Brooks', studentCount: 22, capacity: 24, status: 'Active', tone: 'bg-sky-400/10 text-sky-300', description: 'A nurturing space focused on grace and courtesy.' },
  { id: 'c3', name: 'Oak Studio', ageRange: '6–9 years', leadTeacher: 'Nadia Ibrahim', studentCount: 26, capacity: 30, status: 'Active', tone: 'bg-amber-400/10 text-amber-300', description: 'An elementary studio for deep, interdisciplinary work.' },
  { id: 'c4', name: 'Maple Nido', ageRange: '18 months–3 years', leadTeacher: 'Grace Kim', studentCount: 14, capacity: 16, status: 'Active', tone: 'bg-rose-400/10 text-rose-300', description: 'A gentle first community for our youngest children.' },
];

export const attendanceRecords: AttendanceRecord[] = students.map((student, index) => ({
  id: `att-${index + 1}`,
  studentId: student.id,
  studentName: student.name,
  initials: student.initials,
  color: student.color,
  classroom: student.classroom,
  date: 'Jun 17, 2024',
  status: (index === 2 ? 'Late' : index === 4 ? 'Absent' : index === 5 ? 'Excused' : 'Present') as AttendanceRecord['status'],
  arrivalTime: index === 2 ? '8:47 AM' : index === 4 ? null : index === 5 ? null : '8:12 AM',
  notes: index === 4 ? 'Family notified of absence' : index === 5 ? 'Doctor appointment' : '',
}));

export const attendanceSummary = {
  total: students.length,
  present: 3,
  absent: 1,
  late: 1,
  excused: 1,
  rate: 83,
};

export const observations: Observation[] = [
  { id: 'o1', studentId: 's1', studentName: 'Amara Okafor', initials: 'AO', color: 'bg-rose-400/20 text-rose-200', area: 'Practical Life', skill: 'Food preparation', progress: 'Mastered', note: 'Independently prepared a snack and restored the work area.', teacher: 'Sofia Adeyemi', date: 'Today, 10:42 AM' },
  { id: 'o2', studentId: 's2', studentName: 'Theo Bennett', initials: 'TB', color: 'bg-sky-400/20 text-sky-200', area: 'Mathematics', skill: 'Decimal system', progress: 'Developing', note: 'Explored the decimal system with golden bead material.', teacher: 'Daniel Brooks', date: 'Today, 9:18 AM' },
  { id: 'o3', studentId: 's3', studentName: 'Maya Chen', initials: 'MC', color: 'bg-amber-400/20 text-amber-200', area: 'Language', skill: 'Phonetic matching', progress: 'Practicing', note: 'Matched phonetic objects and recorded three new words.', teacher: 'Sofia Adeyemi', date: 'Yesterday' },
  { id: 'o4', studentId: 's5', studentName: 'Zara Patel', initials: 'ZP', color: 'bg-cyan-400/20 text-cyan-200', area: 'Sensorial', skill: 'Pink tower', progress: 'Developing', note: 'Completed the pink tower sequence with focus.', teacher: 'Daniel Brooks', date: 'Yesterday' },
  { id: 'o5', studentId: 's6', studentName: 'Elias Morgan', initials: 'EM', color: 'bg-orange-400/20 text-orange-200', area: 'Cultural', skill: 'Continents puzzle map', progress: 'Introduced', note: 'Began exploring the continents puzzle map with guidance.', teacher: 'Nadia Ibrahim', date: 'Jun 14, 2024' },
];

export const assessments: Assessment[] = [
  { id: 'a1', studentId: 's1', studentName: 'Amara Okafor', initials: 'AO', color: 'bg-rose-400/20 text-rose-200', area: 'Language', skill: 'Sound games', title: 'Sound Games', score: 92, level: 'Advanced', comments: 'Confidently identifies beginning, middle, and ending sounds.', teacher: 'Sofia Adeyemi', date: 'Jun 12, 2024' },
  { id: 'a2', studentId: 's2', studentName: 'Theo Bennett', initials: 'TB', color: 'bg-sky-400/20 text-sky-200', area: 'Mathematics', skill: 'Teen board', title: 'Teen Board', score: 84, level: 'Proficient', comments: 'Strong understanding of teen quantities and symbols.', teacher: 'Daniel Brooks', date: 'Jun 11, 2024' },
  { id: 'a3', studentId: 's3', studentName: 'Maya Chen', initials: 'MC', color: 'bg-amber-400/20 text-amber-200', area: 'Practical Life', skill: 'Pouring & transferring', title: 'Pouring & Transferring', score: 76, level: 'Developing', comments: 'Improving control with dry pouring; wet pouring needs more practice.', teacher: 'Sofia Adeyemi', date: 'Jun 10, 2024' },
  { id: 'a4', studentId: 's6', studentName: 'Elias Morgan', initials: 'EM', color: 'bg-orange-400/20 text-orange-200', area: 'Cultural', skill: 'Parts of a leaf', title: 'Parts of a Leaf', score: 88, level: 'Proficient', comments: 'Labels all parts correctly and can describe their function.', teacher: 'Nadia Ibrahim', date: 'Jun 08, 2024' },
  { id: 'a5', studentId: 's5', studentName: 'Zara Patel', initials: 'ZP', color: 'bg-cyan-400/20 text-cyan-200', area: 'Sensorial', skill: 'Color grading', title: 'Color Box III', score: 71, level: 'Developing', comments: 'Beginning to grade shades from dark to light independently.', teacher: 'Daniel Brooks', date: 'Jun 07, 2024' },
];

export const feeStructures: FeeStructure[] = [
  { id: 'fs1', name: 'Term 3 Tuition', amount: 1250, frequency: 'Per term', scope: 'All primary programs', status: 'Active' },
  { id: 'fs2', name: 'Materials & supplies', amount: 180, frequency: 'Annual', scope: 'All programs', status: 'Active' },
  { id: 'fs3', name: 'After-school care', amount: 240, frequency: 'Monthly', scope: 'Optional add-on', status: 'Active' },
  { id: 'fs4', name: 'Spring excursion', amount: 85, frequency: 'One-time', scope: 'Elementary only', status: 'Inactive' },
];

export const studentFees: StudentFee[] = [
  { id: 'sf1', studentId: 's1', studentName: 'Amara Okafor', initials: 'AO', color: 'bg-rose-400/20 text-rose-200', feeStructure: 'Term 3 Tuition', amount: 1250, paidAmount: 1250, balance: 0, status: 'Paid', dueDate: 'Jun 01, 2024' },
  { id: 'sf2', studentId: 's2', studentName: 'Theo Bennett', initials: 'TB', color: 'bg-sky-400/20 text-sky-200', feeStructure: 'Term 3 Tuition', amount: 1250, paidAmount: 625, balance: 625, status: 'Partially Paid', dueDate: 'Jun 01, 2024' },
  { id: 'sf3', studentId: 's3', studentName: 'Maya Chen', initials: 'MC', color: 'bg-amber-400/20 text-amber-200', feeStructure: 'Term 3 Tuition', amount: 1250, paidAmount: 1250, balance: 0, status: 'Paid', dueDate: 'Jun 01, 2024' },
  { id: 'sf4', studentId: 's4', studentName: 'Noah Williams', initials: 'NW', color: 'bg-emerald-400/20 text-emerald-200', feeStructure: 'Materials & supplies', amount: 180, paidAmount: 0, balance: 180, status: 'Overdue', dueDate: 'May 01, 2024' },
  { id: 'sf5', studentId: 's5', studentName: 'Zara Patel', initials: 'ZP', color: 'bg-cyan-400/20 text-cyan-200', feeStructure: 'Term 3 Tuition', amount: 1250, paidAmount: 0, balance: 1250, status: 'Pending', dueDate: 'Jul 01, 2024' },
  { id: 'sf6', studentId: 's6', studentName: 'Elias Morgan', initials: 'EM', color: 'bg-orange-400/20 text-orange-200', feeStructure: 'After-school care', amount: 240, paidAmount: 120, balance: 120, status: 'Partially Paid', dueDate: 'Jun 15, 2024' },
];

export const payments: Payment[] = [
  { id: 'p1', studentId: 's1', studentName: 'Amara Okafor', initials: 'AO', color: 'bg-rose-400/20 text-rose-200', amount: 1250, formattedAmount: '$1,250.00', type: 'Term 3 tuition', status: 'Paid', method: 'Bank Transfer', date: 'Jun 14, 2024' },
  { id: 'p2', studentId: 's2', studentName: 'Theo Bennett', initials: 'TB', color: 'bg-sky-400/20 text-sky-200', amount: 625, formattedAmount: '$625.00', type: 'Term 3 tuition (partial)', status: 'Partially Paid', method: 'Online', date: 'Jun 12, 2024' },
  { id: 'p3', studentId: 's3', studentName: 'Maya Chen', initials: 'MC', color: 'bg-amber-400/20 text-amber-200', amount: 1250, formattedAmount: '$1,250.00', type: 'Term 3 tuition', status: 'Paid', method: 'Card', date: 'Jun 10, 2024' },
  { id: 'p4', studentId: 's4', studentName: 'Noah Williams', initials: 'NW', color: 'bg-emerald-400/20 text-emerald-200', amount: 180, formattedAmount: '$180.00', type: 'Materials fee', status: 'Overdue', method: 'Cash', date: 'Jun 05, 2024' },
  { id: 'p5', studentId: 's6', studentName: 'Elias Morgan', initials: 'EM', color: 'bg-orange-400/20 text-orange-200', amount: 120, formattedAmount: '$120.00', type: 'After-school care (partial)', status: 'Partially Paid', method: 'Online', date: 'Jun 03, 2024' },
];

export const financeSummary: FinanceSummary = {
  totalAssigned: 204660,
  totalCollected: 186240,
  totalOutstanding: 18420,
  totalOverdue: 180,
  collectionRate: 91.2,
};

export const children: ChildSummary[] = [
  { id: 's1', name: 'Amara Okafor', initials: 'AO', color: 'bg-rose-400/20 text-rose-200', classroom: 'Cedar House', age: '4 years', attendanceRate: 96, learningProgress: 82 },
  { id: 's7', name: 'Kofi Okafor', initials: 'KO', color: 'bg-emerald-400/20 text-emerald-200', classroom: 'Maple Nido', age: '2 years', attendanceRate: 98, learningProgress: 68 },
];

export const learningProgressData: LearningProgress[] = students.map((student, index) => {
  const areas: AreaProgress[] = [
    { area: 'Practical Life', score: [92, 78, 84, 70, 88, 76][index] ?? 80, level: 'Advanced', assessmentCount: [4, 3, 3, 2, 3, 4][index] ?? 3, note: 'Strong independence and care of environment.' },
    { area: 'Sensorial', score: [85, 72, 68, 60, 75, 80][index] ?? 72, level: 'Proficient', assessmentCount: [3, 2, 2, 1, 3, 3][index] ?? 2, note: 'Material exploration is deepening.' },
    { area: 'Language', score: [90, 80, 72, 65, 78, 82][index] ?? 78, level: 'Advanced', assessmentCount: [5, 3, 2, 2, 3, 4][index] ?? 3, note: 'Vocabulary and expression are growing.' },
    { area: 'Mathematics', score: [78, 84, 66, 58, 70, 74][index] ?? 72, level: 'Proficient', assessmentCount: [3, 4, 2, 1, 2, 3][index] ?? 2, note: 'More repetition will support fluency.' },
    { area: 'Cultural', score: [70, 75, 60, 50, 65, 78][index] ?? 66, level: 'Developing', assessmentCount: [2, 2, 1, 1, 2, 3][index] ?? 2, note: 'New invitations prepared this week.' },
    { area: 'Social Emotional', score: [88, 82, 80, 72, 85, 86][index] ?? 82, level: 'Advanced', assessmentCount: [3, 2, 2, 1, 3, 3][index] ?? 2, note: 'Strong peer collaboration.' },
  ];
  const overall = Math.round(areas.reduce((sum, a) => sum + a.score, 0) / areas.length);
  const sorted = [...areas].sort((a, b) => b.score - a.score);
  return {
    studentId: student.id,
    studentName: student.name,
    overallScore: overall,
    strongestArea: sorted[0].area,
    areas,
    areasNeedingAttention: areas.filter((a) => a.score < 70),
    totalAssessments: areas.reduce((sum, a) => sum + a.assessmentCount, 0),
  };
});

export const schoolProgress = [
  { area: 'Practical Life', score: 84, level: 'Advanced', assessmentCount: 19, note: 'Strong independence and care of environment.' },
  { area: 'Sensorial', score: 72, level: 'Proficient', assessmentCount: 14, note: 'Material exploration is deepening.' },
  { area: 'Language', score: 78, level: 'Proficient', assessmentCount: 19, note: 'Vocabulary and expression are growing.' },
  { area: 'Mathematics', score: 66, level: 'Developing', assessmentCount: 15, note: 'More repetition will support fluency.' },
  { area: 'Cultural', score: 58, level: 'Developing', assessmentCount: 11, note: 'New invitations prepared this week.' },
  { area: 'Social Emotional', score: 81, level: 'Advanced', assessmentCount: 14, note: 'Strong peer collaboration.' },
] as AreaProgress[];

export const schoolProgressSummary = {
  overallScore: 73,
  strongestArea: 'Practical Life' as MontessoriArea,
  totalAssessments: 92,
  areasNeedingAttention: ['Mathematics', 'Cultural'] as MontessoriArea[],
};
