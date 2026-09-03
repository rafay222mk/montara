'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, CalendarCheck, CircleDollarSign, Sparkles, Star, Trophy } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { AssessmentCard, ObservationCard, PageHeader, ProgressBar, ProgressRing } from '@/components/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { assessments, children, learningProgressData, studentFees } from '@/lib/mock-data';
import { observationsApi } from '@/lib/api/observations';
import { assessmentsApi } from '@/lib/api/assessments';
import { gamificationApi } from '@/lib/api/gamification';
import { aiApi } from '@/lib/api/ai';
import { studentsApi } from '@/lib/api/students';
import { attendanceApi } from '@/lib/api/attendance';
import { financeApi } from '@/lib/api/finance';
import { mapApiObservation, mapApiAssessment, mapApiProgress, mapApiStudent, mapApiAttendance, mapApiStudentFee } from '@/lib/utils';
import { Observation, Assessment, LearningProgress, StudentDevelopmentInsight, Student, AttendanceRecord, StudentFee } from '@/types';

export default function ParentStudentPage({ params }: { params: { id: string } }) {
  const childMock = children.find((item) => item.id === params.id) || children[0];
  const progressMock = learningProgressData.find((item) => item.studentId === childMock.id) || learningProgressData[0];
  const feeMock = studentFees.find((item) => item.studentId === childMock.id);

  const [realChild, setRealChild] = useState<Student | null>(null);
  const [realObservations, setRealObservations] = useState<Observation[]>([]);
  const [realAssessments, setRealAssessments] = useState<Assessment[]>([]);
  const [realProgress, setRealProgress] = useState<LearningProgress | null>(null);
  const [realAttendance, setRealAttendance] = useState<AttendanceRecord[]>([]);
  const [realStudentFees, setRealStudentFees] = useState<StudentFee[]>([]);
  const [gamificationSummary, setGamificationSummary] = useState<any>(null);
  const [insight, setInsight] = useState<StudentDevelopmentInsight | null>(null);

  const activeChild = realChild || childMock;
  const progressDisplay = realProgress || progressMock;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.allSettled([
      observationsApi.list({ studentId: params.id }),
      assessmentsApi.list({ studentId: params.id }),
      assessmentsApi.progress(params.id),
      gamificationApi.points.studentSummary(params.id),
      aiApi.studentInsights(params.id),
      studentsApi.get(params.id),
      attendanceApi.list(undefined, undefined, params.id),
      financeApi.studentFees.list({ studentId: params.id }),
    ])
      .then(([obsRes, assessRes, progressRes, gamificationRes, aiRes, studentRes, attendanceRes, feesRes]) => {
        if (obsRes.status === 'fulfilled') setRealObservations(obsRes.value.map(mapApiObservation));
        if (assessRes.status === 'fulfilled') setRealAssessments(assessRes.value.map(mapApiAssessment));
        if (progressRes.status === 'fulfilled') setRealProgress(mapApiProgress(progressRes.value, activeChild.name));
        if (gamificationRes.status === 'fulfilled') setGamificationSummary(gamificationRes.value);
        if (aiRes.status === 'fulfilled') setInsight(aiRes.value);
        if (studentRes.status === 'fulfilled') setRealChild(mapApiStudent(studentRes.value));
        if (attendanceRes.status === 'fulfilled') setRealAttendance(attendanceRes.value.map(mapApiAttendance));
        if (feesRes.status === 'fulfilled') setRealStudentFees(feesRes.value.map(mapApiStudentFee));
      })
      .catch((err) => {
        console.error('Failed to load child details for parent view:', err);
        setError('Could not load student profile data.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [params.id, activeChild.name]);

  const calculatedAttendanceRate = realAttendance.length
    ? Math.round((realAttendance.filter((a) => a.status === 'Present' || a.status === 'Late').length / realAttendance.length) * 100)
    : childMock.attendanceRate;

  const calculatedOutstandingBalance = realStudentFees.length
    ? realStudentFees.reduce((sum, f) => sum + (f.balance || 0), 0)
    : feeMock?.balance || 0;

  return (
    <AppShell>
      <Link
        href="/parent"
        className="mb-6 inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to family space
      </Link>

      <PageHeader
        eyebrow="Family space / Child profile"
        title={activeChild.name}
        description={`${activeChild.classroom} · ${activeChild.age}`}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <CalendarCheck className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xl font-semibold">{calculatedAttendanceRate}%</p>
              <p className="text-xs text-muted-foreground">Attendance</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Sparkles className="h-5 w-5 text-secondary" />
            <div>
              <p className="text-xl font-semibold">{progressDisplay.overallScore}%</p>
              <p className="text-xs text-muted-foreground">Learning progress</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <CircleDollarSign className="h-5 w-5 text-sky-300" />
            <div>
              <p className="text-xl font-semibold">${calculatedOutstandingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <p className="text-xs text-muted-foreground">Balance</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {insight && (
        <Card className="mt-6 border-secondary/20 bg-secondary/[0.02]">
          <CardHeader>
            <CardTitle className="text-[15px] flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-secondary shrink-0" />
              AI Developmental Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-6 text-foreground">{insight.summary}</p>
            <div className="grid gap-4 md:grid-cols-2 pt-3 border-t border-border/50">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Strengths</p>
                <div className="space-y-1.5">
                  {insight.strengths.map((str, idx) => (
                    <p key={idx} className="text-xs text-foreground flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" /> {str}
                    </p>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Suggested Activities</p>
                <div className="space-y-2">
                  {insight.suggestedActivities.map((act, idx) => (
                    <div key={idx} className="text-xs leading-4">
                      <span className="font-semibold text-foreground">{act.title}</span>
                      <span className="text-[10px] text-muted-foreground ml-1.5">({act.area})</span>
                      <p className="text-[11px] text-muted-foreground/90 mt-0.5">{act.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-[15px]">Learning progress</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <ProgressRing value={progressDisplay.overallScore} label="overall" />
              <div className="mt-6 w-full space-y-4">
                {progressDisplay.areas.slice(0, 6).map((area) => (
                  <ProgressBar key={area.area} value={area.score} label={area.area} />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-[15px]">Achievements & Points</CardTitle>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                <span className="text-sm font-bold text-foreground">{gamificationSummary?.totalPoints ?? 0}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground/70 mb-2">Earned Badges</p>
                {gamificationSummary?.badges && gamificationSummary.badges.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {gamificationSummary.badges.map((sb: any) => (
                      <div key={sb.id} className="flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-2.5 py-1 text-xs text-foreground">
                        <span>{sb.badge?.icon || '🏅'}</span>
                        <span>{sb.badge?.name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No badges earned yet.</p>
                )}
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground/70 mb-2">Recent Points</p>
                {gamificationSummary?.history && gamificationSummary.history.length > 0 ? (
                  <div className="space-y-2">
                    {gamificationSummary.history.slice(0, 3).map((record: any) => (
                      <div key={record.id} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground truncate max-w-[150px]">{record.reason}</span>
                        <span className="font-semibold text-amber-400 shrink-0">+{record.points} pts</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No points history yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="mb-4 text-[15px] font-semibold">Recent observations</h2>
            
            {loading && (
              <div className="flex justify-center py-6">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            )}

            {error && (
              <p className="text-xs text-destructive bg-destructive/10 p-3 rounded">
                {error}
              </p>
            )}

            {!loading && !error && (
              <div className="grid gap-4">
                {realObservations.length ? (
                  realObservations.map((item) => (
                    <ObservationCard key={item.id} observation={item} />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No observations yet.</p>
                )}
              </div>
            )}
          </div>

          <div>
            <h2 className="mb-4 text-[15px] font-semibold">Recent assessments</h2>
            
            {loading && (
              <div className="flex justify-center py-6">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            )}

            {!loading && (
              <div className="grid gap-4">
                {realAssessments.length ? (
                  realAssessments.map((item) => (
                    <AssessmentCard key={item.id} assessment={item} />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No assessments yet.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
