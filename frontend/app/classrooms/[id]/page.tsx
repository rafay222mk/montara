'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, CalendarCheck, CheckCircle2, Users } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { AvatarText, PageHeader, StatusBadge } from '@/components/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressBar } from '@/components/shared';
import { classroomsApi } from '@/lib/api/classrooms';
import { studentsApi } from '@/lib/api/students';
import { mapApiClassroom, mapApiStudent } from '@/lib/utils';
import { Classroom, Student } from '@/types';

export default function ClassroomDetailPage() {
  const params = useParams<{ id: string }>();
  const [room, setRoom] = useState<Classroom | null>(null);
  const [roomStudents, setRoomStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const apiRoom = await classroomsApi.get(params.id);
      const mappedRoom = mapApiClassroom(apiRoom);
      setRoom(mappedRoom);

      const apiStudents = await studentsApi.list({ classroomId: params.id });
      setRoomStudents(apiStudents.map(mapApiStudent));
    } catch (err: any) {
      setError(err?.message || 'Failed to load classroom details');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <AppShell>
        <div className="flex justify-center items-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </AppShell>
    );
  }

  if (error || !room) {
    return (
      <AppShell>
        <Link href="/classrooms" className="mb-6 inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to classrooms
        </Link>
        <div className="rounded-lg bg-destructive/15 p-4 text-sm text-destructive mt-4">
          {error || 'Classroom not found'}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Link href="/classrooms" className="mb-6 inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to classrooms
      </Link>
      
      <PageHeader
        eyebrow="Academic / Classroom"
        title={room.name}
        description={room.description}
        action="Edit classroom"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Lead guide</p>
            <p className="mt-2 text-sm font-medium">{room.leadTeacher}</p>
            <p className="mt-1 text-xs text-muted-foreground">Primary guide</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Age group</p>
            <p className="mt-2 text-sm font-medium">{room.ageRange}</p>
            <p className="mt-1 text-xs text-muted-foreground">Prepared environment</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Capacity</p>
            <p className="mt-2 text-sm font-medium">
              {roomStudents.length} of {room.capacity} students
            </p>
            <ProgressBar value={(roomStudents.length / room.capacity) * 100} showValue={false} className="mt-3" />
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[15px]">Students in this classroom</CardTitle>
            <StatusBadge status={room.status} />
          </CardHeader>
          <CardContent className="space-y-4">
            {roomStudents.length ? (
              roomStudents.map((student) => (
                <div key={student.id} className="flex items-center justify-between">
                  <Link href={`/students/${student.id}`}>
                    <AvatarText initials={student.initials} name={student.name} meta={student.age} color={student.color} />
                  </Link>
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No students in this classroom yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-[15px]">Today in {room.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <CalendarCheck className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-medium">Attendance recorded</p>
                <p className="text-xs text-muted-foreground">
                  {roomStudents.length} of {roomStudents.length} children present
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                <Users className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-medium">Prepared environment</p>
                <p className="text-xs text-muted-foreground">3 new invitations on the shelves</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
