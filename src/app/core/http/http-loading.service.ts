import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class HttpLoadingService {
  private readonly visibleState = signal(false);
  readonly isLoading = this.visibleState.asReadonly();

  private activeRequests = 0;
  private showTimer: ReturnType<typeof setTimeout> | null = null;
  private hideTimer: ReturnType<typeof setTimeout> | null = null;
  private shownAt = 0;

  private readonly showDelayMs = 150;
  private readonly minVisibleMs = 250;

  begin(): void {
    this.activeRequests += 1;

    if (this.activeRequests === 1) {
      this.cancelHideTimer();
      this.scheduleShow();
    }
  }

  end(): void {
    if (this.activeRequests === 0) {
      return;
    }

    this.activeRequests -= 1;

    if (this.activeRequests === 0) {
      this.cancelShowTimer();
      this.scheduleHide();
    }
  }

  private scheduleShow(): void {
    if (this.visibleState() || this.showTimer !== null) {
      return;
    }

    this.showTimer = setTimeout(() => {
      this.showTimer = null;

      if (this.activeRequests === 0 || this.visibleState()) {
        return;
      }

      this.shownAt = Date.now();
      this.visibleState.set(true);
    }, this.showDelayMs);
  }

  private scheduleHide(): void {
    if (!this.visibleState()) {
      return;
    }

    const elapsed = Date.now() - this.shownAt;
    const remainingTime = Math.max(0, this.minVisibleMs - elapsed);

    this.cancelHideTimer();
    this.hideTimer = setTimeout(() => {
      this.hideTimer = null;

      if (this.activeRequests > 0) {
        return;
      }

      this.shownAt = 0;
      this.visibleState.set(false);
    }, remainingTime);
  }

  private cancelShowTimer(): void {
    if (this.showTimer === null) {
      return;
    }

    clearTimeout(this.showTimer);
    this.showTimer = null;
  }

  private cancelHideTimer(): void {
    if (this.hideTimer === null) {
      return;
    }

    clearTimeout(this.hideTimer);
    this.hideTimer = null;
  }
}
