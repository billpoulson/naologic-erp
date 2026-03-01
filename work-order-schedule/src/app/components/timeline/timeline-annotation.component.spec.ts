import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TimelineAnnotationComponent } from './timeline-annotation.component';
import { TimelineAnnotationService } from '../../services/timeline-annotation.service';
import { ZoomLevelService } from '../../services/zoom-level.service';
import { TimelineCalculatorService } from '../../services/timeline-calculator.service';

describe('TimelineAnnotationComponent', () => {
  let component: TimelineAnnotationComponent;
  let fixture: ComponentFixture<TimelineAnnotationComponent>;
  let zoomService: ZoomLevelService;

  // Monday March 10, 2025 at 10:00 AM - within the test date ranges
  const fixedDate = new Date(2025, 2, 10, 10, 0, 0, 0);

  const dateRangeContainingNow = {
    start: new Date(2025, 2, 1),
    end: new Date(2025, 2, 31),
  };

  const dateRangeExcludingNow = {
    start: new Date(2020, 0, 1),
    end: new Date(2020, 0, 31),
  };

  const timelineWidth = 1000;

  beforeEach(async () => {
    jasmine.clock().install();
    jasmine.clock().mockDate(fixedDate);

    await TestBed.configureTestingModule({
      imports: [TimelineAnnotationComponent],
      providers: [
        TimelineAnnotationService,
        ZoomLevelService,
        TimelineCalculatorService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TimelineAnnotationComponent);
    component = fixture.componentInstance;
    zoomService = TestBed.inject(ZoomLevelService);

    fixture.componentRef.setInput('dateRange', dateRangeContainingNow);
    fixture.componentRef.setInput('timelineWidth', timelineWidth);
    fixture.detectChanges();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render overlay when bounds exist', () => {
    const overlay = fixture.nativeElement.querySelector('.current-unit-annotation');
    expect(overlay).toBeTruthy();
    expect(overlay.style.left).toBeDefined();
    expect(overlay.style.width).toBeDefined();
    const left = parseInt(overlay.style.left || '0', 10);
    const width = parseInt(overlay.style.width || '0', 10);
    expect(left).toBeGreaterThanOrEqual(0);
    expect(width).toBeGreaterThan(0);
    expect(left + width).toBeLessThanOrEqual(timelineWidth);
  });

  it('should not render overlay when date range excludes now', () => {
    fixture.componentRef.setInput('dateRange', dateRangeExcludingNow);
    fixture.detectChanges();

    const overlay = fixture.nativeElement.querySelector('.current-unit-annotation');
    expect(overlay).toBeFalsy();
  });

  it('should update overlay when zoom level changes', () => {
    const overlayBefore = fixture.nativeElement.querySelector('.current-unit-annotation');
    const leftBefore = parseInt(overlayBefore?.style.left || '0', 10);
    const widthBefore = parseInt(overlayBefore?.style.width || '0', 10);

    zoomService.setLevel('day');
    fixture.detectChanges();

    const overlayAfter = fixture.nativeElement.querySelector('.current-unit-annotation');
    expect(overlayAfter).toBeTruthy();
    const leftAfter = parseInt(overlayAfter?.style.left || '0', 10);
    const widthAfter = parseInt(overlayAfter?.style.width || '0', 10);

    // Day and month units have different spans, so position/size should change
    expect(leftAfter !== leftBefore || widthAfter !== widthBefore).toBeTrue();
  });
});
