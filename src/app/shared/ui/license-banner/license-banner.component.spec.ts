import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthStore } from '@core/auth';
import { LicenseBannerComponent } from './license-banner.component';

describe('LicenseBannerComponent', () => {
  function setup(lapsed: boolean) {
    TestBed.configureTestingModule({
      imports: [LicenseBannerComponent],
      providers: [{ provide: AuthStore, useValue: { licenseLapsed: signal(lapsed) } }],
    });
    const fixture = TestBed.createComponent(LicenseBannerComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('renders the banner when the license is lapsed', () => {
    const fixture = setup(true);
    const banner = fixture.nativeElement.querySelector('.license-banner');
    expect(banner).not.toBeNull();
    expect(banner.textContent).toContain('Tu plan está inactivo');
  });

  it('renders nothing when the license is not lapsed', () => {
    const fixture = setup(false);
    expect(fixture.nativeElement.querySelector('.license-banner')).toBeNull();
  });
});
