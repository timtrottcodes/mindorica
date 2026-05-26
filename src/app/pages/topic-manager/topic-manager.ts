// src/app/pages/topics/topics.component.ts

import { Component } from '@angular/core';
import { FlashcardService } from '../../services/flashcard';
import { TopicModel } from '../../models/flashcard';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TopicTree } from '../../components/TopicTree/TopicTree';
import { ModalService } from '../../services/modal.service';

@Component({
  selector: 'app-topics',
  standalone: true,
  templateUrl: './topic-manager.html',
  styleUrls: ['./topic-manager.scss'],
  imports: [CommonModule, FormsModule, RouterModule, TopicTree]
})
export class TopicManager {
  topics: TopicModel[] = [];
  newTopic: string = '';
  placeholderTopic: string = '';
  selectedParent: string = '';
  indentedTopics: { topic: TopicModel; depth: number }[] = [];
  rootTopics: TopicModel[] = [];

  constructor(
    private flashcardService: FlashcardService,
    private modalService: ModalService
  ) {
    this.loadTopics();
  }

  ngOnInit() {
    this.setRandomPlaceholder();
  }

  setRandomPlaceholder() {
    const index = Math.floor(Math.random() * this.sampleTopics.length);
    this.placeholderTopic = this.sampleTopics[index];
  }

  async loadTopics() {
    this.topics = await this.flashcardService.getTopics();
    this.rootTopics = this.topics.filter(t => !t.parent);
    this.indentedTopics = this.getIndentedTopics();
  }

  async addTopic() {
    const trimmed = this.newTopic.trim();
    if (!trimmed) return;

    // Input validation
    const maxLength = 100;
    if (trimmed.length > maxLength) {
      this.modalService.warning(`Topic name too long. Maximum ${maxLength} characters.`);
      return;
    }

    // Check for duplicate names at the same level
    const siblings = this.selectedParent
      ? this.topics.filter(t => t.parent === this.selectedParent)
      : this.topics.filter(t => !t.parent);

    if (siblings.some(t => t.name.toLowerCase() === trimmed.toLowerCase())) {
      this.modalService.warning('A topic with this name already exists at this level.');
      return;
    }

    const topic: TopicModel = {
      id: crypto.randomUUID(),
      name: trimmed,
      parent: this.selectedParent || undefined
    };

    await this.flashcardService.addTopic(topic);
    this.newTopic = '';
    this.selectedParent = '';
    await this.loadTopics();
  }

  getSubtopics(parentId: string): TopicModel[] {
    return this.topics.filter(t => t.parent === parentId);
  }

  getRootTopics(): TopicModel[] {
    return this.topics.filter(t => !t.parent);
  }

  getIndentedTopics(): { topic: TopicModel; depth: number }[] {
    const result: { topic: TopicModel; depth: number }[] = [];

    const addWithChildren = (parentId?: string, depth = 0) => {
      const children = this.topics
        .filter(t => t.parent === parentId)
        .sort((a, b) => a.name.localeCompare(b.name));

      for (const child of children) {
        result.push({ topic: child, depth });
        addWithChildren(child.id, depth + 1);
      }
    };

    addWithChildren(); // start with root topics
    return result;
  }

  getDepth(topic: TopicModel): number {
    let depth = 0;
    let current = topic;
    const visited = new Set<string>();

    while (current.parent) {
      if (visited.has(current.id)) {
        console.error('Circular reference detected in topic hierarchy:', current.id);
        return depth;
      }
      visited.add(current.id);

      depth++;
      const parent = this.topics.find(t => t.id === current.parent);
      if (!parent) break;
      current = parent;
    }
    return depth;
  }

  private sampleTopics: string[] = [
    'Spanish/Grammar',
    'Physics/Quantum Mechanics',
    'Football/Rules',
    'WorldHistory/Renaissance',
    'Law/Contract Law',
    'Mathematics/Algebra',
    'Chemistry/Organic',
    'Basketball/Dribbling',
    'Philosophy/Ethics',
    'Biology/Genetics',
    'Programming/JavaScript',
    'Geography/Capitals',
    'French/Verbs',
    'Psychology/Cognitive',
    'Music/Theory',
    'Art/Impressionism',
    'Economics/Macro',
    'Medicine/Anatomy',
    'Sociology/Culture',
    'Astronomy/Stars',
    'English/Vocabulary',
    'History/WWII',
    'Law/Criminal',
    'Spanish/Verbs',
    'Physics/Thermodynamics',
    'Sports/Tennis',
    'Philosophy/Logic',
    'Biology/Ecology',
    'Programming/Python',
    'Geography/Landforms',
    'French/Vocabulary',
    'Psychology/Behavior',
    'Music/Instruments',
    'Art/Modern',
    'Economics/Micro',
    'Medicine/Pharmacology',
    'Sociology/Groups',
    'Astronomy/Planets',
    'English/Grammar',
    'History/Ancient Egypt',
    'Law/International',
    'Spanish/Pronunciation',
    'Physics/Relativity',
    'Sports/Baseball',
    'Philosophy/Metaphysics',
    'Biology/Cell Biology',
    'Programming/Java',
    'Geography/Maps',
    'French/Conversation',
    'Psychology/Memory',
    'Music/Composition',
    'Art/Sculpture'
  ];
}
