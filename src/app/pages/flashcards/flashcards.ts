// src/app/pages/flashcards/flashcards.component.ts

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Flashcard } from '../../models/flashcard';
import { FlashcardService as FlashcardDataService } from '../../services/flashcard';

@Component({
  selector: 'app-flashcards',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './flashcards.html',
  styleUrls: ['./flashcards.scss'],
})
export class Flashcards implements OnInit {
  topicId!: string;
  topicName = '';
  flashcards: Flashcard[] = [];

  // For new card form
  newFront = '';
  newBack = '';

  constructor(
    private route: ActivatedRoute,
    private flashcardService: FlashcardDataService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('topicId');
      if (id) {
        this.topicId = id;
        this.loadFlashcards();
        this.loadTopicName();
      }
    });
  }

  loadFlashcards() {
    this.flashcards = this.flashcardService.getFlashcardsForTopic(this.topicId);
  }

  loadTopicName() {
    const topic = this.flashcardService.getTopics().find(t => t.id === this.topicId);
    this.topicName = topic ? topic.name : this.topicId;
  }

  toggleCard(card: Flashcard) {
    card.flipped = !card.flipped;
  }

  addFlashcard() {
    if (!this.newFront.trim() || !this.newBack.trim()) return;

    this.flashcardService.addFlashcard(this.newFront.trim(), this.newBack.trim(), this.topicId);
    this.newFront = '';
    this.newBack = '';
    this.loadFlashcards();
  }
}
