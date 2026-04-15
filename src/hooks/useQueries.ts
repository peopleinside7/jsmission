'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ===== Appointments (선교일지) =====
export function useAppointments() {
  return useQuery({
    queryKey: ['appointments'],
    queryFn: async () => {
      const res = await fetch('/api/mission/appointments');
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      return data.appointments || [];
    },
  });
}

export function useCreateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/mission/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).error || '저장 실패');
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  });
}

export function useDeleteAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/mission/appointments/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('삭제 실패');
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  });
}

// ===== Appointment Comments =====
export function useAppointmentComments(apptId: number | null) {
  return useQuery({
    queryKey: ['appointment-comments', apptId],
    queryFn: async () => {
      if (!apptId) return [];
      const res = await fetch(`/api/mission/appointments/${apptId}/comments`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      return data.comments || [];
    },
    enabled: !!apptId,
  });
}

export function useCreateApptComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ apptId, content }: { apptId: number; content: string }) => {
      const res = await fetch(`/api/mission/appointments/${apptId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['appointment-comments', vars.apptId] });
    },
  });
}

export function useDeleteApptComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ apptId, commentId }: { apptId: number; commentId: number }) => {
      const res = await fetch(`/api/mission/appointments/${apptId}/comments`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId }),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['appointment-comments', vars.apptId] });
    },
  });
}

// ===== Club apply =====
export function useApplyToClub(clubId: string | number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/clubs/${clubId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || '신청 실패');
      return resData;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['club', clubId] }),
  });
}

// ===== Resources =====
export function useResources(category: string) {
  return useQuery({
    queryKey: ['resources', category],
    queryFn: async () => {
      const res = await fetch(`/api/boards/RESOURCE?category=${encodeURIComponent(category)}`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      return data.posts || [];
    },
    enabled: !!category,
  });
}

export function useCreateResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      title, category, file,
    }: { title: string; category: string; file: File | null }) => {
      let filePath = '';
      let fileName = '';

      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        const uploadRes = await fetch('/api/files/upload', { method: 'POST', body: formData });
        if (!uploadRes.ok) {
          const err = await uploadRes.json().catch(() => ({}));
          throw new Error(err.error || '파일 업로드 실패');
        }
        const uploadData = await uploadRes.json();
        filePath = uploadData.filePath;
        fileName = uploadData.fileName;
      }

      const res = await fetch('/api/boards/RESOURCE', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, content: null, resource_category: category,
          file_path: filePath, file_name: fileName,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || '등록 실패');
      }
      return res.json();
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['resources', vars.category] });
    },
  });
}

export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('삭제 실패');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['resources'] });
      qc.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}
