import { DatePipe } from '@angular/common';
import {
  Component,
  OnInit,
  TemplateRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  ChannelLicenseItemDto,
  LicensePlan,
} from '@data/api/channel-licenses.api';
import { ChannelLicensesStore } from '@data/stores/channel-licenses.store';
import { ToastService } from '@shared/services';

@Component({
  selector: 'app-channel-licenses',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTableModule,
    MatTooltipModule,
  ],
  templateUrl: './channel-licenses.page.html',
  styleUrl: './channel-licenses.page.scss',
})
export class ChannelLicensesPage implements OnInit {
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);
  readonly store = inject(ChannelLicensesStore);

  readonly activateDialogTpl = viewChild.required<TemplateRef<unknown>>('activateDialog');
  readonly deactivateDialogTpl = viewChild.required<TemplateRef<unknown>>('deactivateDialog');
  readonly changePlanDialogTpl = viewChild.required<TemplateRef<unknown>>('changePlanDialog');

  readonly selectedLicense = signal<ChannelLicenseItemDto | null>(null);
  readonly activatePlan = signal<LicensePlan>('Standard');
  readonly deactivateReason = signal('');
  readonly newPlan = signal<LicensePlan>('Standard');

  readonly displayedColumns = [
    'businessName',
    'plan',
    'status',
    'licenseActivatedAt',
    'isVerified',
    'actions',
  ];

  readonly pageSizeOptions = [10, 20, 50];

  ngOnInit(): void {
    this.store.reload();
  }

  onPageChange(event: PageEvent): void {
    this.store.setPageSize(event.pageSize);
    this.store.setPage(event.pageIndex + 1);
  }

  onFilterActive(value: string): void {
    const map: Record<string, boolean | undefined> = {
      all: undefined,
      active: true,
      inactive: false,
    };
    this.store.setFilterActive(map[value]);
  }

  onFilterPlan(value: string): void {
    const map: Record<string, LicensePlan | undefined> = {
      all: undefined,
      Standard: 'Standard',
      Growth: 'Growth',
    };
    this.store.setFilterPlan(map[value]);
  }

  // ── Activate ────────────────────────────────────────────────────────────────

  openActivate(license: ChannelLicenseItemDto): void {
    this.selectedLicense.set(license);
    this.activatePlan.set('Standard');
    this.dialog.open(this.activateDialogTpl(), { width: '400px' });
  }

  confirmActivate(): void {
    const license = this.selectedLicense();
    if (!license) return;
    this.store.activate(
      license.professionalProfileId,
      { plan: this.activatePlan() },
      () => {
        this.dialog.closeAll();
        this.toast.success('Licencia activada correctamente');
      },
      (msg) => this.toast.error(msg),
    );
  }

  // ── Deactivate ───────────────────────────────────────────────────────────────

  openDeactivate(license: ChannelLicenseItemDto): void {
    this.selectedLicense.set(license);
    this.deactivateReason.set('');
    this.dialog.open(this.deactivateDialogTpl(), { width: '400px' });
  }

  confirmDeactivate(): void {
    const license = this.selectedLicense();
    if (!license) return;
    this.store.deactivate(
      license.professionalProfileId,
      { reason: this.deactivateReason() || undefined },
      () => {
        this.dialog.closeAll();
        this.toast.success('Licencia desactivada');
      },
      (msg) => this.toast.error(msg),
    );
  }

  // ── Change Plan ──────────────────────────────────────────────────────────────

  openChangePlan(license: ChannelLicenseItemDto): void {
    this.selectedLicense.set(license);
    this.newPlan.set(license.plan === 'Standard' ? 'Growth' : 'Standard');
    this.dialog.open(this.changePlanDialogTpl(), { width: '400px' });
  }

  confirmChangePlan(): void {
    const license = this.selectedLicense();
    if (!license) return;
    this.store.updatePlan(
      license.professionalProfileId,
      { plan: this.newPlan() },
      () => {
        this.dialog.closeAll();
        this.toast.success('Plan actualizado');
      },
      (msg) => this.toast.error(msg),
    );
  }
}
