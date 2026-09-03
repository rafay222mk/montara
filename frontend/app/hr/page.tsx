'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { hasPermission } from '@/lib/auth/permissions';
import { hrApi } from '@/lib/api/hr';
import { Employee } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/shared';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmployeeForm } from '@/components/forms/record-forms';
import { Users, FileUser, CalendarDays, WalletCards, RefreshCw, Pencil, Trash2 } from 'lucide-react';

export default function HrPage() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');

  const canManage = user && hasPermission(user.role, 'hr.manage');

  const fetchEmployees = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await hrApi.employees.list();
      setEmployees(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load employee directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to set this employee status as Inactive?')) return;
    try {
      await hrApi.employees.delete(id);
      fetchEmployees();
    } catch (err: any) {
      alert(err?.message || 'Failed to archive employee.');
    }
  };

  // Stat metrics
  const activeCount = employees.filter((e) => e.status === 'ACTIVE').length;
  const onLeaveCount = employees.filter((e) => e.status === 'ON_LEAVE').length;
  const totalSalary = employees.reduce((sum, e) => sum + (e.status === 'ACTIVE' ? Number(e.salary) : 0), 0);

  // Filtering
  const filtered = employees.filter((emp) => {
    const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employeeNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.jobTitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = deptFilter === 'ALL' || emp.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  // Extract unique departments for filters
  const departments = Array.from(new Set(employees.map((e) => e.department))).filter(Boolean);

  return (
    <AppShell>
      <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Employee Management</h1>
          <p className="text-sm text-muted-foreground">Manage staff profiles, roles, and leave settings.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={fetchEmployees} disabled={loading} title="Reload directory">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          {canManage && (
            <EmployeeForm onSuccess={fetchEmployees} />
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-[#11161a] p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Staff</span>
            <Users className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">{employees.length}</p>
          <p className="text-[10px] text-muted-foreground">Registered employee profiles</p>
        </div>

        <div className="rounded-xl border border-border bg-[#11161a] p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Active Staff</span>
            <FileUser className="h-4 w-4 text-green-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">{activeCount}</p>
          <p className="text-[10px] text-muted-foreground">Present and active on duty</p>
        </div>

        <div className="rounded-xl border border-border bg-[#11161a] p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">On Leave Today</span>
            <CalendarDays className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">{onLeaveCount}</p>
          <p className="text-[10px] text-muted-foreground">Approved leave assignments</p>
        </div>

        <div className="rounded-xl border border-border bg-[#11161a] p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Active Monthly Payroll</span>
            <WalletCards className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">${totalSalary.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">Sum of active salaries</p>
        </div>
      </div>

      {/* Directory & Filters */}
      <div className="rounded-xl border border-border bg-[#11161a] p-6 space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-2 max-w-md">
            <Input
              placeholder="Search by name, number, or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-background/50"
            />
          </div>
          <div className="flex items-center gap-2">
            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {error && (
          <div className="rounded bg-destructive/10 p-4 text-xs text-destructive">{error}</div>
        )}

        {loading ? (
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">Loading directory...</div>
        ) : filtered.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center text-sm text-muted-foreground">
            <Users className="h-8 w-8 mb-2 opacity-40" />
            No employee records found matching your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/80 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Role / Title</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Salary</th>
                  <th className="py-3 px-4">Status</th>
                  {canManage && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-sm">
                {filtered.map((emp) => (
                  <tr key={emp.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs">{emp.employeeNumber}</td>
                    <td className="py-3.5 px-4 font-medium text-foreground">{emp.name}</td>
                    <td className="py-3.5 px-4 text-muted-foreground">{emp.jobTitle}</td>
                    <td className="py-3.5 px-4 text-muted-foreground">{emp.department}</td>
                    <td className="py-3.5 px-4 text-xs">
                      <span className="rounded bg-primary/10 px-2 py-0.5 text-primary font-medium text-[11px]">
                        {emp.employmentType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono">${Number(emp.salary).toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-xs">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          emp.status === 'ACTIVE'
                            ? 'bg-green-500/10 text-green-500'
                            : emp.status === 'ON_LEAVE'
                            ? 'bg-amber-500/10 text-amber-500'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {emp.status}
                      </span>
                    </td>
                    {canManage && (
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex justify-end gap-1">
                          <EmployeeForm
                            employeeId={emp.id}
                            onSuccess={fetchEmployees}
                            trigger={
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted" title="Edit">
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            }
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/15"
                            onClick={() => handleDelete(emp.id)}
                            title="Deactivate"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>
    </AppShell>
  );
}
