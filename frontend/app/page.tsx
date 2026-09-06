'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowUpRight,
  CalendarCheck,
  ClipboardCheck,
  CircleDollarSign,
  GraduationCap,
  Plus,
  Sparkles,
  Users,
  Package,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  WalletCards,
  Megaphone,
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { AvatarText, PageHeader, SectionHeader, StatCard, StatusBadge } from '@/components/shared';
import { AttendanceChart, ProgressChart } from '@/components/shared/charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth/auth-context';
import { hasPermission, Permission } from '@/lib/auth/permissions';
import { studentsApi } from '@/lib/api/students';
import { classroomsApi } from '@/lib/api/classrooms';
import { observationsApi } from '@/lib/api/observations';
import { assessmentsApi } from '@/lib/api/assessments';
import { financeApi } from '@/lib/api/finance';
import { attendanceApi } from '@/lib/api/attendance';
import { hrApi } from '@/lib/api/hr';
import { inventoryApi } from '@/lib/api/inventory';
import {
  mapApiObservation,
  mapApiAssessment,
  mapApiPayment,
  mapApiObservationArea,
} from '@/lib/utils';
import { Observation, Assessment, Payment, Employee, LeaveRequest, InventoryItem } from '@/types';

const fmtCurrency = (n: number) =>
  `$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // General academic & finance state
  const [metrics, setMetrics] = useState({
    totalStudents: 0,
    activeClassrooms: 0,
    attendanceRate: 96.2,
    totalObservations: 0,
    totalAssessments: 0,
    outstandingFees: 0,
    collectedFees: 0,
    totalEmployees: 0,
    activeEmployees: 0,
    pendingLeaves: 0,
    totalInventory: 0,
    lowStockItems: 0,
  });

  const [recentObservations, setRecentObservations] = useState<Observation[]>([]);
  const [recentAssessments, setRecentAssessments] = useState<Assessment[]>([]);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [recentLeaves, setRecentLeaves] = useState<LeaveRequest[]>([]);
  const [recentInventory, setRecentInventory] = useState<InventoryItem[]>([]);
  const [areaProgressData, setAreaProgressData] = useState<{ area: string; score: number }[]>([]);

  // Redirect parents to their dedicated family space
  useEffect(() => {
    if (!authLoading && user?.role === 'PARENT') {
      router.push('/parent');
    }
  }, [user, authLoading, router]);

  const loadDashboardData = useCallback(async () => {
    if (!user || user.role === 'PARENT') return;
    setLoading(true);
    setError(null);

    const todayISO = new Date().toISOString().split('T')[0];
    const role = user.role;

    try {
      // Conditionally query only authorized endpoints to strictly avoid 403 Forbidden errors
      const promises: Promise<any>[] = [];

      const canViewStudents = hasPermission(role, 'students.view');
      const canViewClassrooms = hasPermission(role, 'classrooms.view');
      const canViewObservations = hasPermission(role, 'observations.view');
      const canViewAssessments = hasPermission(role, 'assessments.view');
      const canViewAttendance = hasPermission(role, 'attendance.view');
      const canViewFinance = hasPermission(role, 'finance.view');
      const canViewHr = hasPermission(role, 'hr.view');
      const canViewInventory = hasPermission(role, 'inventory.view');

      // Students
      const studentPromise = canViewStudents ? studentsApi.list() : Promise.resolve([]);
      // Classrooms
      const classroomPromise = canViewClassrooms ? classroomsApi.list() : Promise.resolve([]);
      // Observations
      const observationPromise = canViewObservations ? observationsApi.list() : Promise.resolve([]);
      // Assessments
      const assessmentPromise = canViewAssessments ? assessmentsApi.list() : Promise.resolve([]);
      // Attendance
      const attendancePromise = canViewAttendance ? attendanceApi.list(todayISO) : Promise.resolve([]);
      // Finance (only for Super Admin, School Admin, Accountant)
      const isFinanceStaff = role === 'SUPER_ADMIN' || role === 'SCHOOL_ADMIN' || role === 'ACCOUNTANT';
      const financeSummaryPromise = isFinanceStaff ? financeApi.summary() : Promise.resolve(null);
      const paymentsPromise = isFinanceStaff ? financeApi.payments.list() : Promise.resolve([]);
      // HR
      const hrEmployeesPromise = canViewHr ? hrApi.employees.list() : Promise.resolve([]);
      const hrLeavesPromise = canViewHr ? hrApi.leaves.list() : Promise.resolve([]);
      // Inventory
      const inventoryPromise = canViewInventory ? inventoryApi.items.list() : Promise.resolve([]);

      const [
        studentsRes,
        classroomsRes,
        observationsRes,
        assessmentsRes,
        attendanceRes,
        financeSummaryRes,
        paymentsRes,
        employeesRes,
        leavesRes,
        inventoryRes,
      ] = await Promise.allSettled([
        studentPromise,
        classroomPromise,
        observationPromise,
        assessmentPromise,
        attendancePromise,
        financeSummaryPromise,
        paymentsPromise,
        hrEmployeesPromise,
        hrLeavesPromise,
        inventoryPromise,
      ]);

      const students = studentsRes.status === 'fulfilled' ? studentsRes.value : [];
      const classrooms = classroomsRes.status === 'fulfilled' ? classroomsRes.value : [];
      const observations = observationsRes.status === 'fulfilled' ? observationsRes.value : [];
      const assessments = assessmentsRes.status === 'fulfilled' ? assessmentsRes.value : [];
      const attendance = attendanceRes.status === 'fulfilled' ? attendanceRes.value : [];
      const financeSummary = financeSummaryRes.status === 'fulfilled' ? financeSummaryRes.value : null;
      const payments = paymentsRes.status === 'fulfilled' ? paymentsRes.value : [];
      const employees = employeesRes.status === 'fulfilled' ? employeesRes.value : [];
      const leaves = leavesRes.status === 'fulfilled' ? leavesRes.value : [];
      const inventoryItems = inventoryRes.status === 'fulfilled' ? inventoryRes.value : [];

      // Calculate attendance rate
      let computedAttendanceRate = 96.2;
      if (attendance.length > 0) {
        const presentCount = attendance.filter((a: any) => a.status === 'PRESENT' || a.status === 'LATE').length;
        computedAttendanceRate = Math.round((presentCount / attendance.length) * 1000) / 10;
      }

      // Calculate Area Progress averages from assessments
      const areaMap = new Map<string, { totalScore: number; count: number }>();
      assessments.forEach((a: any) => {
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
        activeClassrooms: classrooms.filter((c: any) => c.isActive).length,
        attendanceRate: computedAttendanceRate,
        totalObservations: observations.length,
        totalAssessments: assessments.length,
        outstandingFees: financeSummary?.totalOutstanding || 0,
        collectedFees: financeSummary?.totalCollected || 0,
        totalEmployees: employees.length,
        activeEmployees: employees.filter((e: any) => e.status === 'ACTIVE').length,
        pendingLeaves: leaves.filter((l: any) => l.status === 'PENDING').length,
        totalInventory: inventoryItems.length,
        lowStockItems: inventoryItems.filter((i: any) => i.quantity <= i.minimumStock).length,
      });

      setRecentObservations(observations.slice(0, 3).map(mapApiObservation));
      setRecentAssessments(assessments.slice(0, 3).map(mapApiAssessment));
      setRecentPayments(payments.slice(0, 4).map(mapApiPayment));
      setRecentLeaves(leaves.slice(0, 4));
      setRecentInventory(inventoryItems.slice(0, 4));

      if (calculatedAreaProgress.length > 0) {
        setAreaProgressData(calculatedAreaProgress);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [user]);

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

  // Role-filtered Quick Actions
  const quickActions = useMemo(() => {
    if (!user) return [];
    const pool: { label: string; icon: any; href: string; permission: Permission }[] = [
      { label: 'Add student', icon: Users, href: '/students', permission: 'students.manage' },
      { label: 'Mark attendance', icon: CalendarCheck, href: '/attendance', permission: 'attendance.manage' },
      { label: 'Add observation', icon: Sparkles, href: '/observations', permission: 'observations.manage' },
      { label: 'Create assessment', icon: ClipboardCheck, href: '/assessments', permission: 'assessments.manage' },
      { label: 'Record payment', icon: CircleDollarSign, href: '/finance/payments', permission: 'finance.manage' },
      { label: 'Fee structures', icon: WalletCards, href: '/finance/structures', permission: 'finance.manage' },
      { label: 'Add employee', icon: Users, href: '/hr', permission: 'hr.manage' },
      { label: 'Leave requests', icon: CalendarCheck, href: '/hr/leave', permission: 'hr.view' },
      { label: 'Add item', icon: Package, href: '/inventory', permission: 'inventory.manage' },
      { label: 'Post notice', icon: Megaphone, href: '/communication', permission: 'communication.manage' },
    ];

    return pool.filter((item) => hasPermission(user.role, item.permission)).slice(0, 5);
  }, [user]);

  if (authLoading || user?.role === 'PARENT') {
    return (
      <AppShell>
        <div className="flex justify-center items-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </AppShell>
    );
  }

  const isAccountant = user?.role === 'ACCOUNTANT';
  const isHr = user?.role === 'HR_MANAGER';
  const isInventory = user?.role === 'INVENTORY_MANAGER';

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

      {/* ── Role-Tailored Stat Cards ── */}
      {isAccountant ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Outstanding Fees"
            value={loading ? '...' : fmtCurrency(metrics.outstandingFees)}
            change="Unpaid balance"
            icon={CircleDollarSign}
            tone="amber"
          />
          <StatCard
            label="Total Collected"
            value={loading ? '...' : fmtCurrency(metrics.collectedFees)}
            change="Revenue collected"
            icon={Receipt}
            tone="primary"
          />
          <StatCard
            label="Enrolled Students"
            value={loading ? '...' : String(metrics.totalStudents)}
            change="Active accounts"
            icon={Users}
            tone="blue"
          />
          <StatCard
            label="Attendance Today"
            value={loading ? '...' : `${metrics.attendanceRate}%`}
            change="Campus rhythm"
            icon={CalendarCheck}
          />
        </div>
      ) : isHr ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Employees"
            value={loading ? '...' : String(metrics.totalEmployees)}
            change="Registered staff"
            icon={Users}
          />
          <StatCard
            label="Active On Duty"
            value={loading ? '...' : String(metrics.activeEmployees)}
            change="Staff present"
            icon={CheckCircle2}
            tone="primary"
          />
          <StatCard
            label="Pending Leave Requests"
            value={loading ? '...' : String(metrics.pendingLeaves)}
            change="Awaiting review"
            icon={Clock}
            tone="amber"
          />
          <StatCard
            label="Attendance Rate"
            value={loading ? '...' : `${metrics.attendanceRate}%`}
            change="Campus rate"
            icon={CalendarCheck}
            tone="blue"
          />
        </div>
      ) : isInventory ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            label="Catalog Items"
            value={loading ? '...' : String(metrics.totalInventory)}
            change="Materials in registry"
            icon={Package}
          />
          <StatCard
            label="Low Stock Alerts"
            value={loading ? '...' : String(metrics.lowStockItems)}
            change="Needs reorder"
            icon={AlertTriangle}
            tone="rose"
          />
          <StatCard
            label="School Operations"
            value={loading ? '...' : 'Healthy'}
            change="Prepared environment"
            icon={CheckCircle2}
            tone="primary"
          />
        </div>
      ) : (
        /* Teacher / Admin default grid */
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
          {user && hasPermission(user.role, 'finance.view') && (
            <StatCard
              label="Outstanding Fees"
              value={loading ? '...' : fmtCurrency(metrics.outstandingFees)}
              change="Unpaid balance"
              icon={CircleDollarSign}
              tone="amber"
            />
          )}
        </div>
      )}

      {/* ── Charts & Visual Sections ── */}
      {!isHr && !isInventory && (
        <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_1fr]">
          <Card className="border-border/70">
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

          <Card className="border-border/70">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-[15px]">
                  {isAccountant ? 'Tuition collections' : 'Learning progress'}
                </CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  {isAccountant ? 'Active term progress' : 'Average progress by Montessori area'}
                </p>
              </div>
              <Button variant="ghost" size="sm" asChild className="gap-1 text-xs text-muted-foreground">
                <Link href={isAccountant ? '/finance' : '/learning-progress'}>
                  {isAccountant ? 'View finance' : 'View progress'} <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="pt-3">
              <ProgressChart data={areaProgressData.length > 0 ? areaProgressData : undefined} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Recent Activity Feeds (Role Tailored) ── */}
      <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Observations Feed (Teacher / Admin) */}
        {!isAccountant && !isHr && !isInventory && (
          <Card className="min-w-0 border-border/70">
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
        )}

        {/* Assessments Feed (Teacher / Admin) */}
        {!isAccountant && !isHr && !isInventory && (
          <Card className="min-w-0 border-border/70">
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
        )}

        {/* Payments Feed (Accountant / Admin) */}
        {user && hasPermission(user.role, 'finance.view') && (
          <Card className={`min-w-0 border-border/70 ${isAccountant ? 'md:col-span-2' : 'md:col-span-2 lg:col-span-1'}`}>
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
                      <p className="text-sm font-semibold text-foreground whitespace-nowrap">
                        {item.formattedAmount}
                      </p>
                      <div className="mt-0.5">
                        <StatusBadge status={item.status} />
                      </div>
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        )}

        {/* HR Feed */}
        {isHr && (
          <Card className="min-w-0 md:col-span-2 border-border/70">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-[15px]">Recent leave requests</CardTitle>
              <Link href="/hr/leave" className="text-xs text-primary hover:underline">
                View all leaves
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentLeaves.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">No pending leave applications.</p>
              ) : (
                recentLeaves.map((leave) => (
                  <div key={leave.id} className="flex items-center justify-between border-b border-border/60 pb-2.5 last:border-0">
                    <div>
                      <p className="text-xs font-medium text-foreground">{leave.employee?.name || 'Staff'}</p>
                      <p className="text-[11px] text-muted-foreground">{leave.leaveType} · {leave.startDate} to {leave.endDate}</p>
                    </div>
                    <StatusBadge status={leave.status} />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}

        {/* Inventory Feed */}
        {isInventory && (
          <Card className="min-w-0 md:col-span-2 border-border/70">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-[15px]">Supply items</CardTitle>
              <Link href="/inventory" className="text-xs text-primary hover:underline">
                View catalog
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentInventory.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">No inventory items recorded.</p>
              ) : (
                recentInventory.map((item) => (
                  <div key={item.id} className="flex items-center justify-between border-b border-border/60 pb-2.5 last:border-0">
                    <div>
                      <p className="text-xs font-medium text-foreground">{item.name}</p>
                      <p className="text-[11px] text-muted-foreground">{item.category} · In stock: {item.quantity} {item.unit}</p>
                    </div>
                    <StatusBadge status={item.quantity <= item.minimumStock ? 'Overdue' : 'Active'} />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── Quick Actions (Filtered by Permission) ── */}
      {quickActions.length > 0 && (
        <div className="mt-6">
          <SectionHeader title="Quick actions" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {quickActions.map(({ label, icon: Icon, href }) => (
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
      )}
    </AppShell>
  );
}
