export interface OfflineAttendanceRecord {
  studentId: string;
  status: string;
  remarks: string | null;
}

export interface OfflineAttendanceBatch {
  id: string;
  classroomId: string;
  date: string;
  records: OfflineAttendanceRecord[];
}

const STORAGE_KEY = 'montara_offline_attendance';

export const attendanceQueue = {
  getQueue(): OfflineAttendanceBatch[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (err) {
      console.error('Failed to parse offline attendance queue from localStorage', err);
      return [];
    }
  },

  saveQueue(queue: OfflineAttendanceBatch[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    } catch (err) {
      console.error('Failed to save offline attendance queue to localStorage', err);
    }
  },

  enqueue(classroomId: string, date: string, records: OfflineAttendanceRecord[]): string {
    const queue = this.getQueue();
    const id = `batch_${Date.now()}`;
    const newBatch: OfflineAttendanceBatch = {
      id,
      classroomId,
      date,
      records,
    };
    queue.push(newBatch);
    this.saveQueue(queue);
    return id;
  },

  dequeue(id: string): void {
    const queue = this.getQueue();
    const filtered = queue.filter((b) => b.id !== id);
    this.saveQueue(filtered);
  },

  size(): number {
    return this.getQueue().length;
  },

  async syncPending(bulkMarkApiFn: (payload: any) => Promise<any>): Promise<{ syncedCount: number; errorsCount: number }> {
    const queue = this.getQueue();
    if (queue.length === 0) return { syncedCount: 0, errorsCount: 0 };

    let syncedCount = 0;
    let errorsCount = 0;

    // Process from oldest to newest
    for (const batch of [...queue]) {
      try {
        await bulkMarkApiFn({
          classroomId: batch.classroomId,
          date: batch.date,
          records: batch.records,
        });
        // Success: remove from local storage queue
        this.dequeue(batch.id);
        syncedCount++;
      } catch (err) {
        console.error(`Failed to sync offline attendance batch ${batch.id}`, err);
        errorsCount++;
      }
    }

    return { syncedCount, errorsCount };
  }
};
