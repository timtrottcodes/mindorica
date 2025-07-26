export interface Topic {
  id: string;
  name: string;
  parent?: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  topicId: string;
  flipped: boolean;
}
