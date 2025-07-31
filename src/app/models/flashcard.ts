export interface TopicModel {
  id: string;
  name: string;
  parent?: string;
}

export interface FlashcardModel {
  id: string;
  parentId?: string;
  front: string;
  back: string;
  topicId: string;
  flipped?: boolean;
  nextReviewDate?: string;
  audioUrl?: string;   // URL or base64
  audioBack?: boolean;    // Optional audio for answer side
  imageUrl?: string;   // URL or base64
  imageBack?: boolean;
  notes?: string;        // Optional explanation
  tags?: string[];       // Optional tags for categorization
  options: FlashcardModel[];
}

interface StudyStateModel {
  due: FlashcardModel[];
  currentIndex: number;
  history: { card: FlashcardModel; rating: number; date: Date }[];
}