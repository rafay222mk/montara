'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowUpRight, CircleDollarSign, Receipt, TrendingUp, WalletCards, Sparkles } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { AvatarText, DataTable, PageHeader, SectionHeader, StatCard, StatusBadge } from '@/components/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TableCell, TableRow } from '@/components/ui/table';
import { financeApi } from '@/lib/api/finance';
import { mapApiStudentFee, mapApiPayment } from '@/lib/utils';
import { StudentFee, Payment, FinanceSummary } from '@/types';

const fmt = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function FinancePage() {
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [outstandingFees, setOutstandingFees] = useState<StudentFee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumData, feesData, paymentsData] = await Promise.all([
        financeApi.summary(),
        financeApi.studentFees.list(),
        financeApi.payments.list(),
      ]);

      // Calculate collection rate on client side
      const assigned = Number(sumData.totalAssigned) || 0;
      const collected = Number(sumData.totalCollected) || 0;
      const rate = assigned > 0 ? Math.round((collected / assigned) * 100) : 100;

      setSummary({
        totalAssigned: assigned,
        totalCollected: collected,
        totalOutstanding: Number(sumData.totalOutstanding) || 0,
        totalOverdue: Number(sumData.totalOverdue) || 0,
        collectionRate: rate,
      });

      // Map and compute paid/balance for student fees
      const mappedFees = feesData.map((f) => {
        const feePayments = paymentsData.filter((p) => p.studentFeeId === f.id);
        const paidAmount = feePayments.reduce((sum, p) => sum + Number(p.amount), 0);
        const balance = Math.max(0, Number(f.amount) - paidAmount);
        
        const base = mapApiStudentFee(f);
        return {
          ...base,
          paidAmount,
          balance,
        };
      });

      setOutstandingFees(mappedFees.filter((f) => f.balance > 0).slice(0, 5));
      setRecentPayments(paymentsData.map(mapApiPayment).slice(0, 5));
    } catch (err: any) {
      setError(err?.message || 'Failed to load school financial overview dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const summaryDisplay = summary || {
    totalAssigned: 0,
    totalCollected: 0,
    totalOutstanding: 0,
    totalOverdue: 0,
    collectionRate: 100,
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Finance / Term 3"
        title="Finance summary"
        description="A clear view of tuition, fees, and the health of your school."
        action="Record payment"
        href="/finance/payments"
      />

      {loading && (
        <div className="flex justify-center items-center h-48">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-destructive/15 p-4 text-sm text-destructive mb-6">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total Assigned" value={fmt(summaryDisplay.totalAssigned)} change="Assigned" icon={WalletCards} />
            <StatCard label="Total Collected" value={fmt(summaryDisplay.totalCollected)} change="Collected" icon={CircleDollarSign} tone="blue" />
            <StatCard label="Total Outstanding" value={fmt(summaryDisplay.totalOutstanding)} change="Outstanding" icon={Receipt} tone="amber" />
            <StatCard label="Total Overdue" value={fmt(summaryDisplay.totalOverdue)} change="Overdue" icon={TrendingUp} tone="rose" />
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_1fr]">
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="text-[15px]">Payment history</CardTitle>
                <Link href="/finance/payments" className="text-xs text-primary hover:underline">
                  View all
                </Link>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <DataTable headers={['Student', 'Amount', 'Method', 'Status', 'Date']}>
                  {recentPayments.length ? (
                    recentPayments.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <AvatarText initials={item.initials} name={item.studentName} meta={item.type} color={item.color} />
                        </TableCell>
                        <TableCell className="text-sm font-medium">{item.formattedAmount}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{item.method}</TableCell>
                        <TableCell>
                          <StatusBadge status={item.status} />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{item.date}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-xs text-muted-foreground">
                        No payments recorded yet.
                      </TableCell>
                    </TableRow>
                  )}
                </DataTable>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-[15px]">Fee collection</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">Current term breakdown</p>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center py-3">
                  <div
                    className="relative flex h-40 w-40 items-center justify-center rounded-full"
                    style={{
                      background: `conic-gradient(hsl(var(--primary)) 0 ${summaryDisplay.collectionRate}%, hsl(var(--muted)) ${summaryDisplay.collectionRate}% 100%)`,
                    }}
                  >
                    <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-card">
                      <span className="text-2xl font-semibold">{summaryDisplay.collectionRate}%</span>
                      <span className="text-[11px] text-muted-foreground">collected</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 space-y-3 text-xs">
                  <div className="flex justify-between">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <span className="h-2 w-2 rounded-full bg-primary" /> Collected
                    </span>
                    <span>{fmt(summaryDisplay.totalCollected)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <span className="h-2 w-2 rounded-full bg-muted" /> Outstanding
                    </span>
                    <span>{fmt(summaryDisplay.totalOutstanding)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[15px] font-semibold text-foreground">Outstanding student fees</h2>
              <Link href="/finance/fees" className="text-xs font-medium text-primary hover:underline">
                View all fees
              </Link>
            </div>
            <DataTable headers={['Student', 'Fee', 'Amount', 'Paid', 'Balance', 'Status', 'Due date']}>
              {outstandingFees.length ? (
                outstandingFees.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <AvatarText initials={item.initials} name={item.studentName} color={item.color} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{item.feeStructure}</TableCell>
                    <TableCell className="text-sm font-medium">{fmt(item.amount)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{fmt(item.paidAmount)}</TableCell>
                    <TableCell className="text-sm font-medium text-secondary">{fmt(item.balance)}</TableCell>
                    <TableCell>
                      <StatusBadge status={item.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{item.dueDate}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Sparkles className="mx-auto h-8 w-8 text-muted-foreground/60 mb-2" />
                    <p className="text-sm text-muted-foreground">All assigned student balances paid up to date!</p>
                  </TableCell>
                </TableRow>
              )}
            </DataTable>
          </div>

          <div className="mt-6">
            <SectionHeader title="Finance shortcuts" />
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ['Fee structures', '/finance/structures'],
                ['Student fees', '/finance/fees'],
                ['Payment history', '/finance/payments'],
              ].map(([label, href]) => (
                <Link
                  key={label}
                  href={href}
                  className="flex items-center justify-between rounded-lg border border-border bg-card p-4 text-sm font-medium transition-colors hover:border-primary/30 hover:bg-accent"
                >
                  {label}
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}
