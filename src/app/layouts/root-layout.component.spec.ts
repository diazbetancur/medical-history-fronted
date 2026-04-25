import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { UiProfileService } from '@core/auth';
import { RootLayoutComponent } from './root-layout.component';

describe('RootLayoutComponent', () => {
  let component: RootLayoutComponent;
  let fixture: ComponentFixture<RootLayoutComponent>;
  let mockUiProfile: jasmine.SpyObj<UiProfileService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    // Create mock UiProfileService
    mockUiProfile = jasmine.createSpyObj('UiProfileService', [], {
      current: signal('CLIENTE'),
      baseRoute: signal('/'),
      isAdmin: signal(false),
      isProfessional: signal(false),
      isClient: signal(true),
    });

    // Create mock Router
    mockRouter = jasmine.createSpyObj('Router', ['navigate'], {
      url: '/login',
    });

    await TestBed.configureTestingModule({
      imports: [RootLayoutComponent],
      providers: [
        { provide: UiProfileService, useValue: mockUiProfile },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RootLayoutComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should NOT redirect if not on login page', () => {
    // User is CLIENTE on home page
    (mockRouter as any).url = '/';
    fixture.detectChanges();

    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should redirect ADMIN user from login page to /admin', () => {
    // Setup: User is ADMIN on login page
    (mockUiProfile as any).current = signal('ADMIN');
    (mockUiProfile as any).baseRoute = signal('/admin');
    (mockUiProfile as any).isAdmin = signal(true);
    (mockRouter as any).url = '/login';

    fixture.detectChanges();

    // Effect should trigger redirect
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/admin'], {
      replaceUrl: true,
    });
  });

  it('should redirect PROFESIONAL user from login page to /dashboard', () => {
    // Setup: User is PROFESIONAL on login page
    (mockUiProfile as any).current = signal('PROFESIONAL');
    (mockUiProfile as any).baseRoute = signal('/dashboard');
    (mockUiProfile as any).isProfessional = signal(true);
    (mockRouter as any).url = '/login';

    fixture.detectChanges();

    // Effect should trigger redirect
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard'], {
      replaceUrl: true,
    });
  });

  it('should NOT redirect CLIENTE user from login page', () => {
    // Setup: User is CLIENTE on login page
    (mockUiProfile as any).current = signal('CLIENTE');
    (mockUiProfile as any).baseRoute = signal('/');
    (mockRouter as any).url = '/login';

    fixture.detectChanges();

    // CLIENTE users can stay on login page
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });
});
