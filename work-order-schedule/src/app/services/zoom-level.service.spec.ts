import { TestBed } from '@angular/core/testing';
import { ZoomLevelService } from './zoom-level.service';

describe('ZoomLevelService', () => {
  let service: ZoomLevelService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ZoomLevelService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should default to month', () => {
    expect(service.level()).toBe('month');
  });

  it('should set and expose level', () => {
    service.setLevel('day');
    expect(service.level()).toBe('day');

    service.setLevel('week');
    expect(service.level()).toBe('week');

    service.setLevel('hours');
    expect(service.level()).toBe('hours');

    service.setLevel('month');
    expect(service.level()).toBe('month');
  });
});
