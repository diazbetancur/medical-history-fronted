import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { UiProfileService } from '@core/auth';
import { AdminLayoutComponent } from './admin-layout/admin-layout.component';
import { AdminShellComponent } from './admin-shell.component';

describe('AdminShellComponent', () => {
  let component: AdminShellComponent;
  let fixture: ComponentFixture<AdminShellComponent>;
  let mockUiProfile: jasmine.SpyObj<UiProfileService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    // Create mock UiProfileService
    mockUiProfile = jasmine.createSpyObj('UiProfileService', [], {
      current: signal('ADMIN'),
      baseRoute: signal('/admin'),
      isAdmin: signal(true),
      isProfessional: signal(false),
      isClient: signal(false),
    });

    // Create mock Router
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [AdminShellComponent, NoopAnimationsModule],
      providers: [
        { provide: UiProfileService, useValue: mockUiProfile },
        { provide: Router, useValue: mockRouter },
      ],
    })
      .overrideComponent(AdminShellComponent, {
        remove: { imports: [AdminLayoutComponent] },
        add: { imports: [] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(AdminShellComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render layout when user has ADMIN profile', () => {
    // User is ADMIN
    (mockUiProfile as any).isAdmin = signal(true);

    fixture.detectChanges();

    expect(component.shouldRenderLayout()).toBe(true);
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should redirect when user does NOT have ADMIN profile', () => {
    // User is PROFESIONAL, not ADMIN
    (mockUiProfile as any).current = signal('PROFESIONAL');
    (mockUiProfile as any).baseRoute = signal('/dashboard');
    (mockUiProfile as any).isAdmin = signal(false);

    fixture.detectChanges();

    // Should redirect to /dashboard
    expect(component.shouldRenderLayout()).toBe(false);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard'], {
      replaceUrl: true,
    });
  });

  it('should redirect CLIENTE user to home', () => {
    // User is CLIENTE
    (mockUiProfile as any).current = signal('CLIENTE');
    (mockUiProfile as any).baseRoute = signal('/');
    (mockUiProfile as any).isAdmin = signal(false);

    fixture.detectChanges();

    // Should redirect to /
    expect(component.shouldRenderLayout()).toBe(false);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/'], {
      replaceUrl: true,
    });
  });
});
