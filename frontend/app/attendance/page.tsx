'use client';

import { CalendarDays, Check, Clock3, Users, X, AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { AttendanceSummary, AvatarText, DataTable, StatusBadge } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { AttendanceStatus, Classroom, Student } from '@/types';
import { classroomsApi } from '@/lib/api/classrooms';
import { studentsApi } from '@/lib/api/students';
import { attendanceApi } from '@/lib/api/attendance';
import { mapApiClassroom, mapApiStudent, mapApiAttendance, mapStatusToApi, mapApiAttendanceStatus } from '@/lib/utils';
import { useAuth } from '@/lib/auth/auth-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { attendanceQueue } from '@/lib/offline/attendance-queue';

interface LocalRecord {
  studentId: string;
  studentName: string;
  initials: string;
  color: string;
  classroom: string;
  status: AttendanceStatus;
  notes: string;
  arrivalTime: string | null;
}

export default function AttendancePage() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>('none');
  const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [localRecords, setLocalRecords] = useState<LocalRecord[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Offline & Synchronization states
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const { user } = useAuth();
  const isReadOnly = user?.role === 'PARENT';

  // Load classrooms list
  useEffect(() => {
    classroomsApi.list()
      .then((data) => {
        const mapped = data.map(mapApiClassroom);
        setClassrooms(mapped);
        if (mapped.length > 0) {
          setSelectedClassroomId(mapped[0].id);
        } else {
          setLoading(false);
        }
      })
      .catch((err) => {
        setError(err?.message || 'Failed to load classrooms');
        setLoading(false);
      });
  }, []);

  // Load students & attendance records
  const loadAttendance = useCallback(async () => {
    if (selectedClassroomId === 'none') return;
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      // 1. Fetch classroom students
      const apiStudents = await studentsApi.list({ classroomId: selectedClassroomId });
      const mappedStudents = apiStudents.map(mapApiStudent);

      // 2. Fetch existing attendance records
      const apiAttendance = await attendanceApi.list(date, selectedClassroomId);

      // 3. Merge: match students with their attendance record
      const merged: LocalRecord[] = mappedStudents.map((student) => {
        const att = apiAttendance.find((a) => a.studentId === student.id);
        if (att) {
          const mappedAtt = mapApiAttendance(att);
          return {
            studentId: student.id,
            studentName: student.name,
            initials: student.initials,
            color: student.color,
            classroom: student.classroom,
            status: mappedAtt.status,
            notes: mappedAtt.notes,
            arrivalTime: mappedAtt.arrivalTime,
          };
        } else {
          // Default status is 'Present' if not marked
          return {
            studentId: student.id,
            studentName: student.name,
            initials: student.initials,
            color: student.color,
            classroom: student.classroom,
            status: 'Present',
            notes: '',
            arrivalTime: null,
          };
        }
      });

      setLocalRecords(merged);
    } catch (err: any) {
      setError(err?.message || 'Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  }, [selectedClassroomId, date]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  // Synchronize pending offline attendance records
  const handleSync = useCallback(async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      const result = await attendanceQueue.syncPending(attendanceApi.bulkMark);
      setPendingCount(attendanceQueue.size());
      if (result.syncedCount > 0) {
        setSuccessMessage(`Successfully synced ${result.syncedCount} queued attendance batches`);
        loadAttendance();
      }
      if (result.errorsCount > 0) {
        setError(`Failed to sync ${result.errorsCount} batches. Will retry when connected.`);
      }
    } catch (err: any) {
      console.error('Failed to sync offline attendance', err);
    } finally {
      setSyncing(false);
    }
  }, [syncing, loadAttendance]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);
    setPendingCount(attendanceQueue.size());

    const goOnline = () => {
      setIsOnline(true);
      handleSync();
    };
    const goOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    // Initial sync trigger if online on mount
    if (navigator.onLine && attendanceQueue.size() > 0) {
      handleSync();
    }

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, [handleSync]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setLocalRecords((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, status } : r))
    );
  };

  const handleNotesChange = (studentId: string, notes: string) => {
    setLocalRecords((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, notes } : r))
    );
  };

  const handleQuickMark = (status: AttendanceStatus) => {
    setLocalRecords((prev) =>
      prev.map((r) => ({ ...r, status }))
    );
  };

  const handleSave = async () => {
    if (selectedClassroomId === 'none') return;
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    const recordsPayload = localRecords.map((r) => ({
      studentId: r.studentId,
      status: mapStatusToApi(r.status),
      remarks: r.notes || null,
    }));

    // Offline check: enqueue if browser reports offline
    if (typeof window !== 'undefined' && !navigator.onLine) {
      attendanceQueue.enqueue(selectedClassroomId, date, recordsPayload);
      setPendingCount(attendanceQueue.size());
      setSuccessMessage('Saved offline — attendance will sync automatically when network is restored');
      setSaving(false);
      return;
    }

    try {
      await attendanceApi.bulkMark({
        classroomId: selectedClassroomId,
        date,
        records: recordsPayload,
      });
      setSuccessMessage('Attendance records saved successfully');
      loadAttendance();
    } catch (err: any) {
      // Safe fallback queue save (network call failed)
      attendanceQueue.enqueue(selectedClassroomId, date, recordsPayload);
      setPendingCount(attendanceQueue.size());
      setSuccessMessage('Saved offline — attendance will sync when connection is restored');
    } finally {
      setSaving(false);
    }
  };

  // Calculations for AttendanceSummary
  const total = localRecords.length;
  const present = localRecords.filter((r) => r.status === 'Present').length;
  const absent = localRecords.filter((r) => r.status === 'Absent').length;
  const late = localRecords.filter((r) => r.status === 'Late').length;
  const excused = localRecords.filter((r) => r.status === 'Excused').length;
  const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 100;
  const summary = { total, present, absent, late, excused, rate };

  return (
    <AppShell>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <p className="eyebrow mb-2">Academic / Daily rhythm</p>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[28px]">Attendance</h1>
            {isOnline ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/30 border border-emerald-900/50 px-2.5 py-1 rounded-md">
                <Wifi className="h-3 w-3" /> Online
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-500 bg-amber-950/30 border border-amber-900/50 px-2.5 py-1 rounded-md">
                <WifiOff className="h-3 w-3" /> Offline
              </span>
            )}
          </div>
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
            A gentle, accurate pulse on who is here and ready to learn.
          </p>
        </div>
        {!isReadOnly && selectedClassroomId !== 'none' && (
          <Button onClick={handleSave} disabled={loading || saving} className="gap-2">
            {saving ? 'Saving...' : 'Save attendance'}
          </Button>
        )}
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 bg-card border border-border rounded-md px-3 py-1.5 text-xs text-foreground">
          <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={loading}
            className="bg-transparent border-0 outline-none text-foreground w-28"
          />
        </div>

        <Select value={selectedClassroomId} onValueChange={setSelectedClassroomId} disabled={loading}>
          <SelectTrigger className="w-[180px] bg-card border-border text-xs">
            <SelectValue placeholder="All classrooms" />
          </SelectTrigger>
          <SelectContent>
            {classrooms.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {pendingCount > 0 && (
        <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-lg bg-amber-950/20 border border-amber-900/35 text-amber-500 text-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>
              You have <strong>{pendingCount}</strong> attendance batch(es) cached locally waiting to sync.
            </span>
          </div>
          <Button 
            size="sm" 
            onClick={handleSync} 
            disabled={syncing || !isOnline} 
            variant="outline" 
            className="border-amber-900/40 text-amber-500 hover:bg-amber-950/30"
          >
            {syncing ? 'Syncing...' : 'Sync Now'}
          </Button>
        </div>
      )}

      {successMessage && (
        <div className="rounded-lg bg-primary/10 border border-primary/20 p-4 text-sm text-primary mb-6">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-destructive/15 p-4 text-sm text-destructive mb-6">
          {error}
        </div>
      )}

      <AttendanceSummary {...summary} />

      {loading ? (
        <div className="flex justify-center items-center h-48 mt-6">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : localRecords.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center mt-6">
          <Users className="mx-auto h-10 w-10 text-muted-foreground/60 mb-3" />
          <h3 className="text-sm font-semibold text-foreground">No students in classroom</h3>
          <p className="text-xs text-muted-foreground mt-1">
            This prepared environment doesn't contain any registered children.
          </p>
        </div>
      ) : (
        <div className="mt-6">
          <DataTable headers={['Student', 'Classroom', 'Arrival', 'Status', 'Notes']}>
            {localRecords.map((record) => (
              <TableRow key={record.studentId}>
                <TableCell>
                  <AvatarText initials={record.initials} name={record.studentName} color={record.color} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{record.classroom}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {record.arrivalTime || '—'}
                </TableCell>
                <TableCell>
                  {isReadOnly ? (
                    <StatusBadge status={record.status} />
                  ) : (
                    <Select
                      value={record.status}
                      onValueChange={(val) => handleStatusChange(record.studentId, val as AttendanceStatus)}
                    >
                      <SelectTrigger className="w-[110px] bg-card border-border h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Present">Present</SelectItem>
                        <SelectItem value="Absent">Absent</SelectItem>
                        <SelectItem value="Late">Late</SelectItem>
                        <SelectItem value="Excused">Excused</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {isReadOnly ? (
                    record.notes || '—'
                  ) : (
                    <Input
                      value={record.notes}
                      onChange={(e) => handleNotesChange(record.studentId, e.target.value)}
                      placeholder="Add note..."
                      className="h-8 max-w-[220px] text-xs bg-card border-border"
                    />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </DataTable>
        </div>
      )}

      {!isReadOnly && localRecords.length > 0 && !loading && (
        <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="mr-2">Quick mark all:</span>
          {(['Present', 'Absent', 'Late', 'Excused'] as AttendanceStatus[]).map((status) => (
            <Button
              key={status}
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => handleQuickMark(status)}
            >
              {status}
            </Button>
          ))}
        </div>
      )}
    </AppShell>
  );
}
