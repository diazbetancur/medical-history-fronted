import { TestBed } from '@angular/core/testing';
import { HomeSliderComponent } from './home-slider.component';

describe('HomeSliderComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HomeSliderComponent] }).compileComponents();
  });

  it('crea el componente con 3 slides', () => {
    const fixture = TestBed.createComponent(HomeSliderComponent);
    const comp = fixture.componentInstance;
    expect(comp).toBeTruthy();
    expect(comp.slides.length).toBe(3);
  });

  it('emite login y register', () => {
    const fixture = TestBed.createComponent(HomeSliderComponent);
    const comp = fixture.componentInstance;
    let l = 0, r = 0;
    comp.login.subscribe(() => l++);
    comp.register.subscribe(() => r++);
    comp.login.emit(); comp.register.emit();
    expect(l).toBe(1); expect(r).toBe(1);
  });
});
