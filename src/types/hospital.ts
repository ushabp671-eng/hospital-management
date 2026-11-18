export type DoctorAvailability = 'Available' | 'In Consultation' | 'On Leave' | 'Off Duty';

export type PatientGender = 'Male' | 'Female' | 'Other';

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export type AppointmentStatus = 'Scheduled' | 'Completed' | 'Cancelled';

export type PaymentStatus = 'Paid' | 'Pending' | 'Partial';

export type PaymentMethod = 'Card' | 'Cash' | 'UPI / Transfer' | 'Insurance';

export type StaffShift = 'Morning (07:00 - 15:00)' | 'Evening (15:00 - 23:00)' | 'Night (23:00 - 07:00)';

export type StaffStatus = 'Active' | 'On Leave';

export interface AdminUser {
  username: string;
  displayName: string;
  role: string;
  email: string;
}

export interface Doctor {
  id: number;
  code: string;
  fullName: string;
  specialization: string;
  department: string;
  email: string;
  phone: string;
  availability: DoctorAvailability;
  scheduleHours: string;
  consultationFee: number;
  createdAt: string;
}

export interface Patient {
  id: number;
  code: string;
  fullName: string;
  age: number;
  gender: PatientGender;
  bloodGroup: BloodGroup;
  phone: string;
  email: string;
  address: string;
  emergencyContact: string;
  medicalNotes: string;
  registeredAt: string;
}

export interface StaffMember {
  id: number;
  code: string;
  fullName: string;
  role: string;
  department: string;
  shift: StaffShift;
  phone: string;
  email: string;
  status: StaffStatus;
  joinedAt: string;
}

export interface Appointment {
  id: number;
  code: string;
  patientId: number | null;
  patientName?: string;
  doctorId: number;
  appointmentDate: string; // YYYY-MM-DD
  appointmentTime: string; // HH:mm
  reason: string;
  status: AppointmentStatus;
  notes: string;
  createdAt: string;
}

export interface Bill {
  id: number;
  invoiceNumber: string;
  patientId: number;
  appointmentId: number | null;
  consultationFee: number;
  labCharges: number;
  medicationCharges: number;
  roomCharges: number;
  discount: number;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  billingDate: string;
  notes: string;
}

export interface DashboardSummary {
  totalDoctors: number;
  availableDoctors: number;
  totalPatients: number;
  totalStaff: number;
  activeStaff: number;
  totalAppointments: number;
  scheduledAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  totalBilled: number;
  collectedRevenue: number;
  pendingBalance: number;
  pendingBillsCount: number;
  paidBillsCount: number;
}

export type ValidationErrors = Record<string, string>;
