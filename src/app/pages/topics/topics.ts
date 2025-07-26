import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FlashcardService, Topic } from '../../services/flashcard';

@Component({
  standalone: true,
  selector: 'app-topics',
  templateUrl: './topics.html',
  styleUrl: './topics.scss',
  imports: [FormsModule]
})
export class Topics {
  topics: Topic[] = [];
  newTopicName = '';

  constructor(private flashcardService: FlashcardService) {
    this.topics = flashcardService.getTopics();
  }

  addTopic() {
    if (!this.newTopicName.trim()) return;
    this.flashcardService.addTopic(this.newTopicName.trim());
    this.newTopicName = '';
    this.topics = this.flashcardService.getTopics();
  }
}
