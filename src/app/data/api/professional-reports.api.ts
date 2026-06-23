import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type {
  AppointmentReportDetailResult,
  AppointmentReportSummaryDto,
  ReportType,
} from '@data/api/api-models';
import { environment } from '@env';
import { Observable } from 'rxjs';
import { ApiClient } from './api-client';

@Injectable({ providedIn: 'root' })
export class ProfessionalReportsApi {
  private readonly apiClient = inject(ApiClient);
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl.replace(/\/+$/, '');

  getAppointmentsSummary(from: string, to: string): Observable<AppointmentReportSummaryDto> {
    return this.apiClient.get<AppointmentReportSummaryDto>(
      '/professional/reports/appointments-summary',
      { params: { from, to } },
    );
  }

  getAppointmentsDetail(params: {
    type: ReportType;
    from: string;
    to: string;
    page: number;
    pageSize: number;
  }): Observable<AppointmentReportDetailResult> {
    return this.apiClient.get<AppointmentReportDetailResult>(
      '/professional/reports/appointments-detail',
      {
        params: {
          type: params.type,
          from: params.from,
          to: params.to,
          page: String(params.page),
          pageSize: String(params.pageSize),
        },
      },
    );
  }

  downloadExport(
    format: 'csv' | 'xlsx',
    type: ReportType,
    from: string,
    to: string,
  ): Observable<Blob> {
    const url = `${this.baseUrl}/professional/reports/appointments-export`;
    return this.http.get(url, {
      responseType: 'blob',
      params: { type, from, to, format },
    });
  }
}
