export interface TopicModel {
  id: string;
  name: string;
  parent?: string;
}

export interface FlashcardModel {
  id: string;
  front: string;
  back: string;
  topicId: string;
  flipped: boolean;
  nextReviewDate?: string;
}

interface StudyStateModel {
  due: FlashcardModel[];
  currentIndex: number;
  history: { card: FlashcardModel; rating: number; date: Date }[];
}