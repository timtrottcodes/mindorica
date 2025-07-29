import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FlashcardModel } from '../../models/flashcard';

@Component({
  selector: 'app-flashcard',
  templateUrl: './flashcard.html',
  styleUrls: ['./flashcard.css']
})
export class FlashcardComponent {
  @Input() card!: FlashcardModel;
  @Input() showBack = false;
  @Output() flip = new EventEmitter<void>();

  onFlip(): void {
    this.flip.emit();
  }
}
