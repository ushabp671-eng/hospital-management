import React, { useMemo, useState } from 'react';
import { Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import type { Doctor, DoctorAvailability, ValidationErrors } from '../types/hospital';
import { apiFetch, ApiError } from '../utils/apiClient';
import { formatCurrency, validateDoctorInput, type DoctorInput } from '../utils/hospitalLogic';
import { ConfirmDeleteModal, ModalDialog } from './ModalDialog';

interface DoctorsViewProps {
  doctors: Doctor[];
  onRefresh: () => Promise<void>;
  externalCreateTrigger?: number;
}

const AVAILABILITY_OPTIONS: DoctorAvailability[] = [
  'Available',
  'In Consultation',
  'On Leave',
  'Off Duty',
];

const EMPTY_FORM: DoctorInput = {
  fullName: '',
  specialization: '',
  department: '',
  email: '',
  phone: '',
  availability: 'Available',
  scheduleHours: 'Mon–Fri · 09:00 – 17:00',
  consultationFee: 150,
};

function availabilityTextClass(status: DoctorAvailability): string {
  switch (status) {
    case 'Available':
      return 'text-emerald-700';
    case 'In Consultation':
      return 'text-amber-700';
    case 'On Leave':
    case 'Off Duty':
      return 'text-slate-500';
  }
}

export function DoctorsView({ doctors, onRefresh, externalCreateTrigger }: DoctorsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [specializationFilter, setSpecializationFilter] = useState('All');
  const [availabilityFilter, setAvailabilityFilter] = useState<'All' | DoctorAvailability>('All');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [viewingDoctor, setViewingDoctor] = useState<Doctor | null>(null);
  const [deletingDoctor, setDeletingDoctor] = useState<Doctor | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [form, setForm] = useState<DoctorInput>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<ValidationErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (externalCreateTrigger && externalCreateTrigger > 0) {
      openCreateModal();
    }
  }, [externalCreateTrigger]);

  const specializations = useMemo(() => {
    const unique = Array.from(new Set(doctors.map((d) => d.specialization))).sort();
    return ['All', ...unique];
  }, [doctors]);

  const filteredDoctors = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return doctors.filter((doc) => {
      if (specializationFilter !== 'All' && doc.specialization !== specializationFilter) return false;
      if (availabilityFilter !== 'All' && doc.availability !== availabilityFilter) return false;
      if (!q) return true;
      return (
        doc.fullName.toLowerCase().includes(q) ||
        doc.code.toLowerCase().includes(q) ||
        doc.specialization.toLowerCase().includes(q) ||
        doc.department.toLowerCase().includes(q) ||
        doc.email.toLowerCase().includes(q)
      );
    });
  }, [doctors, searchQuery, specializationFilter, availabilityFilter]);

  function openCreateModal() {
    setEditingDoctor(null);
    setForm(EMPTY_FORM);
    setFieldErrors({});
    setSubmitError(null);
    setIsFormOpen(true);
  }

  function openEditModal(doc: Doctor) {
    setEditingDoctor(doc);
    setForm({
      fullName: doc.fullName,
      specialization: doc.specialization,
      department: doc.department,
      email: doc.email,
      phone: doc.phone,
      availability: doc.availability,
      scheduleHours: doc.scheduleHours,
      consultationFee: doc.consultationFee,
    });
    setFieldErrors({});
    setSubmitError(null);
    setIsFormOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    const errors = validateDoctorInput(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSaving(true);
    try {
      if (editingDoctor) {
        await apiFetch(`/api/doctors/${editingDoctor.id}`, {
          method: 'PUT',
          body: JSON.stringify(form),
        });
      } else {
        await apiFetch('/api/doctors', {
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
        setSubmitError('Failed to save doctor record.');
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deletingDoctor) return;
    setDeleteError(null);
    setIsDeleting(true);
    try {
      await apiFetch(`/api/doctors/${deletingDoctor.id}`, { method: 'DELETE' });
      await onRefresh();
      setDeletingDoctor(null);
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : 'Unable to delete doctor.');
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
            <label htmlFor="doctor-search" className="sr-only">
              Search doctors
            </label>
            <input
              id="doctor-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, code, or specialty..."
              className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
            />
          </div>

          <div>
            <label htmlFor="doctor-spec-filter" className="sr-only">
              Filter by specialization
            </label>
            <select
              id="doctor-spec-filter"
              value={specializationFilter}
              onChange={(e) => setSpecializationFilter(e.target.value)}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-teal-600 focus:outline-none"
            >
              {specializations.map((spec) => (
                <option key={spec} value={spec}>
                  {spec === 'All' ? 'All Specializations' : spec}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-md bg-slate-100 p-1" role="group" aria-label="Filter by availability">
            {(['All', 'Available', 'In Consultation', 'On Leave'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setAvailabilityFilter(status)}
                className={`rounded px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  availabilityFilter === status
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Doctors Data Table */}
      <div className="rounded-lg border border-slate-200 bg-white">
        {filteredDoctors.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-semibold text-slate-900">No doctors match your current filters</p>
            <p className="mt-1 text-xs text-slate-500">
              Try clearing your search filter or register a new physician.
            </p>
            <button
              type="button"
              onClick={openCreateModal}
              className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
            >
              <Plus className="h-4 w-4" />
              Add Doctor
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-5 py-3">ID</th>
                  <th className="px-5 py-3">Physician</th>
                  <th className="px-5 py-3">Specialization &amp; Dept</th>
                  <th className="px-5 py-3">Schedule</th>
                  <th className="px-5 py-3 text-right">Fee</th>
                  <th className="px-5 py-3">Availability</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredDoctors.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                      {doc.code}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900">{doc.fullName}</div>
                      <div className="text-xs text-slate-500">{doc.email} · {doc.phone}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-slate-800">{doc.specialization}</div>
                      <div className="text-xs text-slate-500">{doc.department}</div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600 whitespace-nowrap">
                      {doc.scheduleHours}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-xs font-medium text-slate-900 tabular-nums whitespace-nowrap">
                      {formatCurrency(doc.consultationFee)}
                    </td>
                    <td className={`px-5 py-3.5 text-xs font-semibold whitespace-nowrap ${availabilityTextClass(doc.availability)}`}>
                      {doc.availability}
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setViewingDoctor(doc)}
                          aria-label={`View ${doc.fullName}`}
                          className="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(doc)}
                          aria-label={`Edit ${doc.fullName}`}
                          className="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-teal-700"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteError(null);
                            setDeletingDoctor(doc);
                          }}
                          aria-label={`Delete ${doc.fullName}`}
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

      {/* Add / Edit Doctor Modal */}
      <ModalDialog
        isOpen={isFormOpen}
        title={editingDoctor ? `Edit ${editingDoctor.fullName}` : 'Add New Doctor'}
        subtitle="Enter physician credentials, specialization, and availability schedule."
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
              <label htmlFor="doc-fullname" className="block text-sm font-medium text-slate-700">
                Full Name
              </label>
              <input
                id="doc-fullname"
                type="text"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="Dr. Kavita Rao"
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
              />
              {fieldErrors.fullName && <p className="mt-1 text-xs text-rose-600">{fieldErrors.fullName}</p>}
            </div>

            <div>
              <label htmlFor="doc-spec" className="block text-sm font-medium text-slate-700">
                Specialization
              </label>
              <input
                id="doc-spec"
                type="text"
                value={form.specialization}
                onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                placeholder="Neurology"
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
              />
              {fieldErrors.specialization && <p className="mt-1 text-xs text-rose-600">{fieldErrors.specialization}</p>}
            </div>

            <div>
              <label htmlFor="doc-dept" className="block text-sm font-medium text-slate-700">
                Department
              </label>
              <input
                id="doc-dept"
                type="text"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                placeholder="Neurosciences"
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
              />
              {fieldErrors.department && <p className="mt-1 text-xs text-rose-600">{fieldErrors.department}</p>}
            </div>

            <div>
              <label htmlFor="doc-email" className="block text-sm font-medium text-slate-700">
                Email Address
              </label>
              <input
                id="doc-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="kavita.rao@mercycare.org"
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
              />
              {fieldErrors.email && <p className="mt-1 text-xs text-rose-600">{fieldErrors.email}</p>}
            </div>

            <div>
              <label htmlFor="doc-phone" className="block text-sm font-medium text-slate-700">
                Phone Number
              </label>
              <input
                id="doc-phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="9876501234"
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
              />
              {fieldErrors.phone && <p className="mt-1 text-xs text-rose-600">{fieldErrors.phone}</p>}
            </div>

            <div>
              <label htmlFor="doc-availability" className="block text-sm font-medium text-slate-700">
                Availability
              </label>
              <select
                id="doc-availability"
                value={form.availability}
                onChange={(e) => setForm({ ...form, availability: e.target.value as DoctorAvailability })}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
              >
                {AVAILABILITY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="doc-fee" className="block text-sm font-medium text-slate-700">
                Consultation Fee ($)
              </label>
              <input
                id="doc-fee"
                type="number"
                min="1"
                step="0.01"
                value={form.consultationFee}
                onChange={(e) => setForm({ ...form, consultationFee: Number(e.target.value) })}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums focus:border-teal-600 focus:outline-none"
              />
              {fieldErrors.consultationFee && <p className="mt-1 text-xs text-rose-600">{fieldErrors.consultationFee}</p>}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="doc-schedule" className="block text-sm font-medium text-slate-700">
                Consultation Schedule Hours
              </label>
              <input
                id="doc-schedule"
                type="text"
                value={form.scheduleHours}
                onChange={(e) => setForm({ ...form, scheduleHours: e.target.value })}
                placeholder="Mon–Fri · 09:00 – 17:00"
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
              />
              {fieldErrors.scheduleHours && <p className="mt-1 text-xs text-rose-600">{fieldErrors.scheduleHours}</p>}
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
              {isSaving ? 'Saving...' : editingDoctor ? 'Update Doctor' : 'Save Doctor'}
            </button>
          </div>
        </form>
      </ModalDialog>

      {/* View Doctor Details Modal */}
      <ModalDialog
        isOpen={Boolean(viewingDoctor)}
        title={viewingDoctor?.fullName ?? 'Doctor Profile'}
        subtitle={viewingDoctor ? `${viewingDoctor.code} · ${viewingDoctor.department}` : undefined}
        onClose={() => setViewingDoctor(null)}
        maxWidthClass="max-w-lg"
      >
        {viewingDoctor && (
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-xs font-medium text-slate-500">Specialization</dt>
              <dd className="mt-0.5 font-medium text-slate-900">{viewingDoctor.specialization}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">Availability</dt>
              <dd className={`mt-0.5 font-semibold ${availabilityTextClass(viewingDoctor.availability)}`}>
                {viewingDoctor.availability}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">Email</dt>
              <dd className="mt-0.5 text-slate-900">{viewingDoctor.email}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">Phone</dt>
              <dd className="mt-0.5 text-slate-900">{viewingDoctor.phone}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">Consultation Fee</dt>
              <dd className="mt-0.5 font-mono font-semibold text-slate-900 tabular-nums">
                {formatCurrency(viewingDoctor.consultationFee)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">Schedule Hours</dt>
              <dd className="mt-0.5 text-slate-900">{viewingDoctor.scheduleHours}</dd>
            </div>
          </dl>
        )}
      </ModalDialog>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(deletingDoctor)}
        entityLabel="Doctor"
        itemName={deletingDoctor?.fullName ?? ''}
        errorMessage={deleteError}
        isDeleting={isDeleting}
        onCancel={() => setDeletingDoctor(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
