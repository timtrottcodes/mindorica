// src/app/pages/topics/topics.component.ts

import { Component } from '@angular/core';
import { FlashcardService } from '../../services/flashcard';
import { Topic } from '../../models/flashcard';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-topics',
  standalone: true,
  templateUrl: './topics.html',
  styleUrls: ['./topics.scss'],
  imports: [CommonModule, FormsModule, RouterModule]
})
export class Topics {
  topics: Topic[] = [];
  newTopic: string = '';

  constructor(private flashcardService: FlashcardService) {
    this.loadTopics();
  }

  loadTopics() {
    this.topics = this.flashcardService.getTopics();
  }

  addTopic() {
    const trimmed = this.newTopic.trim();
    if (!trimmed) return;

    this.flashcardService.addTopic(trimmed);
    this.newTopic = '';
    this.loadTopics();
  }

  getSubtopics(parentId: string): Topic[] {
    return this.topics.filter(t => t.parent === parentId);
  }

  getRootTopics(): Topic[] {
    return this.topics.filter(t => !t.parent);
  }
}
