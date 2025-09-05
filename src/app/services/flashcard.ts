// src/app/services/flashcard.service.ts

import { Injectable } from '@angular/core';
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { FlashcardModel, TopicModel, TopicScore } from '../models/flashcard';
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
  topicScores: {
    key: number;
    value: TopicScore;
    indexes: { 'by-topicId': string };
  };
}

@Injectable({ providedIn: 'root' })
export class FlashcardService {
  private dbPromise: Promise<IDBPDatabase<MindoricaDB>>;

  constructor() {
    this.dbPromise = this.initDB();
  }

  private async initDB(): Promise<IDBPDatabase<MindoricaDB>> {
    const db = await openDB<MindoricaDB>('mindorica-db', 4, {
      upgrade(db, oldVersion, newVersion, transaction) {
        if (!db.objectStoreNames.contains('topics')) {
          db.createObjectStore('topics', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('flashcards')) {
          db.createObjectStore('flashcards', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('topicScores')) {
          const store = db.createObjectStore('topicScores', {
            keyPath: 'id',
            autoIncrement: true,
          });
          store.createIndex('by-topicId', 'topicId');
        } else {
          const store = transaction.objectStore('topicScores');
          if (!store.indexNames.contains('by-topicId')) {
            store.createIndex('by-topicId', 'topicId');
          }
        }
      },
    });

    // migrate data from localStorage if found
    // legacy localStorage keys
    const topicsKey = 'mindorica_topics';
    const cardsKey = 'mindorica_flashcards';
    const oldTopics = localStorage.getItem(topicsKey);
    const oldFlashcards = localStorage.getItem(cardsKey);

    if (oldTopics || oldFlashcards) {
      const topics: TopicModel[] = JSON.parse(oldTopics || '[]');
      const flashcards: FlashcardModel[] = JSON.parse(oldFlashcards || '[]');

      const tx = db.transaction(['topics', 'flashcards'], 'readwrite');
      for (const t of topics) await tx.objectStore('topics').put(t);
      for (const c of flashcards) await tx.objectStore('flashcards').put(c);
      await tx.done;

      localStorage.removeItem(topicsKey);
      localStorage.removeItem(cardsKey);

      alert(
        'Your flashcards have been migrated to a new database for more storage capacity.'
      );
    }

    return db;
  }

  // Save everything in one go
  async saveFlashcardsAndTopics(
    allTopics: TopicModel[],
    flashcards: FlashcardModel[]
  ) {
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

  async getTopicName(topicId: string): Promise<string> {
    const db = await this.dbPromise;
    const topic = await db.get('topics', topicId);
    return topic ? topic.name : "";
  }

  async getFullTopicPath(topicId: string): Promise<string> {
    const db = await this.dbPromise;
    const parts: string[] = [];

    let currentId: string | undefined = topicId;

    while (currentId) {
      const topic: TopicModel | undefined = await db.get('topics', currentId);
      if (!topic) break; // safety check

      parts.unshift(topic.name); // prepend to build path from root
      currentId = topic.parent;
    }

    return parts.join(' > ');
  }

  async addTopic(topic: TopicModel): Promise<void> {
    const db = await this.dbPromise;
    const topics = await db.getAll('topics');

    // Prevent duplicates
    if (topics.find((t) => t.id === topic.id)) return;

    // If the topic has a parent, ensure the parent exists
    if (topic.parent && !topics.find((t) => t.id === topic.parent)) {
      throw new Error(`Parent topic with id "${topic.parent}" does not exist.`);
    }

    await db.put('topics', topic);
  }

  // 🔹 Flashcards
  async getFlashcards(topicId?: string): Promise<FlashcardModel[]> {
    const db = await this.dbPromise;
    const all = await db.getAll('flashcards');

    if (topicId) {
      const relevantTopics = await this.getDescendantTopicIds(topicId);
      return all.filter((card) => relevantTopics.includes(card.topicId));
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
      options: [],
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
      topics
        .filter((t) => t.parent === id)
        .forEach((child) => collect(child.id));
    };

    collect(topicId);
    return Array.from(descendants);
  }

  async getFlashcardsForTopic(topicId: string): Promise<FlashcardModel[]> {
    const relevantTopics = await this.getDescendantTopicIds(topicId);
    const db = await this.dbPromise;
    const all = await db.getAll('flashcards');
    return all.filter((card) => relevantTopics.includes(card.topicId));
  }

  async logTopicScore(
    topicId: string,
    totalCards: number,
    averageRating: number,
    scorePercent: number
  ): Promise<void> {
    const db = await this.dbPromise;

    const newScore: TopicScore = {
      id: this.generateId(),
      topicId,
      date: Date.now(),
      totalCards,
      averageRating,
      scorePercent,
    };

    await db.put('topicScores', newScore);
  }

  async getAverageScorePercent(topicId: string): Promise<number> {
    const db = await this.dbPromise;
    const scores = await db.getAllFromIndex(
      'topicScores',
      'by-topicId',
      topicId
    );

    if (!scores.length) return 0;

    const total = scores.reduce((acc, s) => acc + s.scorePercent, 0);
    return total / scores.length;
  }

  async getStreaks(
    topicId: string
  ): Promise<{ current: number; longest: number }> {
    const db = await this.dbPromise;
    const scores = await db.getAllFromIndex(
      'topicScores',
      'by-topicId',
      topicId
    );

    if (!scores.length) {
      return { current: 0, longest: 0 };
    }

    // Sort by date ascending
    scores.sort((a, b) => a.date - b.date);

    const days = scores.map((s) => {
      const d = new Date(s.date);
      d.setHours(0, 0, 0, 0); // normalize to midnight
      return d.getTime();
    });

    let longest = 1;
    let current = 1;

    for (let i = 1; i < days.length; i++) {
      const prev = days[i - 1];
      const curr = days[i];

      const diffDays = (curr - prev) / (1000 * 60 * 60 * 24);

      if (diffDays === 0) {
        // same day, skip (only count once per day)
        continue;
      } else if (diffDays === 1) {
        // consecutive day
        current++;
        longest = Math.max(longest, current);
      } else {
        // streak broken
        current = 1;
      }
    }

    // Check if the last recorded day was today; otherwise, current streak = 0
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastDay = days[days.length - 1];
    if (lastDay !== today.getTime()) {
      current = 0;
    }

    return { current, longest };
  }

  async getGlobalStreaks(): Promise<{ current: number; longest: number }> {
    const db = await this.dbPromise;
    const scores = await db.getAll('topicScores');

    if (!scores.length) {
      return { current: 0, longest: 0 };
    }

    // Sort by date ascending
    scores.sort((a, b) => a.date - b.date);

    // Normalize to days only
    const days = Array.from(
      new Set(
        scores.map((s) => {
          const d = new Date(s.date);
          d.setHours(0, 0, 0, 0);
          return d.getTime();
        })
      )
    ).sort((a, b) => a - b);

    let longest = 1;
    let current = 1;

    for (let i = 1; i < days.length; i++) {
      const prev = days[i - 1];
      const curr = days[i];

      const diffDays = (curr - prev) / (1000 * 60 * 60 * 24);

      if (diffDays === 1) {
        current++;
        longest = Math.max(longest, current);
      } else {
        current = 1;
      }
    }

    // Reset current if the last day isn’t today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (days[days.length - 1] !== today.getTime()) {
      current = 0;
    }

    return { current, longest };
  }

  async getWeeklyStreak(): Promise<{ label: string; checked: boolean }[]> {
    const db = await this.dbPromise;
    const scores = await db.getAll('topicScores');

    // Days of week starting Sunday
    const labels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const weekDays = labels.map((label) => ({ label, checked: false }));

    if (!scores.length) {
      return weekDays;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Work back 6 days from today to cover this week
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday

    const daysWithScores = new Set(
      scores.map((s) => {
        const d = new Date(s.date);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      })
    );

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);

      const key = day.getTime();
      const dow = day.getDay(); // 0=Sunday … 6=Saturday

      weekDays[dow].checked = daysWithScores.has(key);
    }

    return weekDays;
  }

  private generateId(): string {
    return '_' + Math.random().toString(36).substr(2, 9);
  }
}
