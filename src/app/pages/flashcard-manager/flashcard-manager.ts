import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FlashcardService } from '../../services/flashcard';
import { Flashcard, Topic } from '../../models/flashcard';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Modal } from 'bootstrap';

@Component({
  selector: 'app-flashcard-manager',
  templateUrl: './flashcard-manager.html',
  styleUrls: ['./flashcard-manager.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class FlashcardManager {
  topicId!: string;
  flashcards: Flashcard[] = [];
  editCard: Flashcard = this.blankCard();
  topicName = '';
  cardToDelete: Flashcard | null = null;
  deleteModal!: Modal;
  allTopics: Topic[] = [];
  groupedFlashcards: { [topicId: string]: Flashcard[] } = {};

  constructor(
    private route: ActivatedRoute,
    private flashcardService: FlashcardService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.topicId = params.get('topicId') || '';
      this.flashcards = this.flashcardService.getFlashcardsForTopic(this.topicId);
      this.allTopics = this.flashcardService.getTopics(); // Load all topics
    });

    this.groupedFlashcards = this.flashcards.reduce((groups, card) => {
      if (!groups[card.topicId]) {
        groups[card.topicId] = [];
      }
      groups[card.topicId].push(card);
      return groups;
    }, {} as { [topicId: string]: Flashcard[] });

    this.loadTopicName();
  }

  getTopicIds(grouped: { [topicId: string]: Flashcard[] }): string[] {
    return Object.keys(grouped).sort();
  }

  loadTopicName() {
    const topic = this.flashcardService.getTopics().find(t => t.id === this.topicId);
    this.topicName = topic ? topic.name : this.topicId;
  }


  blankCard(): Flashcard {
    return { id: '', topicId: this.topicId, front: '', back: '', flipped: false };
  }

  loadFlashcards() {
    this.flashcards = this.flashcardService.getFlashcards(this.topicId);
  }

  saveFlashcard() {
    if (this.editCard.id) {
      this.flashcardService.updateFlashcard(this.editCard);
    } else {
      this.flashcardService.addFlashcard({ ...this.editCard, id: crypto.randomUUID() });
    }
    this.editCard = this.blankCard();
    this.loadFlashcards();
  }

  startEdit(card: Flashcard) {
    this.editCard = { ...card };
  }

  cancelEdit() {
    this.editCard = this.blankCard();
  }

  moveCard(card: Flashcard) {
    this.flashcardService.updateFlashcard(card);
  
    if (card.topicId !== this.topicId) {
      this.flashcards = this.flashcardService.getFlashcardsForTopic(this.topicId);
    }
  }

  requestDelete(card: Flashcard): void {
    this.cardToDelete = card;
    this.deleteModal.show();
  }

  confirmDelete(): void {
    if (this.cardToDelete) {
      this.flashcardService.deleteFlashcard(this.cardToDelete.id);
      this.loadFlashcards();
      this.cardToDelete = null;
    }
    this.deleteModal.hide();
  }

  deleteFlashcard(cardId: string) {
    this.flashcardService.deleteFlashcard(cardId);
    this.loadFlashcards();
  }
}
