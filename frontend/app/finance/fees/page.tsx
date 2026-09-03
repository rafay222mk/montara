'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Sparkles, Trash2, ArrowLeft } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { AvatarText, DataTable, FilterBar, PageHeader, StatusBadge } from '@/components/shared';
import { StudentFeeForm } from '@/components/forms/record-forms';
import { TableCell, TableRow } from '@/components/ui/table';
import { financeApi } from '@/lib/api/finance';
import { mapApiStudentFee } from '@/lib/utils';
import { StudentFee } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

const fmt = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function FeesPage() {
  const [items, setItems] = useState<StudentFee[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStudentFees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: any = {};
      if (selectedStatus !== 'all') {
        filters.status = selectedStatus.toUpperCase().replace(' ', '_');
      }

      // Query student fees and payments concurrently
      const [feesData, paymentsData] = await Promise.all([
        financeApi.studentFees.list(filters),
        financeApi.payments.list(),
      ]);

      // Map raw API values and calculate paid amount and remaining balance
      const mapped = feesData.map((f) => {
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

      setItems(mapped);
    } catch (err: any) {
      setError(err?.message || 'Failed to load assigned student fees');
    } finally {
      setLoading(false);
    }
  }, [selectedStatus]);

  useEffect(() => {
    loadStudentFees();
  }, [loadStudentFees]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this assigned student fee?')) return;
    try {
      await financeApi.studentFees.delete(id);
      loadStudentFees();
    } catch (err: any) {
      alert(err?.message || 'Failed to remove assigned student fee');
    }
  };

  const statuses = [
    { label: 'All statuses', value: 'all' },
    { label: 'Pending', value: 'Pending' },
    { label: 'Partially Paid', value: 'Partially Paid' },
    { label: 'Paid', value: 'Paid' },
    { label: 'Overdue', value: 'Overdue' },
    { label: 'Waived', value: 'Waived' },
  ];

  return (
    <AppShell>
      <Link
        href="/finance"
        className="mb-4 inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to finance overview
      </Link>

      <PageHeader
        eyebrow="Finance / Student accounts"
        title="Student fees"
        description="Review balances and payment status by student."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-6">
        <FilterBar>
          <Select value={selectedStatus} onValueChange={setSelectedStatus} disabled={loading}>
            <SelectTrigger className="w-[150px] bg-card border-border h-10 text-xs">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterBar>

        <StudentFeeForm onSuccess={loadStudentFees} />
      </div>

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

      {!loading && !error && items.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
          <Sparkles className="mx-auto h-10 w-10 text-muted-foreground/60 mb-3" />
          <h3 className="text-sm font-semibold text-foreground">No student fees recorded</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Assign a fee structure to a student to generate their outstanding balances.
          </p>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <DataTable headers={['Student', 'Fee structure', 'Amount', 'Paid', 'Balance', 'Status', 'Due date', 'Actions']}>
          {items.map((item) => (
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
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </DataTable>
      )}
    </AppShell>
  );
}
