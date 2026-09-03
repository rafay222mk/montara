import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ApiStudent, Student, ApiClassroom, Classroom, ApiAttendanceRecord, AttendanceRecord, AttendanceStatus, ApiObservation, Observation, ObservationProgress, MontessoriArea, ApiAssessment, Assessment, AssessmentLevel, LearningProgress, ApiFeeStructure, ApiStudentFee, ApiPayment, FeeStructure, StudentFee, Payment, FeeStatus, PaymentMethod, CurriculumLesson, LessonPlan, LessonPlanStatus, ApiCurriculumLesson, ApiLessonPlan } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function mapApiStudent(student: ApiStudent): Student {
  const dob = new Date(student.dateOfBirth);
  const diff = Date.now() - dob.getTime();
  const ageDate = new Date(diff);
  const years = Math.abs(ageDate.getUTCFullYear() - 1970);
  const age = `${years} yrs`;

  const joinedDate = new Date(student.enrollmentDate);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const joined = `${months[joinedDate.getUTCMonth()]} ${joinedDate.getUTCFullYear()}`;

  const colors = [
    'bg-rose-400/20 text-rose-200',
    'bg-sky-400/20 text-sky-200',
    'bg-amber-400/20 text-amber-200',
    'bg-emerald-400/20 text-emerald-200',
    'bg-cyan-400/20 text-cyan-200',
    'bg-orange-400/20 text-orange-200',
  ];
  const charCode = student.id.charCodeAt(0) || 0;
  const color = colors[charCode % colors.length];

  return {
    id: student.id,
    name: `${student.firstName} ${student.lastName}`,
    initials: `${student.firstName[0] || ''}${student.lastName[0] || ''}`.toUpperCase(),
    classroomId: student.classroomId || '',
    classroom: student.classroom?.name || 'Unassigned',
    age,
    dateOfBirth: student.dateOfBirth,
    status: student.isActive ? 'Active' : 'Inactive',
    guardian: student.parent?.name || 'Unassigned',
    guardianEmail: student.parent?.email || '',
    guardianPhone: '',
    joined,
    color,
    address: '',
  };
}

export function mapApiClassroom(room: ApiClassroom): Classroom {
  const nameLower = room.name.toLowerCase();
  let ageRange = '3–6 years';
  if (nameLower.includes('nido') || nameLower.includes('toddler')) {
    ageRange = '18 months–3 years';
  } else if (nameLower.includes('studio') || nameLower.includes('elementary') || nameLower.includes('oak')) {
    ageRange = '6–9 years';
  }

  const tones = [
    'bg-emerald-400/10 text-emerald-300',
    'bg-sky-400/10 text-sky-300',
    'bg-amber-400/10 text-amber-300',
    'bg-rose-400/10 text-rose-300',
  ];
  const charCode = room.id.charCodeAt(0) || 0;
  const tone = tones[charCode % tones.length];

  return {
    id: room.id,
    name: room.name,
    ageRange,
    leadTeacher: room.teacher?.name || 'Unassigned',
    studentCount: room.students ? room.students.length : 0,
    capacity: 30, // Default classroom limit
    status: room.isActive ? 'Active' : 'Inactive',
    tone,
    description: room.description || '',
  };
}

export function mapApiAttendanceStatus(apiStatus: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'): AttendanceStatus {
  const mapping: Record<string, AttendanceStatus> = {
    PRESENT: 'Present',
    ABSENT: 'Absent',
    LATE: 'Late',
    EXCUSED: 'Excused',
  };
  return mapping[apiStatus] || 'Present';
}

export function mapStatusToApi(status: AttendanceStatus): 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' {
  const mapping: Record<AttendanceStatus, 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'> = {
    Present: 'PRESENT',
    Absent: 'ABSENT',
    Late: 'LATE',
    Excused: 'EXCUSED',
  };
  return mapping[status] || 'PRESENT';
}

export function mapApiAttendance(api: ApiAttendanceRecord): AttendanceRecord {
  const initials = api.student 
    ? `${api.student.firstName[0] || ''}${api.student.lastName[0] || ''}`.toUpperCase() 
    : 'U';
  const name = api.student 
    ? `${api.student.firstName} ${api.student.lastName}` 
    : 'Unknown student';

  const colors = [
    'bg-rose-400/20 text-rose-200',
    'bg-sky-400/20 text-sky-200',
    'bg-amber-400/20 text-amber-200',
    'bg-emerald-400/20 text-emerald-200',
    'bg-cyan-400/20 text-cyan-200',
    'bg-orange-400/20 text-orange-200',
  ];
  const charCode = api.studentId.charCodeAt(0) || 0;
  const color = colors[charCode % colors.length];

  // Derive arrivalTime safely if PRESENT or LATE
  const formattedTime = new Date(api.createdAt).toLocaleTimeString([], { 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true 
  });
  const arrivalTime = api.status === 'PRESENT' || api.status === 'LATE' ? formattedTime : null;

  return {
    id: api.id,
    studentId: api.studentId,
    studentName: name,
    initials,
    color,
    classroom: api.classroom?.name || 'Unassigned',
    date: api.date,
    status: mapApiAttendanceStatus(api.status),
    arrivalTime,
    notes: api.remarks || '',
  };
}

export function mapApiObservationStatus(apiProgress: 'NOT_STARTED' | 'INTRODUCED' | 'PRACTICING' | 'DEVELOPING' | 'MASTERED'): ObservationProgress {
  const mapping: Record<string, ObservationProgress> = {
    NOT_STARTED: 'Not Started',
    INTRODUCED: 'Introduced',
    PRACTICING: 'Practicing',
    DEVELOPING: 'Developing',
    MASTERED: 'Mastered',
  };
  return mapping[apiProgress] || 'Introduced';
}

export function mapObservationStatusToApi(progress: ObservationProgress): 'NOT_STARTED' | 'INTRODUCED' | 'PRACTICING' | 'DEVELOPING' | 'MASTERED' {
  const mapping: Record<ObservationProgress, 'NOT_STARTED' | 'INTRODUCED' | 'PRACTICING' | 'DEVELOPING' | 'MASTERED'> = {
    'Not Started': 'NOT_STARTED',
    'Introduced': 'INTRODUCED',
    'Practicing': 'PRACTICING',
    'Developing': 'DEVELOPING',
    'Mastered': 'MASTERED',
  };
  return mapping[progress] || 'INTRODUCED';
}

export function mapApiObservationArea(apiArea: string): MontessoriArea {
  const mapping: Record<string, MontessoriArea> = {
    PRACTICAL_LIFE: 'Practical Life',
    SENSORIAL: 'Sensorial',
    LANGUAGE: 'Language',
    MATHEMATICS: 'Mathematics',
    CULTURAL: 'Cultural',
    ART: 'Art',
    MUSIC: 'Music',
    MOVEMENT: 'Movement',
    SOCIAL_EMOTIONAL: 'Social Emotional',
  };
  return mapping[apiArea] || 'Practical Life';
}

export function mapObservationAreaToApi(area: MontessoriArea): 'PRACTICAL_LIFE' | 'SENSORIAL' | 'LANGUAGE' | 'MATHEMATICS' | 'CULTURAL' | 'ART' | 'MUSIC' | 'MOVEMENT' | 'SOCIAL_EMOTIONAL' {
  const mapping: Record<MontessoriArea, 'PRACTICAL_LIFE' | 'SENSORIAL' | 'LANGUAGE' | 'MATHEMATICS' | 'CULTURAL' | 'ART' | 'MUSIC' | 'MOVEMENT' | 'SOCIAL_EMOTIONAL'> = {
    'Practical Life': 'PRACTICAL_LIFE',
    'Sensorial': 'SENSORIAL',
    'Language': 'LANGUAGE',
    'Mathematics': 'MATHEMATICS',
    'Cultural': 'CULTURAL',
    'Art': 'ART',
    'Music': 'MUSIC',
    'Movement': 'MOVEMENT',
    'Social Emotional': 'SOCIAL_EMOTIONAL',
  };
  return mapping[area] || 'PRACTICAL_LIFE';
}

export function mapApiObservation(api: ApiObservation): Observation {
  const initials = api.student 
    ? `${api.student.firstName[0] || ''}${api.student.lastName[0] || ''}`.toUpperCase() 
    : 'U';
  const studentName = api.student 
    ? `${api.student.firstName} ${api.student.lastName}` 
    : 'Unknown Student';

  const colors = [
    'bg-rose-400/20 text-rose-200',
    'bg-sky-400/20 text-sky-200',
    'bg-amber-400/20 text-amber-200',
    'bg-emerald-400/20 text-emerald-200',
    'bg-cyan-400/20 text-cyan-200',
    'bg-orange-400/20 text-orange-200',
  ];
  const charCode = api.studentId.charCodeAt(0) || 0;
  const color = colors[charCode % colors.length];

  // Friendly date formatting
  const dateObj = new Date(api.observedAt);
  const formattedDate = dateObj.toLocaleDateString([], { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });

  return {
    id: api.id,
    studentId: api.studentId,
    studentName,
    initials,
    color,
    area: mapApiObservationArea(api.area),
    skill: api.skill,
    progress: mapApiObservationStatus(api.progress),
    note: api.notes,
    teacher: api.teacher?.name || 'Unassigned Guide',
    date: formattedDate,
  };
}

export function mapApiAssessmentLevel(apiLevel: 'BEGINNING' | 'DEVELOPING' | 'PROFICIENT' | 'ADVANCED'): AssessmentLevel {
  const mapping: Record<string, AssessmentLevel> = {
    BEGINNING: 'Beginning',
    DEVELOPING: 'Developing',
    PROFICIENT: 'Proficient',
    ADVANCED: 'Advanced',
  };
  return mapping[apiLevel] || 'Beginning';
}

export function mapAssessmentLevelToApi(level: AssessmentLevel): 'BEGINNING' | 'DEVELOPING' | 'PROFICIENT' | 'ADVANCED' {
  const mapping: Record<AssessmentLevel, 'BEGINNING' | 'DEVELOPING' | 'PROFICIENT' | 'ADVANCED'> = {
    Beginning: 'BEGINNING',
    Developing: 'DEVELOPING',
    Proficient: 'PROFICIENT',
    Advanced: 'ADVANCED',
  };
  return mapping[level] || 'BEGINNING';
}

export function mapApiAssessment(api: ApiAssessment): Assessment {
  const initials = api.student 
    ? `${api.student.firstName[0] || ''}${api.student.lastName[0] || ''}`.toUpperCase() 
    : 'U';
  const studentName = api.student 
    ? `${api.student.firstName} ${api.student.lastName}` 
    : 'Unknown Student';

  const colors = [
    'bg-rose-400/20 text-rose-200',
    'bg-sky-400/20 text-sky-200',
    'bg-amber-400/20 text-amber-200',
    'bg-emerald-400/20 text-emerald-200',
    'bg-cyan-400/20 text-cyan-200',
    'bg-orange-400/20 text-orange-200',
  ];
  const charCode = api.studentId.charCodeAt(0) || 0;
  const color = colors[charCode % colors.length];

  const dateObj = new Date(api.assessedAt);
  const formattedDate = dateObj.toLocaleDateString([], { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });

  return {
    id: api.id,
    studentId: api.studentId,
    studentName,
    initials,
    color,
    area: mapApiObservationArea(api.area), // Mapped Montessori Area behaves identically
    skill: api.skill,
    title: api.skill, // Fallback to skill description as title
    score: api.score || 0,
    level: mapApiAssessmentLevel(api.level),
    comments: api.comments || '',
    teacher: api.teacher?.name || 'Unassigned Guide',
    date: formattedDate,
  };
}

export function mapApiProgress(api: any, studentName: string): LearningProgress {
  const mappedAreas = (api.areas || []).map((a: any) => {
    return {
      area: mapApiObservationArea(a.area),
      score: a.averageScore ? Math.round(a.averageScore) : 0,
      level: mapApiAssessmentLevel(a.latestLevel),
      assessmentCount: 1, // Presentational placeholder since database aggregates don't count separate subrecords
      note: `Latest assessed on ${new Date(a.latestAssessedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}`,
    };
  });

  const areasNeedingAttention = mappedAreas.filter((a: any) => a.score < 70 || a.level === 'Beginning' || a.level === 'Developing');

  return {
    studentId: api.studentId,
    studentName,
    overallScore: api.overallAverageScore ? Math.round(api.overallAverageScore) : 0,
    strongestArea: api.strongestArea ? mapApiObservationArea(api.strongestArea) : 'Practical Life',
    areas: mappedAreas,
    areasNeedingAttention,
    totalAssessments: api.totalAssessments || 0,
  };
}

// ── Finance Mappers ─────────────────────────────────────────

export function mapApiFeeFrequency(freq: string): string {
  const mapping: Record<string, string> = {
    MONTHLY: 'Monthly',
    QUARTERLY: 'Quarterly',
    SEMESTER: 'Per Term',
    YEARLY: 'Annual',
    ONE_TIME: 'One-time',
  };
  return mapping[freq] || 'Monthly';
}

export function mapFeeFrequencyToApi(freq: string): string {
  const mapping: Record<string, string> = {
    'Monthly': 'MONTHLY',
    'Quarterly': 'QUARTERLY',
    'Per term': 'SEMESTER',
    'Per Term': 'SEMESTER',
    'Annual': 'YEARLY',
    'One-time': 'ONE_TIME',
  };
  return mapping[freq] || 'MONTHLY';
}

export function mapApiFeeStructure(api: ApiFeeStructure): FeeStructure {
  return {
    id: api.id,
    name: api.name,
    amount: api.amount ? Number(api.amount) : 0,
    frequency: mapApiFeeFrequency(api.frequency),
    scope: api.description || 'All Programs',
    status: api.isActive ? 'Active' : 'Inactive',
  };
}

export function mapApiStudentFee(api: ApiStudentFee): StudentFee {
  const initials = api.student 
    ? `${api.student.firstName[0] || ''}${api.student.lastName[0] || ''}`.toUpperCase() 
    : 'U';
  const studentName = api.student 
    ? `${api.student.firstName} ${api.student.lastName}` 
    : 'Unknown Student';

  const colors = [
    'bg-rose-400/20 text-rose-200',
    'bg-sky-400/20 text-sky-200',
    'bg-amber-400/20 text-amber-200',
    'bg-emerald-400/20 text-emerald-200',
    'bg-cyan-400/20 text-cyan-200',
    'bg-orange-400/20 text-orange-200',
  ];
  const charCode = api.studentId.charCodeAt(0) || 0;
  const color = colors[charCode % colors.length];

  const dateObj = new Date(api.dueDate);
  const dueDate = dateObj.toLocaleDateString([], { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });

  const feeStatusMap: Record<string, FeeStatus> = {
    PENDING: 'Pending',
    PARTIALLY_PAID: 'Partially Paid',
    PAID: 'Paid',
    OVERDUE: 'Overdue',
    WAIVED: 'Waived',
  };

  return {
    id: api.id,
    studentId: api.studentId,
    studentName,
    initials,
    color,
    feeStructure: api.feeStructure?.name || 'Assigned Fee',
    amount: api.amount ? Number(api.amount) : 0,
    paidAmount: 0,
    balance: api.amount ? Number(api.amount) : 0,
    status: feeStatusMap[api.status] || 'Pending',
    dueDate,
  };
}

export function mapApiPayment(api: ApiPayment): Payment {
  const initials = api.student 
    ? `${api.student.firstName[0] || ''}${api.student.lastName[0] || ''}`.toUpperCase() 
    : 'U';
  const studentName = api.student 
    ? `${api.student.firstName} ${api.student.lastName}` 
    : 'Unknown Student';

  const colors = [
    'bg-rose-400/20 text-rose-200',
    'bg-sky-400/20 text-sky-200',
    'bg-amber-400/20 text-amber-200',
    'bg-emerald-400/20 text-emerald-200',
    'bg-cyan-400/20 text-cyan-200',
    'bg-orange-400/20 text-orange-200',
  ];
  const charCode = api.studentId.charCodeAt(0) || 0;
  const color = colors[charCode % colors.length];

  const dateObj = new Date(api.paymentDate);
  const formattedDate = dateObj.toLocaleDateString([], { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });

  const methodMap: Record<string, PaymentMethod> = {
    CASH: 'Cash',
    BANK_TRANSFER: 'Bank Transfer',
    CARD: 'Card',
    ONLINE: 'Online',
  };

  const amountVal = api.amount ? Number(api.amount) : 0;

  return {
    id: api.id,
    studentId: api.studentId,
    studentName,
    initials,
    color,
    amount: amountVal,
    formattedAmount: `$${amountVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    type: api.studentFee?.feeStructure?.name || 'Fee Payment',
    status: 'Paid',
    method: methodMap[api.paymentMethod] || 'Cash',
    date: formattedDate,
  };
}

export function mapPaymentMethodToApi(method: PaymentMethod): string {
  const mapping: Record<PaymentMethod, string> = {
    Cash: 'CASH',
    'Bank Transfer': 'BANK_TRANSFER',
    Card: 'CARD',
    Online: 'ONLINE',
  };
  return mapping[method] || 'CASH';
}

export function mapApiLesson(api: ApiCurriculumLesson): CurriculumLesson {
  return {
    id: api.id,
    area: mapApiObservationArea(api.area),
    title: api.title,
    description: api.description || '',
    ageGroup: api.ageGroup || '3–6 years',
    sequence: api.sequence || 1,
    materialsNeeded: api.materialsNeeded || '',
    isActive: api.isActive,
  };
}

export function mapApiLessonPlanStatus(status: string): LessonPlanStatus {
  const mapping: Record<string, LessonPlanStatus> = {
    PLANNED: 'Planned',
    PRESENTED: 'Presented',
    PRACTICING: 'Practicing',
    MASTERED: 'Mastered',
    DEFERRED: 'Deferred',
  };
  return mapping[status] || 'Planned';
}

export function mapLessonPlanStatusToApi(status: LessonPlanStatus): 'PLANNED' | 'PRESENTED' | 'PRACTICING' | 'MASTERED' | 'DEFERRED' {
  const mapping: Record<LessonPlanStatus, 'PLANNED' | 'PRESENTED' | 'PRACTICING' | 'MASTERED' | 'DEFERRED'> = {
    Planned: 'PLANNED',
    Presented: 'PRESENTED',
    Practicing: 'PRACTICING',
    Mastered: 'MASTERED',
    Deferred: 'DEFERRED',
  };
  return mapping[status] || 'PLANNED';
}

export function mapApiLessonPlan(api: ApiLessonPlan): LessonPlan {
  const studentName = api.student
    ? `${api.student.firstName} ${api.student.lastName}`
    : 'All Classroom Students';

  const studentInitials = api.student
    ? `${api.student.firstName[0] || ''}${api.student.lastName[0] || ''}`.toUpperCase()
    : 'CL';

  const colors = [
    'bg-rose-400/20 text-rose-200',
    'bg-sky-400/20 text-sky-200',
    'bg-amber-400/20 text-amber-200',
    'bg-emerald-400/20 text-emerald-200',
    'bg-cyan-400/20 text-cyan-200',
    'bg-orange-400/20 text-orange-200',
  ];
  const charCode = (api.studentId || api.id).charCodeAt(0) || 0;
  const studentColor = colors[charCode % colors.length];

  const dateObj = new Date(api.scheduledDate);
  const formattedDate = dateObj.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return {
    id: api.id,
    lessonId: api.lessonId,
    lessonTitle: api.lesson?.title || 'Montessori Presentation',
    area: api.lesson ? mapApiObservationArea(api.lesson.area) : 'Practical Life',
    classroomId: api.classroomId,
    classroomName: api.classroom?.name || 'Assigned Group',
    studentId: api.studentId,
    studentName,
    studentInitials,
    studentColor,
    teacherId: api.teacherId,
    teacherName: api.teacher?.name || 'Lead Guide',
    scheduledDate: formattedDate,
    status: mapApiLessonPlanStatus(api.status),
    notes: api.notes || '',
  };
}

