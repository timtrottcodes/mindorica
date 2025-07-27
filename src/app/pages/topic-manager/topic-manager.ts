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
  templateUrl: './topic-manager.html',
  styleUrls: ['./topic-manager.scss'],
  imports: [CommonModule, FormsModule, RouterModule]
})
export class TopicManager {
  topics: Topic[] = [];
  newTopic: string = '';
  placeholderTopic: string = '';

  constructor(private flashcardService: FlashcardService) {
    this.loadTopics();
  }

  ngOnInit() {
    this.setRandomPlaceholder();
  }

  setRandomPlaceholder() {
    const index = Math.floor(Math.random() * this.sampleTopics.length);
    this.placeholderTopic = this.sampleTopics[index];
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
