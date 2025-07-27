import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TopicManager } from './topic-manager';

describe('Topics', () => {
  let component: TopicManager;
  let fixture: ComponentFixture<TopicManager>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TopicManager]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TopicManager);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
