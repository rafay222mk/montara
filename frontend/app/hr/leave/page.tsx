'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-context';
import { hasPermission } from '@/lib/auth/permissions';
import { hrApi } from '@/lib/api/hr';
import { LeaveRequest } from '@/types';
import { Button } from '@/components/ui/button';
import { AppShell } from '@/components/layout/app-shell';
import { LeaveRequestForm } from '@/components/forms/record-forms';
import { CalendarDays, CalendarCheck, Clock, Check, X, RefreshCw, ArrowLeft } from 'lucide-react';

export default function LeavePage() {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canApprove = user && hasPermission(user.role, 'hr.manage');

  const fetchLeaves = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await hrApi.leaves.list();
      setLeaves(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load leave history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleUpdateStatus = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    if (!confirm(`Are you sure you want to mark this request as ${status}?`)) return;
    try {
      await hrApi.leaves.updateStatus(id, status);
      fetchLeaves();
    } catch (err: any) {
      alert(err?.message || 'Failed to update request status.');
    }
  };

  // Stat calculations
  const pendingCount = leaves.filter((l) => l.status === 'PENDING').length;
  const approvedCount = leaves.filter((l) => l.status === 'APPROVED').length;
  const sickCount = leaves.filter((l) => l.status === 'APPROVED' && l.leaveType === 'SICK').length;

  return (
    <AppShell>
      <div className="space-y-6">
        <Link
          href="/hr"
          className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to employees
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Leave Management</h1>
            <p className="text-sm text-muted-foreground">Request time off and manage approvals.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={fetchLeaves} disabled={loading} title="Reload records">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <LeaveRequestForm onSuccess={fetchLeaves} />
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-[#11161a] p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Pending Approvals</p>
              <h3 className="text-2xl font-bold text-amber-500 mt-1">{pendingCount}</h3>
            </div>
            <Clock className="h-8 w-8 text-amber-500/30" />
          </div>
          <div className="rounded-xl border border-border bg-[#11161a] p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Approved Leaves</p>
              <h3 className="text-2xl font-bold text-green-500 mt-1">{approvedCount}</h3>
            </div>
            <CalendarCheck className="h-8 w-8 text-green-500/30" />
          </div>
          <div className="rounded-xl border border-border bg-[#11161a] p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Medical / Sick Off</p>
              <h3 className="text-2xl font-bold text-primary mt-1">{sickCount}</h3>
            </div>
            <CalendarDays className="h-8 w-8 text-primary/30" />
          </div>
        </div>

        {/* Leave Records Table */}
        {error && <div className="rounded bg-destructive/10 p-4 text-xs text-destructive">{error}</div>}

        {loading ? (
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
            Loading leave requests...
          </div>
        ) : leaves.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground rounded-xl border border-dashed border-border bg-[#11161a]">
            No leave requests recorded yet.
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-[#11161a] overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-muted-foreground bg-muted/20">
                <tr>
                  <th className="py-3 px-4 font-semibold">Employee</th>
                  <th className="py-3 px-4 font-semibold">Type</th>
                  <th className="py-3 px-4 font-semibold">Start Date</th>
                  <th className="py-3 px-4 font-semibold">End Date</th>
                  <th className="py-3 px-4 font-semibold">Reason</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  {canApprove && <th className="py-3 px-4 text-right font-semibold">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {leaves.map((item) => {
                  const isPending = item.status === 'PENDING';
                  const isApproved = item.status === 'APPROVED';
                  const isRejected = item.status === 'REJECTED';

                  return (
                    <tr key={item.id} className="hover:bg-muted/10 transition-colors">
                      <td className="py-3 px-4 font-medium text-foreground">
                        {item.employee?.name || 'Staff Member'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                          {item.leaveType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground font-mono text-xs">
                        {new Date(item.startDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground font-mono text-xs">
                        {new Date(item.endDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground max-w-xs truncate" title={item.reason || ''}>
                        {item.reason || '-'}
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <span
                          className={`inline-flex items-center gap-1 rounded px-2 py-0.5 font-medium ${
                            isApproved
                              ? 'bg-green-500/10 text-green-500'
                              : isRejected
                              ? 'bg-destructive/10 text-destructive'
                              : 'bg-amber-500/10 text-amber-500'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      {canApprove && (
                        <td className="py-3 px-4 text-right">
                          {isPending ? (
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-green-500 hover:bg-green-500/15"
                                onClick={() => handleUpdateStatus(item.id, 'APPROVED')}
                                title="Approve"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:bg-destructive/15"
                                onClick={() => handleUpdateStatus(item.id, 'REJECTED')}
                                title="Reject"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Processed</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
