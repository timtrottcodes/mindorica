import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FlashcardService } from '../../services/flashcard';
import { FlashcardModel, TopicModel } from '../../models/flashcard';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Modal } from 'bootstrap';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-flashcard-manager',
  templateUrl: './flashcard-manager.html',
  styleUrls: ['./flashcard-manager.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
})
export class FlashcardManager {
  topicId!: string;
  flashcards: FlashcardModel[] = [];
  editCard: FlashcardModel = this.blankCard();
  topicName = '';
  cardToDelete: FlashcardModel | null = null;
  deleteModal!: Modal;
  allTopics: TopicModel[] = [];
  groupedFlashcards: { [topicId: string]: FlashcardModel[] } = {};
  draggedCard: FlashcardModel | null = null;
  dragOverTarget: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private flashcardService: FlashcardService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.topicId = params.get('topicId') || '';
      this.flashcards = this.flashcardService.getFlashcardsForTopic(
        this.topicId
      );
      this.allTopics = this.flashcardService.getTopics(); // Load all topics
      this.editCard = this.blankCard();
    });

    this.loadGroupedFlashcards();
    this.loadTopicName();
  }

  getSafeUrl(dataUrl: string | undefined): SafeUrl | null {
    return dataUrl ? this.sanitizer.bypassSecurityTrustUrl(dataUrl) : null;
  }

  getTopicIds(grouped: { [topicId: string]: FlashcardModel[] }): string[] {
    return Object.keys(grouped).sort();
  }

  loadTopicName() {
    const topic = this.flashcardService
      .getTopics()
      .find((t) => t.id === this.topicId);
    this.topicName = topic ? topic.name : this.topicId;
  }

  blankCard(): FlashcardModel {
    return {
      id: '',
      topicId: this.topicId,
      front: '',
      back: '',
      imageUrl: undefined,
      imageBack: false,
      audioUrl: undefined,
      audioBack: false,
      notes: undefined,
      flipped: false,
      nextReviewDate: undefined,
      options: []
    };
  }

  loadFlashcards() {
    this.flashcards = this.flashcardService.getFlashcards(this.topicId);
    this.loadGroupedFlashcards();
  }

  loadGroupedFlashcards() {
    this.groupedFlashcards = this.flashcards.reduce((groups, card) => {
      if (!groups[card.topicId]) {
        groups[card.topicId] = [];
      }
      groups[card.topicId].push(card);
      return groups;
    }, {} as { [topicId: string]: FlashcardModel[] });
  }

  saveFlashcard() {
    const card = {
      ...this.editCard,
      id: this.editCard.id || crypto.randomUUID(),
    };

    if (this.editCard.id) {
      this.flashcardService.updateFlashcard(card);
    } else {
      this.flashcardService.addFlashcard(card);
    }

    this.editCard = this.blankCard();
    this.loadFlashcards();
  }

  startEdit(card: FlashcardModel) {
    this.editCard = { ...card };
  }

  cancelEdit() {
    this.editCard = this.blankCard();
  }

  moveCard(card: FlashcardModel) {
    this.flashcardService.updateFlashcard(card);

    if (card.topicId !== this.topicId) {
      this.flashcards = this.flashcardService.getFlashcardsForTopic(
        this.topicId
      );
    }
  }

  onFileChange(event: Event, type: 'image' | 'audio') {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (type === 'image') {
        this.editCard.imageUrl = reader.result as string;
      } else if (type === 'audio') {
        this.editCard.audioUrl = reader.result as string;
      }
    };
    reader.readAsDataURL(file);
  }

  clearMedia(type: 'image' | 'audio') {
    if (type === 'image') {
      this.editCard.imageUrl = undefined;
      this.editCard.imageBack = false;
    } else if (type === 'audio') {
      this.editCard.imageUrl = undefined;
      this.editCard.audioBack = false;
    }
  }

  requestDelete(card: FlashcardModel): void {
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

  getAllDropListIds(topicId: string): string[] {
    const flashcards = this.groupedFlashcards[topicId];
    const dropIds = flashcards.map(card => `options-${card.id}`);
    dropIds.push(`main-list-${topicId}`);
    return dropIds;
  }

  onCardDrop(event: CdkDragDrop<FlashcardModel[]>, topicId: string) {
    if (event.previousContainer === event.container) {
      moveItemInArray(this.groupedFlashcards[topicId], event.previousIndex, event.currentIndex);
    } else {
      const card = event.previousContainer.data[event.previousIndex];

      // Remove from previous
      event.previousContainer.data.splice(event.previousIndex, 1);

      // Add to top-level
      this.groupedFlashcards[topicId].splice(event.currentIndex, 0, card);
    }
  }

  onOptionDrop(event: CdkDragDrop<FlashcardModel[]>, parentCard: FlashcardModel) {
    const draggedCard = event.previousContainer.data[event.previousIndex];

    // Prevent adding more than 2 options
    if (!parentCard.options) {
      parentCard.options = [];
    }
    if (parentCard.options.length >= 2) {
      alert('Max 2 options allowed');
      return;
    }

    // Prevent nesting a card inside itself
    if (draggedCard === parentCard) {
      return;
    }

    // Remove from old location
    event.previousContainer.data.splice(event.previousIndex, 1);

    // Add to options
    parentCard.options.splice(event.currentIndex, 0, draggedCard);
  }

}
