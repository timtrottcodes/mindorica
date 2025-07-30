import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FlashcardModel } from '../../models/flashcard';
import { CommonModule } from '@angular/common';

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

  onFlip(): void {
    this.flip.emit();
  }
}
