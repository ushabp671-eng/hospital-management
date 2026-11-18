import React, { useMemo, useState } from 'react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import type { StaffMember, StaffShift, StaffStatus, ValidationErrors } from '../types/hospital';
import { apiFetch, ApiError } from '../utils/apiClient';
import { validateStaffInput, type StaffInput } from '../utils/hospitalLogic';
import { ConfirmDeleteModal, ModalDialog } from './ModalDialog';

interface StaffViewProps {
  staff: StaffMember[];
  onRefresh: () => Promise<void>;
  externalCreateTrigger?: number;
}

const SHIFTS: StaffShift[] = [
  'Morning (07:00 - 15:00)',
  'Evening (15:00 - 23:00)',
  'Night (23:00 - 07:00)',
];

const EMPTY_FORM: StaffInput = {
  fullName: '',
  role: '',
  department: '',
  shift: 'Morning (07:00 - 15:00)',
  phone: '',
  email: '',
  status: 'Active',
};

export function StaffView({ staff, onRefresh, externalCreateTrigger }: StaffViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | StaffStatus>('All');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [deletingStaff, setDeletingStaff] = useState<StaffMember | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [form, setForm] = useState<StaffInput>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<ValidationErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (externalCreateTrigger && externalCreateTrigger > 0) {
      openCreateModal();
    }
  }, [externalCreateTrigger]);

  const filteredStaff = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return staff.filter((member) => {
      if (statusFilter !== 'All' && member.status !== statusFilter) return false;
      if (!q) return true;
      return (
        member.fullName.toLowerCase().includes(q) ||
        member.code.toLowerCase().includes(q) ||
        member.role.toLowerCase().includes(q) ||
        member.department.toLowerCase().includes(q)
      );
    });
  }, [staff, searchQuery, statusFilter]);

  function openCreateModal() {
    setEditingStaff(null);
    setForm(EMPTY_FORM);
    setFieldErrors({});
    setSubmitError(null);
    setIsFormOpen(true);
  }

  function openEditModal(member: StaffMember) {
    setEditingStaff(member);
    setForm({
      fullName: member.fullName,
      role: member.role,
      department: member.department,
      shift: member.shift,
      phone: member.phone,
      email: member.email,
      status: member.status,
    });
    setFieldErrors({});
    setSubmitError(null);
    setIsFormOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    const errors = validateStaffInput(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSaving(true);
    try {
      if (editingStaff) {
        await apiFetch(`/api/staff/${editingStaff.id}`, {
          method: 'PUT',
          body: JSON.stringify(form),
        });
      } else {
        await apiFetch('/api/staff', {
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
        setSubmitError('Failed to save staff record.');
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deletingStaff) return;
    setIsDeleting(true);
    try {
      await apiFetch(`/api/staff/${deletingStaff.id}`, { method: 'DELETE' });
      await onRefresh();
      setDeletingStaff(null);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <label htmlFor="staff-search" className="sr-only">
            Search staff
          </label>
          <input
            id="staff-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search staff name, role, or department..."
            className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-md bg-slate-100 p-1" role="group" aria-label="Filter by staff status">
            {(['All', 'Active', 'On Leave'] as const).map((st) => (
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

      {/* Staff Table */}
      <div className="rounded-lg border border-slate-200 bg-white">
        {filteredStaff.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-semibold text-slate-900">No staff members found</p>
            <p className="mt-1 text-xs text-slate-500">Add nurses, technicians, or reception staff to the directory.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-5 py-3">ID</th>
                  <th className="px-5 py-3">Name &amp; Contact</th>
                  <th className="px-5 py-3">Role &amp; Dept</th>
                  <th className="px-5 py-3">Shift</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredStaff.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                      {member.code}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900">{member.fullName}</div>
                      <div className="text-xs text-slate-500">{member.email} · {member.phone}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-slate-800">{member.role}</div>
                      <div className="text-xs text-slate-500">{member.department}</div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600 whitespace-nowrap">{member.shift}</td>
                    <td
                      className={`px-5 py-3.5 text-xs font-semibold whitespace-nowrap ${
                        member.status === 'Active' ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {member.status}
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(member)}
                          aria-label={`Edit ${member.fullName}`}
                          className="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-teal-700"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingStaff(member)}
                          aria-label={`Delete ${member.fullName}`}
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

      {/* Add / Edit Staff Modal */}
      <ModalDialog
        isOpen={isFormOpen}
        title={editingStaff ? `Edit ${editingStaff.fullName}` : 'Add Staff Member'}
        subtitle="Manage nursing, laboratory, pharmacy, and admissions staff."
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
              <label htmlFor="stf-name" className="block text-sm font-medium text-slate-700">
                Full Name
              </label>
              <input
                id="stf-name"
                type="text"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="Priya Menon"
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
              />
              {fieldErrors.fullName && <p className="mt-1 text-xs text-rose-600">{fieldErrors.fullName}</p>}
            </div>

            <div>
              <label htmlFor="stf-role" className="block text-sm font-medium text-slate-700">
                Role
              </label>
              <input
                id="stf-role"
                type="text"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                placeholder="Charge Nurse"
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
              />
              {fieldErrors.role && <p className="mt-1 text-xs text-rose-600">{fieldErrors.role}</p>}
            </div>

            <div>
              <label htmlFor="stf-dept" className="block text-sm font-medium text-slate-700">
                Department
              </label>
              <input
                id="stf-dept"
                type="text"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                placeholder="Critical Care"
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
              />
              {fieldErrors.department && <p className="mt-1 text-xs text-rose-600">{fieldErrors.department}</p>}
            </div>

            <div>
              <label htmlFor="stf-shift" className="block text-sm font-medium text-slate-700">
                Shift
              </label>
              <select
                id="stf-shift"
                value={form.shift}
                onChange={(e) => setForm({ ...form, shift: e.target.value })}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
              >
                {SHIFTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="stf-status" className="block text-sm font-medium text-slate-700">
                Status
              </label>
              <select
                id="stf-status"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
              >
                <option value="Active">Active</option>
                <option value="On Leave">On Leave</option>
              </select>
            </div>

            <div>
              <label htmlFor="stf-phone" className="block text-sm font-medium text-slate-700">
                Phone
              </label>
              <input
                id="stf-phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="9876543210"
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
              />
              {fieldErrors.phone && <p className="mt-1 text-xs text-rose-600">{fieldErrors.phone}</p>}
            </div>

            <div>
              <label htmlFor="stf-email" className="block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="stf-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="staff@mercycare.org"
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
              />
              {fieldErrors.email && <p className="mt-1 text-xs text-rose-600">{fieldErrors.email}</p>}
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
              {isSaving ? 'Saving...' : editingStaff ? 'Update Staff' : 'Save Staff'}
            </button>
          </div>
        </form>
      </ModalDialog>

      <ConfirmDeleteModal
        isOpen={Boolean(deletingStaff)}
        entityLabel="Staff Member"
        itemName={deletingStaff?.fullName ?? ''}
        isDeleting={isDeleting}
        onCancel={() => setDeletingStaff(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
