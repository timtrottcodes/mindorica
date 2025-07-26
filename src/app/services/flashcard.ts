import { Injectable } from '@angular/core';

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  tags?: string[];
}

export interface Topic {
  id: string;
  name: string;
  cards: Flashcard[];
}

@Injectable({
  providedIn: 'root'
})
export class FlashcardService {
  private storageKey = 'ankular_topics';

  getTopics(): Topic[] {
    const raw = localStorage.getItem(this.storageKey);
    return raw ? JSON.parse(raw) : [];
  }

  saveTopics(topics: Topic[]) {
    localStorage.setItem(this.storageKey, JSON.stringify(topics));
  }

  addTopic(name: string): void {
    const topics = this.getTopics();
    topics.push({ id: crypto.randomUUID(), name, cards: [] });
    this.saveTopics(topics);
  }
}
