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
  FamilyGroupPendingRequest,
  FamilyGroupSummary,
  FamilyJoinRequest,
  LeaveGroupResult,
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

  promoteMember(groupId: string, memberId: string): Observable<unknown> {
    return this.http
      .post(`${this.baseUrl}/${groupId}/members/${memberId}/promote`, {})
      .pipe(catchError((e) => this.handle(e)));
  }

  demoteMember(groupId: string, memberId: string): Observable<unknown> {
    return this.http
      .post(`${this.baseUrl}/${groupId}/members/${memberId}/demote`, {})
      .pipe(catchError((e) => this.handle(e)));
  }

  removeMember(groupId: string, memberId: string): Observable<unknown> {
    return this.http
      .delete(`${this.baseUrl}/${groupId}/members/${memberId}`)
      .pipe(catchError((e) => this.handle(e)));
  }

  leaveGroup(groupId: string): Observable<LeaveGroupResult> {
    return this.http
      .post<LeaveGroupResult>(`${this.baseUrl}/${groupId}/leave`, {})
      .pipe(catchError((e) => this.handle(e)));
  }

  getIncomingRequests(): Observable<FamilyJoinRequest[]> {
    return this.http
      .get<FamilyJoinRequest[]>(`${this.baseUrl}/requests/incoming`)
      .pipe(catchError((e) => this.handle(e)));
  }

  acceptRequest(requestId: string): Observable<unknown> {
    return this.http
      .post(`${this.baseUrl}/requests/${requestId}/accept`, {})
      .pipe(catchError((e) => this.handle(e)));
  }

  rejectRequest(requestId: string): Observable<unknown> {
    return this.http
      .post(`${this.baseUrl}/requests/${requestId}/reject`, {})
      .pipe(catchError((e) => this.handle(e)));
  }

  getGroupRequests(groupId: string): Observable<FamilyGroupPendingRequest[]> {
    return this.http
      .get<FamilyGroupPendingRequest[]>(`${this.baseUrl}/${groupId}/requests`)
      .pipe(catchError((e) => this.handle(e)));
  }

  cancelRequest(groupId: string, requestId: string): Observable<unknown> {
    return this.http
      .delete(`${this.baseUrl}/${groupId}/requests/${requestId}`)
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

  bookAppointment(
    patientProfileId: string,
    dto: {
      professionalProfileId: string;
      appointmentDate: string;
      timeSlot: string;
      observation?: string;
      reason?: string;
      notes?: string;
    },
  ): Observable<unknown> {
    return this.http
      .post(this.patientUrl(patientProfileId, 'appointments'), dto)
      .pipe(catchError((e) => this.handle(e)));
  }

  uploadExam(
    patientProfileId: string,
    data: { title: string; examDate: string; notes?: string; file: File },
  ): Observable<unknown> {
    const form = new FormData();
    form.append('title', data.title);
    form.append('examDate', data.examDate);
    if (data.notes) form.append('notes', data.notes);
    form.append('file', data.file, data.file.name);
    return this.http
      .post(this.patientUrl(patientProfileId, 'exams'), form)
      .pipe(catchError((e) => this.handle(e)));
  }

  deleteExam(patientProfileId: string, examId: string): Observable<unknown> {
    return this.http
      .delete(`${this.patientUrl(patientProfileId, 'exams')}/${examId}`)
      .pipe(catchError((e) => this.handle(e)));
  }

  private handle(error: unknown): Observable<never> {
    return throwError(() => createApiError(error));
  }
}
