// src/app/services/flashcard.service.ts

import { Injectable } from '@angular/core';
import { Flashcard, Topic } from '../models/flashcard';
import { v4 as uuidv4 } from 'uuid';

@Injectable({ providedIn: 'root' })
export class FlashcardService {
  private topicsKey = 'mindorica_topics';
  private cardsKey = 'mindorica_flashcards';

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

  // Topics
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

  // Flashcards
  getFlashcards(topicId?: string): Flashcard[] {
    if (topicId) {
      const relevantTopics = this.getDescendantTopicIds(topicId);
      return this.flashcards.filter(card => relevantTopics.includes(card.topicId));
    }
    return [...this.flashcards];
  }

  addFlashcard(card: Partial<Flashcard>) {
    if (!card.front || !card.back || !card.topicId) return;

    const newCard: Flashcard = {
      id: uuidv4(),
      front: card.front,
      back: card.back,
      topicId: card.topicId,
      flipped: card.flipped ?? false
    };

    this.flashcards.push(newCard);
    this.save();
  }

  updateFlashcard(updatedCard: Flashcard) {
    const index = this.flashcards.findIndex(c => c.id === updatedCard.id);
    if (index !== -1) {
      this.flashcards[index] = updatedCard;
      this.save();
    }
  }

  deleteFlashcard(id: string) {
    this.flashcards = this.flashcards.filter(card => card.id !== id);
    this.save();
  }

  // Recursive topic helper
  private getDescendantTopicIds(topicId: string): string[] {
    const descendants = new Set<string>();

    const collect = (id: string) => {
      descendants.add(id);
      this.topics.filter(t => t.parent === id).forEach(child => collect(child.id));
    };

    collect(topicId);
    return Array.from(descendants);
  }

  getFlashcardsForTopic(topicId: string): Flashcard[] {
    const relevantTopics = this.getDescendantTopicIds(topicId);
    return this.flashcards.filter(card => relevantTopics.includes(card.topicId));
  }  
}
