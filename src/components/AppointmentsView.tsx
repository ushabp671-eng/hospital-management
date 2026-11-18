import React, { useMemo, useState } from 'react';
import { CheckCircle2, Pencil, Plus, Search, Trash2, XCircle } from 'lucide-react';
import type {
  Appointment,
  AppointmentStatus,
  Doctor,
  Patient,
  ValidationErrors,
} from '../types/hospital';
import { apiFetch, ApiError } from '../utils/apiClient';
import { validateAppointmentInput, type AppointmentInput } from '../utils/hospitalLogic';
import { ConfirmDeleteModal, ModalDialog } from './ModalDialog';

interface AppointmentsViewProps {
  appointments: Appointment[];
  patients: Patient[];
  doctors: Doctor[];
  onRefresh: () => Promise<void>;
  externalCreateTrigger?: number;
}

function statusColor(status: AppointmentStatus): string {
  switch (status) {
    case 'Scheduled':
      return 'text-teal-700';
    case 'Completed':
      return 'text-emerald-700';
    case 'Cancelled':
      return 'text-rose-700';
  }
}

export function AppointmentsView({
  appointments,
  patients,
  doctors,
  onRefresh,
  externalCreateTrigger,
}: AppointmentsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | AppointmentStatus>('All');
  const [dateFilter, setDateFilter] = useState('');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [deletingAppointment, setDeletingAppointment] = useState<Appointment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [form, setForm] = useState<AppointmentInput>({
    patientName: '',
    doctorId: doctors[0]?.id ?? 0,
    appointmentDate: new Date().toISOString().slice(0, 10),
    appointmentTime: '10:00',
    reason: '',
    status: 'Scheduled',
    notes: '',
  });
  const [fieldErrors, setFieldErrors] = useState<ValidationErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (externalCreateTrigger && externalCreateTrigger > 0) {
      openCreateModal();
    }
  }, [externalCreateTrigger]);

  const patientMap = useMemo(() => new Map(patients.map((p) => [p.id, p])), [patients]);
  const doctorMap = useMemo(() => new Map(doctors.map((d) => [d.id, d])), [doctors]);

  function resolvePatientDisplay(appt: Appointment): { name: string; subLabel: string } {
    const registered = appt.patientId !== null ? patientMap.get(appt.patientId) : undefined;
    if (registered) {
      return { name: registered.fullName, subLabel: registered.code };
    }
    return {
      name: appt.patientName?.trim() || 'Walk-in Patient',
      subLabel: 'Walk-in / Manual Entry',
    };
  }

  const filteredAppointments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return appointments.filter((appt) => {
      if (statusFilter !== 'All' && appt.status !== statusFilter) return false;
      if (dateFilter && appt.appointmentDate !== dateFilter) return false;
      if (!q) return true;
      const registeredName = appt.patientId !== null ? patientMap.get(appt.patientId)?.fullName : undefined;
      const pName = (appt.patientName || registeredName || '').toLowerCase();
      const dName = doctorMap.get(appt.doctorId)?.fullName.toLowerCase() ?? '';
      return (
        appt.code.toLowerCase().includes(q) ||
        pName.includes(q) ||
        dName.includes(q) ||
        appt.reason.toLowerCase().includes(q)
      );
    });
  }, [appointments, statusFilter, dateFilter, searchQuery, patientMap, doctorMap]);

  function openCreateModal() {
    const defaultDoc = doctors.find((d) => d.availability === 'Available') ?? doctors[0];
    setEditingAppointment(null);
    setForm({
      patientName: '',
      doctorId: defaultDoc?.id ?? 0,
      appointmentDate: '2026-11-16',
      appointmentTime: '10:30',
      reason: '',
      status: 'Scheduled',
      notes: '',
    });
    setFieldErrors({});
    setSubmitError(null);
    setIsFormOpen(true);
  }

  function openEditModal(appt: Appointment) {
    const { name } = resolvePatientDisplay(appt);
    setEditingAppointment(appt);
    setForm({
      patientId: appt.patientId,
      patientName: name,
      doctorId: appt.doctorId,
      appointmentDate: appt.appointmentDate,
      appointmentTime: appt.appointmentTime,
      reason: appt.reason,
      status: appt.status,
      notes: appt.notes,
    });
    setFieldErrors({});
    setSubmitError(null);
    setIsFormOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    const errors = validateAppointmentInput(form, appointments, editingAppointment?.id);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSaving(true);
    try {
      if (editingAppointment) {
        await apiFetch(`/api/appointments/${editingAppointment.id}`, {
          method: 'PUT',
          body: JSON.stringify(form),
        });
      } else {
        await apiFetch('/api/appointments', {
          method: 'POST',
          body: JSON.stringify(form),
        });
      }
      await onRefresh();
      setIsFormOpen(false);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.fieldErrors) setFieldErrors(err.fieldErrors);
        setSubmitError(err.message);
      } else {
        setSubmitError('Failed to save appointment.');
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function quickStatusChange(appt: Appointment, nextStatus: AppointmentStatus) {
    const { name } = resolvePatientDisplay(appt);
    try {
      await apiFetch(`/api/appointments/${appt.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          patientId: appt.patientId,
          patientName: name,
          doctorId: appt.doctorId,
          appointmentDate: appt.appointmentDate,
          appointmentTime: appt.appointmentTime,
          reason: appt.reason,
          status: nextStatus,
          notes: appt.notes,
        }),
      });
      await onRefresh();
    } catch {
      // Errors handled via refresh/edit modal if needed
    }
  }

  async function handleConfirmDelete() {
    if (!deletingAppointment) return;
    setIsDeleting(true);
    try {
      await apiFetch(`/api/appointments/${deletingAppointment.id}`, { method: 'DELETE' });
      await onRefresh();
      setDeletingAppointment(null);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <label htmlFor="appt-search" className="sr-only">
              Search appointments
            </label>
            <input
              id="appt-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search code, patient, doctor, or reason..."
              className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
            />
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="appt-date-filter" className="sr-only">
              Filter by date
            </label>
            <input
              id="appt-date-filter"
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 font-mono focus:border-teal-600 focus:outline-none"
            />
            {dateFilter && (
              <button
                type="button"
                onClick={() => setDateFilter('')}
                className="text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-md bg-slate-100 p-1" role="group" aria-label="Filter by appointment status">
            {(['All', 'Scheduled', 'Completed', 'Cancelled'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`rounded px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  statusFilter === st ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Appointments Table */}
      <div className="rounded-lg border border-slate-200 bg-white">
        {filteredAppointments.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-semibold text-slate-900">No appointments match your filter</p>
            <p className="mt-1 text-xs text-slate-500">Schedule a new consultation between a patient and physician.</p>
            <button
              type="button"
              onClick={openCreateModal}
              className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
            >
              <Plus className="h-4 w-4" />
              Book Appointment
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-5 py-3">Code</th>
                  <th className="px-5 py-3">Patient</th>
                  <th className="px-5 py-3">Doctor &amp; Dept</th>
                  <th className="px-5 py-3">Date &amp; Time</th>
                  <th className="px-5 py-3">Reason</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredAppointments.map((appt) => {
                  const patientInfo = resolvePatientDisplay(appt);
                  const doctor = doctorMap.get(appt.doctorId);
                  return (
                    <tr key={appt.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                        {appt.code}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-900">{patientInfo.name}</div>
                        <div className="text-xs text-slate-500">{patientInfo.subLabel}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-slate-800">{doctor?.fullName ?? 'Unknown Doctor'}</div>
                        <div className="text-xs text-slate-500">{doctor?.specialization}</div>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-700 tabular-nums whitespace-nowrap">
                        {appt.appointmentDate} · {appt.appointmentTime}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-700 max-w-[240px]">
                        <div className="truncate font-medium text-slate-800">{appt.reason}</div>
                        {appt.notes && <div className="truncate text-slate-500">{appt.notes}</div>}
                      </td>
                      <td className={`px-5 py-3.5 text-xs font-semibold whitespace-nowrap ${statusColor(appt.status)}`}>
                        {appt.status}
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          {appt.status === 'Scheduled' && (
                            <>
                              <button
                                type="button"
                                onClick={() => quickStatusChange(appt, 'Completed')}
                                aria-label={`Mark ${appt.code} completed`}
                                title="Mark Completed"
                                className="rounded p-1.5 text-slate-500 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => quickStatusChange(appt, 'Cancelled')}
                                aria-label={`Cancel ${appt.code}`}
                                title="Cancel Appointment"
                                className="rounded p-1.5 text-slate-500 transition-colors hover:bg-amber-50 hover:text-amber-700"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => openEditModal(appt)}
                            aria-label={`Edit ${appt.code}`}
                            className="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-teal-700"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingAppointment(appt)}
                            aria-label={`Delete ${appt.code}`}
                            className="rounded p-1.5 text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Book / Edit Appointment Modal */}
      <ModalDialog
        isOpen={isFormOpen}
        title={editingAppointment ? `Edit Appointment ${editingAppointment.code}` : 'Book New Appointment'}
        subtitle="Enter patient name, select physician, and choose an available consultation slot."
        onClose={() => setIsFormOpen(false)}
      >
        <form onSubmit={handleSave} className="space-y-4" noValidate>
          {submitError && (
            <div role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
              {submitError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="appt-patient-name" className="block text-sm font-medium text-slate-700">
                Patient Name
              </label>
              <input
                id="appt-patient-name"
                type="text"
                value={form.patientName}
                onChange={(e) => setForm({ ...form, patientName: e.target.value })}
                placeholder="Enter patient full name"
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none"
              />
              {fieldErrors.patientName && <p className="mt-1 text-xs text-rose-600">{fieldErrors.patientName}</p>}
            </div>

            <div>
              <label htmlFor="appt-doctor" className="block text-sm font-medium text-slate-700">
                Physician
              </label>
              <select
                id="appt-doctor"
                value={form.doctorId}
                onChange={(e) => setForm({ ...form, doctorId: Number(e.target.value) })}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
              >
                <option value={0}>Select physician...</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.fullName} ({d.specialization})
                  </option>
                ))}
              </select>
              {fieldErrors.doctorId && <p className="mt-1 text-xs text-rose-600">{fieldErrors.doctorId}</p>}
            </div>

            <div>
              <label htmlFor="appt-date" className="block text-sm font-medium text-slate-700">
                Date
              </label>
              <input
                id="appt-date"
                type="date"
                value={form.appointmentDate}
                onChange={(e) => setForm({ ...form, appointmentDate: e.target.value })}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono focus:border-teal-600 focus:outline-none"
              />
              {fieldErrors.appointmentDate && <p className="mt-1 text-xs text-rose-600">{fieldErrors.appointmentDate}</p>}
            </div>

            <div>
              <label htmlFor="appt-time" className="block text-sm font-medium text-slate-700">
                Time Slot
              </label>
              <input
                id="appt-time"
                type="time"
                value={form.appointmentTime}
                onChange={(e) => setForm({ ...form, appointmentTime: e.target.value })}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono focus:border-teal-600 focus:outline-none"
              />
              {fieldErrors.appointmentTime && <p className="mt-1 text-xs text-rose-600">{fieldErrors.appointmentTime}</p>}
            </div>

            {editingAppointment && (
              <div className="sm:col-span-2">
                <label htmlFor="appt-status" className="block text-sm font-medium text-slate-700">
                  Appointment Status
                </label>
                <select
                  id="appt-status"
                  value={form.status ?? 'Scheduled'}
                  onChange={(e) => setForm({ ...form, status: e.target.value as AppointmentStatus })}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
                >
                  <option value="Scheduled">Scheduled</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            )}

            <div className="sm:col-span-2">
              <label htmlFor="appt-reason" className="block text-sm font-medium text-slate-700">
                Reason for Visit
              </label>
              <input
                id="appt-reason"
                type="text"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                placeholder="Initial cardiology consultation"
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
              />
              {fieldErrors.reason && <p className="mt-1 text-xs text-rose-600">{fieldErrors.reason}</p>}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="appt-notes" className="block text-sm font-medium text-slate-700">
                Clinical Notes (Optional)
              </label>
              <textarea
                id="appt-notes"
                rows={2}
                value={form.notes ?? ''}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Preparation instructions or triage notes..."
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
            >
              {isSaving ? 'Saving...' : editingAppointment ? 'Update Appointment' : 'Confirm Booking'}
            </button>
          </div>
        </form>
      </ModalDialog>

      <ConfirmDeleteModal
        isOpen={Boolean(deletingAppointment)}
        entityLabel="Appointment"
        itemName={deletingAppointment?.code ?? ''}
        isDeleting={isDeleting}
        onCancel={() => setDeletingAppointment(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
