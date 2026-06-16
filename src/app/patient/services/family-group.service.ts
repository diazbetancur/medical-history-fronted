import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { createApiError } from '@core/http/api-error';
import { environment } from '@env';
import { catchError, Observable, throwError } from 'rxjs';
import {
  AddMemberByDocumentRequest,
  AddMemberResult,
  CreateFamilyGroupRequest,
  FamilyGroupDetail,
  FamilyGroupSummary,
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

  private handle(error: unknown): Observable<never> {
    return throwError(() => createApiError(error));
  }
}
