import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ModalConfig {
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'confirm' | 'success';
  confirmText?: string;
  cancelText?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  private modalSubject = new BehaviorSubject<ModalConfig | null>(null);
  private resolveFunction: ((value: boolean) => void) | null = null;

  modal$ = this.modalSubject.asObservable();

  alert(message: string, title: string = 'Notice', type: 'info' | 'warning' | 'error' | 'success' = 'info'): Promise<void> {
    return new Promise((resolve) => {
      this.modalSubject.next({
        title,
        message,
        type,
        confirmText: 'OK',
      });
      
      this.resolveFunction = () => {
        resolve();
      };
    });
  }

  confirm(message: string, title: string = 'Confirm'): Promise<boolean> {
    return new Promise((resolve) => {
      this.modalSubject.next({
        title,
        message,
        type: 'confirm',
        confirmText: 'Yes',
        cancelText: 'Cancel',
      });
      
      this.resolveFunction = resolve;
    });
  }

  success(message: string, title: string = 'Success'): Promise<void> {
    return this.alert(message, title, 'success');
  }

  error(message: string, title: string = 'Error'): Promise<void> {
    return this.alert(message, title, 'error');
  }

  warning(message: string, title: string = 'Warning'): Promise<void> {
    return this.alert(message, title, 'warning');
  }

  close(result: boolean = true): void {
    this.modalSubject.next(null);
    if (this.resolveFunction) {
      this.resolveFunction(result);
      this.resolveFunction = null;
    }
  }
}
