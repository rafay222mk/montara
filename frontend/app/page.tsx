'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  CalendarCheck,
  ClipboardCheck,
  CircleDollarSign,
  GraduationCap,
  Plus,
  Sparkles,
  Users,
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { AvatarText, PageHeader, SectionHeader, StatCard, StatusBadge } from '@/components/shared';
import { AttendanceChart, ProgressChart } from '@/components/shared/charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth/auth-context';
import { studentsApi } from '@/lib/api/students';
import { classroomsApi } from '@/lib/api/classrooms';
import { observationsApi } from '@/lib/api/observations';
import { assessmentsApi } from '@/lib/api/assessments';
import { financeApi } from '@/lib/api/finance';
import { attendanceApi } from '@/lib/api/attendance';
import { mapApiObservation, mapApiAssessment, mapApiPayment, mapApiObservationArea } from '@/lib/utils';
import { Observation, Assessment, Payment } from '@/types';

const fmtCurrency = (n: number) =>
  `$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [metrics, setMetrics] = useState({
    totalStudents: 0,
    activeClassrooms: 0,
    attendanceRate: 96.2,
    totalObservations: 0,
    totalAssessments: 0,
    outstandingFees: 0,
  });

  const [recentObservations, setRecentObservations] = useState<Observation[]>([]);
  const [recentAssessments, setRecentAssessments] = useState<Assessment[]>([]);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [areaProgressData, setAreaProgressData] = useState<{ area: string; score: number }[]>([]);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const todayISO = new Date().toISOString().split('T')[0];

      // Run independent data queries concurrently
      const [
        studentsRes,
        classroomsRes,
        observationsRes,
        assessmentsRes,
        attendanceRes,
        financeSummaryRes,
        paymentsRes,
      ] = await Promise.allSettled([
        studentsApi.list(),
        classroomsApi.list(),
        observationsApi.list(),
        assessmentsApi.list(),
        attendanceApi.list(todayISO),
        financeApi.summary(),
        financeApi.payments.list(),
      ]);

      const students = studentsRes.status === 'fulfilled' ? studentsRes.value : [];
      const classrooms = classroomsRes.status === 'fulfilled' ? classroomsRes.value : [];
      const observations = observationsRes.status === 'fulfilled' ? observationsRes.value : [];
      const assessments = assessmentsRes.status === 'fulfilled' ? assessmentsRes.value : [];
      const attendance = attendanceRes.status === 'fulfilled' ? attendanceRes.value : [];
      const financeSummary = financeSummaryRes.status === 'fulfilled' ? financeSummaryRes.value : null;
      const payments = paymentsRes.status === 'fulfilled' ? paymentsRes.value : [];

      // Calculate attendance rate
      let computedAttendanceRate = 96.2;
      if (attendance.length > 0) {
        const presentCount = attendance.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
        computedAttendanceRate = Math.round((presentCount / attendance.length) * 1000) / 10;
      }

      // Calculate Area Progress averages from assessments
      const areaMap = new Map<string, { totalScore: number; count: number }>();
      assessments.forEach((a) => {
        const uiArea = mapApiObservationArea(a.area);
        const score = typeof a.score === 'number' ? a.score : 75;
        const current = areaMap.get(uiArea) || { totalScore: 0, count: 0 };
        areaMap.set(uiArea, { totalScore: current.totalScore + score, count: current.count + 1 });
      });

      const calculatedAreaProgress = Array.from(areaMap.entries()).map(([area, val]) => ({
        area: area.length > 12 ? `${area.substring(0, 10)}...` : area,
        score: Math.round(val.totalScore / val.count),
      }));

      setMetrics({
        totalStudents: students.length,
        activeClassrooms: classrooms.filter((c) => c.isActive).length,
        attendanceRate: computedAttendanceRate,
        totalObservations: observations.length,
        totalAssessments: assessments.length,
        outstandingFees: financeSummary?.totalOutstanding || 0,
      });

      setRecentObservations(observations.slice(0, 3).map(mapApiObservation));
      setRecentAssessments(assessments.slice(0, 3).map(mapApiAssessment));
      setRecentPayments(payments.slice(0, 3).map(mapApiPayment));
      if (calculatedAreaProgress.length > 0) {
        setAreaProgressData(calculatedAreaProgress);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load school dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const todayStr = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }, []);

  const greetingName = user?.name ? user.name.split(' ')[0] : 'there';

  return (
    <AppShell>
      <PageHeader
        eyebrow={todayStr}
        title={`Good morning, ${greetingName}`}
        description="Here's what's happening across your school today."
      />

      {error && (
        <div className="rounded-lg bg-destructive/15 p-4 text-sm text-destructive mb-6">
          {error}
        </div>
      )}

      {/* Metric Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Total Students"
          value={loading ? '...' : String(metrics.totalStudents)}
          change="Enrolled"
          icon={Users}
        />
        <StatCard
          label="Active Classrooms"
          value={loading ? '...' : String(metrics.activeClassrooms)}
          change="Active"
          icon={GraduationCap}
          tone="amber"
        />
        <StatCard
          label="Attendance Rate"
          value={loading ? '...' : `${metrics.attendanceRate}%`}
          change="Current"
          icon={CalendarCheck}
          tone="blue"
        />
        <StatCard
          label="Observations"
          value={loading ? '...' : String(metrics.totalObservations)}
          change="Recorded"
          icon={Sparkles}
          tone="rose"
        />
        <StatCard
          label="Assessments"
          value={loading ? '...' : String(metrics.totalAssessments)}
          change="Completed"
          icon={ClipboardCheck}
        />
        <StatCard
          label="Outstanding Fees"
          value={loading ? '...' : fmtCurrency(metrics.outstandingFees)}
          change="Unpaid balance"
          icon={CircleDollarSign}
          tone="amber"
        />
      </div>

      {/* Visual Analytics Charts */}
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-[15px]">Attendance overview</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">Weekly attendance trends</p>
            </div>
            <Button variant="ghost" size="sm" asChild className="gap-1 text-xs text-muted-foreground">
              <Link href="/attendance">
                View attendance <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-3">
            <AttendanceChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-[15px]">Learning progress</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">Average progress by Montessori area</p>
            </div>
            <Button variant="ghost" size="sm" asChild className="gap-1 text-xs text-muted-foreground">
              <Link href="/learning-progress">
                View progress <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-3">
            <ProgressChart data={areaProgressData.length > 0 ? areaProgressData : undefined} />
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Feeds */}
      <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Recent Observations */}
        <Card className="min-w-0">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[15px]">Recent observations</CardTitle>
            <Link href="/observations" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading && <p className="text-xs text-muted-foreground py-2">Loading observations...</p>}
            {!loading && recentObservations.length === 0 && (
              <p className="text-xs text-muted-foreground py-2">No observations recorded yet.</p>
            )}
            {!loading &&
              recentObservations.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-3 min-w-0">
                  <AvatarText
                    initials={item.initials}
                    name={item.studentName}
                    meta={`${item.area} · ${item.date}`}
                    color={item.color}
                  />
                  <div className="shrink-0 pt-0.5">
                    <StatusBadge status={item.progress} />
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>

        {/* Recent Assessments */}
        <Card className="min-w-0">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[15px]">Recent assessments</CardTitle>
            <Link href="/assessments" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading && <p className="text-xs text-muted-foreground py-2">Loading assessments...</p>}
            {!loading && recentAssessments.length === 0 && (
              <p className="text-xs text-muted-foreground py-2">No assessments recorded yet.</p>
            )}
            {!loading &&
              recentAssessments.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 min-w-0">
                  <AvatarText
                    initials={item.initials}
                    name={item.studentName}
                    meta={item.title}
                    color={item.color}
                  />
                  <span className="shrink-0 text-sm font-semibold text-foreground">
                    {item.score}
                    <span className="text-xs text-muted-foreground">/100</span>
                  </span>
                </div>
              ))}
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card className="min-w-0 md:col-span-2 lg:col-span-1">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[15px]">Recent payments</CardTitle>
            <Link href="/finance/payments" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading && <p className="text-xs text-muted-foreground py-2">Loading payments...</p>}
            {!loading && recentPayments.length === 0 && (
              <p className="text-xs text-muted-foreground py-2">No payments recorded yet.</p>
            )}
            {!loading &&
              recentPayments.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 min-w-0">
                  <AvatarText
                    initials={item.initials}
                    name={item.studentName}
                    meta={item.type}
                    color={item.color}
                  />
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-foreground whitespace-nowrap">{item.formattedAmount}</p>
                    <div className="mt-0.5">
                      <StatusBadge status={item.status} />
                    </div>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Bar */}
      <div className="mt-6">
        <SectionHeader title="Quick actions" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {[
            { label: 'Add student', icon: Users, href: '/students' },
            { label: 'Mark attendance', icon: CalendarCheck, href: '/attendance' },
            { label: 'Add observation', icon: Sparkles, href: '/observations' },
            { label: 'Create assessment', icon: ClipboardCheck, href: '/assessments' },
            { label: 'Record payment', icon: CircleDollarSign, href: '/finance/payments' },
          ].map(({ label, icon: Icon, href }) => (
            <Link
              key={label}
              href={href}
              className="group flex items-center gap-3 rounded-lg border border-border bg-card p-3.5 transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:bg-accent"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground transition-colors group-hover:bg-primary/15 group-hover:text-primary">
                <Plus className="h-4 w-4" />
              </span>
              <span className="text-xs font-medium text-foreground">{label}</span>
              <ArrowUpRight className="ml-auto h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
