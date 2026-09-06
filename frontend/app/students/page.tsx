'use client';

import Link from 'next/link';
import { MoreHorizontal, Users } from 'lucide-react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { AvatarText, ConfirmDialog, DataTable, FilterBar, PageHeader, StatusBadge } from '@/components/shared';
import { StudentForm } from '@/components/forms/record-forms';
import { TableCell, TableRow } from '@/components/ui/table';
import { studentsApi } from '@/lib/api/students';
import { classroomsApi } from '@/lib/api/classrooms';
import { mapApiStudent } from '@/lib/utils';
import { Student, Classroom } from '@/types';
import { useAuth } from '@/lib/auth/auth-context';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Deactivate state
  const [deactivatingStudent, setDeactivatingStudent] = useState<Student | null>(null);
  const [deactivating, setDeactivating] = useState(false);

  const { user } = useAuth();

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch classrooms for the filter list
      const apiRooms = await classroomsApi.list();
      setClassrooms(apiRooms.map((r) => ({ id: r.id, name: r.name } as Classroom)));

      // 2. Fetch students with filters
      const filters: any = {};
      if (selectedClassroomId !== 'all') {
        filters.classroomId = selectedClassroomId;
      }
      if (selectedStatus !== 'all') {
        filters.isActive = selectedStatus === 'active';
      }

      const apiStudents = await studentsApi.list(filters);
      setStudents(apiStudents.map(mapApiStudent));
    } catch (err: any) {
      setError(err?.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [selectedClassroomId, selectedStatus]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDeactivateConfirm = async () => {
    if (!deactivatingStudent) return;
    setDeactivating(true);
    try {
      await studentsApi.delete(deactivatingStudent.id);
      setDeactivatingStudent(null);
      loadData();
    } catch (err: any) {
      console.error('Failed to deactivate student:', err);
    } finally {
      setDeactivating(false);
    }
  };

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase();
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.classroom.toLowerCase().includes(q) ||
        s.guardian.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q)
    );
  }, [students, searchQuery]);

  const hasActiveFilters = Boolean(searchQuery || selectedClassroomId !== 'all' || selectedStatus !== 'all');

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedClassroomId('all');
    setSelectedStatus('all');
  };

  const isEditable = user?.role === 'SUPER_ADMIN' || user?.role === 'SCHOOL_ADMIN';

  return (
    <AppShell>
      <PageHeader
        eyebrow="Academic / Directory"
        title="Students"
        description="A clear view of every child in your school community."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-6">
        <FilterBar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search students by name, classroom, guardian..."
          onReset={handleResetFilters}
          hasActiveFilters={hasActiveFilters}
        >
          <Select value={selectedClassroomId} onValueChange={setSelectedClassroomId} disabled={loading}>
            <SelectTrigger className="w-[180px] bg-card border-border text-xs">
              <SelectValue placeholder="All classrooms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All classrooms</SelectItem>
              {classrooms.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedStatus} onValueChange={setSelectedStatus} disabled={loading}>
            <SelectTrigger className="w-[150px] bg-card border-border text-xs">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </FilterBar>

        {isEditable && <StudentForm onSuccess={loadData} />}
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

      {!loading && !error && filteredStudents.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
          <Users className="mx-auto h-10 w-10 text-muted-foreground/60 mb-3" />
          <h3 className="text-sm font-semibold text-foreground">
            {hasActiveFilters ? 'No students match your search' : 'No students found'}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {hasActiveFilters ? 'Try adjusting your search query or filters.' : 'No student records registered in this tenant.'}
          </p>
        </div>
      )}

      {!loading && !error && filteredStudents.length > 0 && (
        <DataTable headers={['Student', 'Student ID', 'Classroom', 'Age', 'Parent', 'Status', '']}>
          {filteredStudents.map((student) => (
            <TableRow key={student.id}>
              <TableCell>
                <Link href={`/students/${student.id}`}>
                  <AvatarText initials={student.initials} name={student.name} color={student.color} />
                </Link>
              </TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">
                MNT-{student.id.slice(0, 4).toUpperCase()}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{student.classroom}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{student.age}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{student.guardian}</TableCell>
              <TableCell>
                <StatusBadge status={student.status} />
              </TableCell>
              <TableCell>
                {isEditable ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <StudentForm studentId={student.id} onSuccess={loadData} trigger={
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Edit profile</DropdownMenuItem>
                      } />
                      <DropdownMenuItem className="text-destructive" onClick={() => setDeactivatingStudent(student)}>
                        Deactivate Student
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <div className="w-8" />
                )}
              </TableCell>
            </TableRow>
          ))}
        </DataTable>
      )}

      <ConfirmDialog
        open={!!deactivatingStudent}
        onOpenChange={(open) => !open && setDeactivatingStudent(null)}
        title="Deactivate Student"
        description={deactivatingStudent ? `Are you sure you want to deactivate ${deactivatingStudent.name}? They will be marked as inactive.` : ''}
        confirmLabel="Deactivate"
        onConfirm={handleDeactivateConfirm}
      />
    </AppShell>
  );
}
