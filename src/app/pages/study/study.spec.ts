import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Study } from './study';

describe('Study', () => {
  let component: Study;
  let fixture: ComponentFixture<Study>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Study]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Study);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
