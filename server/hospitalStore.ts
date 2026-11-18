import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type {
  AdminUser,
  Appointment,
  Bill,
  Doctor,
  Patient,
  PaymentMethod,
  StaffMember,
} from '../src/types/hospital';
import {
  calculateBillTotals,
  computeDashboardSummary,
  validateAppointmentInput,
  validateBillInput,
  validateDoctorInput,
  validatePatientInput,
  validatePaymentRecord,
  validateStaffInput,
  type AppointmentInput,
  type BillCreateInput,
  type DoctorInput,
  type PatientInput,
  type StaffInput,
} from '../src/utils/hospitalLogic';

interface AdminRecord extends AdminUser {
  passwordHash: string;
  passwordSalt: string;
}

interface HospitalDatabase {
  nextIds: {
    doctor: number;
    patient: number;
    staff: number;
    appointment: number;
    bill: number;
  };
  admins: AdminRecord[];
  doctors: Doctor[];
  patients: Patient[];
  staff: StaffMember[];
  appointments: Appointment[];
  bills: Bill[];
}

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function createInitialDatabase(): HospitalDatabase {
  const adminSalt = 'mercycare_admin_salt_2026';
  const adminPasswordHash = hashPassword('Admin@123', adminSalt);

  return {
    nextIds: {
      doctor: 7,
      patient: 7,
      staff: 6,
      appointment: 8,
      bill: 6,
    },
    admins: [
      {
        username: 'admin',
        email: 'admin@mercycare.org',
        displayName: 'Dr. Eleanor Vance',
        role: 'Hospital Administrator',
        passwordSalt: adminSalt,
        passwordHash: adminPasswordHash,
      },
    ],
    doctors: [
      {
        id: 1,
        code: 'DOC-101',
        fullName: 'Dr. Vikramaditya Nair',
        specialization: 'Cardiology',
        department: 'Cardiology & Heart Care',
        email: 'v.nair@mercycare.org',
        phone: '+1 (555) 210-4401',
        availability: 'Available',
        scheduleHours: 'Mon–Fri · 08:30 – 16:30',
        consultationFee: 180,
        createdAt: '2026-01-12',
      },
      {
        id: 2,
        code: 'DOC-102',
        fullName: 'Dr. Hannah Lindqvist',
        specialization: 'Neurology',
        department: 'Neurosciences',
        email: 'h.lindqvist@mercycare.org',
        phone: '+1 (555) 210-4402',
        availability: 'In Consultation',
        scheduleHours: 'Mon–Fri · 09:00 – 17:00',
        consultationFee: 210,
        createdAt: '2026-02-04',
      },
      {
        id: 3,
        code: 'DOC-103',
        fullName: 'Dr. Marcus Thorne',
        specialization: 'Orthopedics',
        department: 'Orthopedic Surgery',
        email: 'm.thorne@mercycare.org',
        phone: '+1 (555) 210-4403',
        availability: 'Available',
        scheduleHours: 'Tue–Sat · 08:00 – 15:00',
        consultationFee: 165,
        createdAt: '2026-03-19',
      },
      {
        id: 4,
        code: 'DOC-104',
        fullName: 'Dr. Ananya Deshmukh',
        specialization: 'Pediatrics',
        department: 'Pediatrics & Neonatology',
        email: 'a.deshmukh@mercycare.org',
        phone: '+1 (555) 210-4404',
        availability: 'Available',
        scheduleHours: 'Mon–Fri · 09:30 – 17:30',
        consultationFee: 140,
        createdAt: '2026-04-08',
      },
      {
        id: 5,
        code: 'DOC-105',
        fullName: 'Dr. Samuel Okafor',
        specialization: 'General Medicine',
        department: 'Internal Medicine',
        email: 's.okafor@mercycare.org',
        phone: '+1 (555) 210-4405',
        availability: 'On Leave',
        scheduleHours: 'Mon–Fri · 08:00 – 16:00',
        consultationFee: 120,
        createdAt: '2026-05-14',
      },
      {
        id: 6,
        code: 'DOC-106',
        fullName: 'Dr. Claire Beaumont',
        specialization: 'Dermatology',
        department: 'Dermatology Clinic',
        email: 'c.beaumont@mercycare.org',
        phone: '+1 (555) 210-4406',
        availability: 'Available',
        scheduleHours: 'Wed–Sun · 10:00 – 18:00',
        consultationFee: 150,
        createdAt: '2026-06-21',
      },
    ],
    patients: [
      {
        id: 1,
        code: 'PAT-201',
        fullName: 'Rohan Kulkarni',
        age: 46,
        gender: 'Male',
        bloodGroup: 'O+',
        phone: '+1 (555) 890-1120',
        email: 'rohan.k@example.com',
        address: '742 Evergreen Terrace, Apt 3B',
        emergencyContact: 'Meera Kulkarni · +1 (555) 890-1121',
        medicalNotes: 'Mild hypertension; prescribed Lisinopril 10mg daily.',
        registeredAt: '2026-09-10',
      },
      {
        id: 2,
        code: 'PAT-202',
        fullName: 'Sophia Alvarez',
        age: 31,
        gender: 'Female',
        bloodGroup: 'A+',
        phone: '+1 (555) 890-2240',
        email: 'sophia.alvarez@example.com',
        address: '118 Cedar Park Lane',
        emergencyContact: 'Carlos Alvarez · +1 (555) 890-2241',
        medicalNotes: 'Recurring migraines; monitoring triggers and sleep schedule.',
        registeredAt: '2026-09-24',
      },
      {
        id: 3,
        code: 'PAT-203',
        fullName: 'David Chen',
        age: 62,
        gender: 'Male',
        bloodGroup: 'B+',
        phone: '+1 (555) 890-3355',
        email: 'd.chen@example.com',
        address: '905 Harbor View Blvd',
        emergencyContact: 'Lily Chen · +1 (555) 890-3356',
        medicalNotes: 'Post-operative right knee rehabilitation.',
        registeredAt: '2026-10-03',
      },
      {
        id: 4,
        code: 'PAT-204',
        fullName: 'Maya Patel',
        age: 8,
        gender: 'Female',
        bloodGroup: 'AB+',
        phone: '+1 (555) 890-4470',
        email: 'parent.patel@example.com',
        address: '304 Maple Crest Drive',
        emergencyContact: 'Neha Patel · +1 (555) 890-4471',
        medicalNotes: 'Annual pediatric immunization & wellness check.',
        registeredAt: '2026-10-18',
      },
      {
        id: 5,
        code: 'PAT-205',
        fullName: 'Evelyn Brooks',
        age: 54,
        gender: 'Female',
        bloodGroup: 'O-',
        phone: '+1 (555) 890-5582',
        email: 'ebrooks@example.com',
        address: '521 Birchwood Way',
        emergencyContact: 'Thomas Brooks · +1 (555) 890-5583',
        medicalNotes: 'Penicillin allergy noted. Periodic cardiac stress screening.',
        registeredAt: '2026-11-01',
      },
      {
        id: 6,
        code: 'PAT-206',
        fullName: 'Liam O’Connor',
        age: 27,
        gender: 'Male',
        bloodGroup: 'A-',
        phone: '+1 (555) 890-6690',
        email: 'liam.oconnor@example.com',
        address: '89 Riverstone Court',
        emergencyContact: 'Sarah O’Connor · +1 (555) 890-6691',
        medicalNotes: 'Contact dermatitis follow-up.',
        registeredAt: '2026-11-07',
      },
    ],
    staff: [
      {
        id: 1,
        code: 'STF-301',
        fullName: 'Priya Menon',
        role: 'Charge Nurse',
        department: 'Cardiology & Heart Care',
        shift: 'Morning (07:00 - 15:00)',
        phone: '+1 (555) 310-7701',
        email: 'p.menon@mercycare.org',
        status: 'Active',
        joinedAt: '2025-04-12',
      },
      {
        id: 2,
        code: 'STF-302',
        fullName: 'Carlos Mendez',
        role: 'Senior Lab Technician',
        department: 'Diagnostics & Pathology',
        shift: 'Morning (07:00 - 15:00)',
        phone: '+1 (555) 310-7702',
        email: 'c.mendez@mercycare.org',
        status: 'Active',
        joinedAt: '2025-07-01',
      },
      {
        id: 3,
        code: 'STF-303',
        fullName: 'Rachel Kim',
        role: 'Front Desk Coordinator',
        department: 'Patient Admissions',
        shift: 'Morning (07:00 - 15:00)',
        phone: '+1 (555) 310-7703',
        email: 'r.kim@mercycare.org',
        status: 'Active',
        joinedAt: '2025-09-15',
      },
      {
        id: 4,
        code: 'STF-304',
        fullName: 'Benjamin Wright',
        role: 'Clinical Pharmacist',
        department: 'Central Pharmacy',
        shift: 'Evening (15:00 - 23:00)',
        phone: '+1 (555) 310-7704',
        email: 'b.wright@mercycare.org',
        status: 'Active',
        joinedAt: '2026-01-20',
      },
      {
        id: 5,
        code: 'STF-305',
        fullName: 'Amina Hassan',
        role: 'ICU Staff Nurse',
        department: 'Critical Care',
        shift: 'Night (23:00 - 07:00)',
        phone: '+1 (555) 310-7705',
        email: 'a.hassan@mercycare.org',
        status: 'On Leave',
        joinedAt: '2026-03-03',
      },
    ],
    appointments: [
      {
        id: 1,
        code: 'APT-401',
        patientId: 1,
        doctorId: 1,
        appointmentDate: '2026-11-13',
        appointmentTime: '09:30',
        reason: 'Quarterly ECG and blood pressure review',
        status: 'Completed',
        notes: 'BP 124/80 mmHg. Continue current dosage.',
        createdAt: '2026-11-08',
      },
      {
        id: 2,
        code: 'APT-402',
        patientId: 2,
        doctorId: 2,
        appointmentDate: '2026-11-13',
        appointmentTime: '11:00',
        reason: 'Migraine frequency evaluation',
        status: 'Scheduled',
        notes: 'Bring 30-day headache diary.',
        createdAt: '2026-11-09',
      },
      {
        id: 3,
        code: 'APT-403',
        patientId: 3,
        doctorId: 3,
        appointmentDate: '2026-11-13',
        appointmentTime: '14:00',
        reason: 'Knee physiotherapy progress check',
        status: 'Scheduled',
        notes: 'Range of motion assessment.',
        createdAt: '2026-11-10',
      },
      {
        id: 4,
        code: 'APT-404',
        patientId: 4,
        doctorId: 4,
        appointmentDate: '2026-11-14',
        appointmentTime: '10:00',
        reason: 'Seasonal pediatric checkup',
        status: 'Scheduled',
        notes: 'Immunization record verification.',
        createdAt: '2026-11-10',
      },
      {
        id: 5,
        code: 'APT-405',
        patientId: 5,
        doctorId: 1,
        appointmentDate: '2026-11-14',
        appointmentTime: '15:30',
        reason: 'Cardiac lipid panel consultation',
        status: 'Scheduled',
        notes: 'Fasting lab work completed.',
        createdAt: '2026-11-11',
      },
      {
        id: 6,
        code: 'APT-406',
        patientId: 6,
        doctorId: 6,
        appointmentDate: '2026-11-12',
        appointmentTime: '16:00',
        reason: 'Topical treatment follow-up',
        status: 'Completed',
        notes: 'Symptoms significantly improved.',
        createdAt: '2026-11-06',
      },
      {
        id: 7,
        code: 'APT-407',
        patientId: 3,
        doctorId: 5,
        appointmentDate: '2026-11-11',
        appointmentTime: '12:00',
        reason: 'General wellness screening',
        status: 'Cancelled',
        notes: 'Rescheduled due to physician leave.',
        createdAt: '2026-11-05',
      },
    ],
    bills: [
      {
        id: 1,
        invoiceNumber: 'INV-2026-501',
        patientId: 1,
        appointmentId: 1,
        consultationFee: 180,
        labCharges: 95,
        medicationCharges: 45,
        roomCharges: 0,
        discount: 0,
        totalAmount: 320,
        paidAmount: 320,
        paymentStatus: 'Paid',
        paymentMethod: 'Card',
        billingDate: '2026-11-13',
        notes: 'ECG + Lipid Profile + Prescription',
      },
      {
        id: 2,
        invoiceNumber: 'INV-2026-502',
        patientId: 2,
        appointmentId: 2,
        consultationFee: 210,
        labCharges: 140,
        medicationCharges: 0,
        roomCharges: 0,
        discount: 25,
        totalAmount: 325,
        paidAmount: 150,
        paymentStatus: 'Partial',
        paymentMethod: 'Insurance',
        billingDate: '2026-11-13',
        notes: 'Initial deposit collected; awaiting insurance co-pay',
      },
      {
        id: 3,
        invoiceNumber: 'INV-2026-503',
        patientId: 3,
        appointmentId: 3,
        consultationFee: 165,
        labCharges: 120,
        medicationCharges: 60,
        roomCharges: 240,
        discount: 35,
        totalAmount: 550,
        paidAmount: 0,
        paymentStatus: 'Pending',
        paymentMethod: 'Card',
        billingDate: '2026-11-13',
        notes: 'Orthopedic imaging & day-care physiotherapy bay',
      },
      {
        id: 4,
        invoiceNumber: 'INV-2026-504',
        patientId: 6,
        appointmentId: 6,
        consultationFee: 150,
        labCharges: 0,
        medicationCharges: 38,
        roomCharges: 0,
        discount: 0,
        totalAmount: 188,
        paidAmount: 188,
        paymentStatus: 'Paid',
        paymentMethod: 'UPI / Transfer',
        billingDate: '2026-11-12',
        notes: 'Dermatology consultation & topical ointment',
      },
      {
        id: 5,
        invoiceNumber: 'INV-2026-505',
        patientId: 5,
        appointmentId: 5,
        consultationFee: 180,
        labCharges: 110,
        medicationCharges: 0,
        roomCharges: 0,
        discount: 0,
        totalAmount: 290,
        paidAmount: 0,
        paymentStatus: 'Pending',
        paymentMethod: 'Cash',
        billingDate: '2026-11-13',
        notes: 'Pre-consultation cardiac lab panel',
      },
    ],
  };
}

export class HospitalStore {
  private readonly filePath: string;
  private db: HospitalDatabase;
  private readonly sessions = new Map<string, AdminUser>();

  constructor(filePath = path.join(process.cwd(), 'data', 'hospital-db.json')) {
    this.filePath = filePath;
    this.db = this.loadOrSeed();
  }

  private loadOrSeed(): HospitalDatabase {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (fs.existsSync(this.filePath)) {
      try {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw) as HospitalDatabase;
        if (parsed && Array.isArray(parsed.doctors) && Array.isArray(parsed.patients)) {
          return parsed;
        }
      } catch {
        // Fall through to re-seed if file is malformed
      }
    }
    const seeded = createInitialDatabase();
    this.persist(seeded);
    return seeded;
  }

  private persist(data: HospitalDatabase = this.db): void {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const tempPath = `${this.filePath}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempPath, this.filePath);
  }

  authenticate(usernameOrEmail: string, password: string): { token: string; user: AdminUser } | null {
    const normalized = usernameOrEmail.trim().toLowerCase();
    const admin = this.db.admins.find(
      (a) => a.username.toLowerCase() === normalized || a.email.toLowerCase() === normalized
    );
    if (!admin) return null;

    const candidateHash = hashPassword(password, admin.passwordSalt);
    const matches = crypto.timingSafeEqual(
      Buffer.from(candidateHash, 'hex'),
      Buffer.from(admin.passwordHash, 'hex')
    );
    if (!matches) return null;

    const token = crypto.randomBytes(24).toString('hex');
    const user: AdminUser = {
      username: admin.username,
      displayName: admin.displayName,
      role: admin.role,
      email: admin.email,
    };
    this.sessions.set(token, user);
    return { token, user };
  }

  verifyToken(token: string | undefined): AdminUser | null {
    if (!token) return null;
    return this.sessions.get(token) ?? null;
  }

  revokeToken(token: string | undefined): void {
    if (token) {
      this.sessions.delete(token);
    }
  }

  getDashboardSummary() {
    return computeDashboardSummary(
      this.db.doctors,
      this.db.patients,
      this.db.staff,
      this.db.appointments,
      this.db.bills
    );
  }

  // Doctors
  listDoctors(): Doctor[] {
    return [...this.db.doctors];
  }

  createDoctor(input: DoctorInput): { doctor?: Doctor; errors?: Record<string, string> } {
    const errors = validateDoctorInput(input);
    if (Object.keys(errors).length > 0) return { errors };

    const id = this.db.nextIds.doctor++;
    const doctor: Doctor = {
      id,
      code: `DOC-${100 + id}`,
      fullName: input.fullName.trim(),
      specialization: input.specialization.trim(),
      department: input.department.trim(),
      email: input.email.trim(),
      phone: input.phone.trim(),
      availability: input.availability,
      scheduleHours: input.scheduleHours.trim(),
      consultationFee: Number(input.consultationFee),
      createdAt: new Date().toISOString().slice(0, 10),
    };
    this.db.doctors.unshift(doctor);
    this.persist();
    return { doctor };
  }

  updateDoctor(id: number, input: DoctorInput): { doctor?: Doctor; errors?: Record<string, string>; notFound?: boolean } {
    const idx = this.db.doctors.findIndex((d) => d.id === id);
    if (idx === -1) return { notFound: true };

    const errors = validateDoctorInput(input);
    if (Object.keys(errors).length > 0) return { errors };

    const updated: Doctor = {
      ...this.db.doctors[idx],
      fullName: input.fullName.trim(),
      specialization: input.specialization.trim(),
      department: input.department.trim(),
      email: input.email.trim(),
      phone: input.phone.trim(),
      availability: input.availability,
      scheduleHours: input.scheduleHours.trim(),
      consultationFee: Number(input.consultationFee),
    };
    this.db.doctors[idx] = updated;
    this.persist();
    return { doctor: updated };
  }

  deleteDoctor(id: number): { deleted: boolean; conflict?: string } {
    const hasActiveAppts = this.db.appointments.some(
      (a) => a.doctorId === id && a.status === 'Scheduled'
    );
    if (hasActiveAppts) {
      return {
        deleted: false,
        conflict: 'Cannot delete doctor while they have scheduled appointments. Cancel or reassign those appointments first.',
      };
    }
    const before = this.db.doctors.length;
    this.db.doctors = this.db.doctors.filter((d) => d.id !== id);
    if (this.db.doctors.length === before) return { deleted: false };
    this.persist();
    return { deleted: true };
  }

  // Patients
  listPatients(): Patient[] {
    return [...this.db.patients];
  }

  createPatient(input: PatientInput): { patient?: Patient; errors?: Record<string, string> } {
    const errors = validatePatientInput(input);
    if (Object.keys(errors).length > 0) return { errors };

    const id = this.db.nextIds.patient++;
    const patient: Patient = {
      id,
      code: `PAT-${200 + id}`,
      fullName: input.fullName.trim(),
      age: Number(input.age),
      gender: input.gender as Patient['gender'],
      bloodGroup: input.bloodGroup as Patient['bloodGroup'],
      phone: input.phone.trim(),
      email: (input.email ?? '').trim(),
      address: input.address.trim(),
      emergencyContact: input.emergencyContact.trim(),
      medicalNotes: (input.medicalNotes ?? '').trim(),
      registeredAt: new Date().toISOString().slice(0, 10),
    };
    this.db.patients.unshift(patient);
    this.persist();
    return { patient };
  }

  updatePatient(id: number, input: PatientInput): { patient?: Patient; errors?: Record<string, string>; notFound?: boolean } {
    const idx = this.db.patients.findIndex((p) => p.id === id);
    if (idx === -1) return { notFound: true };

    const errors = validatePatientInput(input);
    if (Object.keys(errors).length > 0) return { errors };

    const updated: Patient = {
      ...this.db.patients[idx],
      fullName: input.fullName.trim(),
      age: Number(input.age),
      gender: input.gender as Patient['gender'],
      bloodGroup: input.bloodGroup as Patient['bloodGroup'],
      phone: input.phone.trim(),
      email: (input.email ?? '').trim(),
      address: input.address.trim(),
      emergencyContact: input.emergencyContact.trim(),
      medicalNotes: (input.medicalNotes ?? '').trim(),
    };
    this.db.patients[idx] = updated;
    this.persist();
    return { patient: updated };
  }

  deletePatient(id: number): { deleted: boolean; conflict?: string } {
    const hasScheduled = this.db.appointments.some(
      (a) => a.patientId === id && a.status === 'Scheduled'
    );
    if (hasScheduled) {
      return {
        deleted: false,
        conflict: 'Cannot remove patient with active scheduled appointments. Cancel their scheduled appointments first.',
      };
    }
    const before = this.db.patients.length;
    this.db.patients = this.db.patients.filter((p) => p.id !== id);
    if (this.db.patients.length === before) return { deleted: false };
    this.persist();
    return { deleted: true };
  }

  // Staff
  listStaff(): StaffMember[] {
    return [...this.db.staff];
  }

  createStaff(input: StaffInput): { staff?: StaffMember; errors?: Record<string, string> } {
    const errors = validateStaffInput(input);
    if (Object.keys(errors).length > 0) return { errors };

    const id = this.db.nextIds.staff++;
    const member: StaffMember = {
      id,
      code: `STF-${300 + id}`,
      fullName: input.fullName.trim(),
      role: input.role.trim(),
      department: input.department.trim(),
      shift: input.shift as StaffMember['shift'],
      phone: input.phone.trim(),
      email: input.email.trim(),
      status: (input.status as StaffMember['status']) || 'Active',
      joinedAt: new Date().toISOString().slice(0, 10),
    };
    this.db.staff.unshift(member);
    this.persist();
    return { staff: member };
  }

  updateStaff(id: number, input: StaffInput): { staff?: StaffMember; errors?: Record<string, string>; notFound?: boolean } {
    const idx = this.db.staff.findIndex((s) => s.id === id);
    if (idx === -1) return { notFound: true };

    const errors = validateStaffInput(input);
    if (Object.keys(errors).length > 0) return { errors };

    const updated: StaffMember = {
      ...this.db.staff[idx],
      fullName: input.fullName.trim(),
      role: input.role.trim(),
      department: input.department.trim(),
      shift: input.shift as StaffMember['shift'],
      phone: input.phone.trim(),
      email: input.email.trim(),
      status: (input.status as StaffMember['status']) || 'Active',
    };
    this.db.staff[idx] = updated;
    this.persist();
    return { staff: updated };
  }

  deleteStaff(id: number): boolean {
    const before = this.db.staff.length;
    this.db.staff = this.db.staff.filter((s) => s.id !== id);
    if (this.db.staff.length === before) return false;
    this.persist();
    return true;
  }

  // Appointments
  listAppointments(): Appointment[] {
    return [...this.db.appointments];
  }

  createAppointment(input: AppointmentInput): { appointment?: Appointment; errors?: Record<string, string> } {
    const errors = validateAppointmentInput(input, this.db.appointments);
    if (Object.keys(errors).length > 0) return { errors };

    const doctorExists = this.db.doctors.some((d) => d.id === Number(input.doctorId));
    if (!doctorExists) return { errors: { doctorId: 'Selected doctor does not exist.' } };

    const trimmedName = input.patientName.trim();
    const matchedPatient = this.db.patients.find(
      (p) => p.fullName.trim().toLowerCase() === trimmedName.toLowerCase()
    );

    const id = this.db.nextIds.appointment++;
    const appointment: Appointment = {
      id,
      code: `APT-${400 + id}`,
      patientId: matchedPatient ? matchedPatient.id : null,
      patientName: matchedPatient ? matchedPatient.fullName : trimmedName,
      doctorId: Number(input.doctorId),
      appointmentDate: input.appointmentDate,
      appointmentTime: input.appointmentTime,
      reason: input.reason.trim(),
      status: input.status ?? 'Scheduled',
      notes: (input.notes ?? '').trim(),
      createdAt: new Date().toISOString().slice(0, 10),
    };
    this.db.appointments.unshift(appointment);
    this.persist();
    return { appointment };
  }

  updateAppointment(
    id: number,
    input: AppointmentInput
  ): { appointment?: Appointment; errors?: Record<string, string>; notFound?: boolean } {
    const idx = this.db.appointments.findIndex((a) => a.id === id);
    if (idx === -1) return { notFound: true };

    const errors = validateAppointmentInput(input, this.db.appointments, id);
    if (Object.keys(errors).length > 0) return { errors };

    const trimmedName = input.patientName.trim();
    const matchedPatient = this.db.patients.find(
      (p) => p.fullName.trim().toLowerCase() === trimmedName.toLowerCase()
    );

    const updated: Appointment = {
      ...this.db.appointments[idx],
      patientId: matchedPatient ? matchedPatient.id : null,
      patientName: matchedPatient ? matchedPatient.fullName : trimmedName,
      doctorId: Number(input.doctorId),
      appointmentDate: input.appointmentDate,
      appointmentTime: input.appointmentTime,
      reason: input.reason.trim(),
      status: input.status ?? this.db.appointments[idx].status,
      notes: (input.notes ?? '').trim(),
    };
    this.db.appointments[idx] = updated;
    this.persist();
    return { appointment: updated };
  }

  deleteAppointment(id: number): boolean {
    const before = this.db.appointments.length;
    this.db.appointments = this.db.appointments.filter((a) => a.id !== id);
    if (this.db.appointments.length === before) return false;
    this.persist();
    return true;
  }

  // Bills
  listBills(): Bill[] {
    return [...this.db.bills];
  }

  createBill(input: BillCreateInput): { bill?: Bill; errors?: Record<string, string> } {
    const errors = validateBillInput(input);
    if (Object.keys(errors).length > 0) return { errors };

    const patientExists = this.db.patients.some((p) => p.id === Number(input.patientId));
    if (!patientExists) return { errors: { patientId: 'Selected patient does not exist.' } };

    const totals = calculateBillTotals(input);
    const id = this.db.nextIds.bill++;
    const bill: Bill = {
      id,
      invoiceNumber: `INV-2026-${500 + id}`,
      patientId: Number(input.patientId),
      appointmentId: input.appointmentId ? Number(input.appointmentId) : null,
      consultationFee: Number(input.consultationFee),
      labCharges: Number(input.labCharges),
      medicationCharges: Number(input.medicationCharges),
      roomCharges: Number(input.roomCharges),
      discount: Number(input.discount),
      totalAmount: totals.totalAmount,
      paidAmount: totals.paidAmount,
      paymentStatus: totals.paymentStatus,
      paymentMethod: input.paymentMethod,
      billingDate: input.billingDate,
      notes: (input.notes ?? '').trim(),
    };
    this.db.bills.unshift(bill);
    this.persist();
    return { bill };
  }

  recordBillPayment(
    id: number,
    amount: number,
    paymentMethod: PaymentMethod
  ): { bill?: Bill; errors?: Record<string, string>; notFound?: boolean } {
    const idx = this.db.bills.findIndex((b) => b.id === id);
    if (idx === -1) return { notFound: true };

    const existing = this.db.bills[idx];
    const errors = validatePaymentRecord(existing, Number(amount));
    if (Object.keys(errors).length > 0) return { errors };

    const nextPaid = Math.round((existing.paidAmount + Number(amount) + Number.EPSILON) * 100) / 100;
    const totals = calculateBillTotals({
      consultationFee: existing.consultationFee,
      labCharges: existing.labCharges,
      medicationCharges: existing.medicationCharges,
      roomCharges: existing.roomCharges,
      discount: existing.discount,
      paidAmount: nextPaid,
    });

    const updated: Bill = {
      ...existing,
      paidAmount: totals.paidAmount,
      paymentStatus: totals.paymentStatus,
      paymentMethod,
    };
    this.db.bills[idx] = updated;
    this.persist();
    return { bill: updated };
  }

  deleteBill(id: number): boolean {
    const before = this.db.bills.length;
    this.db.bills = this.db.bills.filter((b) => b.id !== id);
    if (this.db.bills.length === before) return false;
    this.persist();
    return true;
  }
}
