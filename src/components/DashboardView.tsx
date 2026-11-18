import React from 'react';
import { ArrowRight, Calendar, CreditCard, Stethoscope, Users } from 'lucide-react';
import type {
  Appointment,
  Bill,
  DashboardSummary,
  Doctor,
  Patient,
  StaffMember,
} from '../types/hospital';
import { formatCurrency } from '../utils/hospitalLogic';

export type ActiveTab =
  | 'dashboard'
  | 'doctors'
  | 'patients'
  | 'appointments'
  | 'billing'
  | 'staff'
  | 'source';

interface DashboardViewProps {
  summary: DashboardSummary;
  doctors: Doctor[];
  patients: Patient[];
  staff: StaffMember[];
  appointments: Appointment[];
  bills: Bill[];
  onNavigate: (tab: ActiveTab) => void;
}

function getAppointmentStatusColor(status: Appointment['status']): string {
  switch (status) {
    case 'Scheduled':
      return 'text-teal-700';
    case 'Completed':
      return 'text-emerald-700';
    case 'Cancelled':
      return 'text-rose-700';
  }
}

function getAvailabilityColor(availability: Doctor['availability']): string {
  switch (availability) {
    case 'Available':
      return 'text-emerald-700';
    case 'In Consultation':
      return 'text-amber-700';
    case 'On Leave':
    case 'Off Duty':
      return 'text-slate-500';
  }
}

function getPaymentStatusColor(status: Bill['paymentStatus']): string {
  switch (status) {
    case 'Paid':
      return 'text-emerald-700';
    case 'Partial':
      return 'text-amber-700';
    case 'Pending':
      return 'text-rose-700';
  }
}

export function DashboardView({
  summary,
  doctors,
  patients,
  staff,
  appointments,
  bills,
  onNavigate,
}: DashboardViewProps) {
  const patientMap = new Map(patients.map((p) => [p.id, p]));
  const doctorMap = new Map(doctors.map((d) => [d.id, d]));

  const upcomingAppointments = appointments
    .filter((a) => a.status === 'Scheduled')
    .slice(0, 5);

  const recentBills = bills.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* 4-Column KPI Strip */}
      <section aria-label="Hospital summary metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-sm font-medium">Total Doctors</span>
            <Stethoscope className="h-4 w-4 text-teal-700" aria-hidden="true" />
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900 tabular-nums" data-testid="kpi-doctors">
            {summary.totalDoctors}
          </p>
          <p className="mt-1.5 text-xs text-slate-500 tabular-nums">
            {summary.availableDoctors} available · {summary.activeStaff} active staff
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-sm font-medium">Total Patients</span>
            <Users className="h-4 w-4 text-teal-700" aria-hidden="true" />
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900 tabular-nums" data-testid="kpi-patients">
            {summary.totalPatients}
          </p>
          <p className="mt-1.5 text-xs text-slate-500 tabular-nums">
            Registered inpatient &amp; outpatient records
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-sm font-medium">Total Appointments</span>
            <Calendar className="h-4 w-4 text-teal-700" aria-hidden="true" />
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900 tabular-nums" data-testid="kpi-appointments">
            {summary.totalAppointments}
          </p>
          <p className="mt-1.5 text-xs text-slate-500 tabular-nums">
            {summary.scheduledAppointments} scheduled · {summary.completedAppointments} completed
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-sm font-medium">Billing Revenue</span>
            <CreditCard className="h-4 w-4 text-teal-700" aria-hidden="true" />
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900 tabular-nums" data-testid="kpi-revenue">
            {formatCurrency(summary.collectedRevenue)}
          </p>
          <p className="mt-1.5 text-xs text-slate-500 tabular-nums">
            {formatCurrency(summary.pendingBalance)} pending across {summary.pendingBillsCount} invoices
          </p>
        </div>
      </section>

      {/* Main 2-Column Workspace */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Scheduled Appointments */}
        <section className="xl:col-span-2 rounded-lg border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Upcoming Appointments</h2>
              <p className="text-xs text-slate-500">Scheduled consultations requiring clinical attention</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('appointments')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-800 whitespace-nowrap shrink-0"
            >
              Manage Appointments
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {upcomingAppointments.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm font-medium text-slate-700">No upcoming scheduled appointments</p>
              <p className="mt-1 text-xs text-slate-500">Book a new patient consultation from the Appointments view.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <tr>
                    <th className="px-3.5 py-3">Code</th>
                    <th className="px-3.5 py-3">Patient</th>
                    <th className="px-3.5 py-3">Physician</th>
                    <th className="px-3.5 py-3">Schedule</th>
                    <th className="px-3.5 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {upcomingAppointments.map((appt) => {
                    const patient = appt.patientId !== null ? patientMap.get(appt.patientId) : undefined;
                    const patientDisplayName = appt.patientName?.trim() || patient?.fullName || 'Walk-in Patient';
                    const doctor = doctorMap.get(appt.doctorId);
                    return (
                      <tr key={appt.id} className="hover:bg-slate-50/70">
                        <td className="px-3.5 py-3 font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                          {appt.code}
                        </td>
                        <td className="px-3.5 py-3">
                          <div className="font-medium text-slate-900">{patientDisplayName}</div>
                          <div className="text-xs text-slate-500 truncate max-w-[155px]">{appt.reason}</div>
                        </td>
                        <td className="px-3.5 py-3 whitespace-nowrap">
                          <div className="font-medium text-slate-900">{doctor?.fullName ?? 'Unknown Doctor'}</div>
                          <div className="text-xs text-slate-500">{doctor?.specialization}</div>
                        </td>
                        <td className="px-3.5 py-3 font-mono text-xs text-slate-700 tabular-nums whitespace-nowrap">
                          {appt.appointmentDate} · {appt.appointmentTime}
                        </td>
                        <td className={`px-3.5 py-3 text-right text-xs font-semibold whitespace-nowrap ${getAppointmentStatusColor(appt.status)}`}>
                          {appt.status}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Doctor Availability */}
        <section className="rounded-lg border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Physician Roster</h2>
              <p className="text-xs text-slate-500">{staff.length} total support staff on directory</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('doctors')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-800 whitespace-nowrap shrink-0"
            >
              All Doctors
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="divide-y divide-slate-200">
            {doctors.slice(0, 5).map((doc) => (
              <div key={doc.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">{doc.fullName}</p>
                  <p className="truncate text-xs text-slate-500">
                    {doc.specialization} · {formatCurrency(doc.consultationFee)}
                  </p>
                </div>
                <span className={`text-xs font-semibold whitespace-nowrap shrink-0 ${getAvailabilityColor(doc.availability)}`}>
                  {doc.availability}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Recent Billing Ledger */}
      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Recent Billing &amp; Payment Records</h2>
            <p className="text-xs text-slate-500">
              Total Billed: <span className="font-mono font-medium text-slate-700 tabular-nums">{formatCurrency(summary.totalBilled)}</span>
              {' · '}
              Collected: <span className="font-mono font-medium text-emerald-700 tabular-nums">{formatCurrency(summary.collectedRevenue)}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('billing')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-800 whitespace-nowrap shrink-0"
          >
            Open Billing Ledger
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-5 py-3">Invoice</th>
                <th className="px-5 py-3">Patient</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3 text-right">Total</th>
                <th className="px-5 py-3 text-right">Paid</th>
                <th className="px-5 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {recentBills.map((bill) => {
                const patient = patientMap.get(bill.patientId);
                return (
                  <tr key={bill.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3 font-mono text-xs font-medium text-slate-700 tabular-nums whitespace-nowrap">
                      {bill.invoiceNumber}
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-900">
                      {patient?.fullName ?? 'Unknown Patient'}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                      {bill.billingDate}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-xs font-medium text-slate-900 tabular-nums whitespace-nowrap">
                      {formatCurrency(bill.totalAmount)}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-xs text-slate-700 tabular-nums whitespace-nowrap">
                      {formatCurrency(bill.paidAmount)}
                    </td>
                    <td className={`px-5 py-3 text-right text-xs font-semibold whitespace-nowrap ${getPaymentStatusColor(bill.paymentStatus)}`}>
                      {bill.paymentStatus}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
