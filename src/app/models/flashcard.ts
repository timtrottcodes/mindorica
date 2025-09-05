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

export interface TopicScore {
  id: string;          // unique id for this entry
  topicId: string;     // the topic this score belongs to
  date: number;        // timestamp of completion
  totalCards: number;  // total cards in the session
  averageRating: number; // average rating for this session (0-4)
  scorePercent: number;  // percentage score (0-100)
}