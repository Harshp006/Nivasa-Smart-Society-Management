// ============================================================
// Core Types for Nivasa Smart Society Management
// ============================================================

export type UserRole = 'ADMIN' | 'RESIDENT' | 'SECURITY';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  residentProfile?: ResidentProfile;
}

export interface Society {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone?: string;
  email?: string;
}

export interface Apartment {
  id: string;
  societyId: string;
  building: string;
  floor: number;
  unitNumber: string;
  type: string;
  areaSqFt?: number;
  occupancyStatus: 'VACANT' | 'OCCUPIED';
  maintenanceAmt: number;
  notes?: string;
  createdAt: string;
  residentProfiles?: ResidentProfile[];
}

export interface ResidentProfile {
  id: string;
  userId: string;
  apartmentId: string;
  residentType: 'OWNER' | 'TENANT';
  moveInDate: string;
  moveOutDate?: string;
  isActive: boolean;
  emergencyContact?: string;
  emergencyPhone?: string;
  user?: Partial<User>;
  apartment?: Apartment;
  familyMembers?: FamilyMember[];
  vehicles?: Vehicle[];
}

export interface FamilyMember {
  id: string;
  residentProfileId: string;
  firstName: string;
  lastName: string;
  relation: string;
  age?: number;
  phone?: string;
  isEmergencyContact: boolean;
  createdAt: string;
}

export interface Vehicle {
  id: string;
  residentProfileId: string;
  registrationNo: string;
  make: string;
  model: string;
  color: string;
  type: string;
  parkingSlot?: string;
  createdAt: string;
}

export type VisitorStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'EXPIRED';
export type VisitorType = 'GUEST' | 'DELIVERY' | 'SERVICE' | 'CONTRACTOR' | 'OTHER';

export interface Visitor {
  id: string;
  apartmentId: string;
  residentProfileId: string;
  visitorName: string;
  visitorPhone?: string;
  purpose: string;
  visitorType: VisitorType;
  vehicleNumber?: string;
  expectedDate: string;
  expectedTime?: string;
  status: VisitorStatus;
  passCode: string;
  notes?: string;
  createdAt: string;
  apartment?: { building: string; unitNumber: string };
  residentProfile?: { user?: { firstName: string; lastName: string } };
  approval?: VisitorApproval;
  entryLogs?: VisitorEntryLog[];
}

export interface VisitorApproval {
  id: string;
  visitorId: string;
  decision: string;
  reason?: string;
  expiresAt?: string;
  decidedAt: string;
}

export interface VisitorEntryLog {
  id: string;
  visitorId: string;
  checkInAt?: string;
  checkOutAt?: string;
  securityNotes?: string;
}

export type BillStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';

export interface MaintenanceBill {
  id: string;
  apartmentId: string;
  billingMonth: number;
  billingYear: number;
  amount: number;
  dueDate: string;
  status: BillStatus;
  paidAmount: number;
  notes?: string;
  createdAt: string;
  apartment?: { building: string; unitNumber: string };
  payments?: Payment[];
}

export interface Payment {
  id: string;
  billId: string;
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
  referenceNumber: string;
  isDemo: boolean;
  paidAt: string;
  receipt?: PaymentReceipt;
}

export interface PaymentReceipt {
  id: string;
  paymentId: string;
  receiptNo: string;
  generatedAt: string;
  receiptData: Record<string, unknown>;
}

export type ComplaintStatus = 'SUBMITTED' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type ComplaintPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Complaint {
  id: string;
  residentProfileId: string;
  title: string;
  description: string;
  category: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  assignedTo?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  createdAt: string;
  residentProfile?: {
    user?: { firstName: string; lastName: string };
    apartment?: { building: string; unitNumber: string };
  };
  comments?: ComplaintComment[];
}

export interface ComplaintComment {
  id: string;
  complaintId: string;
  userId: string;
  comment: string;
  isInternal: boolean;
  createdAt: string;
  user?: { firstName: string; lastName: string; role: string };
}

export interface Amenity {
  id: string;
  societyId: string;
  name: string;
  description?: string;
  location?: string;
  capacity?: number;
  rules?: string;
  openingTime: string;
  closingTime: string;
  slotDuration: number;
  isActive: boolean;
  requiresApproval: boolean;
}

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'REJECTED';

export interface AmenityBooking {
  id: string;
  amenityId: string;
  bookedBy: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose?: string;
  status: BookingStatus;
  createdAt: string;
  amenity?: { name: string; location?: string };
  booker?: { firstName: string; lastName: string };
}

export interface Announcement {
  id: string;
  societyId: string;
  createdBy: string;
  title: string;
  content: string;
  category: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  publishedAt?: string;
  expiresAt?: string;
  isPinned: boolean;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  readAt?: string;
  entityId?: string;
  entityType?: string;
  createdAt: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: PaginationMeta;
}
