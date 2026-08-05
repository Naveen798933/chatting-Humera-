/**
 * Lightweight Toast Notification System
 * Provides success, error, info, and love (heart) toasts
 */

export type ToastType = 'success' | 'error' | 'love' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

type ToastListener = (toasts: Toast[]) => void;

class ToastManager {
  private toasts: Toast[] = [];
  private listeners: ToastListener[] = [];

  private notify() {
    this.listeners.forEach(l => l([...this.toasts]));
  }

  subscribe(listener: ToastListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  show(message: string, type: ToastType = 'info', duration = 3500): string {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const toast: Toast = { id, message, type, duration };
    this.toasts = [...this.toasts, toast];
    this.notify();

    setTimeout(() => this.dismiss(id), duration);
    return id;
  }

  success(message: string, duration?: number) {
    return this.show(message, 'success', duration);
  }

  error(message: string, duration?: number) {
    return this.show(message, 'error', duration);
  }

  love(message: string, duration?: number) {
    return this.show(message, 'love', duration);
  }

  info(message: string, duration?: number) {
    return this.show(message, 'info', duration);
  }

  dismiss(id: string) {
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.notify();
  }
}

export const toast = new ToastManager();
