import { TestBed } from '@angular/core/testing';

import { FlashcardService } from './flashcard';

describe('Flashcard', () => {
  let service: FlashcardService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FlashcardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
