import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FlashcardManager } from './flashcard-manager';

describe('FlashcardManager', () => {
  let component: FlashcardManager;
  let fixture: ComponentFixture<FlashcardManager>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FlashcardManager]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FlashcardManager);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
