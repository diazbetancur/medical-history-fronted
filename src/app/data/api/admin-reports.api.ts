import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env';

export interface AdminLicenseKpiDto {
  totalInPortfolio: number;
  active: number;
  inactive: number;
  standard: number;
  growth: number;
  newActivations: number;
  newDeactivations: number;
}

export interface AdminAppointmentKpiDto {
  total: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  noShow: number;
  uniqueProfessionals: number;
}

export interface AdminReportsOverviewDto {
  channel: string;
  from: string;
  to: string;
  licenses: AdminLicenseKpiDto;
  appointments: AdminAppointmentKpiDto;
}

@Injectable({ providedIn: 'root' })
export class AdminReportsApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/admin/reports`;

  getOverview(from: string, to: string): Observable<AdminReportsOverviewDto> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get<AdminReportsOverviewDto>(`${this.base}/overview`, { params });
  }

  getExportUrl(from: string, to: string): string {
    return `${this.base}/licenses/export?from=${from}&to=${to}`;
  }
}
