// src/app/services/flashcard.service.ts

import { Injectable } from '@angular/core';
import { Flashcard, Topic } from '../models/flashcard';
import { v4 as uuidv4 } from 'uuid';

@Injectable({ providedIn: 'root' })
export class FlashcardService {
  private topicsKey = 'ankular_topics';
  private cardsKey = 'ankular_flashcards';

  private topics: Topic[] = [];
  private flashcards: Flashcard[] = [];

  constructor() {
    this.load();
  }

  private load() {
    this.topics = JSON.parse(localStorage.getItem(this.topicsKey) || '[]');
    this.flashcards = JSON.parse(localStorage.getItem(this.cardsKey) || '[]');
  }

  private save() {
    localStorage.setItem(this.topicsKey, JSON.stringify(this.topics));
    localStorage.setItem(this.cardsKey, JSON.stringify(this.flashcards));
  }

  getTopics(): Topic[] {
    return [...this.topics];
  }

  addTopic(fullId: string) {
    if (this.topics.find(t => t.id === fullId)) return;

    const parts = fullId.split('/');
    const name = parts[parts.length - 1];
    const parent = parts.length > 1 ? parts.slice(0, -1).join('/') : undefined;

    this.topics.push({ id: fullId, name, parent });
    this.save();
  }

  getFlashcardsForTopic(topicId: string): Flashcard[] {
    const relevantTopics = this.getDescendantTopicIds(topicId);
    return this.flashcards.filter(card => relevantTopics.includes(card.topicId));
  }

  private getDescendantTopicIds(topicId: string): string[] {
    const descendants = new Set<string>();

    const collect = (id: string) => {
      descendants.add(id);
      this.topics.filter(t => t.parent === id).forEach(child => collect(child.id));
    };

    collect(topicId);
    return Array.from(descendants);
  }

  addFlashcard(front: string, back: string, topicId: string, flipped: boolean = false) {
    const card: Flashcard = {
      id: uuidv4(),
      front,
      back,
      topicId,
      flipped
    };
    this.flashcards.push(card);
    this.save();
  }

  getFlashcards(): Flashcard[] {
    return [...this.flashcards];
  }
}
