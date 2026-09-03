'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, CalendarCheck, CheckCircle2, CircleDollarSign, Mail, MapPin, Phone, Sparkles, Users, Star } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { AreaBadge, AvatarText, ObservationCard, AssessmentCard, ProgressBar, ProgressRing, SectionHeader, StatusBadge } from '@/components/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { assessments, observations, payments, learningProgressData, attendanceRecords } from '@/lib/mock-data';
import { studentsApi } from '@/lib/api/students';
import { observationsApi } from '@/lib/api/observations';
import { assessmentsApi } from '@/lib/api/assessments';
import { gamificationApi } from '@/lib/api/gamification';
import { aiApi } from '@/lib/api/ai';
import { attendanceApi } from '@/lib/api/attendance';
import { financeApi } from '@/lib/api/finance';
import { mapApiStudent, mapApiObservation, mapApiAssessment, mapApiProgress, mapApiAttendance, mapApiStudentFee, mapApiPayment } from '@/lib/utils';
import { Student, Observation, Assessment, LearningProgress, StudentDevelopmentInsight, AttendanceRecord, StudentFee, Payment } from '@/types';
import { useAuth } from '@/lib/auth/auth-context';
import { StudentForm } from '@/components/forms/record-forms';

export default function StudentDetailPage() {
  const params = useParams<{ id: string }>();
  const [student, setStudent] = useState<Student | null>(null);
  const [realObservations, setRealObservations] = useState<Observation[]>([]);
  const [realAssessments, setRealAssessments] = useState<Assessment[]>([]);
  const [realProgress, setRealProgress] = useState<LearningProgress | null>(null);
  const [realAttendance, setRealAttendance] = useState<AttendanceRecord[]>([]);
  const [realPayments, setRealPayments] = useState<Payment[]>([]);
  const [realStudentFees, setRealStudentFees] = useState<StudentFee[]>([]);
  const [gamificationSummary, setGamificationSummary] = useState<any>(null);
  const [insight, setInsight] = useState<StudentDevelopmentInsight | null>(null);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const loadStudent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const apiStudent = await studentsApi.get(params.id);
      const studentName = `${apiStudent.firstName} ${apiStudent.lastName}`;
      setStudent(mapApiStudent(apiStudent));

      const apiObs = await observationsApi.list({ studentId: params.id });
      setRealObservations(apiObs.map(mapApiObservation));

      const apiAssess = await assessmentsApi.list({ studentId: params.id });
      setRealAssessments(apiAssess.map(mapApiAssessment));

      const apiProg = await assessmentsApi.progress(params.id);
      setRealProgress(mapApiProgress(apiProg, studentName));
      
      try {
        const gamificationData = await gamificationApi.points.studentSummary(params.id);
        setGamificationSummary(gamificationData);
      } catch (gErr) {
        console.error('Failed to load gamification summary', gErr);
      }

      try {
        const apiAttendance = await attendanceApi.list(undefined, undefined, params.id);
        setRealAttendance(apiAttendance.map(mapApiAttendance));
      } catch (attErr) {
        console.error('Failed to load real attendance records', attErr);
      }

      try {
        const apiFees = await financeApi.studentFees.list({ studentId: params.id });
        setRealStudentFees(apiFees.map(mapApiStudentFee));
      } catch (feeErr) {
        console.error('Failed to load real student fees', feeErr);
      }

      try {
        const apiPayments = await financeApi.payments.list({ studentId: params.id });
        setRealPayments(apiPayments.map(mapApiPayment));
      } catch (payErr) {
        console.error('Failed to load real student payments', payErr);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load student profile details');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    loadStudent();
  }, [loadStudent]);

  const generateInsights = async () => {
    setGenerating(true);
    try {
      const res = await aiApi.studentInsights(params.id);
      setInsight(res);
    } catch (err: any) {
      alert(err?.message || 'Failed to generate developmental insights');
    } finally {
      setGenerating(false);
    }
  };

  const isEditable = user?.role === 'SUPER_ADMIN' || user?.role === 'SCHOOL_ADMIN';

  // Fallback to static mock datasets using constant 's1' key to keep unintegrated visual tabs populated
  const mockStudentId = 's1';
  const studentObservations = realObservations.length ? realObservations : observations.filter((o) => o.studentId === mockStudentId);
  const studentAssessments = realAssessments.length ? realAssessments : assessments.filter((a) => a.studentId === mockStudentId);
  const studentPayments = realPayments.length ? realPayments : payments.filter((p) => p.studentId === mockStudentId);
  const progress = learningProgressData.find((p) => p.studentId === mockStudentId) || learningProgressData[0];
  const progressDisplay = realProgress || progress;
  const studentAttendance = realAttendance.length ? realAttendance : attendanceRecords.filter((a) => a.studentId === mockStudentId);

  const calculatedAttendanceRate = realAttendance.length
    ? Math.round((realAttendance.filter((a) => a.status === 'Present' || a.status === 'Late').length / realAttendance.length) * 100)
    : 96;

  const calculatedOutstandingBalance = realStudentFees.length
    ? realStudentFees.reduce((sum, f) => sum + (f.balance || 0), 0)
    : 0;

  if (loading) {
    return (
      <AppShell>
        <div className="flex justify-center items-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </AppShell>
    );
  }

  if (error || !student) {
    return (
      <AppShell>
        <Link href="/students" className="mb-6 inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to students
        </Link>
        <div className="rounded-lg bg-destructive/15 p-4 text-sm text-destructive mt-4">
          {error || 'Student profile not found'}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Link href="/students" className="mb-6 inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to students
      </Link>

      <div className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <span className={`flex h-16 w-16 items-center justify-center rounded-xl text-lg font-semibold ${student.color}`}>
            {student.initials}
          </span>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">{student.name}</h1>
              <StatusBadge status={student.status} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {student.classroom} · {student.age} · Joined {student.joined}
            </p>
          </div>
        </div>
        {isEditable && (
          <StudentForm studentId={student.id} onSuccess={loadStudent} trigger={
            <Button variant="outline">Edit profile</Button>
          } />
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CalendarCheck className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xl font-semibold">{calculatedAttendanceRate}%</p>
              <p className="text-xs text-muted-foreground">Attendance</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xl font-semibold">{progressDisplay.overallScore}%</p>
              <p className="text-xs text-muted-foreground">Learning progress</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-400/10 text-sky-300">
              <CircleDollarSign className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xl font-semibold">${calculatedOutstandingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <p className="text-xs text-muted-foreground">Outstanding balance</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="mt-6">
        <TabsList className="flex w-full flex-wrap gap-1 overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="observations">Observations</TabsTrigger>
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="finance">Finance</TabsTrigger>
          <TabsTrigger value="gamification">Gamification</TabsTrigger>
          <TabsTrigger value="ai-insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-[15px]">Student information</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="eyebrow mb-1">Classroom</p>
                    <p className="text-sm">{student.classroom}</p>
                  </div>
                  <div>
                    <p className="eyebrow mb-1">Primary guardian</p>
                    <p className="text-sm">{student.guardian}</p>
                  </div>
                  <div>
                    <p className="eyebrow mb-1">Contact</p>
                    <p className="flex items-center gap-2 text-sm">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" /> {student.guardianEmail || 'No contact email'}
                    </p>
                  </div>
                  <div>
                    <p className="eyebrow mb-1">Phone</p>
                    <p className="flex items-center gap-2 text-sm">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" /> {student.guardianPhone || 'No contact phone'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-[15px]">Recent observations</CardTitle>
                  <Link href="/observations" className="text-xs text-primary">View all</Link>
                </CardHeader>
                <CardContent className="space-y-4">
                  {studentObservations.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex gap-3 border-b border-border/70 pb-4 last:border-0 last:pb-0">
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium">{item.area}</p>
                          <StatusBadge status={item.progress} />
                        </div>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.note}</p>
                        <p className="mt-1 text-[11px] text-muted-foreground/70">{item.date}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-[15px]">Learning progress</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center pb-6 pt-2">
                  <ProgressRing value={progress.overallScore} label="overall" />
                  <p className="mt-4 text-xs text-muted-foreground">Strongest area: {progress.strongestArea}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-[15px]">Recent assessments</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {studentAssessments.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.area} · {item.date}</p>
                      </div>
                      <span className="text-sm font-semibold text-primary">{item.score}%</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="profile" className="mt-4">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle className="text-[15px]">Profile details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="eyebrow mb-1">Full name</p>
                <p className="text-sm">{student.name}</p>
              </div>
              <div>
                <p className="eyebrow mb-1">Date of birth</p>
                <p className="text-sm">{student.dateOfBirth.split('T')[0]}</p>
              </div>
              <div>
                <p className="eyebrow mb-1">Age</p>
                <p className="text-sm">{student.age}</p>
              </div>
              <div>
                <p className="eyebrow mb-1">Classroom</p>
                <p className="text-sm">{student.classroom}</p>
              </div>
              <div>
                <p className="eyebrow mb-1">Guardian</p>
                <p className="text-sm">{student.guardian}</p>
              </div>
              <div>
                <p className="eyebrow mb-1">Guardian email</p>
                <p className="text-sm">{student.guardianEmail || 'Not configured'}</p>
              </div>
              <div>
                <p className="eyebrow mb-1">Guardian phone</p>
                <p className="text-sm">{student.guardianPhone || 'Not configured'}</p>
              </div>
              <div>
                <p className="eyebrow mb-1">Joined</p>
                <p className="text-sm">{student.joined}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="eyebrow mb-1">Address</p>
                <p className="flex items-center gap-2 text-sm">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> {student.address || 'No address configured'}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-[15px]">Attendance records</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {studentAttendance.length ? (
                studentAttendance.map((record) => (
                  <div key={record.id} className="flex items-center justify-between border-b border-border/70 pb-3 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{record.date}</p>
                      <p className="text-xs text-muted-foreground">{record.arrivalTime || 'No arrival'}</p>
                    </div>
                    <StatusBadge status={record.status} />
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No attendance records yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="observations" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {realObservations.length ? (
              realObservations.map((item) => <ObservationCard key={item.id} observation={item} />)
            ) : (
              <p className="text-sm text-muted-foreground">No observations recorded yet.</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="assessments" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {realAssessments.length ? (
              realAssessments.map((item) => <AssessmentCard key={item.id} assessment={item} />)
            ) : (
              <p className="text-sm text-muted-foreground">No assessments recorded yet.</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="progress" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
            <Card>
              <CardHeader>
                <CardTitle className="text-[15px]">Overall progress</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center pb-6 pt-2">
                <ProgressRing value={progressDisplay.overallScore} label="overall" />
                <p className="mt-4 text-xs text-muted-foreground">Strongest area: {progressDisplay.strongestArea}</p>
                <p className="mt-1 text-xs text-muted-foreground">{progressDisplay.totalAssessments} assessments recorded</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-[15px]">Progress by area</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {progressDisplay.areas.map((area) => (
                  <div key={area.area}>
                    <div className="mb-2 flex items-center justify-between">
                      <AreaBadge area={area.area} />
                      <StatusBadge status={area.level} />
                    </div>
                    <ProgressBar value={area.score} showValue />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {progressDisplay.areasNeedingAttention.length > 0 && (
            <div className="mt-6">
              <SectionHeader title="Areas needing attention" />
              <div className="grid gap-4 sm:grid-cols-2">
                {progressDisplay.areasNeedingAttention.map((area) => (
                  <Card key={area.area} className="border-secondary/20 bg-secondary/[0.03]">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <AreaBadge area={area.area} />
                        <span className="text-sm font-semibold text-secondary">{area.score}%</span>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">{area.note}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="finance" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
            <Card>
              <CardHeader>
                <CardTitle className="text-[15px]">Finance summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between border-b border-border/70 pb-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Term 3 tuition</p>
                    <p className="mt-1 text-sm font-medium">$1,250.00</p>
                  </div>
                  <StatusBadge status="Paid" />
                </div>
                <div className="flex items-center gap-2 pt-4 text-xs text-primary">
                  <CheckCircle2 className="h-4 w-4" /> All payments up to date
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-[15px]">Recent payments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {studentPayments.length ? (
                  studentPayments.map((item) => (
                    <div key={item.id} className="flex items-center justify-between border-b border-border/70 pb-3 last:border-0">
                      <div>
                        <p className="text-sm font-medium">{item.formattedAmount}</p>
                        <p className="text-xs text-muted-foreground">{item.type} · {item.date}</p>
                      </div>
                      <StatusBadge status={item.status} />
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No payments recorded.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="gamification" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
            <Card>
              <CardHeader>
                <CardTitle className="text-[15px]">Points & Badges</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
                  <span className="text-2xl font-bold">{gamificationSummary?.totalPoints ?? 0}</span>
                  <span className="text-sm text-muted-foreground">total points</span>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground/70 mb-2">Earned Badges</p>
                  {gamificationSummary?.badges && gamificationSummary.badges.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {gamificationSummary.badges.map((sb: any) => (
                        <div key={sb.id} className="flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1.5 text-xs text-foreground">
                          <span>{sb.badge?.icon || '🏅'}</span>
                          <span className="font-medium">{sb.badge?.name}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No badges earned yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-[15px]">Points History</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {gamificationSummary?.history && gamificationSummary.history.length > 0 ? (
                  gamificationSummary.history.map((record: any) => (
                    <div key={record.id} className="flex items-center justify-between border-b border-border/70 pb-3 last:border-0 last:pb-0">
                      <div>
                        <p className="text-sm font-medium text-foreground">{record.reason}</p>
                        <p className="text-xs text-muted-foreground">
                          Awarded by {record.awardedBy?.name || 'Teacher'} on {new Date(record.awardedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-amber-400">+{record.points} pts</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No points transactions recorded yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ai-insights" className="mt-4">
          {generating ? (
            <Card className="border-primary/20 bg-primary/[0.02]">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mb-4" />
                <p className="text-sm font-medium text-foreground">Analyzing student observations and scores...</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  We are parsing recent skill achievements and learning areas to generate developmental insights.
                </p>
              </CardContent>
            </Card>
          ) : insight ? (
            <div className="space-y-6">
              {/* Summary */}
              <Card className="border-secondary/20 bg-secondary/[0.02]">
                <CardHeader>
                  <CardTitle className="text-[15px] flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-secondary shrink-0" />
                    Developmental Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-6 text-foreground">{insight.summary}</p>
                </CardContent>
              </Card>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Column 1: Strengths & Attention */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-[15px] text-primary">Strengths</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {insight.strengths.map((str, idx) => (
                        <div key={idx} className="flex gap-2.5 items-start text-sm">
                          <span className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                          <span>{str}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-[15px] text-amber-500">Areas Needing Attention</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {insight.areasNeedingAttention.map((area, idx) => (
                        <div key={idx} className="flex gap-2.5 items-start text-sm">
                          <span className="h-2 w-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                          <span>{area}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                {/* Column 2: Next Steps & Activities */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-[15px] text-foreground">Recommended Next Steps</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {insight.nextSteps.map((step, idx) => (
                        <div key={idx} className="flex gap-2.5 items-start text-sm text-muted-foreground">
                          <span className="font-semibold text-foreground shrink-0">{idx + 1}.</span>
                          <span>{step}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-[15px] text-foreground">Suggested Montessori Activities</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {insight.suggestedActivities.map((act, idx) => (
                        <div key={idx} className="border-b border-border/60 pb-3 last:border-0 last:pb-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-semibold text-foreground">{act.title}</span>
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border/70">
                              {act.area}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-4">{act.reason}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={generateInsights} variant="outline" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Regenerate insights
                </Button>
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground mb-4">
                  <Sparkles className="h-6 w-6" />
                </span>
                <p className="text-sm font-medium text-foreground">No developmental insights generated yet</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mb-6">
                  Analyze this student's learning progress, attendance patterns, and observations with Montessori intelligence.
                </p>
                <Button onClick={generateInsights} className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Generate Insights
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
