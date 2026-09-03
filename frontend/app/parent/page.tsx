'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  CalendarCheck,
  ChevronRight,
  CircleDollarSign,
  GraduationCap,
  Sparkles,
  Users,
  Star,
} from 'lucide-react';
import { gamificationApi } from '@/lib/api/gamification';
import { AppShell } from '@/components/layout/app-shell';
import { AvatarText, StatusBadge } from '@/components/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { studentsApi } from '@/lib/api/students';
import { dashboardApi } from '@/lib/api/dashboard';
import { mapApiStudent, mapApiObservation } from '@/lib/utils';
import { Student, ApiStudentDashboard, Observation } from '@/types';

const fmtCurrency = (n: number) =>
  `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function ParentPage() {
  const [children, setChildren] = useState<Student[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<ApiStudentDashboard | null>(null);
  const [gamificationSummary, setGamificationSummary] = useState<any>(null);
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Load parent's children on mount
  useEffect(() => {
    let isMounted = true;
    async function loadChildren() {
      setLoadingChildren(true);
      setError(null);
      try {
        const raw = await studentsApi.list();
        if (!isMounted) return;
        const mapped = raw.map(mapApiStudent);
        setChildren(mapped);
        if (mapped.length > 0) {
          setSelectedId(mapped[0].id);
        }
      } catch (err: any) {
        if (isMounted) setError(err?.message || 'Failed to load children list');
      } finally {
        if (isMounted) setLoadingChildren(false);
      }
    }
    loadChildren();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Load student dashboard metrics when selectedId changes
  const loadChildDashboard = useCallback(async (childId: string) => {
    setLoadingDashboard(true);
    try {
      const data = await dashboardApi.student(childId);
      setDashboardData(data);
      
      try {
        const gamificationData = await gamificationApi.points.studentSummary(childId);
        setGamificationSummary(gamificationData);
      } catch (gErr) {
        console.error('Failed to load child gamification summary', gErr);
        setGamificationSummary(null);
      }
    } catch (err: any) {
      console.error('Failed to load child dashboard data:', err);
    } finally {
      setLoadingDashboard(false);
    }
  }, []);

  useEffect(() => {
    if (selectedId) {
      loadChildDashboard(selectedId);
    }
  }, [selectedId, loadChildDashboard]);

  const selectedChild = children.find((c) => c.id === selectedId) || children[0];

  const recentObservations: Observation[] = dashboardData?.recentObservations
    ? dashboardData.recentObservations.map(mapApiObservation)
    : [];

  const attendanceRate = dashboardData?.attendance?.attendancePercentage ?? 98;
  const learningProgress = dashboardData?.learning?.overallAverageScore ?? 75;

  return (
    <AppShell>
      <div className="mb-8">
        <p className="eyebrow mb-2">Family space</p>
        <h1 className="text-2xl font-semibold tracking-tight">How is your child doing?</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          A warm, simple window into your children's days at Montara.
        </p>
      </div>

      {loadingChildren && (
        <div className="flex justify-center items-center h-48">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-destructive/15 p-4 text-sm text-destructive mb-6">
          {error}
        </div>
      )}

      {!loadingChildren && children.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
          <Users className="mx-auto h-10 w-10 text-muted-foreground/60 mb-3" />
          <h3 className="text-sm font-semibold text-foreground">No enrolled children found</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Your family account does not have any linked student profiles yet.
          </p>
        </div>
      )}

      {!loadingChildren && children.length > 0 && selectedChild && (
        <>
          {/* Child Selector Tabs */}
          <div className="mb-6 flex flex-wrap gap-2">
            {children.map((child) => (
              <Button
                key={child.id}
                variant={selectedChild.id === child.id ? 'secondary' : 'outline'}
                onClick={() => setSelectedId(child.id)}
                className="gap-2"
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-semibold ${child.color}`}
                >
                  {child.initials}
                </span>
                {child.name}
              </Button>
            ))}
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {/* Child Profile & Attendance/Progress Metrics */}
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-center justify-between border-b border-border/70 p-5">
                  <AvatarText
                    initials={selectedChild.initials}
                    name={selectedChild.name}
                    meta={`${selectedChild.classroom} · ${selectedChild.age}`}
                    color={selectedChild.color}
                  />
                  <Link
                    href={`/parent/students/${selectedChild.id}`}
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    View profile <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
                <div className="grid grid-cols-3 gap-4 p-5">
                  <div className="rounded-lg bg-muted/50 p-4">
                    <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
                      <CalendarCheck className="h-4 w-4 text-primary" /> Attendance
                    </div>
                    <p className="text-2xl font-semibold">
                      {loadingDashboard ? '...' : `${attendanceRate}%`}
                    </p>
                    <p className="mt-1 text-xs text-primary">
                      {attendanceRate >= 90 ? 'Excellent rhythm' : 'Regular attendance'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-4">
                    <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
                      <Sparkles className="h-4 w-4 text-secondary" /> Progress
                    </div>
                    <p className="text-2xl font-semibold">
                      {loadingDashboard ? '...' : `${learningProgress}%`}
                    </p>
                    <div className="mt-3 h-1.5 rounded-full bg-muted">
                      <div
                        className="h-1.5 rounded-full bg-primary transition-all"
                        style={{ width: `${learningProgress}%` }}
                      />
                    </div>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-4">
                    <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
                      <Star className="h-4 w-4 text-amber-400 fill-amber-400" /> Points
                    </div>
                    <p className="text-2xl font-semibold text-amber-400">
                      {loadingDashboard ? '...' : `${gamificationSummary?.totalPoints ?? 0}`}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {gamificationSummary?.badges?.length ?? 0} badges earned
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* This Week at a Glance */}
            <Card>
              <CardHeader>
                <CardTitle className="text-[15px]">This week at a glance</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  A few moments from {selectedChild.name}'s classroom
                </p>
              </CardHeader>
              <CardContent className="space-y-5">
                {recentObservations.length > 0 ? (
                  <div className="flex gap-3">
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${selectedChild.color}`}
                    >
                      {selectedChild.initials}
                    </span>
                    <div>
                      <p className="text-sm leading-5">{recentObservations[0].note}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {recentObservations[0].area} · {recentObservations[0].date}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No recent observation notes recorded.</p>
                )}
                <div className="flex items-center gap-3 border-t border-border/70 pt-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-medium">A positive rhythm of learning</p>
                    <p className="text-xs text-muted-foreground">
                      {dashboardData?.learning?.totalObservations ?? 0} observations and{' '}
                      {dashboardData?.learning?.totalAssessments ?? 0} assessments recorded
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_1fr]">
            {/* Recent Learning Moments */}
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="text-[15px]">Recent learning moments</CardTitle>
                <Link href={`/parent/students/${selectedChild.id}`} className="text-xs text-primary hover:underline">
                  See all
                </Link>
              </CardHeader>
              <CardContent className="space-y-5">
                {recentObservations.length > 0 ? (
                  recentObservations.slice(0, 3).map((obs, idx) => (
                    <div key={obs.id || idx} className="flex gap-3">
                      <span
                        className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                          idx % 2 === 0 ? 'bg-primary' : 'bg-secondary'
                        }`}
                      />
                      <div>
                        <p className="text-sm leading-5">{obs.note}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {obs.area} · {obs.date}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground py-2">
                    New learning activities and observations will appear here.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Fees & Payments Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-[15px]">Fees & payments</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">Your family's account</p>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between border-b border-border/70 pb-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Outstanding balance</p>
                    <p className="mt-1 text-lg font-semibold">
                      {dashboardData?.finance
                        ? fmtCurrency(dashboardData.finance.outstandingBalance)
                        : '$0.00'}
                    </p>
                  </div>
                  <StatusBadge
                    status={
                      dashboardData?.finance?.outstandingBalance === 0
                        ? 'Paid'
                        : dashboardData?.finance?.overdueAmount && dashboardData.finance.overdueAmount > 0
                        ? 'Overdue'
                        : 'Pending'
                    }
                  />
                </div>
                <div className="flex items-center gap-3 pt-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <CircleDollarSign className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-medium">
                      {dashboardData?.finance?.outstandingBalance === 0
                        ? 'All payments up to date'
                        : `Total assigned: ${fmtCurrency(dashboardData?.finance?.totalAssigned || 0)}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {dashboardData?.finance?.totalPaid
                        ? `Total paid to date: ${fmtCurrency(dashboardData.finance.totalPaid)}`
                        : 'View statements in payments'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 rounded-lg border border-primary/15 bg-primary/[0.04] p-5">
            <div className="flex items-center gap-3">
              <GraduationCap className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">A note from the classroom</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  The children have been especially interested in sensorial materials and self-directed explorations this term.
                </p>
              </div>
              <Button variant="ghost" size="sm" asChild className="ml-auto">
                <Link href={`/parent/students/${selectedChild.id}`}>
                  <ArrowUpRight className="h-4 w-4 text-primary" />
                </Link>
              </Button>
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}
