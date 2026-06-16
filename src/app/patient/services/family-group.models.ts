export type FamilyAdminRole = 'None' | 'Principal' | 'Additional';
export type FamilyLinkType = 'Dependent' | 'Registered';

export interface FamilyGroupSummary {
  id: string;
  name: string;
  myRole: string;
  memberCount: number;
}

export interface FamilyGroupMember {
  memberId: string;
  patientProfileId: string;
  fullName: string;
  linkType: FamilyLinkType;
  adminRole: FamilyAdminRole;
  hasAccount: boolean;
}

export interface FamilyGroupDetail {
  id: string;
  name: string;
  iAmAdmin: boolean;
  members: FamilyGroupMember[];
}

export interface AddMemberResult {
  outcome: 'DependentCreated' | 'DependentLinked' | 'JoinRequestSent';
  member: FamilyGroupMember | null;
}

export interface CreateFamilyGroupRequest {
  name: string;
}

export interface AddMemberByDocumentRequest {
  documentType: string;
  documentNumber: string;
  fullName?: string;
}

export interface ManageablePatient {
  patientProfileId: string;
  fullName: string;
  familyGroupId: string;
  familyGroupName: string;
  linkType: FamilyLinkType;
}
