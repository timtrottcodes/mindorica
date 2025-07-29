import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FlashcardViewer } from './flashcard-viewer';

describe('FlashcardViewer', () => {
  let component: FlashcardViewer;
  let fixture: ComponentFixture<FlashcardViewer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FlashcardViewer]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FlashcardViewer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
