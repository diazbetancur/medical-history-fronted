import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import {
  uiProfileAdminGuard,
  uiProfileClientGuard,
  uiProfileProfessionalGuard,
} from './ui-area.guards';
import { UiProfileService } from './ui-profile.service';

describe('UI Area Guards', () => {
  let mockUiProfileService: jasmine.SpyObj<UiProfileService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(() => {
    // Create mock UiProfileService with signals
    mockUiProfileService = jasmine.createSpyObj('UiProfileService', [], {
      isAdmin: signal(false),
      isProfessional: signal(false),
      isClient: signal(false),
      baseRoute: signal('/'),
    });

    // Create mock Router
    mockRouter = jasmine.createSpyObj('Router', ['createUrlTree']);

    TestBed.configureTestingModule({
      providers: [
        { provide: UiProfileService, useValue: mockUiProfileService },
        { provide: Router, useValue: mockRouter },
      ],
    });
  });

  describe('uiProfileAdminGuard', () => {
    it('should return true when user has ADMIN profile', () => {
      // Arrange: User is admin
      (mockUiProfileService.isAdmin as any).set(true);

      // Act
      const result = TestBed.runInInjectionContext(() =>
        uiProfileAdminGuard({} as any, {} as any),
      );

      // Assert
      expect(result).toBe(true);
      expect(mockRouter.createUrlTree).not.toHaveBeenCalled();
    });

    it('should redirect when user does not have ADMIN profile', () => {
      // Arrange: User is not admin, base route is '/dashboard'
      (mockUiProfileService.isAdmin as any).set(false);
      (mockUiProfileService.baseRoute as any).set('/dashboard');
      const expectedUrlTree = {} as UrlTree;
      mockRouter.createUrlTree.and.returnValue(expectedUrlTree);

      // Act
      const result = TestBed.runInInjectionContext(() =>
        uiProfileAdminGuard({} as any, {} as any),
      );

      // Assert
      expect(result).toBe(expectedUrlTree);
      expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/dashboard']);
    });

    it('should redirect to root when user has CLIENT profile', () => {
      // Arrange: User is client (public area)
      (mockUiProfileService.isAdmin as any).set(false);
      (mockUiProfileService.baseRoute as any).set('/');
      const expectedUrlTree = {} as UrlTree;
      mockRouter.createUrlTree.and.returnValue(expectedUrlTree);

      // Act
      const result = TestBed.runInInjectionContext(() =>
        uiProfileAdminGuard({} as any, {} as any),
      );

      // Assert
      expect(result).toBe(expectedUrlTree);
      expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/']);
    });
  });

  describe('uiProfileProfessionalGuard', () => {
    it('should return true when user has PROFESIONAL profile', () => {
      // Arrange: User is professional
      (mockUiProfileService.isProfessional as any).set(true);

      // Act
      const result = TestBed.runInInjectionContext(() =>
        uiProfileProfessionalGuard({} as any, {} as any),
      );

      // Assert
      expect(result).toBe(true);
      expect(mockRouter.createUrlTree).not.toHaveBeenCalled();
    });

    it('should redirect when user does not have PROFESIONAL profile', () => {
      // Arrange: User is not professional, base route is '/admin'
      (mockUiProfileService.isProfessional as any).set(false);
      (mockUiProfileService.baseRoute as any).set('/admin');
      const expectedUrlTree = {} as UrlTree;
      mockRouter.createUrlTree.and.returnValue(expectedUrlTree);

      // Act
      const result = TestBed.runInInjectionContext(() =>
        uiProfileProfessionalGuard({} as any, {} as any),
      );

      // Assert
      expect(result).toBe(expectedUrlTree);
      expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/admin']);
    });

    it('should redirect to root when user has CLIENT profile', () => {
      // Arrange: User is client
      (mockUiProfileService.isProfessional as any).set(false);
      (mockUiProfileService.baseRoute as any).set('/');
      const expectedUrlTree = {} as UrlTree;
      mockRouter.createUrlTree.and.returnValue(expectedUrlTree);

      // Act
      const result = TestBed.runInInjectionContext(() =>
        uiProfileProfessionalGuard({} as any, {} as any),
      );

      // Assert
      expect(result).toBe(expectedUrlTree);
      expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/']);
    });
  });

  describe('uiProfileClientGuard', () => {
    it('should return true when user has CLIENT profile (or no special profile)', () => {
      // Arrange: User is client
      (mockUiProfileService.isClient as any).set(true);

      // Act
      const result = TestBed.runInInjectionContext(() =>
        uiProfileClientGuard({} as any, {} as any),
      );

      // Assert
      expect(result).toBe(true);
      expect(mockRouter.createUrlTree).not.toHaveBeenCalled();
    });

    it('should redirect when user has special profile (ADMIN/PROFESIONAL)', () => {
      // Arrange: User is not client (has special profile), base route is '/dashboard'
      (mockUiProfileService.isClient as any).set(false);
      (mockUiProfileService.baseRoute as any).set('/dashboard');
      const expectedUrlTree = {} as UrlTree;
      mockRouter.createUrlTree.and.returnValue(expectedUrlTree);

      // Act
      const result = TestBed.runInInjectionContext(() =>
        uiProfileClientGuard({} as any, {} as any),
      );

      // Assert
      expect(result).toBe(expectedUrlTree);
      expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/dashboard']);
    });

    it('should redirect ADMIN users to admin area', () => {
      // Arrange: User is admin trying to access public area
      (mockUiProfileService.isClient as any).set(false);
      (mockUiProfileService.baseRoute as any).set('/admin');
      const expectedUrlTree = {} as UrlTree;
      mockRouter.createUrlTree.and.returnValue(expectedUrlTree);

      // Act
      const result = TestBed.runInInjectionContext(() =>
        uiProfileClientGuard({} as any, {} as any),
      );

      // Assert
      expect(result).toBe(expectedUrlTree);
      expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/admin']);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle profile transitions correctly', () => {
      // Arrange: User starts as client, then becomes professional
      const isAdminSignal = signal(false);
      const isProfessionalSignal = signal(false);
      const isClientSignal = signal(true);
      const baseRouteSignal = signal('/');

      mockUiProfileService = jasmine.createSpyObj('UiProfileService', [], {
        isAdmin: isAdminSignal,
        isProfessional: isProfessionalSignal,
        isClient: isClientSignal,
        baseRoute: baseRouteSignal,
      });

      TestBed.overrideProvider(UiProfileService, {
        useValue: mockUiProfileService,
      });

      // Act & Assert: Initial state (client)
      let result = TestBed.runInInjectionContext(() =>
        uiProfileClientGuard({} as any, {} as any),
      );
      expect(result).toBe(true);

      // Simulate profile change to professional
      isClientSignal.set(false);
      isProfessionalSignal.set(true);
      baseRouteSignal.set('/dashboard');

      // Client guard should now redirect
      const expectedUrlTree = {} as UrlTree;
      mockRouter.createUrlTree.and.returnValue(expectedUrlTree);

      result = TestBed.runInInjectionContext(() =>
        uiProfileClientGuard({} as any, {} as any),
      );
      expect(result).toBe(expectedUrlTree);

      // Professional guard should now allow
      result = TestBed.runInInjectionContext(() =>
        uiProfileProfessionalGuard({} as any, {} as any),
      );
      expect(result).toBe(true);
    });
  });
});
