// src/app/services/flashcard.service.ts

import { Injectable } from '@angular/core';
import { FlashcardModel, TopicModel } from '../models/flashcard';
import { v4 as uuidv4 } from 'uuid';

@Injectable({ providedIn: 'root' })
export class FlashcardService {
  private topicsKey = 'mindorica_topics';
  private cardsKey = 'mindorica_flashcards';

  private topics: TopicModel[] = [];
  private flashcards: FlashcardModel[] = [];

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
  getTopics(): TopicModel[] {
    return [...this.topics];
  }

  addTopic(fullId: string) {
    // Don't add if it already exists
    if (this.topics.find(t => t.id === fullId)) return;

    const parts = fullId.split('/');
    const name = parts[parts.length - 1];
    const parentId = parts.length > 1 ? parts.slice(0, -1).join('/') : undefined;

    // Recursively add parent first if needed
    if (parentId && !this.topics.find(t => t.id === parentId)) {
      this.addTopic(parentId);
    }

    // Add the current topic
    this.topics.push({
      id: fullId,
      name,
      parent: parentId,
    });

    this.save();
  }


  // Flashcards
  getFlashcards(topicId?: string): FlashcardModel[] {
    if (topicId) {
      const relevantTopics = this.getDescendantTopicIds(topicId);
      return this.flashcards.filter(card => relevantTopics.includes(card.topicId));
    }
    return [...this.flashcards];
  }

  addFlashcard(card: Partial<FlashcardModel>) {
    if (!card.front || !card.back || !card.topicId) return;

    const newCard: FlashcardModel = {
      id: card.id || uuidv4(),
      front: card.front,
      back: card.back,
      topicId: card.topicId,
      flipped: card.flipped ?? false,
      imageUrl: card.imageUrl || undefined,
      audioUrl: card.audioUrl || undefined,
      notes: card.notes || undefined,
      nextReviewDate: card.nextReviewDate || undefined
    };

    this.flashcards.push(newCard);
    this.save();
  }

  updateFlashcard(updatedCard: FlashcardModel) {
    const index = this.flashcards.findIndex(c => c.id === updatedCard.id);
    if (index !== -1) {
      this.flashcards[index] = {
        ...this.flashcards[index],
        ...updatedCard
      };
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

  getFlashcardsForTopic(topicId: string): FlashcardModel[] {
    const relevantTopics = this.getDescendantTopicIds(topicId);
    return this.flashcards.filter(card => relevantTopics.includes(card.topicId));
  }  
}
