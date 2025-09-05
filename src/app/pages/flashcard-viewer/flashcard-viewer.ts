import { Component, OnInit, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FlashcardService } from '../../services/flashcard';
import { FlashcardModel } from '../../models/flashcard';
import { FlashcardComponent } from '../../components/flashcard/flashcard';
import { CommonModule } from '@angular/common';
import { AppRoutes } from '../../app-routing';
import { from } from 'rxjs';

@Component({
  selector: 'app-flashcard-viewer',
  standalone: true,
  imports: [CommonModule, FlashcardComponent],
  templateUrl: './flashcard-viewer.html',
  styleUrls: ['./flashcard-viewer.scss'],
})
export class FlashcardViewer implements OnInit {
  topicId!: string;
  topicName: string = "";
  cards: FlashcardModel[] = [];
  currentIndex = 0;
  showBack = false;
  feedback = '';
  reviewingDone = false;
  scorePercent = 0;
  averageRating = 0;
  countRatings: Record<number, number> = {};
  cardsToReview: { front: string; rating: number }[] = [];
  finalMessage = '';
  shuffledOptions?: FlashcardModel[];
  selectedOption: string | null = null;

  studyHistory: {
    card: FlashcardModel;
    rating: number;
    date: Date;
    nextReviewDate: string;
  }[] = [];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private flashcardService: FlashcardService
  ) {}

  ngOnInit(): void {
    this.topicId = decodeURIComponent(
      this.route.snapshot.paramMap.get('topicId') || ''
    );

    from(this.flashcardService.getFullTopicPath(this.topicId)).subscribe((topicName: string) => {
      this.topicName = topicName;
    });
    from(this.getFlashcards()).subscribe((flashCards) => {
      this.cards = flashCards;
    });
  }

  async getFlashcards(): Promise<FlashcardModel[]> {
    const raw = await this.flashcardService.getFlashcardsForTopic(this.topicId);

    // If less than or equal to 15, just shuffle and return
    if (raw.length <= 15) {
      return this.shuffle([...raw]);
    }

    const now = new Date().toISOString();

    // Sort by nextReviewDate (earliest first), treating undefined as most overdue
    const sorted = [...raw].sort((a, b) => {
      const aDate = a.nextReviewDate || '1970-01-01T00:00:00.000Z';
      const bDate = b.nextReviewDate || '1970-01-01T00:00:00.000Z';
      return new Date(aDate).getTime() - new Date(bDate).getTime();
    });

    const dueCards = sorted.filter(
      (card) => !card.nextReviewDate || card.nextReviewDate <= now
    );

    const selected =
      dueCards.length >= 15 ? dueCards.slice(0, 15) : sorted.slice(0, 15);

    return this.shuffle(selected);
  }

  get currentCard(): FlashcardModel | undefined {
    return this.cards[this.currentIndex];
  }

  onSelectOption(choice: string, correct: string) {
    this.selectedOption = choice;
    this.flip();
  }

  getMultipleChoiceOptions(card: FlashcardModel): FlashcardModel[] {
    if (!this.shuffledOptions) {
      const wrongs = card.options ?? []; // already FlashcardModel[]
      const allOptions = [card, ...wrongs]; // merge into one array
      this.shuffledOptions = this.shuffleArray(allOptions);
    }
    return this.shuffledOptions;
  }

  shuffleArray<T>(array: T[]): T[] {
    return [...array].sort(() => Math.random() - 0.5);
  }

  flip(): void {
    this.showBack = !this.showBack;
  }

  rateCard(rating: number): void {
    const card = this.cards[this.currentIndex];
    const now = new Date();

    let daysToNext = 1;
    if (rating === 2) daysToNext = 3;
    if (rating === 3) daysToNext = 6;
    if (rating === 4) daysToNext = 10;

    const nextReviewDate = new Date(
      now.getTime() + daysToNext * 86400000
    ).toISOString();
    card.nextReviewDate = nextReviewDate;

    this.studyHistory.push({
      card,
      rating,
      date: now,
      nextReviewDate,
    });

    if (!this.countRatings[rating]) {
      this.countRatings[rating] = 1;
    } else {
      this.countRatings[rating]++;
    }

    this.flashcardService.updateFlashcard(card); // Save updated review info
    this.feedback = this.getFeedback(rating);
    this.showBack = false;

    setTimeout(() => {
      this.feedback = '';
      this.advance();
    }, 1500);
  }

  async advance() {
    this.shuffledOptions = undefined;
    this.selectedOption = '';
    this.currentIndex++;
    if (this.currentIndex >= this.cards.length) {
      this.reviewingDone = true;

      const total = this.studyHistory.length;
      const sum = this.studyHistory.reduce((acc, item) => acc + item.rating, 0);
      this.averageRating = total > 0 ? sum / total : 0;
      this.scorePercent = (this.averageRating / 4) * 100;

      this.cardsToReview = this.studyHistory
        .filter((item) => item.rating <= 2)
        .map((item) => ({ front: item.card.front, rating: item.rating }));

      this.finalMessage =
        this.scorePercent >= 90
          ? 'Excellent work! 🔥 You really know your stuff.'
          : this.scorePercent >= 70
          ? 'Nice job! Keep reviewing for mastery. 💪'
          : 'Keep practicing, you’re improving every time! 💡';

      await this.flashcardService.logTopicScore(
        this.topicId,
        total,
        this.averageRating,
        this.scorePercent
      );
    }
  }

  async restart() {
    this.currentIndex = 0;
    this.reviewingDone = false;
    this.studyHistory = [];
    this.countRatings = {};
    this.averageRating = 0;
    this.scorePercent = 0;
    this.cardsToReview = [];
    this.finalMessage = '';
    this.cards = await this.getFlashcards();
  }

  topics() {
    this.router.navigate([AppRoutes.StudyViewer]);
  }

  shuffle(array: FlashcardModel[]): FlashcardModel[] {
    return array.sort(() => Math.random() - 0.5);
  }

  getFeedback(rating: number): string {
    switch (rating) {
      case 1:
        return 'You’ll get it next time!';
      case 2:
        return 'Keep it up!';
      case 3:
        return 'Great job!';
      case 4:
        return 'Perfect recall!';
      default:
        return '';
    }
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboard(event: KeyboardEvent): void {
    if (this.reviewingDone) return;
    if (event.code === 'Space') this.flip();
    if (this.showBack) {
      if (event.key === '1') this.rateCard(1);
      if (event.key === '2') this.rateCard(2);
      if (event.key === '3') this.rateCard(3);
      if (event.key === '4') this.rateCard(4);
    }
  }
}
