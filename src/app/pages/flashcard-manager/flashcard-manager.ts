import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FlashcardService } from '../../services/flashcard';
import { FlashcardModel, TopicModel } from '../../models/flashcard';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Modal } from 'bootstrap';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { ModalService } from '../../services/modal.service';

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
  topicNameMap: Record<string, string> = {};

  constructor(
    private route: ActivatedRoute,
    private flashcardService: FlashcardService,
    private sanitizer: DomSanitizer,
    private modalService: ModalService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(async (params) => {
      this.topicId = params.get('topicId') || '';
      this.flashcards = await this.flashcardService.getFlashcardsForTopic(
        this.topicId
      );
      this.allTopics = await this.flashcardService.getTopics(); // Load all topics
      this.editCard = this.blankCard();

      this.loadGroupedFlashcards();
      await this.loadTopicNames(this.allTopics.map(t => t.id));
      this.topicName = this.topicNameMap[this.topicId];
    });
  }

  getSafeUrl(dataUrl: string | undefined): SafeUrl | null {
    return dataUrl ? this.sanitizer.bypassSecurityTrustUrl(dataUrl) : null;
  }

  getTopicIds(grouped: { [topicId: string]: FlashcardModel[] }): string[] {
    return Object.keys(grouped).sort();
  }

  async loadTopicNames(topicIds: string[]) {
    for (const id of topicIds) {
      this.topicNameMap[id] = await this.flashcardService.getFullTopicPath(id);
    }
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

  async loadFlashcards() {
    this.flashcards = await this.flashcardService.getFlashcards(this.topicId);
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

  async saveFlashcard() {
    const maxLength = 5000;
    if (!this.editCard.front?.trim()) {
      await this.modalService.warning('Front of card cannot be empty.');
      return;
    }
    if (!this.editCard.back?.trim()) {
      await this.modalService.warning('Back of card cannot be empty.');
      return;
    }
    if (this.editCard.front.length > maxLength) {
      await this.modalService.warning(`Front text too long. Maximum ${maxLength} characters.`);
      return;
    }
    if (this.editCard.back.length > maxLength) {
      await this.modalService.warning(`Back text too long. Maximum ${maxLength} characters.`);
      return;
    }
    if (this.editCard.notes && this.editCard.notes.length > maxLength) {
      await this.modalService.warning(`Notes too long. Maximum ${maxLength} characters.`);
      return;
    }

    const card = {
      ...this.editCard,
      id: this.editCard.id || crypto.randomUUID(),
      front: this.editCard.front.trim(),
      back: this.editCard.back.trim(),
      notes: this.editCard.notes?.trim(),
    };

    if (this.editCard.id) {
      await this.flashcardService.updateFlashcard(card);
    } else {
      await this.flashcardService.addFlashcard(card);
    }

    this.editCard = this.blankCard();
    await this.loadFlashcards();
  }

  startEdit(card: FlashcardModel) {
    this.editCard = { ...card };
  }

  cancelEdit() {
    this.editCard = this.blankCard();
  }

  async moveCard(card: FlashcardModel) {
    await this.flashcardService.updateFlashcard(card);

    if (card.topicId !== this.topicId) {
      this.flashcards = await this.flashcardService.getFlashcardsForTopic(
        this.topicId
      );
    }
  }

  onFileChange(event: Event, type: 'image' | 'audio') {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    // File size validation (max 5MB for images, 10MB for audio)
    const maxSize = type === 'image' ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      const sizeMB = (maxSize / (1024 * 1024)).toFixed(0);
      this.modalService.warning(`File too large. Maximum size for ${type} is ${sizeMB}MB.`);
      return;
    }

    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const validAudioTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'];
    const validTypes = type === 'image' ? validImageTypes : validAudioTypes;

    if (!validTypes.includes(file.type)) {
      this.modalService.warning(`Invalid file type. Please upload a valid ${type} file.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (type === 'image') {
        this.editCard.imageUrl = reader.result as string;
      } else if (type === 'audio') {
        this.editCard.audioUrl = reader.result as string;
      }
    };
    reader.onerror = () => {
      this.modalService.error('Error reading file. Please try again.');
    };
    reader.readAsDataURL(file);
  }

  clearMedia(type: 'image' | 'audio') {
    if (type === 'image') {
      this.editCard.imageUrl = undefined;
      this.editCard.imageBack = false;
    } else if (type === 'audio') {
      this.editCard.audioUrl = undefined;
      this.editCard.audioBack = false;
    }
  }

  requestDelete(card: FlashcardModel): void {
    this.cardToDelete = card;
    this.deleteModal.show();
  }

  async confirmDelete() {
    if (this.cardToDelete) {
      await this.flashcardService.deleteFlashcard(this.cardToDelete.id);
      await this.loadFlashcards();
      this.cardToDelete = null;
    }
    this.deleteModal.hide();
  }

  async deleteFlashcard(cardId: string) {
    await this.flashcardService.deleteFlashcard(cardId);
    await this.loadFlashcards();
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
      this.modalService.warning('Max 2 options allowed');
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
