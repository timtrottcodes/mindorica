import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FlashcardModel } from '../../models/flashcard';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-flashcard',
  templateUrl: './flashcard.html',
  styleUrls: ['./flashcard.css'],
  imports: [CommonModule]
})
export class FlashcardComponent {
  @Input() card!: FlashcardModel;
  @Input() showBack = false;
  @Output() flip = new EventEmitter<void>();

  constructor(private sanitizer: DomSanitizer) {}

  onFlip(): void {
    this.flip.emit();
  }

  getSanitizedHtml(content: string): SafeHtml {
    return this.sanitizer.sanitize(1, content) || '';
  }

  getSafeUrl(url: string | undefined): SafeUrl | string {
    if (!url) return '';
    if (url.startsWith('data:image/') || url.startsWith('data:audio/')) {
      return this.sanitizer.bypassSecurityTrustUrl(url);
    }
    return url;
  }
}
