import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { AuthService, UiProfileService } from '@core/auth';
import { MenuBuilderService } from '@core/services/menu-builder.service';
import { ProfessionalShellComponent } from './professional-shell.component';

describe('ProfessionalShellComponent', () => {
  let component: ProfessionalShellComponent;
  let fixture: ComponentFixture<ProfessionalShellComponent>;
  let mockUiProfile: jasmine.SpyObj<UiProfileService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockMenuBuilder: jasmine.SpyObj<MenuBuilderService>;

  beforeEach(async () => {
    // Create mocks
    mockUiProfile = jasmine.createSpyObj('UiProfileService', [], {
      current: signal('PROFESIONAL'),
      baseRoute: signal('/dashboard'),
      isAdmin: signal(false),
      isProfessional: signal(true),
      isClient: signal(false),
      displayName: signal('Profesional'),
    });

    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    mockAuthService = jasmine.createSpyObj(
      'AuthService',
      ['isAuthenticated', 'isAdminArea', 'logout'],
      {
        currentUser: signal({ email: 'test@example.com' }),
      },
    );
    mockAuthService.isAuthenticated.and.returnValue(true);
    mockAuthService.isAdminArea.and.returnValue(false);

    mockMenuBuilder = jasmine.createSpyObj('MenuBuilderService', [], {
      professionalMenu: signal([]),
      professionalFooterMenu: signal([]),
      visibleProfessionalItemCount: signal(5),
    });

    await TestBed.configureTestingModule({
      imports: [ProfessionalShellComponent, NoopAnimationsModule],
      providers: [
        { provide: UiProfileService, useValue: mockUiProfile },
        { provide: Router, useValue: mockRouter },
        { provide: AuthService, useValue: mockAuthService },
        { provide: MenuBuilderService, useValue: mockMenuBuilder },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfessionalShellComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render layout when user has PROFESIONAL profile', () => {
    // User is PROFESIONAL
    (mockUiProfile as any).isProfessional = signal(true);

    fixture.detectChanges();

    expect(component.shouldRenderLayout()).toBe(true);
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should redirect when user does NOT have PROFESIONAL profile', () => {
    // User is ADMIN, not PROFESIONAL
    (mockUiProfile as any).current = signal('ADMIN');
    (mockUiProfile as any).baseRoute = signal('/admin');
    (mockUiProfile as any).isProfessional = signal(false);

    fixture.detectChanges();

    // Should redirect to /admin
    expect(component.shouldRenderLayout()).toBe(false);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/admin'], {
      replaceUrl: true,
    });
  });

  it('should redirect CLIENTE user to home', () => {
    // User is CLIENTE
    (mockUiProfile as any).current = signal('CLIENTE');
    (mockUiProfile as any).baseRoute = signal('/');
    (mockUiProfile as any).isProfessional = signal(false);

    fixture.detectChanges();

    // Should redirect to /
    expect(component.shouldRenderLayout()).toBe(false);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/'], {
      replaceUrl: true,
    });
  });

  it('should call logout when logout button is clicked', () => {
    fixture.detectChanges();

    component.logout();

    expect(mockAuthService.logout).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
  });
});
