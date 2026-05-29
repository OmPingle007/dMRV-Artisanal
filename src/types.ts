export type Role = 'Farmer' | 'FieldOfficer' | 'Management' | 'Auditor' | 'LabTechnician';

export interface User {
  id: string;
  name: string;
  role: Role;
  mobile: string;
  pmKisanId?: string;
  village?: string;
  district?: string;
}

export type BatchStatus = 'IN_PROGRESS' | 'SUBMITTED' | 'SAMPLE_SEALED' | 'APPROVED' | 'REJECTED' | 'EXPIRED';

export interface Batch {
  id: string;
  kilnId: string;
  farmerId: string;
  operatorId: string;
  farmId: string;
  feedstockType: string;
  status: BatchStatus;
  createdAt: number;
  carbonEstimate?: number;
  currentStep: number;
}
