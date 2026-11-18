import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateBillTotals,
  computeDashboardSummary,
  validateAppointmentInput,
  validateBillInput,
  validateDoctorInput,
  validatePatientInput,
  validatePaymentRecord,
} from './hospitalLogic';
import type { Appointment, Bill, Doctor, Patient, StaffMember } from '../types/hospital';

test('validateDoctorInput flags missing or invalid fields and accepts valid input', () => {
  const bad = validateDoctorInput({
    fullName: 'Dr',
    specialization: '',
    department: 'Cardiology',
    email: 'not-an-email',
    phone: '123',
    availability: 'Available',
    scheduleHours: '',
    consultationFee: -10,
  });
  assert.ok(bad.fullName);
  assert.ok(bad.specialization);
  assert.ok(bad.email);
  assert.ok(bad.phone);
  assert.ok(bad.scheduleHours);
  assert.ok(bad.consultationFee);

  const good = validateDoctorInput({
    fullName: 'Dr. Kavita Rao',
    specialization: 'Neurology',
    department: 'Neurosciences',
    email: 'kavita.rao@mercycare.org',
    phone: '+1 (555) 234-5678',
    availability: 'Available',
    scheduleHours: 'Mon-Fri 09:00 - 16:00',
    consultationFee: 180,
  });
  assert.deepEqual(good, {});
});

test('validatePatientInput enforces realistic age and contact requirements', () => {
  const bad = validatePatientInput({
    fullName: '',
    age: 145,
    gender: 'Female',
    bloodGroup: 'O+',
    phone: '999',
    email: 'bad-email',
    address: '12',
    emergencyContact: '',
  });
  assert.ok(bad.fullName);
  assert.ok(bad.age);
  assert.ok(bad.phone);
  assert.ok(bad.email);
  assert.ok(bad.address);
  assert.ok(bad.emergencyContact);

  const good = validatePatientInput({
    fullName: 'Arjun Mehta',
    age: 38,
    gender: 'Male',
    bloodGroup: 'B+',
    phone: '9876543210',
    email: '',
    address: '420 Oakwood Avenue, Suite 4B',
    emergencyContact: 'Priya Mehta (9876500001)',
  });
  assert.deepEqual(good, {});
});

test('validateAppointmentInput detects double-booking conflicts only for Scheduled slots', () => {
  const existing: Appointment[] = [
    {
      id: 1,
      code: 'APT-1001',
      patientId: 1,
      doctorId: 2,
      appointmentDate: '2026-11-15',
      appointmentTime: '10:30',
      reason: 'Follow-up cardiac review',
      status: 'Scheduled',
      notes: '',
      createdAt: '2026-11-13',
    },
    {
      id: 2,
      code: 'APT-1002',
      patientId: 2,
      doctorId: 2,
      appointmentDate: '2026-11-15',
      appointmentTime: '11:30',
      reason: 'Cancelled slot',
      status: 'Cancelled',
      notes: '',
      createdAt: '2026-11-13',
    },
  ];

  const conflict = validateAppointmentInput(
    {
      patientName: 'Manual Walk-In Patient',
      doctorId: 2,
      appointmentDate: '2026-11-15',
      appointmentTime: '10:30',
      reason: 'Initial consultation',
    },
    existing
  );
  assert.ok(conflict.appointmentTime);

  const missingPatientName = validateAppointmentInput(
    {
      patientName: ' ',
      doctorId: 2,
      appointmentDate: '2026-11-15',
      appointmentTime: '12:00',
      reason: 'Initial consultation',
    },
    existing
  );
  assert.ok(missingPatientName.patientName);

  // Editing the same appointment id should not conflict with itself
  const selfEdit = validateAppointmentInput(
    {
      patientId: 1,
      patientName: 'Rohan Kulkarni',
      doctorId: 2,
      appointmentDate: '2026-11-15',
      appointmentTime: '10:30',
      reason: 'Updated cardiac review',
    },
    existing,
    1
  );
  assert.deepEqual(selfEdit, {});

  // Booking a previously cancelled slot with a manual name should succeed
  const cancelledSlot = validateAppointmentInput(
    {
      patientName: 'Kiran Sharma',
      doctorId: 2,
      appointmentDate: '2026-11-15',
      appointmentTime: '11:30',
      reason: 'New patient visit',
    },
    existing
  );
  assert.deepEqual(cancelledSlot, {});
});

test('calculateBillTotals and validatePaymentRecord handle partial and full payments', () => {
  const partial = calculateBillTotals({
    consultationFee: 150,
    labCharges: 85.5,
    medicationCharges: 44.5,
    roomCharges: 0,
    discount: 20,
    paidAmount: 100,
  });
  assert.equal(partial.subtotal, 280);
  assert.equal(partial.totalAmount, 260);
  assert.equal(partial.balanceDue, 160);
  assert.equal(partial.paymentStatus, 'Partial');

  const paid = calculateBillTotals({
    consultationFee: 150,
    labCharges: 0,
    medicationCharges: 0,
    roomCharges: 0,
    discount: 0,
    paidAmount: 150,
  });
  assert.equal(paid.paymentStatus, 'Paid');
  assert.equal(paid.balanceDue, 0);

  const badBill = validateBillInput({
    patientId: 1,
    appointmentId: null,
    consultationFee: 100,
    labCharges: 0,
    medicationCharges: 0,
    roomCharges: 0,
    discount: 150,
    paidAmount: 0,
    paymentMethod: 'Card',
    billingDate: '2026-11-13',
  });
  assert.ok(badBill.discount);

  const billRecord: Bill = {
    id: 10,
    invoiceNumber: 'INV-2026-010',
    patientId: 1,
    appointmentId: null,
    consultationFee: 150,
    labCharges: 50,
    medicationCharges: 0,
    roomCharges: 0,
    discount: 0,
    totalAmount: 200,
    paidAmount: 75,
    paymentStatus: 'Partial',
    paymentMethod: 'Card',
    billingDate: '2026-11-13',
    notes: '',
  };

  assert.ok(validatePaymentRecord(billRecord, 0).amount);
  assert.ok(validatePaymentRecord(billRecord, 150).amount);
  assert.deepEqual(validatePaymentRecord(billRecord, 125), {});
});

test('computeDashboardSummary aggregates doctors, patients, appointments, and billing', () => {
  const doctors: Doctor[] = [
    {
      id: 1,
      code: 'DOC-101',
      fullName: 'Dr. A',
      specialization: 'Cardiology',
      department: 'Cardiology',
      email: 'a@x.org',
      phone: '1234567890',
      availability: 'Available',
      scheduleHours: '09:00-17:00',
      consultationFee: 150,
      createdAt: '2026-01-01',
    },
    {
      id: 2,
      code: 'DOC-102',
      fullName: 'Dr. B',
      specialization: 'Neurology',
      department: 'Neurology',
      email: 'b@x.org',
      phone: '1234567891',
      availability: 'On Leave',
      scheduleHours: '09:00-17:00',
      consultationFee: 180,
      createdAt: '2026-01-01',
    },
  ];
  const patients: Patient[] = [
    {
      id: 1,
      code: 'PAT-201',
      fullName: 'P1',
      age: 30,
      gender: 'Female',
      bloodGroup: 'O+',
      phone: '1234567890',
      email: '',
      address: 'Address 1',
      emergencyContact: 'EC 1',
      medicalNotes: '',
      registeredAt: '2026-01-01',
    },
  ];
  const staff: StaffMember[] = [
    {
      id: 1,
      code: 'STF-301',
      fullName: 'Nurse Joy',
      role: 'Head Nurse',
      department: 'ICU',
      shift: 'Morning (07:00 - 15:00)',
      phone: '1234567892',
      email: 'joy@x.org',
      status: 'Active',
      joinedAt: '2026-01-01',
    },
  ];
  const appointments: Appointment[] = [
    {
      id: 1,
      code: 'APT-1',
      patientId: 1,
      doctorId: 1,
      appointmentDate: '2026-11-13',
      appointmentTime: '10:00',
      reason: 'Checkup',
      status: 'Scheduled',
      notes: '',
      createdAt: '2026-11-10',
    },
  ];
  const bills: Bill[] = [
    {
      id: 1,
      invoiceNumber: 'INV-1',
      patientId: 1,
      appointmentId: 1,
      consultationFee: 150,
      labCharges: 50,
      medicationCharges: 0,
      roomCharges: 0,
      discount: 0,
      totalAmount: 200,
      paidAmount: 150,
      paymentStatus: 'Partial',
      paymentMethod: 'Card',
      billingDate: '2026-11-13',
      notes: '',
    },
  ];

  const summary = computeDashboardSummary(doctors, patients, staff, appointments, bills);
  assert.equal(summary.totalDoctors, 2);
  assert.equal(summary.availableDoctors, 1);
  assert.equal(summary.totalPatients, 1);
  assert.equal(summary.totalAppointments, 1);
  assert.equal(summary.totalBilled, 200);
  assert.equal(summary.collectedRevenue, 150);
  assert.equal(summary.pendingBalance, 50);
  assert.equal(summary.pendingBillsCount, 1);
});
