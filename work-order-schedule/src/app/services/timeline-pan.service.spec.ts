import { TestBed } from '@angular/core/testing';
import { TimelinePanService } from './timeline-pan.service';

describe('TimelinePanService', () => {
  let service: TimelinePanService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TimelinePanService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with didPan false', () => {
    expect(service.didPan()).toBe(false);
  });

  it('should set didPan true when setPanningOccurred is called', () => {
    service.setPanningOccurred();
    expect(service.didPan()).toBe(true);
  });

  it('consumeAndReset should return true and reset when panning occurred', () => {
    service.setPanningOccurred();
    const result = service.consumeAndReset();
    expect(result).toBe(true);
    expect(service.didPan()).toBe(false);
  });

  it('consumeAndReset should return false when no panning occurred', () => {
    const result = service.consumeAndReset();
    expect(result).toBe(false);
  });
});
