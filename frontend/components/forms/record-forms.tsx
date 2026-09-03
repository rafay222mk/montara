'use client';

import { useState, useEffect } from 'react';
import { FormDialog } from '@/components/shared';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { montessoriAreas } from '@/lib/mock-data';
import { ObservationProgress, MontessoriArea, AssessmentLevel, PaymentMethod } from '@/types';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { apiClient } from '@/lib/api/client';
import { studentsApi } from '@/lib/api/students';
import { classroomsApi } from '@/lib/api/classrooms';
import { observationsApi } from '@/lib/api/observations';
import { assessmentsApi } from '@/lib/api/assessments';
import { financeApi } from '@/lib/api/finance';
import { curriculumApi } from '@/lib/api/curriculum';
import { hrApi } from '@/lib/api/hr';
import { inventoryApi } from '@/lib/api/inventory';
import { communicationApi } from '@/lib/api/communication';
import { mapApiStudent, mapApiClassroom, mapObservationAreaToApi, mapObservationStatusToApi, mapAssessmentLevelToApi, mapFeeFrequencyToApi, mapPaymentMethodToApi, mapLessonPlanStatusToApi, mapApiLesson } from '@/lib/utils';
import { LessonPlanStatus, Employee, LeaveRequest, InventoryItem, Announcement } from '@/types';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}

// ========================================================
// LIVE STUDENT FORM (CREATE / UPDATE)
// ========================================================
export function StudentForm({
  studentId,
  onSuccess,
  trigger = <Button>Add student</Button>,
}: {
  studentId?: string;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('Male');
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [enrollmentDate, setEnrollmentDate] = useState('');
  const [classroomId, setClassroomId] = useState<string>('none');
  const [parentId, setParentId] = useState<string>('none');

  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [parents, setParents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load classrooms & parents list on open
  useEffect(() => {
    if (!open) return;

    classroomsApi.list()
      .then(setClassrooms)
      .catch((err) => console.error('Error fetching classrooms:', err));

    apiClient.get<any[]>('/users')
      .then((users) => {
        setParents(users.filter((u) => u.role === 'PARENT'));
      })
      .catch((err) => console.error('Error fetching parent users:', err));
  }, [open]);

  // Load existing student details if studentId is provided (Edit Mode)
  useEffect(() => {
    if (!open || !studentId) {
      if (!studentId) {
        // Clear form fields for new student creation
        setFirstName('');
        setLastName('');
        setDateOfBirth('');
        setGender('Male');
        setAdmissionNumber('');
        setEnrollmentDate('');
        setClassroomId('none');
        setParentId('none');
      }
      return;
    }

    setLoading(true);
    studentsApi.get(studentId)
      .then((student) => {
        setFirstName(student.firstName);
        setLastName(student.lastName);
        setDateOfBirth(student.dateOfBirth.split('T')[0]);
        setGender(student.gender);
        setAdmissionNumber(student.admissionNumber);
        setEnrollmentDate(student.enrollmentDate.split('T')[0]);
        setClassroomId(student.classroomId || 'none');
        setParentId(student.parentId || 'none');
      })
      .catch((err) => {
        setError(err?.message || 'Failed to fetch student details');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [open, studentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const payload = {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      admissionNumber,
      enrollmentDate,
      classroomId: classroomId === 'none' ? null : classroomId,
      parentId: parentId === 'none' ? null : parentId,
    };

    try {
      if (studentId) {
        await studentsApi.update(studentId, payload);
      } else {
        await studentsApi.create(payload);
      }
      setOpen(false);
      onSuccess?.();
    } catch (err: any) {
      setError(err?.message || 'Failed to save student');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{studentId ? 'Edit student' : 'Add student'}</DialogTitle>
          <DialogDescription>
            {studentId
              ? 'Update this student profile details.'
              : 'Create a student record ready for the school directory.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {error && (
            <div className="rounded bg-destructive/15 p-3 text-xs text-destructive">
              {error}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name">
              <Input
                placeholder="Amara"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={loading}
                required
              />
            </Field>
            
            <Field label="Last name">
              <Input
                placeholder="Okafor"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={loading}
                required
              />
            </Field>

            <Field label="Date of birth">
              <Input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                disabled={loading}
                required
              />
            </Field>

            <Field label="Gender">
              <Select value={gender} onValueChange={setGender} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field label="Admission number">
              <Input
                placeholder="AD-101"
                value={admissionNumber}
                onChange={(e) => setAdmissionNumber(e.target.value)}
                disabled={loading}
                required
              />
            </Field>

            <Field label="Enrollment date">
              <Input
                type="date"
                value={enrollmentDate}
                onChange={(e) => setEnrollmentDate(e.target.value)}
                disabled={loading}
                required
              />
            </Field>

            <Field label="Classroom">
              <Select value={classroomId} onValueChange={setClassroomId} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose classroom" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {classrooms.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Guardian parent">
              <Select value={parentId} onValueChange={setParentId} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose guardian" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {parents.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name} ({p.email})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : studentId ? 'Save changes' : 'Add student'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ========================================================
// LIVE CLASSROOM FORM (CREATE / UPDATE)
// ========================================================
export function ClassroomForm({
  classroomId,
  onSuccess,
  trigger = <Button>Add classroom</Button>,
}: {
  classroomId?: string;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [teacherId, setTeacherId] = useState<string>('none');

  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch teachers list on open
  useEffect(() => {
    if (!open) return;

    apiClient.get<any[]>('/users')
      .then((users) => {
        setTeachers(users.filter((u) => u.role === 'TEACHER'));
      })
      .catch((err) => console.error('Error fetching teachers:', err));
  }, [open]);

  // Load existing classroom details if classroomId is provided (Edit Mode)
  useEffect(() => {
    if (!open || !classroomId) {
      if (!classroomId) {
        setName('');
        setDescription('');
        setTeacherId('none');
      }
      return;
    }

    setLoading(true);
    classroomsApi.get(classroomId)
      .then((room) => {
        setName(room.name);
        setDescription(room.description || '');
        setTeacherId(room.teacherId || 'none');
      })
      .catch((err) => {
        setError(err?.message || 'Failed to fetch classroom details');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [open, classroomId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const payload = {
      name,
      description: description || null,
      teacherId: teacherId === 'none' ? null : teacherId,
    };

    try {
      if (classroomId) {
        await classroomsApi.update(classroomId, payload);
      } else {
        await classroomsApi.create(payload);
      }
      setOpen(false);
      onSuccess?.();
    } catch (err: any) {
      setError(err?.message || 'Failed to save classroom');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{classroomId ? 'Edit classroom' : 'Add classroom'}</DialogTitle>
          <DialogDescription>
            {classroomId
              ? 'Update the details of this classroom prepared environment.'
              : 'Create a new prepared environment room.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {error && (
            <div className="rounded bg-destructive/15 p-3 text-xs text-destructive">
              {error}
            </div>
          )}

          <Field label="Classroom name">
            <Input
              placeholder="Cedar House"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              required
            />
          </Field>

          <Field label="Lead teacher / guide">
            <Select value={teacherId} onValueChange={setTeacherId} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Choose guide" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unassigned</SelectItem>
                {teachers.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Description">
            <Textarea
              placeholder="Describe this prepared environment..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
            />
          </Field>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : classroomId ? 'Save changes' : 'Create classroom'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ========================================================
// LIVE OBSERVATION FORM (CREATE)
// ========================================================
export function ObservationForm({
  onSuccess,
  trigger = <Button>Add observation</Button>,
}: {
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [studentId, setStudentId] = useState<string>('none');
  const [area, setArea] = useState<MontessoriArea>('Practical Life');
  const [progress, setProgress] = useState<ObservationProgress>('Introduced');
  const [skill, setSkill] = useState('');
  const [notes, setNotes] = useState('');
  const [observedAt, setObservedAt] = useState(() => new Date().toISOString().split('T')[0]);

  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch active students list on dialog open
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    studentsApi.list({ isActive: true })
      .then((data) => {
        const mapped = data.map(mapApiStudent);
        setStudents(mapped);
        if (mapped.length > 0) {
          setStudentId(mapped[0].id);
        }
      })
      .catch((err) => console.error('Failed to load students for observations:', err))
      .finally(() => setLoading(false));
  }, [open]);

  // Reset form inputs
  useEffect(() => {
    if (!open) return;
    setArea('Practical Life');
    setProgress('Introduced');
    setSkill('');
    setNotes('');
    setObservedAt(new Date().toISOString().split('T')[0]);
    setError(null);
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (studentId === 'none') {
      setError('Please choose a student');
      return;
    }
    setError(null);
    setLoading(true);

    const payload = {
      studentId,
      area: mapObservationAreaToApi(area),
      skill,
      notes,
      progress: mapObservationStatusToApi(progress),
      observedAt,
    };

    try {
      await observationsApi.create(payload);
      setOpen(false);
      onSuccess?.();
    } catch (err: any) {
      setError(err?.message || 'Failed to save observation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add observation</DialogTitle>
          <DialogDescription>
            Record a meaningful moment from the prepared environment.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {error && (
            <div className="rounded bg-destructive/15 p-3 text-xs text-destructive font-medium">
              {error}
            </div>
          )}

          <Field label="Student">
            <Select value={studentId} onValueChange={setStudentId} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Choose student" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Choose student</SelectItem>
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Montessori area">
              <Select value={area} onValueChange={(val) => setArea(val as MontessoriArea)} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose area" />
                </SelectTrigger>
                <SelectContent>
                  {montessoriAreas.map((item) => (
                    <SelectItem key={item} value={item}>{item}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Progress">
              <Select value={progress} onValueChange={(val) => setProgress(val as ObservationProgress)} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose progress" />
                </SelectTrigger>
                <SelectContent>
                  {(['Not Started', 'Introduced', 'Practicing', 'Developing', 'Mastered'] as ObservationProgress[]).map((level) => (
                    <SelectItem key={level} value={level}>{level}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Skill">
              <Input
                placeholder="What skill or work was observed?"
                value={skill}
                onChange={(e) => setSkill(e.target.value)}
                disabled={loading}
                required
              />
            </Field>

            <Field label="Observed date">
              <Input
                type="date"
                value={observedAt}
                onChange={(e) => setObservedAt(e.target.value)}
                disabled={loading}
                required
              />
            </Field>
          </div>

          <Field label="Notes">
            <Textarea
              placeholder="Describe what you noticed…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={loading}
              required
            />
          </Field>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save observation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


// ========================================================
// LIVE ASSESSMENT FORM (CREATE)
// ========================================================
export function AssessmentForm({
  onSuccess,
  trigger = <Button>Create assessment</Button>,
}: {
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [studentId, setStudentId] = useState<string>('none');
  const [area, setArea] = useState<MontessoriArea>('Practical Life');
  const [level, setLevel] = useState<AssessmentLevel>('Beginning');
  const [skill, setSkill] = useState('');
  const [score, setScore] = useState<number | ''>('');
  const [comments, setComments] = useState('');
  const [assessedAt, setAssessedAt] = useState(() => new Date().toISOString().split('T')[0]);

  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch active students list on dialog open
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    studentsApi.list({ isActive: true })
      .then((data) => {
        const mapped = data.map(mapApiStudent);
        setStudents(mapped);
        if (mapped.length > 0) {
          setStudentId(mapped[0].id);
        }
      })
      .catch((err) => console.error('Failed to load students for assessments:', err))
      .finally(() => setLoading(false));
  }, [open]);

  // Reset form inputs
  useEffect(() => {
    if (!open) return;
    setArea('Practical Life');
    setLevel('Beginning');
    setSkill('');
    setScore('');
    setComments('');
    setAssessedAt(new Date().toISOString().split('T')[0]);
    setError(null);
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (studentId === 'none') {
      setError('Please choose a student');
      return;
    }
    setError(null);
    setLoading(true);

    const payload: any = {
      studentId,
      area: mapObservationAreaToApi(area),
      skill,
      level: mapAssessmentLevelToApi(level),
      assessedAt,
    };

    if (score !== '') {
      payload.score = Number(score);
    }
    if (comments) {
      payload.comments = comments;
    }

    try {
      await assessmentsApi.create(payload);
      setOpen(false);
      onSuccess?.();
    } catch (err: any) {
      setError(err?.message || 'Failed to save assessment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create assessment</DialogTitle>
          <DialogDescription>
            Capture a clear progress marker for a child.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {error && (
            <div className="rounded bg-destructive/15 p-3 text-xs text-destructive font-medium">
              {error}
            </div>
          )}

          <Field label="Student">
            <Select value={studentId} onValueChange={setStudentId} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Choose student" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Choose student</SelectItem>
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Area">
              <Select value={area} onValueChange={(val) => setArea(val as MontessoriArea)} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose area" />
                </SelectTrigger>
                <SelectContent>
                  {montessoriAreas.map((item) => (
                    <SelectItem key={item} value={item}>{item}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Level">
              <Select value={level} onValueChange={(val) => setLevel(val as AssessmentLevel)} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose level" />
                </SelectTrigger>
                <SelectContent>
                  {['Beginning', 'Developing', 'Proficient', 'Advanced'].map((lvl) => (
                    <SelectItem key={lvl} value={lvl}>{lvl}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <Field label="Skill">
                <Input
                  placeholder="Skill or work"
                  value={skill}
                  onChange={(e) => setSkill(e.target.value)}
                  disabled={loading}
                  required
                />
              </Field>
            </div>

            <Field label="Score (0-100)">
              <Input
                type="number"
                min="0"
                max="100"
                placeholder="85"
                value={score}
                onChange={(e) => {
                  const val = e.target.value;
                  setScore(val === '' ? '' : Number(val));
                }}
                disabled={loading}
              />
            </Field>
          </div>

          <Field label="Assessed date">
            <Input
              type="date"
              value={assessedAt}
              onChange={(e) => setAssessedAt(e.target.value)}
              disabled={loading}
              required
            />
          </Field>

          <Field label="Comments">
            <Textarea
              placeholder="Add context for this assessment…"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              disabled={loading}
            />
          </Field>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save assessment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ========================================================
// LIVE FEE STRUCTURE FORM (CREATE)
// ========================================================
export function FeeForm({ onSuccess }: { onSuccess?: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [frequency, setFrequency] = useState('Monthly');
  const [description, setDescription] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName('');
    setAmount('');
    setFrequency('Monthly');
    setDescription('');
    setError(null);
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || amount === '') {
      setError('Please fill in name and amount');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      await financeApi.structures.create({
        name,
        amount: Number(amount),
        frequency: mapFeeFrequencyToApi(frequency),
        description: description || undefined,
      });
      setOpen(false);
      onSuccess?.();
    } catch (err: any) {
      setError(err?.message || 'Failed to save fee structure');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add fee structure</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add fee structure</DialogTitle>
          <DialogDescription>
            Set up a reusable fee for student accounts.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {error && (
            <div className="rounded bg-destructive/15 p-3 text-xs text-destructive font-medium">
              {error}
            </div>
          )}

          <Field label="Fee name">
            <Input
              placeholder="Term 3 Tuition"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              required
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Amount">
              <Input
                type="number"
                placeholder="1250.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                disabled={loading}
                required
              />
            </Field>

            <Field label="Frequency">
              <Select value={frequency} onValueChange={setFrequency} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                  <SelectItem value="Quarterly">Quarterly</SelectItem>
                  <SelectItem value="Per term">Per term</SelectItem>
                  <SelectItem value="Annual">Annual</SelectItem>
                  <SelectItem value="One-time">One-time</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="Applies to / Description">
            <Input
              placeholder="All primary programs"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
            />
          </Field>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Create structure'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ========================================================
// LIVE STUDENT FEE ASSIGNMENT FORM (CREATE)
// ========================================================
export function StudentFeeForm({ onSuccess }: { onSuccess?: () => void }) {
  const [open, setOpen] = useState(false);
  const [studentId, setStudentId] = useState<string>('none');
  const [feeStructureId, setFeeStructureId] = useState<string>('none');
  const [amount, setAmount] = useState<number | ''>('');
  const [dueDate, setDueDate] = useState(() => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); // Default 14 days out

  const [students, setStudents] = useState<any[]>([]);
  const [structures, setStructures] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch dependency models on open
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    Promise.all([
      studentsApi.list({ isActive: true }),
      financeApi.structures.list(),
    ])
      .then(([studentList, structureList]) => {
        const mappedStuds = studentList.map(mapApiStudent);
        setStudents(mappedStuds);
        setStructures(structureList);
        
        if (mappedStuds.length > 0) setStudentId(mappedStuds[0].id);
        if (structureList.length > 0) {
          setFeeStructureId(structureList[0].id);
          setAmount(Number(structureList[0].amount));
        }
      })
      .catch((err) => console.error('Failed to load dependency data for student fee assign:', err))
      .finally(() => setLoading(false));
  }, [open]);

  // Handle fee structure change to auto-update amount field
  const handleStructureChange = (id: string) => {
    setFeeStructureId(id);
    const selected = structures.find((s) => s.id === id);
    if (selected) {
      setAmount(Number(selected.amount));
    }
  };

  useEffect(() => {
    if (!open) return;
    setStudentId('none');
    setFeeStructureId('none');
    setAmount('');
    setDueDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setError(null);
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (studentId === 'none' || feeStructureId === 'none' || amount === '') {
      setError('Please choose student, fee structure, and amount');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      await financeApi.studentFees.create({
        studentId,
        feeStructureId,
        amount: Number(amount),
        dueDate,
      });
      setOpen(false);
      onSuccess?.();
    } catch (err: any) {
      setError(err?.message || 'Failed to assign fee');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Assign student fee</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign student fee</DialogTitle>
          <DialogDescription>
            Add a fee to a student's account.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {error && (
            <div className="rounded bg-destructive/15 p-3 text-xs text-destructive font-medium">
              {error}
            </div>
          )}

          <Field label="Student">
            <Select value={studentId} onValueChange={setStudentId} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Choose student" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Choose student</SelectItem>
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Fee structure">
            <Select value={feeStructureId} onValueChange={handleStructureChange} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Choose fee structure" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Choose fee structure</SelectItem>
                {structures.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name} (${Number(s.amount).toLocaleString()})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Amount">
              <Input
                type="number"
                placeholder="1250.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                disabled={loading}
                required
              />
            </Field>

            <Field label="Due date">
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={loading}
                required
              />
            </Field>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Assigning...' : 'Assign fee'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ========================================================
// LIVE PAYMENT RECEIPT RECORD FORM (CREATE)
// ========================================================
export function PaymentForm({ onSuccess }: { onSuccess?: () => void }) {
  const [open, setOpen] = useState(false);
  const [studentId, setStudentId] = useState<string>('none');
  const [studentFeeId, setStudentFeeId] = useState<string>('none');
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  const [students, setStudents] = useState<any[]>([]);
  const [unpaidFees, setUnpaidFees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [feesLoading, setFeesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch active student list on dialog open
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    studentsApi.list({ isActive: true })
      .then((data) => {
        const mapped = data.map(mapApiStudent);
        setStudents(mapped);
        if (mapped.length > 0) {
          setStudentId(mapped[0].id);
        }
      })
      .catch((err) => console.error('Failed to load students for payments:', err))
      .finally(() => setLoading(false));
  }, [open]);

  // Load unpaid or partially paid student fees for selected student
  useEffect(() => {
    if (!open || studentId === 'none') {
      setUnpaidFees([]);
      setStudentFeeId('none');
      setAmount('');
      return;
    }

    setFeesLoading(true);
    // Fetch fees matching this studentId
    Promise.all([
      financeApi.studentFees.list({ studentId }),
      financeApi.payments.list({ studentId }),
    ])
      .then(([feesList, paymentsList]) => {
        // Calculate unpaid balance per fee in memory
        const outstanding = feesList
          .map((fee) => {
            const feePayments = paymentsList.filter((p) => p.studentFeeId === fee.id);
            const paid = feePayments.reduce((sum, p) => sum + Number(p.amount), 0);
            const bal = Math.max(0, Number(fee.amount) - paid);
            return {
              ...fee,
              balance: bal,
            };
          })
          .filter((fee) => fee.balance > 0); // Only keep unpaid/partially paid fees

        setUnpaidFees(outstanding);
        if (outstanding.length > 0) {
          setStudentFeeId(outstanding[0].id);
          setAmount(outstanding[0].balance);
        } else {
          setStudentFeeId('none');
          setAmount('');
        }
      })
      .catch((err) => console.error('Failed to query unpaid child fees:', err))
      .finally(() => setFeesLoading(false));
  }, [studentId, open]);

  // Handle assigned fee change to auto-update target payment amount
  const handleFeeChange = (id: string) => {
    setStudentFeeId(id);
    const selected = unpaidFees.find((f) => f.id === id);
    if (selected) {
      setAmount(selected.balance);
    }
  };

  // Reset inputs
  useEffect(() => {
    if (!open) return;
    setStudentId('none');
    setStudentFeeId('none');
    setAmount('');
    setPaymentMethod('Cash');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setReference('');
    setNotes('');
    setError(null);
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (studentId === 'none' || studentFeeId === 'none' || amount === '') {
      setError('Please choose a student, outstanding fee target, and payment amount');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      await financeApi.payments.create({
        studentId,
        studentFeeId,
        amount: Number(amount),
        paymentDate,
        paymentMethod: mapPaymentMethodToApi(paymentMethod),
        reference: reference || undefined,
        notes: notes || undefined,
      });
      setOpen(false);
      onSuccess?.();
    } catch (err: any) {
      setError(err?.message || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Record payment</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record payment</DialogTitle>
          <DialogDescription>
            Add a payment to a student account.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {error && (
            <div className="rounded bg-destructive/15 p-3 text-xs text-destructive font-medium">
              {error}
            </div>
          )}

          <Field label="Student">
            <Select value={studentId} onValueChange={setStudentId} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Choose student" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Choose student</SelectItem>
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Assigned Fee Target">
            <Select value={studentFeeId} onValueChange={handleFeeChange} disabled={loading || feesLoading || unpaidFees.length === 0}>
              <SelectTrigger>
                <SelectValue placeholder={feesLoading ? 'Querying balances...' : unpaidFees.length === 0 ? 'No outstanding fees found' : 'Choose fee target'} />
              </SelectTrigger>
              <SelectContent>
                {unpaidFees.length === 0 && <SelectItem value="none">No outstanding fees</SelectItem>}
                {unpaidFees.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.feeStructure?.name || 'Assigned fee'} (Due: {f.dueDate} | Bal: ${Number(f.balance).toLocaleString()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Amount to pay">
              <Input
                type="number"
                placeholder="1250.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                disabled={loading}
                required
              />
            </Field>

            <Field label="Payment method">
              <Select value={paymentMethod} onValueChange={(val) => setPaymentMethod(val as PaymentMethod)} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Card">Card</SelectItem>
                  <SelectItem value="Online">Online</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Payment date">
              <Input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                disabled={loading}
                required
              />
            </Field>

            <Field label="Reference or Receipt #">
              <Input
                placeholder="TXN-901842"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                disabled={loading}
              />
            </Field>
          </div>

          <Field label="Notes">
            <Textarea
              placeholder="Optional payment notes…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={loading}
            />
          </Field>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || unpaidFees.length === 0}>
              {loading ? 'Recording...' : 'Record payment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ========================================================
// LESSON FORM (CREATE CURRICULUM LESSON / MATERIAL)
// ========================================================
export function LessonForm({
  onSuccess,
  trigger = <Button>Add lesson</Button>,
}: {
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [area, setArea] = useState<string>('PRACTICAL_LIFE');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ageGroup, setAgeGroup] = useState('3-6 years');
  const [sequence, setSequence] = useState('1');
  const [materialsNeeded, setMaterialsNeeded] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setArea('PRACTICAL_LIFE');
    setTitle('');
    setDescription('');
    setAgeGroup('3-6 years');
    setSequence('1');
    setMaterialsNeeded('');
    setError(null);
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required'); return; }
    setError(null);
    setLoading(true);
    try {
      await curriculumApi.lessons.create({
        area,
        title: title.trim(),
        description: description.trim() || undefined,
        ageGroup: ageGroup.trim() || undefined,
        sequence: parseInt(sequence) || 1,
        materialsNeeded: materialsNeeded.trim() || undefined,
      });
      setOpen(false);
      onSuccess?.();
    } catch (err: any) {
      setError(err?.message || 'Failed to create lesson');
    } finally {
      setLoading(false);
    }
  };

  const areaOptions = [
    { value: 'PRACTICAL_LIFE', label: 'Practical Life' },
    { value: 'SENSORIAL', label: 'Sensorial' },
    { value: 'LANGUAGE', label: 'Language' },
    { value: 'MATHEMATICS', label: 'Mathematics' },
    { value: 'CULTURAL', label: 'Cultural' },
    { value: 'ART', label: 'Art' },
    { value: 'MUSIC', label: 'Music' },
    { value: 'MOVEMENT', label: 'Movement' },
    { value: 'SOCIAL_EMOTIONAL', label: 'Social & Emotional' },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Add Curriculum Lesson / Material</DialogTitle>
          <DialogDescription>Create a new Montessori lesson or material in the curriculum catalog.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Field label="Montessori Area">
            <Select value={area} onValueChange={setArea} disabled={loading}>
              <SelectTrigger><SelectValue placeholder="Select area" /></SelectTrigger>
              <SelectContent>
                {areaOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Lesson title">
            <Input placeholder="e.g. Pink Tower Sequencing" value={title} onChange={(e) => setTitle(e.target.value)} disabled={loading} required />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Age group">
              <Input placeholder="3-6 years" value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)} disabled={loading} />
            </Field>
            <Field label="Sequence #">
              <Input type="number" min={1} value={sequence} onChange={(e) => setSequence(e.target.value)} disabled={loading} />
            </Field>
          </div>
          <Field label="Description">
            <Textarea placeholder="Brief description of this lesson..." value={description} onChange={(e) => setDescription(e.target.value)} disabled={loading} />
          </Field>
          <Field label="Materials needed">
            <Textarea placeholder="List materials required for this presentation..." value={materialsNeeded} onChange={(e) => setMaterialsNeeded(e.target.value)} disabled={loading} />
          </Field>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Add lesson'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ========================================================
// LESSON PLAN FORM (SCHEDULE A PRESENTATION)
// ========================================================
export function LessonPlanForm({
  onSuccess,
  trigger = <Button>Schedule presentation</Button>,
}: {
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [lessonsList, setLessonsList] = useState<{ id: string; title: string }[]>([]);
  const [classrooms, setClassrooms] = useState<{ id: string; name: string }[]>([]);
  const [students, setStudents] = useState<{ id: string; name: string }[]>([]);
  const [lessonId, setLessonId] = useState('');
  const [classroomId, setClassroomId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<LessonPlanStatus>('Planned');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLessonId('');
    setClassroomId('');
    setStudentId('');
    setScheduledDate(new Date().toISOString().split('T')[0]);
    setStatus('Planned');
    setNotes('');
    setError(null);
    setLoading(true);
    Promise.allSettled([
      curriculumApi.lessons.list({ isActive: true }),
      apiClient.get<any[]>('/classrooms'),
      apiClient.get<any[]>('/students?isActive=true'),
    ]).then(([lessonsRes, classroomsRes, studentsRes]) => {
      if (lessonsRes.status === 'fulfilled') {
        setLessonsList(lessonsRes.value.map((l: any) => ({ id: l.id, title: l.title })));
        if (lessonsRes.value.length > 0) setLessonId(lessonsRes.value[0].id);
      }
      if (classroomsRes.status === 'fulfilled') {
        setClassrooms(classroomsRes.value.map((c: any) => ({ id: c.id, name: c.name })));
      }
      if (studentsRes.status === 'fulfilled') {
        setStudents(studentsRes.value.map((s: any) => ({ id: s.id, name: `${s.firstName} ${s.lastName}` })));
      }
    }).finally(() => setLoading(false));
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonId) { setError('Please select a lesson'); return; }
    setError(null);
    setLoading(true);
    try {
      await curriculumApi.plans.schedule({
        lessonId,
        classroomId: classroomId || undefined,
        studentId: studentId || undefined,
        scheduledDate,
        status: mapLessonPlanStatusToApi(status),
        notes: notes.trim() || undefined,
      });
      setOpen(false);
      onSuccess?.();
    } catch (err: any) {
      setError(err?.message || 'Failed to schedule presentation');
    } finally {
      setLoading(false);
    }
  };

  const statusOptions: LessonPlanStatus[] = ['Planned', 'Presented', 'Practicing', 'Mastered', 'Deferred'];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Schedule Presentation</DialogTitle>
          <DialogDescription>Plan a Montessori lesson presentation for a student or classroom group.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Field label="Lesson / Material">
            <Select value={lessonId} onValueChange={setLessonId} disabled={loading}>
              <SelectTrigger><SelectValue placeholder="Select a lesson" /></SelectTrigger>
              <SelectContent>
                {lessonsList.map((l) => <SelectItem key={l.id} value={l.id}>{l.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Classroom (optional)">
            <Select value={classroomId} onValueChange={setClassroomId} disabled={loading}>
              <SelectTrigger><SelectValue placeholder="Whole classroom..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">No specific classroom</SelectItem>
                {classrooms.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Student (optional)">
            <Select value={studentId} onValueChange={setStudentId} disabled={loading}>
              <SelectTrigger><SelectValue placeholder="Individual student..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Whole group</SelectItem>
                {students.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Scheduled date">
              <Input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} disabled={loading} required />
            </Field>
            <Field label="Status">
              <Select value={status} onValueChange={(v) => setStatus(v as LessonPlanStatus)} disabled={loading}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {statusOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Notes">
            <Textarea placeholder="Optional observation notes..." value={notes} onChange={(e) => setNotes(e.target.value)} disabled={loading} />
          </Field>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading || !lessonId}>{loading ? 'Scheduling...' : 'Schedule presentation'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ========================================================
// HR / EMPLOYEE FORM (CREATE / UPDATE)
// ========================================================
export function EmployeeForm({
  employeeId,
  onSuccess,
  trigger = <Button>Add employee</Button>,
}: {
  employeeId?: string;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [employeeNumber, setEmployeeNumber] = useState('');
  const [name, setName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [employmentType, setEmploymentType] = useState('FULL_TIME');
  const [hireDate, setHireDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [salary, setSalary] = useState<number | ''>('');
  const [status, setStatus] = useState('ACTIVE');
  const [phone, setPhone] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [userId, setUserId] = useState<string>('none');
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    // Fetch users for binding (optional)
    apiClient.get<any[]>('/users')
      .then((data) => setUsersList(data))
      .catch((err) => console.error('Failed to load users:', err))
      .finally(() => setLoading(false));

    if (employeeId) {
      setLoading(true);
      hrApi.employees.get(employeeId)
        .then((emp) => {
          setEmployeeNumber(emp.employeeNumber);
          setName(emp.name);
          setJobTitle(emp.jobTitle);
          setDepartment(emp.department);
          setEmploymentType(emp.employmentType);
          setHireDate(emp.hireDate.split('T')[0]);
          setSalary(Number(emp.salary));
          setStatus(emp.status);
          setPhone(emp.phone || '');
          setEmergencyContact(emp.emergencyContact || '');
          setUserId(emp.userId || 'none');
        })
        .catch((err) => console.error('Failed to load employee details:', err))
        .finally(() => setLoading(false));
    } else {
      setEmployeeNumber('');
      setName('');
      setJobTitle('');
      setDepartment('');
      setEmploymentType('FULL_TIME');
      setHireDate(new Date().toISOString().split('T')[0]);
      setSalary('');
      setStatus('ACTIVE');
      setPhone('');
      setEmergencyContact('');
      setUserId('none');
      setError(null);
    }
  }, [open, employeeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeNumber || !name || !jobTitle || !department || salary === '') {
      setError('Please fill in all required fields');
      return;
    }
    setError(null);
    setLoading(true);

    const payload = {
      employeeNumber,
      name,
      jobTitle,
      department,
      employmentType: employmentType as any,
      hireDate,
      salary: Number(salary),
      status: status as any,
      phone: phone || null,
      emergencyContact: emergencyContact || null,
      userId: userId === 'none' ? null : userId,
    };

    try {
      if (employeeId) {
        await hrApi.employees.update(employeeId, payload);
      } else {
        await hrApi.employees.create(payload);
      }
      setOpen(false);
      onSuccess?.();
    } catch (err: any) {
      setError(err?.message || 'Failed to save employee');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{employeeId ? 'Edit Employee' : 'Add Employee'}</DialogTitle>
          <DialogDescription>
            {employeeId ? 'Update employee directory information.' : 'Register a new employee record.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {error && <div className="rounded bg-destructive/15 p-3 text-xs text-destructive font-medium">{error}</div>}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Employee Number">
              <Input placeholder="e.g. EMP-101" value={employeeNumber} onChange={(e) => setEmployeeNumber(e.target.value)} disabled={loading} required />
            </Field>
            <Field label="Full Name">
              <Input placeholder="e.g. Maria Montessori" value={name} onChange={(e) => setName(e.target.value)} disabled={loading} required />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Job Title">
              <Input placeholder="e.g. Lead Guide" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} disabled={loading} required />
            </Field>
            <Field label="Department">
              <Input placeholder="e.g. Primary Room" value={department} onChange={(e) => setDepartment(e.target.value)} disabled={loading} required />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Employment Type">
              <Select value={employmentType} onValueChange={setEmploymentType} disabled={loading}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FULL_TIME">Full Time</SelectItem>
                  <SelectItem value="PART_TIME">Part Time</SelectItem>
                  <SelectItem value="CONTRACT">Contract</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Salary">
              <Input type="number" placeholder="45000" value={salary} onChange={(e) => setSalary(e.target.value === '' ? '' : Number(e.target.value))} disabled={loading} required />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Hire Date">
              <Input type="date" value={hireDate} onChange={(e) => setHireDate(e.target.value)} disabled={loading} required />
            </Field>
            <Field label="Status">
              <Select value={status} onValueChange={setStatus} disabled={loading}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="ON_LEAVE">On Leave</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone">
              <Input placeholder="+1 555-0192" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={loading} />
            </Field>
            <Field label="Emergency Contact">
              <Input placeholder="Name / Phone" value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} disabled={loading} />
            </Field>
          </div>

          <Field label="Linked User Account (optional)">
            <Select value={userId} onValueChange={setUserId} disabled={loading}>
              <SelectTrigger><SelectValue placeholder="Choose user account" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No associated user account</SelectItem>
                {usersList.map((u) => <SelectItem key={u.id} value={u.id}>{u.name} ({u.email})</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Employee'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ========================================================
// LEAVE REQUEST FORM (SUBMIT REQUEST)
// ========================================================
export function LeaveRequestForm({
  onSuccess,
  trigger = <Button>Request leave</Button>,
}: {
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [employeeId, setEmployeeId] = useState('none');
  const [leaveType, setLeaveType] = useState('CASUAL');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    hrApi.employees.list()
      .then((data) => {
        setEmployees(data.filter(e => e.status !== 'INACTIVE'));
        if (data.length > 0) setEmployeeId(data[0].id);
      })
      .catch((err) => console.error('Failed to load employees for leave request:', err))
      .finally(() => setLoading(false));

    setLeaveType('CASUAL');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate(new Date().toISOString().split('T')[0]);
    setReason('');
    setError(null);
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (employeeId === 'none') { setError('Please select an employee'); return; }
    setError(null);
    setLoading(true);

    try {
      await hrApi.leaves.create({
        employeeId,
        leaveType,
        startDate,
        endDate,
        reason: reason.trim() || undefined,
      });
      setOpen(false);
      onSuccess?.();
    } catch (err: any) {
      setError(err?.message || 'Failed to submit leave request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Submit Leave Request</DialogTitle>
          <DialogDescription>Submit a new leave request for approval.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {error && <div className="rounded bg-destructive/15 p-3 text-xs text-destructive font-medium">{error}</div>}

          <Field label="Employee">
            <Select value={employeeId} onValueChange={setEmployeeId} disabled={loading}>
              <SelectTrigger><SelectValue placeholder="Choose employee" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Choose employee</SelectItem>
                {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.name} ({e.jobTitle})</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Leave Type">
            <Select value={leaveType} onValueChange={setLeaveType} disabled={loading}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="SICK">Sick Leave</SelectItem>
                <SelectItem value="CASUAL">Casual Leave</SelectItem>
                <SelectItem value="ANNUAL">Annual Leave</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Start Date">
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} disabled={loading} required />
            </Field>
            <Field label="End Date">
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} disabled={loading} required />
            </Field>
          </div>

          <Field label="Reason">
            <Textarea placeholder="Explain the reason for this request..." value={reason} onChange={(e) => setReason(e.target.value)} disabled={loading} />
          </Field>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading || employeeId === 'none'}>{loading ? 'Submitting...' : 'Submit Request'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ========================================================
// INVENTORY ITEM FORM (CREATE / UPDATE)
// ========================================================
export function InventoryItemForm({
  itemId,
  onSuccess,
  trigger = <Button>Add item</Button>,
}: {
  itemId?: string;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [minimumStock, setMinimumStock] = useState<number | ''>(5);
  const [unit, setUnit] = useState('units');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (itemId) {
      setLoading(true);
      inventoryApi.items.get(itemId)
        .then((item) => {
          setName(item.name);
          setCategory(item.category);
          setDescription(item.description || '');
          setQuantity(item.quantity);
          setMinimumStock(item.minimumStock);
          setUnit(item.unit);
          setLocation(item.location || '');
          setStatus(item.status);
        })
        .catch((err) => console.error('Failed to load inventory item:', err))
        .finally(() => setLoading(false));
    } else {
      setName('');
      setCategory('');
      setDescription('');
      setQuantity('');
      setMinimumStock(5);
      setUnit('units');
      setLocation('');
      setStatus('ACTIVE');
      setError(null);
    }
  }, [open, itemId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !category) {
      setError('Please fill in name and category');
      return;
    }
    setError(null);
    setLoading(true);

    const payload = {
      name,
      category,
      description: description || undefined,
      quantity: quantity === '' ? undefined : Number(quantity),
      minimumStock: minimumStock === '' ? undefined : Number(minimumStock),
      unit,
      location: location || undefined,
      status: status as any,
    };

    try {
      if (itemId) {
        await inventoryApi.items.update(itemId, payload);
      } else {
        await inventoryApi.items.create(payload as any);
      }
      setOpen(false);
      onSuccess?.();
    } catch (err: any) {
      setError(err?.message || 'Failed to save inventory item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{itemId ? 'Edit Item' : 'Add Inventory Item'}</DialogTitle>
          <DialogDescription>Define an item in the school catalog.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {error && <div className="rounded bg-destructive/15 p-3 text-xs text-destructive font-medium">{error}</div>}

          <Field label="Item Name">
            <Input placeholder="e.g. Montessori Pink Tower" value={name} onChange={(e) => setName(e.target.value)} disabled={loading} required />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category">
              <Input placeholder="e.g. Sensorial" value={category} onChange={(e) => setCategory(e.target.value)} disabled={loading} required />
            </Field>
            <Field label="Unit of Measure">
              <Input placeholder="e.g. set, units, box" value={unit} onChange={(e) => setUnit(e.target.value)} disabled={loading} required />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Initial Quantity">
              <Input type="number" min={0} placeholder="0" value={quantity} onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))} disabled={loading || !!itemId} />
            </Field>
            <Field label="Minimum Threshold">
              <Input type="number" min={0} placeholder="5" value={minimumStock} onChange={(e) => setMinimumStock(e.target.value === '' ? '' : Number(e.target.value))} disabled={loading} />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Storage Location">
              <Input placeholder="e.g. Cabinet A, Room 1" value={location} onChange={(e) => setLocation(e.target.value)} disabled={loading} />
            </Field>
            <Field label="Status">
              <Select value={status} onValueChange={setStatus} disabled={loading}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="Description">
            <Textarea placeholder="Details about this item..." value={description} onChange={(e) => setDescription(e.target.value)} disabled={loading} />
          </Field>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Item'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ========================================================
// STOCK ADJUSTMENT FORM (STOCK IN / STOCK OUT)
// ========================================================
export function StockAdjustmentForm({
  item,
  type,
  onSuccess,
  trigger,
}: {
  item: InventoryItem;
  type: 'STOCK_IN' | 'STOCK_OUT';
  onSuccess?: () => void;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState<number | ''>(1);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setQuantity(1);
    setReason('');
    setError(null);
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity === '' || Number(quantity) <= 0) {
      setError('Quantity must be greater than zero');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      if (type === 'STOCK_IN') {
        await inventoryApi.items.stockIn(item.id, { quantity: Number(quantity), reason: reason.trim() || undefined });
      } else {
        await inventoryApi.items.stockOut(item.id, { quantity: Number(quantity), reason: reason.trim() || undefined });
      }
      setOpen(false);
      onSuccess?.();
    } catch (err: any) {
      setError(err?.message || 'Failed to adjust stock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{type === 'STOCK_IN' ? 'Stock In' : 'Stock Out'}</DialogTitle>
          <DialogDescription>
            {type === 'STOCK_IN'
              ? `Add stock to "${item.name}" (Current: ${item.quantity} ${item.unit}).`
              : `Withdraw stock from "${item.name}" (Current: ${item.quantity} ${item.unit}).`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {error && <div className="rounded bg-destructive/15 p-3 text-xs text-destructive font-medium">{error}</div>}

          <Field label="Adjustment Quantity">
            <Input type="number" min={1} max={type === 'STOCK_OUT' ? item.quantity : undefined} value={quantity} onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))} disabled={loading} required />
          </Field>

          <Field label="Reason / Notes">
            <Input placeholder={type === 'STOCK_IN' ? 'Restocking' : 'Classroom usage'} value={reason} onChange={(e) => setReason(e.target.value)} disabled={loading} />
          </Field>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Adjusting...' : 'Confirm'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ========================================================
// ANNOUNCEMENT FORM (CREATE / UPDATE)
// ========================================================
export function AnnouncementForm({
  announcementId,
  onSuccess,
  trigger = <Button>New announcement</Button>,
}: {
  announcementId?: string;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [audience, setAudience] = useState('ALL');
  const [priority, setPriority] = useState('NORMAL');
  const [isPublished, setIsPublished] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (announcementId) {
      setLoading(true);
      communicationApi.announcements.get(announcementId)
        .then((ann) => {
          setTitle(ann.title);
          setContent(ann.content);
          setAudience(ann.audience);
          setPriority(ann.priority);
          setIsPublished(ann.isPublished);
        })
        .catch((err) => console.error('Failed to load announcement:', err))
        .finally(() => setLoading(false));
    } else {
      setTitle('');
      setContent('');
      setAudience('ALL');
      setPriority('NORMAL');
      setIsPublished(true);
      setError(null);
    }
  }, [open, announcementId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Please fill in title and content');
      return;
    }
    setError(null);
    setLoading(true);

    const payload = {
      title: title.trim(),
      content: content.trim(),
      audience: audience as any,
      priority: priority as any,
      isPublished,
    };

    try {
      if (announcementId) {
        await communicationApi.announcements.update(announcementId, payload);
      } else {
        await communicationApi.announcements.create(payload as any);
      }
      setOpen(false);
      onSuccess?.();
    } catch (err: any) {
      setError(err?.message || 'Failed to save announcement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{announcementId ? 'Edit Announcement' : 'New Announcement'}</DialogTitle>
          <DialogDescription>Broadcast a message to targeted user roles.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {error && <div className="rounded bg-destructive/15 p-3 text-xs text-destructive font-medium">{error}</div>}

          <Field label="Title">
            <Input placeholder="e.g. Field Trip Tomorrow" value={title} onChange={(e) => setTitle(e.target.value)} disabled={loading} required />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Audience Target">
              <Select value={audience} onValueChange={setAudience} disabled={loading}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Roles</SelectItem>
                  <SelectItem value="TEACHERS">Teachers Only</SelectItem>
                  <SelectItem value="PARENTS">Parents Only</SelectItem>
                  <SelectItem value="ADMINS">Admins Only</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field label="Priority Level">
              <Select value={priority} onValueChange={setPriority} disabled={loading}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NORMAL">Normal</SelectItem>
                  <SelectItem value="IMPORTANT">Important</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="Announcement Message">
            <Textarea placeholder="Write details..." value={content} onChange={(e) => setContent(e.target.value)} disabled={loading} rows={5} required />
          </Field>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="isPublished" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} className="h-4 w-4 rounded border-border" disabled={loading} />
            <Label htmlFor="isPublished" className="cursor-pointer">Publish announcement immediately</Label>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Announcement'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}