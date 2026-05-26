import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalService, ModalConfig } from '../../services/modal.service';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-backdrop" *ngIf="modalConfig" (click)="onBackdropClick()"></div>
    
    <div class="modal fade" [class.show]="modalConfig" [style.display]="modalConfig ? 'block' : 'none'" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header" [ngClass]="{
            'bg-info text-white': modalConfig?.type === 'info',
            'bg-warning': modalConfig?.type === 'warning',
            'bg-danger text-white': modalConfig?.type === 'error',
            'bg-success text-white': modalConfig?.type === 'success',
            'bg-primary text-white': modalConfig?.type === 'confirm'
          }">
            <h5 class="modal-title">
              <i class="fas" [ngClass]="{
                'fa-info-circle': modalConfig?.type === 'info',
                'fa-exclamation-triangle': modalConfig?.type === 'warning',
                'fa-times-circle': modalConfig?.type === 'error',
                'fa-check-circle': modalConfig?.type === 'success',
                'fa-question-circle': modalConfig?.type === 'confirm'
              }"></i>
              {{ modalConfig?.title }}
            </h5>
            <button type="button" class="btn-close" [class.btn-close-white]="shouldUseWhiteClose()" (click)="onCancel()" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <p style="white-space: pre-line;">{{ modalConfig?.message }}</p>
          </div>
          <div class="modal-footer">
            <button 
              *ngIf="modalConfig?.type === 'confirm' && modalConfig?.cancelText !== null" 
              type="button" 
              class="btn btn-secondary" 
              (click)="onCancel()">
              {{ modalConfig?.cancelText }}
            </button>
            <button 
              type="button" 
              class="btn"
              [ngClass]="{
                'btn-info': modalConfig?.type === 'info',
                'btn-warning': modalConfig?.type === 'warning',
                'btn-danger': modalConfig?.type === 'error',
                'btn-success': modalConfig?.type === 'success',
                'btn-primary': modalConfig?.type === 'confirm'
              }"
              (click)="onConfirm()">
              {{ modalConfig?.confirmText || 'OK' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 1040;
    }

    .modal.show {
      display: block;
    }

    .modal {
      z-index: 1050;
    }

    .modal-header i {
      margin-right: 8px;
    }

    .modal-body p {
      margin: 0;
    }
  `]
})
export class ModalComponent implements OnInit {
  modalConfig: ModalConfig | null = null;

  constructor(private modalService: ModalService) {}

  ngOnInit(): void {
    this.modalService.modal$.subscribe((config) => {
      this.modalConfig = config;
    });
  }

  onConfirm(): void {
    this.modalService.close(true);
  }

  onCancel(): void {
    this.modalService.close(false);
  }

  onBackdropClick(): void {
    // Close modal when clicking backdrop (treat as cancel)
    this.onCancel();
  }

  shouldUseWhiteClose(): boolean {
    return this.modalConfig?.type === 'info' || 
           this.modalConfig?.type === 'error' || 
           this.modalConfig?.type === 'success' || 
           this.modalConfig?.type === 'confirm';
  }
}
