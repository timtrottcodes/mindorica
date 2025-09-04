// src/app/services/flashcard.service.ts

import { Injectable } from '@angular/core';
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { FlashcardModel, TopicModel } from '../models/flashcard';
import { v4 as uuidv4 } from 'uuid';

interface MindoricaDB extends DBSchema {
  topics: {
    key: string;
    value: TopicModel;
  };
  flashcards: {
    key: string;
    value: FlashcardModel;
  };
}

@Injectable({ providedIn: 'root' })
export class FlashcardService {
  private dbPromise: Promise<IDBPDatabase<MindoricaDB>>;
  // legacy localStorage keys
  private topicsKey = 'mindorica_topics';      
  private cardsKey = 'mindorica_flashcards';

  constructor() {
    this.dbPromise = this.initDB();
  }

  private async initDB(): Promise<IDBPDatabase<MindoricaDB>> {
    const db = await openDB<MindoricaDB>('mindorica-db', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('topics')) {
          db.createObjectStore('topics', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('flashcards')) {
          db.createObjectStore('flashcards', { keyPath: 'id' });
        }
      }
    });

    // migrate data from localStorage if found
    const oldTopics = localStorage.getItem(this.topicsKey);
    const oldFlashcards = localStorage.getItem(this.cardsKey);

    if (oldTopics || oldFlashcards) {
      const topics: TopicModel[] = JSON.parse(oldTopics || '[]');
      const flashcards: FlashcardModel[] = JSON.parse(oldFlashcards || '[]');

      const tx = db.transaction(['topics', 'flashcards'], 'readwrite');
      for (const t of topics) await tx.objectStore('topics').put(t);
      for (const c of flashcards) await tx.objectStore('flashcards').put(c);
      await tx.done;

      localStorage.removeItem(this.topicsKey);
      localStorage.removeItem(this.cardsKey);

      alert('Your flashcards have been migrated to a new database for more storage capacity.');
    }

    return db;
  }

  // Save everything in one go
  async saveFlashcardsAndTopics(allTopics: TopicModel[], flashcards: FlashcardModel[]) {
    const db = await this.dbPromise;
    const tx = db.transaction(['topics', 'flashcards'], 'readwrite');

    // clear and reinsert
    await tx.objectStore('topics').clear();
    await tx.objectStore('flashcards').clear();

    for (const t of allTopics) await tx.objectStore('topics').put(t);
    for (const f of flashcards) await tx.objectStore('flashcards').put(f);

    await tx.done;
  }

  // 🔹 Topics
  async getTopics(): Promise<TopicModel[]> {
    const db = await this.dbPromise;
    return await db.getAll('topics');
  }

  async addTopic(fullId: string): Promise<void> {
    const db = await this.dbPromise;
    const topics = await db.getAll('topics');

    if (topics.find(t => t.id === fullId)) return;

    const parts = fullId.split('/');
    const name = parts[parts.length - 1];
    const parentId = parts.length > 1 ? parts.slice(0, -1).join('/') : undefined;

    // recursively add parent first
    if (parentId && !topics.find(t => t.id === parentId)) {
      await this.addTopic(parentId);
    }

    const newTopic: TopicModel = {
      id: fullId,
      name,
      parent: parentId
    };

    await db.put('topics', newTopic);
  }

  // 🔹 Flashcards
  async getFlashcards(topicId?: string): Promise<FlashcardModel[]> {
    const db = await this.dbPromise;
    const all = await db.getAll('flashcards');

    if (topicId) {
      const relevantTopics = await this.getDescendantTopicIds(topicId);
      return all.filter(card => relevantTopics.includes(card.topicId));
    }
    return all;
  }

  async addFlashcard(card: Partial<FlashcardModel>): Promise<void> {
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
      nextReviewDate: card.nextReviewDate || undefined,
      options: []
    };

    const db = await this.dbPromise;
    await db.put('flashcards', newCard);
  }

  async updateFlashcard(updatedCard: FlashcardModel): Promise<void> {
    const db = await this.dbPromise;
    await db.put('flashcards', updatedCard);
  }

  async deleteFlashcard(id: string): Promise<void> {
    const db = await this.dbPromise;
    await db.delete('flashcards', id);
  }

  // 🔹 Recursive topic helper
  private async getDescendantTopicIds(topicId: string): Promise<string[]> {
    const db = await this.dbPromise;
    const topics = await db.getAll('topics');

    const descendants = new Set<string>();
    const collect = (id: string) => {
      descendants.add(id);
      topics.filter(t => t.parent === id).forEach(child => collect(child.id));
    };

    collect(topicId);
    return Array.from(descendants);
  }

  async getFlashcardsForTopic(topicId: string): Promise<FlashcardModel[]> {
    const relevantTopics = await this.getDescendantTopicIds(topicId);
    const db = await this.dbPromise;
    const all = await db.getAll('flashcards');
    return all.filter(card => relevantTopics.includes(card.topicId));
  }
}
