import type {
  Appointment,
  AppointmentStatus,
  Bill,
  DashboardSummary,
  Doctor,
  DoctorAvailability,
  Patient,
  PaymentMethod,
  PaymentStatus,
  StaffMember,
  ValidationErrors,
} from '../types/hospital';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_DIGITS_REGEX = /^\d{10,15}$/;

export function normalizePhoneDigits(phone: string): string {
  return phone.replace(/[\s\-()+]/g, '');
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export interface DoctorInput {
  fullName: string;
  specialization: string;
  department: string;
  email: string;
  phone: string;
  availability: DoctorAvailability;
  scheduleHours: string;
  consultationFee: number;
}

export function validateDoctorInput(input: DoctorInput): ValidationErrors {
  const errors: ValidationErrors = {};
  if (!input.fullName || input.fullName.trim().length < 3) {
    errors.fullName = 'Full name must be at least 3 characters.';
  }
  if (!input.specialization || input.specialization.trim().length < 2) {
    errors.specialization = 'Specialization is required.';
  }
  if (!input.department || input.department.trim().length < 2) {
    errors.department = 'Department is required.';
  }
  if (!input.email || !EMAIL_REGEX.test(input.email.trim())) {
    errors.email = 'Enter a valid email address.';
  }
  const phoneDigits = normalizePhoneDigits(input.phone || '');
  if (!PHONE_DIGITS_REGEX.test(phoneDigits)) {
    errors.phone = 'Enter a valid phone number (10 to 15 digits).';
  }
  if (!input.scheduleHours || input.scheduleHours.trim().length < 3) {
    errors.scheduleHours = 'Consultation schedule hours are required.';
  }
  if (!Number.isFinite(input.consultationFee) || input.consultationFee <= 0) {
    errors.consultationFee = 'Consultation fee must be greater than zero.';
  }
  return errors;
}

export interface PatientInput {
  fullName: string;
  age: number;
  gender: string;
  bloodGroup: string;
  phone: string;
  email: string;
  address: string;
  emergencyContact: string;
  medicalNotes?: string;
}

export function validatePatientInput(input: PatientInput): ValidationErrors {
  const errors: ValidationErrors = {};
  if (!input.fullName || input.fullName.trim().length < 2) {
    errors.fullName = 'Patient full name is required.';
  }
  if (!Number.isInteger(input.age) || input.age < 0 || input.age > 120) {
    errors.age = 'Age must be a whole number between 0 and 120.';
  }
  if (!input.gender) {
    errors.gender = 'Gender selection is required.';
  }
  if (!input.bloodGroup) {
    errors.bloodGroup = 'Blood group is required.';
  }
  const phoneDigits = normalizePhoneDigits(input.phone || '');
  if (!PHONE_DIGITS_REGEX.test(phoneDigits)) {
    errors.phone = 'Enter a valid 10–15 digit phone number.';
  }
  if (input.email && input.email.trim().length > 0 && !EMAIL_REGEX.test(input.email.trim())) {
    errors.email = 'Enter a valid email address or leave blank.';
  }
  if (!input.address || input.address.trim().length < 5) {
    errors.address = 'Residential address must be at least 5 characters.';
  }
  if (!input.emergencyContact || input.emergencyContact.trim().length < 5) {
    errors.emergencyContact = 'Emergency contact details are required.';
  }
  return errors;
}

export interface StaffInput {
  fullName: string;
  role: string;
  department: string;
  shift: string;
  phone: string;
  email: string;
  status: string;
}

export function validateStaffInput(input: StaffInput): ValidationErrors {
  const errors: ValidationErrors = {};
  if (!input.fullName || input.fullName.trim().length < 2) {
    errors.fullName = 'Staff member name is required.';
  }
  if (!input.role || input.role.trim().length < 2) {
    errors.role = 'Role is required.';
  }
  if (!input.department || input.department.trim().length < 2) {
    errors.department = 'Department is required.';
  }
  if (!input.shift) {
    errors.shift = 'Shift schedule is required.';
  }
  const phoneDigits = normalizePhoneDigits(input.phone || '');
  if (!PHONE_DIGITS_REGEX.test(phoneDigits)) {
    errors.phone = 'Enter a valid 10–15 digit phone number.';
  }
  if (!input.email || !EMAIL_REGEX.test(input.email.trim())) {
    errors.email = 'Enter a valid email address.';
  }
  return errors;
}

export interface AppointmentInput {
  patientId?: number | null;
  patientName: string;
  doctorId: number;
  appointmentDate: string;
  appointmentTime: string;
  reason: string;
  status?: AppointmentStatus;
  notes?: string;
}

export function hasAppointmentConflict(
  doctorId: number,
  appointmentDate: string,
  appointmentTime: string,
  existingAppointments: Appointment[],
  excludeAppointmentId?: number
): boolean {
  return existingAppointments.some(
    (appt) =>
      appt.id !== excludeAppointmentId &&
      appt.doctorId === doctorId &&
      appt.appointmentDate === appointmentDate &&
      appt.appointmentTime === appointmentTime &&
      appt.status === 'Scheduled'
  );
}

export function validateAppointmentInput(
  input: AppointmentInput,
  existingAppointments: Appointment[],
  excludeAppointmentId?: number
): ValidationErrors {
  const errors: ValidationErrors = {};
  if (!input.patientName || input.patientName.trim().length < 2) {
    errors.patientName = 'Patient name must be at least 2 characters.';
  }
  if (!input.doctorId || input.doctorId <= 0) {
    errors.doctorId = 'Please select a doctor.';
  }
  if (!input.appointmentDate || !/^\d{4}-\d{2}-\d{2}$/.test(input.appointmentDate)) {
    errors.appointmentDate = 'Select a valid appointment date.';
  }
  if (!input.appointmentTime || !/^\d{2}:\d{2}$/.test(input.appointmentTime)) {
    errors.appointmentTime = 'Select a valid appointment time.';
  }
  if (!input.reason || input.reason.trim().length < 3) {
    errors.reason = 'Reason for visit must be at least 3 characters.';
  }

  const targetStatus = input.status ?? 'Scheduled';
  if (
    targetStatus === 'Scheduled' &&
    !errors.doctorId &&
    !errors.appointmentDate &&
    !errors.appointmentTime &&
    hasAppointmentConflict(
      input.doctorId,
      input.appointmentDate,
      input.appointmentTime,
      existingAppointments,
      excludeAppointmentId
    )
  ) {
    errors.appointmentTime = 'Selected doctor already has a scheduled appointment at this date and time.';
  }
  return errors;
}

export interface BillCalculationInput {
  consultationFee: number;
  labCharges: number;
  medicationCharges: number;
  roomCharges: number;
  discount: number;
  paidAmount: number;
}

export interface BillTotals {
  subtotal: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  paymentStatus: PaymentStatus;
}

export function calculateBillTotals(input: BillCalculationInput): BillTotals {
  const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
  const subtotal = round2(
    Math.max(0, input.consultationFee) +
      Math.max(0, input.labCharges) +
      Math.max(0, input.medicationCharges) +
      Math.max(0, input.roomCharges)
  );
  const safeDiscount = round2(Math.min(subtotal, Math.max(0, input.discount)));
  const totalAmount = round2(Math.max(0, subtotal - safeDiscount));
  const safePaid = round2(Math.min(totalAmount, Math.max(0, input.paidAmount)));
  const balanceDue = round2(Math.max(0, totalAmount - safePaid));

  let paymentStatus: PaymentStatus = 'Pending';
  if (totalAmount === 0 || balanceDue === 0) {
    paymentStatus = 'Paid';
  } else if (safePaid > 0) {
    paymentStatus = 'Partial';
  }

  return {
    subtotal,
    totalAmount,
    paidAmount: safePaid,
    balanceDue,
    paymentStatus,
  };
}

export interface BillCreateInput extends BillCalculationInput {
  patientId: number;
  appointmentId: number | null;
  paymentMethod: PaymentMethod;
  billingDate: string;
  notes?: string;
}

export function validateBillInput(input: BillCreateInput): ValidationErrors {
  const errors: ValidationErrors = {};
  if (!input.patientId || input.patientId <= 0) {
    errors.patientId = 'Please select a patient.';
  }
  if (input.consultationFee < 0 || input.labCharges < 0 || input.medicationCharges < 0 || input.roomCharges < 0) {
    errors.charges = 'Charge line items cannot be negative.';
  }
  const subtotal =
    Math.max(0, input.consultationFee) +
    Math.max(0, input.labCharges) +
    Math.max(0, input.medicationCharges) +
    Math.max(0, input.roomCharges);

  if (subtotal <= 0) {
    errors.charges = 'Total charges must be greater than $0.00.';
  }
  if (input.discount < 0) {
    errors.discount = 'Discount cannot be negative.';
  } else if (input.discount > subtotal) {
    errors.discount = 'Discount cannot exceed the subtotal.';
  }
  const total = Math.max(0, subtotal - Math.max(0, input.discount));
  if (input.paidAmount < 0) {
    errors.paidAmount = 'Paid amount cannot be negative.';
  } else if (input.paidAmount > total) {
    errors.paidAmount = 'Initial payment cannot exceed total invoice amount.';
  }
  if (!input.billingDate || !/^\d{4}-\d{2}-\d{2}$/.test(input.billingDate)) {
    errors.billingDate = 'Valid billing date is required.';
  }
  return errors;
}

export function validatePaymentRecord(bill: Bill, paymentAmount: number): ValidationErrors {
  const errors: ValidationErrors = {};
  const balanceDue = Math.round((bill.totalAmount - bill.paidAmount + Number.EPSILON) * 100) / 100;
  if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
    errors.amount = 'Payment amount must be greater than $0.00.';
  } else if (paymentAmount > balanceDue + 0.001) {
    errors.amount = `Payment cannot exceed remaining balance of ${formatCurrency(balanceDue)}.`;
  }
  return errors;
}

export function computeDashboardSummary(
  doctors: Doctor[],
  patients: Patient[],
  staff: StaffMember[],
  appointments: Appointment[],
  bills: Bill[]
): DashboardSummary {
  const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
  const availableDoctors = doctors.filter((d) => d.availability === 'Available').length;
  const activeStaff = staff.filter((s) => s.status === 'Active').length;

  const scheduledAppointments = appointments.filter((a) => a.status === 'Scheduled').length;
  const completedAppointments = appointments.filter((a) => a.status === 'Completed').length;
  const cancelledAppointments = appointments.filter((a) => a.status === 'Cancelled').length;

  const totalBilled = round2(bills.reduce((sum, b) => sum + b.totalAmount, 0));
  const collectedRevenue = round2(bills.reduce((sum, b) => sum + b.paidAmount, 0));
  const pendingBalance = round2(Math.max(0, totalBilled - collectedRevenue));
  const pendingBillsCount = bills.filter((b) => b.paymentStatus !== 'Paid').length;
  const paidBillsCount = bills.filter((b) => b.paymentStatus === 'Paid').length;

  return {
    totalDoctors: doctors.length,
    availableDoctors,
    totalPatients: patients.length,
    totalStaff: staff.length,
    activeStaff,
    totalAppointments: appointments.length,
    scheduledAppointments,
    completedAppointments,
    cancelledAppointments,
    totalBilled,
    collectedRevenue,
    pendingBalance,
    pendingBillsCount,
    paidBillsCount,
  };
}
