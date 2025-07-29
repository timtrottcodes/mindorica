import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FlashcardService } from '../../services/flashcard';
import { TopicModel } from '../../models/flashcard';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppRoutes } from '../../app-routing';

@Component({
  selector: 'app-study',
  templateUrl: './study.html',
  imports: [CommonModule, FormsModule]
})
export class Study implements OnInit {
  topicCounts: { topic: TopicModel; count: number }[] = [];
  filteredTopics: { topic: TopicModel; count: number }[] = [];
  categories: string[] = [];
  selectedCategory: string = 'All';

  constructor(
    private flashcardService: FlashcardService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const allTopics = this.flashcardService.getTopics();
    if (!allTopics.length) {
      this.router.navigate(['/topic-manager']);
      return;
    }

    const topicWithCounts = allTopics
      .map(topic => {
        const cards = this.flashcardService.getFlashcardsForTopic(topic.id);
        return { topic, count: cards.length };
      })
      .filter(tc => tc.count > 0);

    // Filter out parent topics if any of their subtopics have cards
    const leafOnly = topicWithCounts.filter(tc => {
      const isParent = topicWithCounts.some(
        other => other.topic.id.startsWith(tc.topic.id + '/') && other.topic.id !== tc.topic.id
      );
      return !isParent;
    });

    if (!leafOnly.length) {
      this.router.navigate(['/topic-manager']);
      return;
    }

    this.topicCounts = leafOnly;

    const categorySet = new Set<string>();
    for (const tc of this.topicCounts) {
      const [category] = tc.topic.id.split('/');
      categorySet.add(category);
    }

    this.categories = ['All', ...Array.from(categorySet).sort()];
    this.applyFilter();
  }


  applyFilter(): void {
    this.filteredTopics = this.selectedCategory === 'All'
      ? this.topicCounts
      : this.topicCounts.filter(tc => tc.topic.id.startsWith(this.selectedCategory + '/'));
  }

  startStudy(topic: string): void {
    this.router.navigate(['flashcard-viewer', topic]);
  }
}
