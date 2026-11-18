import React, { useMemo, useState } from 'react';
import { FileText, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import type {
  Appointment,
  Bill,
  BloodGroup,
  Doctor,
  Patient,
  PatientGender,
  ValidationErrors,
} from '../types/hospital';
import { apiFetch, ApiError } from '../utils/apiClient';
import { formatCurrency, validatePatientInput, type PatientInput } from '../utils/hospitalLogic';
import { ConfirmDeleteModal, ModalDialog } from './ModalDialog';

interface PatientsViewProps {
  patients: Patient[];
  appointments: Appointment[];
  bills: Bill[];
  doctors: Doctor[];
  onRefresh: () => Promise<void>;
  externalCreateTrigger?: number;
}

const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDERS: PatientGender[] = ['Male', 'Female', 'Other'];

const EMPTY_FORM: PatientInput = {
  fullName: '',
  age: 30,
  gender: 'Male',
  bloodGroup: 'O+',
  phone: '',
  email: '',
  address: '',
  emergencyContact: '',
  medicalNotes: '',
};

export function PatientsView({
  patients,
  appointments,
  bills,
  doctors,
  onRefresh,
  externalCreateTrigger,
}: PatientsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [bloodFilter, setBloodFilter] = useState('All');
  const [genderFilter, setGenderFilter] = useState<'All' | PatientGender>('All');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [viewingPatient, setViewingPatient] = useState<Patient | null>(null);
  const [deletingPatient, setDeletingPatient] = useState<Patient | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [form, setForm] = useState<PatientInput>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<ValidationErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (externalCreateTrigger && externalCreateTrigger > 0) {
      openCreateModal();
    }
  }, [externalCreateTrigger]);

  const filteredPatients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return patients.filter((p) => {
      if (bloodFilter !== 'All' && p.bloodGroup !== bloodFilter) return false;
      if (genderFilter !== 'All' && p.gender !== genderFilter) return false;
      if (!q) return true;
      return (
        p.fullName.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.phone.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q)
      );
    });
  }, [patients, searchQuery, bloodFilter, genderFilter]);

  function openCreateModal() {
    setEditingPatient(null);
    setForm(EMPTY_FORM);
    setFieldErrors({});
    setSubmitError(null);
    setIsFormOpen(true);
  }

  function openEditModal(patient: Patient) {
    setEditingPatient(patient);
    setForm({
      fullName: patient.fullName,
      age: patient.age,
      gender: patient.gender,
      bloodGroup: patient.bloodGroup,
      phone: patient.phone,
      email: patient.email,
      address: patient.address,
      emergencyContact: patient.emergencyContact,
      medicalNotes: patient.medicalNotes,
    });
    setFieldErrors({});
    setSubmitError(null);
    setIsFormOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    const errors = validatePatientInput(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSaving(true);
    try {
      if (editingPatient) {
        await apiFetch(`/api/patients/${editingPatient.id}`, {
          method: 'PUT',
          body: JSON.stringify(form),
        });
      } else {
        await apiFetch('/api/patients', {
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
        setSubmitError('Failed to save patient record.');
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deletingPatient) return;
    setDeleteError(null);
    setIsDeleting(true);
    try {
      await apiFetch(`/api/patients/${deletingPatient.id}`, { method: 'DELETE' });
      await onRefresh();
      setDeletingPatient(null);
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : 'Unable to delete patient.');
    } finally {
      setIsDeleting(false);
    }
  }

  const doctorMap = useMemo(() => new Map(doctors.map((d) => [d.id, d])), [doctors]);
  const patientAppointments = viewingPatient
    ? appointments.filter((a) => a.patientId === viewingPatient.id)
    : [];
  const patientBills = viewingPatient
    ? bills.filter((b) => b.patientId === viewingPatient.id)
    : [];

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <label htmlFor="patient-search" className="sr-only">
              Search patients
            </label>
            <input
              id="patient-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search patient name, ID, or phone..."
              className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
            />
          </div>

          <div>
            <label htmlFor="patient-blood-filter" className="sr-only">
              Filter by blood group
            </label>
            <select
              id="patient-blood-filter"
              value={bloodFilter}
              onChange={(e) => setBloodFilter(e.target.value)}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-teal-600 focus:outline-none"
            >
              <option value="All">All Blood Groups</option>
              {BLOOD_GROUPS.map((bg) => (
                <option key={bg} value={bg}>
                  Blood Group {bg}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-md bg-slate-100 p-1" role="group" aria-label="Filter by gender">
            {(['All', 'Male', 'Female', 'Other'] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGenderFilter(g)}
                className={`rounded px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  genderFilter === g ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Patients Table */}
      <div className="rounded-lg border border-slate-200 bg-white">
        {filteredPatients.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-semibold text-slate-900">No patient records found</p>
            <p className="mt-1 text-xs text-slate-500">Adjust your search criteria or register a new patient.</p>
            <button
              type="button"
              onClick={openCreateModal}
              className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
            >
              <Plus className="h-4 w-4" />
              Register Patient
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-5 py-3">ID</th>
                  <th className="px-5 py-3">Patient Name</th>
                  <th className="px-5 py-3">Age / Gender</th>
                  <th className="px-5 py-3">Blood</th>
                  <th className="px-5 py-3">Contact &amp; Address</th>
                  <th className="px-5 py-3">Registered</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredPatients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                      {patient.code}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900">{patient.fullName}</div>
                      <div className="text-xs text-slate-500 truncate max-w-[220px]">
                        {patient.medicalNotes || 'No clinical notes recorded'}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-700 tabular-nums whitespace-nowrap">
                      {patient.age} yrs · {patient.gender}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs font-semibold text-rose-700 whitespace-nowrap">
                      {patient.bloodGroup}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-slate-800">{patient.phone}</div>
                      <div className="text-xs text-slate-500 truncate max-w-[220px]">{patient.address}</div>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                      {patient.registeredAt}
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setViewingPatient(patient)}
                          aria-label={`View record for ${patient.fullName}`}
                          className="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(patient)}
                          aria-label={`Edit ${patient.fullName}`}
                          className="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-teal-700"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteError(null);
                            setDeletingPatient(patient);
                          }}
                          aria-label={`Delete ${patient.fullName}`}
                          className="rounded p-1.5 text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Register / Edit Patient Modal */}
      <ModalDialog
        isOpen={isFormOpen}
        title={editingPatient ? `Update ${editingPatient.fullName}` : 'Register New Patient'}
        subtitle="Maintain demographic, emergency contact, and clinical notes."
        onClose={() => setIsFormOpen(false)}
      >
        <form onSubmit={handleSave} className="space-y-4" noValidate>
          {submitError && (
            <div role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
              {submitError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="pat-fullname" className="block text-sm font-medium text-slate-700">
                Full Name
              </label>
              <input
                id="pat-fullname"
                type="text"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="Arjun Mehta"
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
              />
              {fieldErrors.fullName && <p className="mt-1 text-xs text-rose-600">{fieldErrors.fullName}</p>}
            </div>

            <div>
              <label htmlFor="pat-age" className="block text-sm font-medium text-slate-700">
                Age (Years)
              </label>
              <input
                id="pat-age"
                type="number"
                min="0"
                max="120"
                value={form.age}
                onChange={(e) => setForm({ ...form, age: Number(e.target.value) })}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums focus:border-teal-600 focus:outline-none"
              />
              {fieldErrors.age && <p className="mt-1 text-xs text-rose-600">{fieldErrors.age}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="pat-gender" className="block text-sm font-medium text-slate-700">
                  Gender
                </label>
                <select
                  id="pat-gender"
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
                >
                  {GENDERS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="pat-blood" className="block text-sm font-medium text-slate-700">
                  Blood Group
                </label>
                <select
                  id="pat-blood"
                  value={form.bloodGroup}
                  onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
                >
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="pat-phone" className="block text-sm font-medium text-slate-700">
                Phone Number
              </label>
              <input
                id="pat-phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="9876543210"
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
              />
              {fieldErrors.phone && <p className="mt-1 text-xs text-rose-600">{fieldErrors.phone}</p>}
            </div>

            <div>
              <label htmlFor="pat-email" className="block text-sm font-medium text-slate-700">
                Email (Optional)
              </label>
              <input
                id="pat-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="patient@example.com"
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
              />
              {fieldErrors.email && <p className="mt-1 text-xs text-rose-600">{fieldErrors.email}</p>}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="pat-address" className="block text-sm font-medium text-slate-700">
                Residential Address
              </label>
              <input
                id="pat-address"
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="420 Oakwood Avenue, Suite 4B"
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
              />
              {fieldErrors.address && <p className="mt-1 text-xs text-rose-600">{fieldErrors.address}</p>}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="pat-emergency" className="block text-sm font-medium text-slate-700">
                Emergency Contact
              </label>
              <input
                id="pat-emergency"
                type="text"
                value={form.emergencyContact}
                onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })}
                placeholder="Priya Mehta · 9876500001"
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
              />
              {fieldErrors.emergencyContact && <p className="mt-1 text-xs text-rose-600">{fieldErrors.emergencyContact}</p>}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="pat-notes" className="block text-sm font-medium text-slate-700">
                Medical Notes &amp; Allergies
              </label>
              <textarea
                id="pat-notes"
                rows={3}
                value={form.medicalNotes ?? ''}
                onChange={(e) => setForm({ ...form, medicalNotes: e.target.value })}
                placeholder="Known allergies, chronic conditions, ongoing medications..."
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
              {isSaving ? 'Saving...' : editingPatient ? 'Update Patient' : 'Register Patient'}
            </button>
          </div>
        </form>
      </ModalDialog>

      {/* Patient Clinical Record Modal */}
      <ModalDialog
        isOpen={Boolean(viewingPatient)}
        title={viewingPatient ? `${viewingPatient.fullName} — Patient Record` : 'Patient Record'}
        subtitle={viewingPatient ? `${viewingPatient.code} · Registered ${viewingPatient.registeredAt}` : undefined}
        onClose={() => setViewingPatient(null)}
        maxWidthClass="max-w-2xl"
      >
        {viewingPatient && (
          <div className="space-y-6 text-sm">
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-xs font-medium text-slate-500">Age &amp; Gender</dt>
                <dd className="mt-0.5 font-medium text-slate-900">
                  {viewingPatient.age} yrs · {viewingPatient.gender}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500">Blood Group</dt>
                <dd className="mt-0.5 font-mono font-semibold text-rose-700">{viewingPatient.bloodGroup}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500">Phone</dt>
                <dd className="mt-0.5 text-slate-900">{viewingPatient.phone}</dd>
              </div>
              <div className="col-span-2 sm:col-span-3">
                <dt className="text-xs font-medium text-slate-500">Address &amp; Emergency Contact</dt>
                <dd className="mt-0.5 text-slate-800">
                  {viewingPatient.address} · Emergency: {viewingPatient.emergencyContact}
                </dd>
              </div>
              <div className="col-span-2 sm:col-span-3">
                <dt className="text-xs font-medium text-slate-500">Clinical Notes</dt>
                <dd className="mt-1 rounded-md bg-slate-50 p-3 text-slate-700">
                  {viewingPatient.medicalNotes || 'No medical notes recorded.'}
                </dd>
              </div>
            </dl>

            <div className="border-t border-slate-200 pt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Appointments ({patientAppointments.length})
              </h3>
              {patientAppointments.length === 0 ? (
                <p className="mt-2 text-xs text-slate-500">No appointments recorded for this patient.</p>
              ) : (
                <div className="mt-2 divide-y divide-slate-200 border-t border-b border-slate-200">
                  {patientAppointments.map((a) => (
                    <div key={a.id} className="flex items-center justify-between py-2 text-xs">
                      <div>
                        <span className="font-mono text-slate-600">{a.code}</span> ·{' '}
                        <span className="font-medium text-slate-900">
                          {doctorMap.get(a.doctorId)?.fullName ?? 'Doctor'}
                        </span>{' '}
                        — {a.reason}
                      </div>
                      <div className="font-mono text-slate-600 tabular-nums whitespace-nowrap">
                        {a.appointmentDate} · {a.status}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Billing History ({patientBills.length})
              </h3>
              {patientBills.length === 0 ? (
                <p className="mt-2 text-xs text-slate-500">No bills issued for this patient.</p>
              ) : (
                <div className="mt-2 divide-y divide-slate-200 border-t border-b border-slate-200">
                  {patientBills.map((b) => (
                    <div key={b.id} className="flex items-center justify-between py-2 text-xs">
                      <div>
                        <span className="font-mono font-medium text-slate-800">{b.invoiceNumber}</span> · {b.billingDate}
                      </div>
                      <div className="font-mono tabular-nums">
                        {formatCurrency(b.paidAmount)} / {formatCurrency(b.totalAmount)} ({b.paymentStatus})
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </ModalDialog>

      <ConfirmDeleteModal
        isOpen={Boolean(deletingPatient)}
        entityLabel="Patient"
        itemName={deletingPatient?.fullName ?? ''}
        errorMessage={deleteError}
        isDeleting={isDeleting}
        onCancel={() => setDeletingPatient(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
