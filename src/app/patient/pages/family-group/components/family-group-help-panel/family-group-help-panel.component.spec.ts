import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import {
  FamilyGroupHelpPanelComponent,
  STORAGE_KEY,
} from './family-group-help-panel.component';

describe('FamilyGroupHelpPanelComponent', () => {
  beforeEach(() => localStorage.clear());

  function configure(platform: 'browser' | 'server' = 'browser'): void {
    TestBed.configureTestingModule({
      imports: [FamilyGroupHelpPanelComponent],
      providers: [
        provideNoopAnimations(),
        ...(platform === 'server'
          ? [{ provide: PLATFORM_ID, useValue: 'server' }]
          : []),
      ],
    });
  }

  it('defaults to collapsed when there is no stored preference', () => {
    configure();
    const c = TestBed.createComponent(FamilyGroupHelpPanelComponent)
      .componentInstance;
    expect(c.expanded()).toBe(false);
  });

  it('starts expanded when the stored preference is "true"', () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    configure();
    const c = TestBed.createComponent(FamilyGroupHelpPanelComponent)
      .componentInstance;
    expect(c.expanded()).toBe(true);
  });

  it('persists the expanded state when it changes', () => {
    configure();
    const c = TestBed.createComponent(FamilyGroupHelpPanelComponent)
      .componentInstance;
    c.onExpandedChange(true);
    expect(c.expanded()).toBe(true);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('true');
    c.onExpandedChange(false);
    expect(c.expanded()).toBe(false);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('false');
  });

  it('toggles when the panel header is clicked (template binding)', () => {
    configure();
    const fixture = TestBed.createComponent(FamilyGroupHelpPanelComponent);
    fixture.detectChanges();
    const header: HTMLElement = fixture.nativeElement.querySelector(
      'mat-expansion-panel-header',
    );
    header.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.expanded()).toBe(true);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('true');
  });

  it('does not touch localStorage on the server (SSR-safe)', () => {
    configure('server');
    const c = TestBed.createComponent(FamilyGroupHelpPanelComponent)
      .componentInstance;
    expect(c.expanded()).toBe(false);
    c.onExpandedChange(true);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
