import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { FamilyGroupHelpPanelComponent } from './family-group-help-panel.component';

describe('FamilyGroupHelpPanelComponent', () => {
  const KEY = 'fg-help-panel-expanded';

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [FamilyGroupHelpPanelComponent],
      providers: [provideNoopAnimations()],
    });
  });

  function create(): FamilyGroupHelpPanelComponent {
    return TestBed.createComponent(FamilyGroupHelpPanelComponent).componentInstance;
  }

  it('defaults to collapsed when there is no stored preference', () => {
    expect(create().expanded()).toBe(false);
  });

  it('starts expanded when the stored preference is "true"', () => {
    localStorage.setItem(KEY, 'true');
    expect(create().expanded()).toBe(true);
  });

  it('persists the expanded state when it changes', () => {
    const c = create();
    c.onExpandedChange(true);
    expect(c.expanded()).toBe(true);
    expect(localStorage.getItem(KEY)).toBe('true');
    c.onExpandedChange(false);
    expect(localStorage.getItem(KEY)).toBe('false');
  });
});
