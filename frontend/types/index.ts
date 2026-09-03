// ── Auth & Users ──────────────────────────────────────────
export type Role = 'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'TEACHER' | 'PARENT' | 'ACCOUNTANT' | 'HR_MANAGER' | 'INVENTORY_MANAGER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  initials: string;
  avatarColor: string;
  schoolName?: string;
}

// ── Students ──────────────────────────────────────────────
export type StudentStatus = 'Active' | 'Pending' | 'Inactive';

export interface Student {
  id: string;
  name: string;
  initials: string;
  classroomId: string;
  classroom: string;
  age: string;
  dateOfBirth: string;
  status: StudentStatus;
  guardian: string;
  guardianEmail: string;
  guardianPhone: string;
  joined: string;
  color: string;
  address: string;
}

export interface ApiStudent {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  admissionNumber: string;
  enrollmentDate: string;
  isActive: boolean;
  tenantId: string;
  parentId?: string | null;
  classroomId?: string | null;
  parent?: { id: string; name: string; email: string } | null;
  classroom?: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

// ── Classrooms ────────────────────────────────────────────
export interface Classroom {
  id: string;
  name: string;
  ageRange: string;
  leadTeacher: string;
  studentCount: number;
  capacity: number;
  status: 'Active' | 'Inactive';
  tone: string;
  description: string;
}

export interface ApiClassroom {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  tenantId: string;
  teacherId: string | null;
  teacher?: { id: string; name: string } | null;
  students?: ApiStudent[];
  createdAt: string;
  updatedAt: string;
}

// ── Attendance ────────────────────────────────────────────
export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Excused';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  initials: string;
  color: string;
  classroom: string;
  date: string;
  status: AttendanceStatus;
  arrivalTime: string | null;
  notes: string;
}

export interface AttendanceSummary {
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  rate: number;
}

export interface ApiAttendanceRecord {
  id: string;
  studentId: string;
  classroomId: string;
  tenantId: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  remarks: string | null;
  markedById: string;
  createdAt: string;
  updatedAt: string;
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    parentId: string | null;
  } | null;
  classroom?: {
    id: string;
    name: string;
  } | null;
  markedBy?: {
    id: string;
    name: string;
  } | null;
}


// ── Observations ──────────────────────────────────────────
export type ObservationProgress = 'Not Started' | 'Introduced' | 'Practicing' | 'Developing' | 'Mastered';

export interface Observation {
  id: string;
  studentId: string;
  studentName: string;
  initials: string;
  color: string;
  area: MontessoriArea;
  skill: string;
  progress: ObservationProgress;
  note: string;
  teacher: string;
  date: string;
}

export interface ApiObservation {
  id: string;
  studentId: string;
  area: 'PRACTICAL_LIFE' | 'SENSORIAL' | 'LANGUAGE' | 'MATHEMATICS' | 'CULTURAL' | 'ART' | 'MUSIC' | 'MOVEMENT' | 'SOCIAL_EMOTIONAL';
  skill: string;
  notes: string;
  progress: 'NOT_STARTED' | 'INTRODUCED' | 'PRACTICING' | 'DEVELOPING' | 'MASTERED';
  observedAt: string;
  teacherId: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    parentId: string | null;
  } | null;
  teacher?: {
    id: string;
    name: string;
  } | null;
}


// ── Assessments ───────────────────────────────────────────
export type AssessmentLevel = 'Beginning' | 'Developing' | 'Proficient' | 'Advanced';

export interface Assessment {
  id: string;
  studentId: string;
  studentName: string;
  initials: string;
  color: string;
  area: MontessoriArea;
  skill: string;
  title: string;
  score: number;
  level: AssessmentLevel;
  comments: string;
  teacher: string;
  date: string;
}

export interface ApiAssessment {
  id: string;
  studentId: string;
  area: 'PRACTICAL_LIFE' | 'SENSORIAL' | 'LANGUAGE' | 'MATHEMATICS' | 'CULTURAL' | 'ART' | 'MUSIC' | 'MOVEMENT' | 'SOCIAL_EMOTIONAL';
  skill: string;
  level: 'BEGINNING' | 'DEVELOPING' | 'PROFICIENT' | 'ADVANCED';
  score: number | null;
  comments: string | null;
  assessedAt: string;
  teacherId: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    parentId: string | null;
  } | null;
  teacher?: {
    id: string;
    name: string;
  } | null;
}


// ── Learning Progress ─────────────────────────────────────
export interface AreaProgress {
  area: MontessoriArea;
  score: number;
  level: AssessmentLevel;
  assessmentCount: number;
  note: string;
}

export interface LearningProgress {
  studentId: string;
  studentName: string;
  overallScore: number;
  strongestArea: MontessoriArea;
  areas: AreaProgress[];
  areasNeedingAttention: AreaProgress[];
  totalAssessments: number;
}

// ── Finance ───────────────────────────────────────────────
export type FeeStatus = 'Pending' | 'Partially Paid' | 'Paid' | 'Overdue' | 'Waived';
export type PaymentMethod = 'Cash' | 'Bank Transfer' | 'Card' | 'Online';

export interface FeeStructure {
  id: string;
  name: string;
  amount: number;
  frequency: string;
  scope: string;
  status: 'Active' | 'Inactive';
}

export interface StudentFee {
  id: string;
  studentId: string;
  studentName: string;
  initials: string;
  color: string;
  feeStructure: string;
  amount: number;
  paidAmount: number;
  balance: number;
  status: FeeStatus;
  dueDate: string;
}

export interface Payment {
  id: string;
  studentId: string;
  studentName: string;
  initials: string;
  color: string;
  amount: number;
  formattedAmount: string;
  type: string;
  status: FeeStatus;
  method: PaymentMethod;
  date: string;
}

export interface StudentBalance {
  studentId: string;
  studentName: string;
  totalAssigned: number;
  totalPaid: number;
  outstanding: number;
  overdue: number;
}

export interface FinanceSummary {
  totalAssigned: number;
  totalCollected: number;
  totalOutstanding: number;
  totalOverdue: number;
  collectionRate: number;
}

// ── Montessori Areas ───────────────────────────────────────
export type MontessoriArea =
  | 'Practical Life'
  | 'Sensorial'
  | 'Language'
  | 'Mathematics'
  | 'Cultural'
  | 'Art'
  | 'Music'
  | 'Movement'
  | 'Social Emotional';

// ── Parent / Student Dashboard ────────────────────────────
export interface ChildSummary {
  id: string;
  name: string;
  initials: string;
  color: string;
  classroom: string;
  age: string;
  attendanceRate: number;
  learningProgress: number;
}

export interface StudentDashboard {
  student: Student;
  attendance: AttendanceSummary;
  recentObservations: Observation[];
  recentAssessments: Assessment[];
  learningProgress: LearningProgress;
  balance: StudentBalance;
  recentPayments: Payment[];
}

// ── Generic ───────────────────────────────────────────────
export type Status = StudentStatus | AttendanceStatus | AssessmentLevel | FeeStatus;

// ── Raw API Contracts ─────────────────────────────────────
export interface ApiFeeStructure {
  id: string;
  name: string;
  description: string | null;
  amount: number;
  frequency: 'MONTHLY' | 'QUARTERLY' | 'SEMESTER' | 'YEARLY' | 'ONE_TIME';
  isActive: boolean;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiStudentFee {
  id: string;
  tenantId: string;
  studentId: string;
  feeStructureId: string;
  amount: number;
  dueDate: string;
  status: 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'WAIVED';
  createdAt: string;
  updatedAt: string;
  student?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  feeStructure?: ApiFeeStructure | null;
}

export interface ApiPayment {
  id: string;
  tenantId: string;
  studentId: string;
  studentFeeId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CARD' | 'ONLINE';
  reference: string | null;
  notes: string | null;
  receivedById: string;
  createdAt: string;
  updatedAt: string;
  student?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  studentFee?: ApiStudentFee | null;
  receivedBy?: {
    id: string;
    name: string;
  } | null;
}

export interface ApiStudentDashboard {
  student: {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    isActive: boolean;
  };
  classroom: {
    id: string;
    name: string;
  } | null;
  attendance: {
    totalRecords: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    attendancePercentage: number;
  };
  learning: {
    totalObservations: number;
    totalAssessments: number;
    overallAverageScore: number | null;
    strongestArea: string | null;
    areasNeedingAttention: string[];
  };
  recentObservations: ApiObservation[];
  recentAssessments: ApiAssessment[];
  finance: {
    totalAssigned: number;
    totalPaid: number;
    outstandingBalance: number;
    overdueAmount: number;
    recentPayments: ApiPayment[];
  } | null;
}

// ── Curriculum & Lesson Planning ──────────────────────────
export type LessonPlanStatus = 'Planned' | 'Presented' | 'Practicing' | 'Mastered' | 'Deferred';

export interface CurriculumLesson {
  id: string;
  area: MontessoriArea;
  title: string;
  description: string;
  ageGroup: string;
  sequence: number;
  materialsNeeded: string;
  isActive: boolean;
}

export interface LessonPlan {
  id: string;
  lessonId: string;
  lessonTitle: string;
  area: MontessoriArea;
  classroomId: string | null;
  classroomName: string;
  studentId: string | null;
  studentName: string;
  studentInitials: string;
  studentColor: string;
  teacherId: string;
  teacherName: string;
  scheduledDate: string;
  status: LessonPlanStatus;
  notes: string;
}

export interface ApiCurriculumLesson {
  id: string;
  tenantId: string;
  area: 'PRACTICAL_LIFE' | 'SENSORIAL' | 'LANGUAGE' | 'MATHEMATICS' | 'CULTURAL' | 'ART' | 'MUSIC' | 'MOVEMENT' | 'SOCIAL_EMOTIONAL';
  title: string;
  description: string | null;
  ageGroup: string;
  sequence: number;
  materialsNeeded: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiLessonPlan {
  id: string;
  tenantId: string;
  lessonId: string;
  classroomId: string | null;
  studentId: string | null;
  teacherId: string;
  scheduledDate: string;
  status: 'PLANNED' | 'PRESENTED' | 'PRACTICING' | 'MASTERED' | 'DEFERRED';
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  lesson?: ApiCurriculumLesson | null;
  classroom?: { id: string; name: string } | null;
  student?: { id: string; firstName: string; lastName: string } | null;
  teacher?: { id: string; name: string } | null;
}


// ── Gamification ───────────────────────────────────────────
export type BadgeCategory = 'Attendance' | 'Academic' | 'Behavior' | 'Participation' | 'Special';

export interface ApiBadge {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  icon: string;
  category: 'ATTENDANCE' | 'ACADEMIC' | 'BEHAVIOR' | 'PARTICIPATION' | 'SPECIAL';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiStudentPoints {
  id: string;
  tenantId: string;
  studentId: string;
  points: number;
  reason: string;
  awardedById: string;
  awardedAt: string;
  student?: { id: string; firstName: string; lastName: string } | null;
  awardedBy?: { id: string; name: string } | null;
}

export interface ApiStudentBadge {
  id: string;
  tenantId: string;
  studentId: string;
  badgeId: string;
  awardedById: string;
  notes: string | null;
  awardedAt: string;
  student?: { id: string; firstName: string; lastName: string } | null;
  badge?: ApiBadge | null;
  awardedBy?: { id: string; name: string } | null;
}

export interface ApiLeaderboardEntry {
  studentId: string;
  firstName: string;
  lastName: string;
  totalPoints: number;
  badgeCount: number;
}

export interface ApiStudentGamificationSummary {
  studentId: string;
  totalPoints: number;
  history: ApiStudentPoints[];
  badges: ApiStudentBadge[];
}

export interface GamificationBadge {
  id: string;
  name: string;
  icon: string;
  category: BadgeCategory;
  description: string;
}

export interface LeaderboardEntry {
  rank: number;
  studentId: string;
  name: string;
  initials: string;
  color: string;
  totalPoints: number;
  badgeCount: number;
}

// ── HR / Employee Management ──────────────────────────────
export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT';
export type EmployeeStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';
export type LeaveType = 'SICK' | 'CASUAL' | 'ANNUAL';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Employee {
  id: string;
  tenantId: string;
  userId: string | null;
  employeeNumber: string;
  name: string;
  jobTitle: string;
  department: string;
  employmentType: EmploymentType;
  hireDate: string;
  salary: number;
  status: EmployeeStatus;
  phone: string | null;
  emergencyContact: string | null;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; name: string; email: string } | null;
}

export interface LeaveRequest {
  id: string;
  tenantId: string;
  employeeId: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  status: LeaveStatus;
  approverId: string | null;
  reason: string | null;
  createdAt: string;
  updatedAt: string;
  employee?: Employee | null;
  approver?: { id: string; name: string } | null;
}

// ── Inventory ─────────────────────────────────────────────
export type InventoryItemStatus = 'ACTIVE' | 'INACTIVE';
export type InventoryTransactionType = 'STOCK_IN' | 'STOCK_OUT';

export interface InventoryItem {
  id: string;
  tenantId: string;
  name: string;
  category: string;
  description: string | null;
  quantity: number;
  minimumStock: number;
  unit: string;
  location: string | null;
  status: InventoryItemStatus;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryTransaction {
  id: string;
  tenantId: string;
  itemId: string;
  type: InventoryTransactionType;
  quantity: number;
  reason: string | null;
  createdBy: string | null;
  createdAt: string;
  item?: InventoryItem | null;
  creator?: { id: string; name: string } | null;
}

// ── Communication ─────────────────────────────────────────
export type AnnouncementAudience = 'ALL' | 'TEACHERS' | 'PARENTS' | 'ADMINS';
export type AnnouncementPriority = 'NORMAL' | 'IMPORTANT' | 'URGENT';

export interface Announcement {
  id: string;
  tenantId: string;
  title: string;
  content: string;
  audience: AnnouncementAudience;
  priority: AnnouncementPriority;
  isPublished: boolean;
  publishedAt: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  creator?: { id: string; name: string; email: string } | null;
}

// ── Admin Settings ──────────────────────────────────────────
export interface SchoolSettings {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  timezone: string | null;
  currency: string | null;
  academicYear: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── AI Developmental Insights ───────────────────────────────
export interface SuggestedActivity {
  title: string;
  area: string;
  reason: string;
}

export interface StudentDevelopmentInsight {
  summary: string;
  strengths: string[];
  areasNeedingAttention: string[];
  nextSteps: string[];
  suggestedActivities: SuggestedActivity[];
}