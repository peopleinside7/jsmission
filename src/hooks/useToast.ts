'use client';

import { useUIStore } from '@/stores/uiStore';
import { useCallback } from 'react';

export function useToast() {
  const addToast = useUIStore((state) => state.addToast);

  const toast = useCallback((message: string) => addToast(message, 'success'), [addToast]);
  const toastError = useCallback((message: string) => addToast(message, 'error'), [addToast]);
  const toastInfo = useCallback((message: string) => addToast(message, 'info'), [addToast]);

  return { toast, toastError, toastInfo };
}
