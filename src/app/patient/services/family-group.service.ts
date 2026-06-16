import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { createApiError } from '@core/http/api-error';
import { environment } from '@env';
import { catchError, Observable, throwError } from 'rxjs';
import {
  AddMemberByDocumentRequest,
  AddMemberResult,
  AllergyInput,
  BackgroundInput,
  CreateFamilyGroupRequest,
  FamilyGroupDetail,
  FamilyGroupSummary,
  ManageablePatient,
  MedicationInput,
} from './family-group.models';

@Injectable({ providedIn: 'root' })
export class FamilyGroupService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/family-group`;

  getMyGroups(): Observable<FamilyGroupSummary[]> {
    return this.http
      .get<FamilyGroupSummary[]>(this.baseUrl)
      .pipe(catchError((e) => this.handle(e)));
  }

  getDetail(groupId: string): Observable<FamilyGroupDetail> {
    return this.http
      .get<FamilyGroupDetail>(`${this.baseUrl}/${groupId}`)
      .pipe(catchError((e) => this.handle(e)));
  }

  createGroup(payload: CreateFamilyGroupRequest): Observable<FamilyGroupSummary> {
    return this.http
      .post<FamilyGroupSummary>(this.baseUrl, payload)
      .pipe(catchError((e) => this.handle(e)));
  }

  addMember(groupId: string, payload: AddMemberByDocumentRequest): Observable<AddMemberResult> {
    return this.http
      .post<AddMemberResult>(`${this.baseUrl}/${groupId}/members`, payload)
      .pipe(catchError((e) => this.handle(e)));
  }

  getManageablePatients(): Observable<ManageablePatient[]> {
    return this.http
      .get<ManageablePatient[]>(`${this.baseUrl}/manageable-patients`)
      .pipe(catchError((e) => this.handle(e)));
  }

  getPatientArea<T>(
    patientProfileId: string,
    area: string,
    page = 1,
    pageSize = 10,
  ): Observable<T> {
    return this.http
      .get<T>(
        `${this.baseUrl}/patients/${patientProfileId}/${area}?page=${page}&pageSize=${pageSize}`,
      )
      .pipe(catchError((e) => this.handle(e)));
  }

  private patientUrl(id: string, area: string): string {
    return `${this.baseUrl}/patients/${id}/${area}`;
  }

  createMedication(id: string, body: MedicationInput): Observable<unknown> {
    return this.http
      .post(this.patientUrl(id, 'medications'), body)
      .pipe(catchError((e) => this.handle(e)));
  }

  updateMedication(id: string, medId: string, body: MedicationInput): Observable<unknown> {
    return this.http
      .put(`${this.patientUrl(id, 'medications')}/${medId}`, body)
      .pipe(catchError((e) => this.handle(e)));
  }

  deleteMedication(id: string, medId: string): Observable<unknown> {
    return this.http
      .delete(`${this.patientUrl(id, 'medications')}/${medId}`)
      .pipe(catchError((e) => this.handle(e)));
  }

  createAllergy(id: string, body: AllergyInput): Observable<unknown> {
    return this.http
      .post(this.patientUrl(id, 'allergies'), body)
      .pipe(catchError((e) => this.handle(e)));
  }

  updateAllergy(id: string, aId: string, body: AllergyInput): Observable<unknown> {
    return this.http
      .put(`${this.patientUrl(id, 'allergies')}/${aId}`, body)
      .pipe(catchError((e) => this.handle(e)));
  }

  deleteAllergy(id: string, aId: string): Observable<unknown> {
    return this.http
      .delete(`${this.patientUrl(id, 'allergies')}/${aId}`)
      .pipe(catchError((e) => this.handle(e)));
  }

  createBackground(id: string, body: BackgroundInput): Observable<unknown> {
    return this.http
      .post(this.patientUrl(id, 'background'), body)
      .pipe(catchError((e) => this.handle(e)));
  }

  updateBackground(id: string, bId: string, body: BackgroundInput): Observable<unknown> {
    return this.http
      .put(`${this.patientUrl(id, 'background')}/${bId}`, body)
      .pipe(catchError((e) => this.handle(e)));
  }

  deleteBackground(id: string, bId: string): Observable<unknown> {
    return this.http
      .delete(`${this.patientUrl(id, 'background')}/${bId}`)
      .pipe(catchError((e) => this.handle(e)));
  }

  cancelAppointment(id: string, appointmentId: string, reason?: string): Observable<unknown> {
    return this.http
      .post(`${this.patientUrl(id, 'appointments')}/${appointmentId}/cancel`, { reason })
      .pipe(catchError((e) => this.handle(e)));
  }

  private handle(error: unknown): Observable<never> {
    return throwError(() => createApiError(error));
  }
}
