import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ProfessionalReportsPage } from './professional-reports.page';

describe('ProfessionalReportsPage interactions', () => {
  function createComponent(): ProfessionalReportsPage {
    TestBed.configureTestingModule({
      imports: [ProfessionalReportsPage],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideNoopAnimations()],
    });
    // No detectChanges() → ngOnInit no corre → sin requests HTTP.
    return TestBed.createComponent(ProfessionalReportsPage).componentInstance;
  }

  it('selectCard sets type, resets page, jumps to Detalle tab and marks detail stale', () => {
    const cmp = createComponent();
    cmp.detailPage.set(3);
    cmp.detailLoaded.set(true);

    cmp.selectCard('cancelled');

    expect(cmp.selectedType()).toBe('cancelled');
    expect(cmp.detailPage()).toBe(0);
    expect(cmp.selectedTabIndex()).toBe(2);
    expect(cmp.detailLoaded()).toBe(false);
  });

  it('selectType(null) is ignored (no deselection)', () => {
    const cmp = createComponent();
    cmp.selectedType.set('confirmed');

    cmp.selectType(null);

    expect(cmp.selectedType()).toBe('confirmed');
  });
});
