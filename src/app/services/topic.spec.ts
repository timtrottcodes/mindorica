import { TestBed } from '@angular/core/testing';

import { Topic } from './topic';

describe('Topic', () => {
  let service: Topic;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Topic);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
