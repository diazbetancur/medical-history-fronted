import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import type { TenantDto } from '@data/models/tenant.models';
import { TenantsStore } from '@data/stores/tenants.store';
import { TenantFormDialogComponent } from '../tenant-form-dialog/tenant-form-dialog.component';

@Component({
  selector: 'app-tenants-list-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDialogModule,
    MatTooltipModule,
  ],
  templateUrl: './tenants-list.page.html',
  styleUrl: './tenants-list.page.scss',
})
export class TenantsListPage implements OnInit {
  readonly store = inject(TenantsStore);
  private readonly dialog = inject(MatDialog);

  filterName = '';

  ngOnInit(): void {
    this.store.loadTenants();
  }

  displayedColumns: string[] = ['code', 'name', 'isActive', 'actions'];

  get filteredTenants(): TenantDto[] {
    const search = this.filterName.trim().toLowerCase();
    if (!search) return this.store.tenants();
    return this.store.tenants().filter(
      (t) =>
        t.name.toLowerCase().includes(search) ||
        t.code.toLowerCase().includes(search),
    );
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(TenantFormDialogComponent, {
      width: '600px',
      data: { mode: 'create' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.store.createTenant(result);
      }
    });
  }

  openEditDialog(tenant: TenantDto): void {
    const dialogRef = this.dialog.open(TenantFormDialogComponent, {
      width: '600px',
      data: { mode: 'edit', tenant },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.store.updateTenant(tenant.id, result);
      }
    });
  }
}
