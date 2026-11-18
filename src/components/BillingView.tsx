import React, { useMemo, useState } from 'react';
import { CreditCard, Plus, Printer, Receipt, Search, Trash2 } from 'lucide-react';
import type {
  Appointment,
  Bill,
  Doctor,
  Patient,
  PaymentMethod,
  PaymentStatus,
  ValidationErrors,
} from '../types/hospital';
import { apiFetch, ApiError } from '../utils/apiClient';
import {
  calculateBillTotals,
  formatCurrency,
  validateBillInput,
  validatePaymentRecord,
  type BillCreateInput,
} from '../utils/hospitalLogic';
import { ConfirmDeleteModal, ModalDialog } from './ModalDialog';

interface BillingViewProps {
  bills: Bill[];
  patients: Patient[];
  appointments: Appointment[];
  doctors: Doctor[];
  onRefresh: () => Promise<void>;
  externalCreateTrigger?: number;
}

const PAYMENT_METHODS: PaymentMethod[] = ['Card', 'Cash', 'UPI / Transfer', 'Insurance'];

function paymentStatusClass(status: PaymentStatus): string {
  switch (status) {
    case 'Paid':
      return 'text-emerald-700';
    case 'Partial':
      return 'text-amber-700';
    case 'Pending':
      return 'text-rose-700';
  }
}

export function BillingView({
  bills,
  patients,
  appointments,
  doctors,
  onRefresh,
  externalCreateTrigger,
}: BillingViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | PaymentStatus>('All');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [payingBill, setPayingBill] = useState<Bill | null>(null);
  const [receiptBill, setReceiptBill] = useState<Bill | null>(null);
  const [deletingBill, setDeletingBill] = useState<Bill | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [form, setForm] = useState<BillCreateInput>({
    patientId: patients[0]?.id ?? 0,
    appointmentId: null,
    consultationFee: 150,
    labCharges: 0,
    medicationCharges: 0,
    roomCharges: 0,
    discount: 0,
    paidAmount: 0,
    paymentMethod: 'Card',
    billingDate: '2026-11-13',
    notes: '',
  });
  const [fieldErrors, setFieldErrors] = useState<ValidationErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Card');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);

  React.useEffect(() => {
    if (externalCreateTrigger && externalCreateTrigger > 0) {
      openCreateModal();
    }
  }, [externalCreateTrigger]);

  const patientMap = useMemo(() => new Map(patients.map((p) => [p.id, p])), [patients]);
  const doctorMap = useMemo(() => new Map(doctors.map((d) => [d.id, d])), [doctors]);
  const appointmentMap = useMemo(() => new Map(appointments.map((a) => [a.id, a])), [appointments]);

  const totalsSummary = useMemo(() => {
    const totalBilled = bills.reduce((sum, b) => sum + b.totalAmount, 0);
    const collected = bills.reduce((sum, b) => sum + b.paidAmount, 0);
    const pending = Math.max(0, totalBilled - collected);
    return { totalBilled, collected, pending };
  }, [bills]);

  const filteredBills = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return bills.filter((b) => {
      if (statusFilter !== 'All' && b.paymentStatus !== statusFilter) return false;
      if (!q) return true;
      const patientName = patientMap.get(b.patientId)?.fullName.toLowerCase() ?? '';
      return b.invoiceNumber.toLowerCase().includes(q) || patientName.includes(q);
    });
  }, [bills, statusFilter, searchQuery, patientMap]);

  const livePreview = useMemo(() => calculateBillTotals(form), [form]);

  const patientAppointments = useMemo(
    () => appointments.filter((a) => a.patientId === form.patientId),
    [appointments, form.patientId]
  );

  function openCreateModal() {
    const firstPatient = patients[0];
    setForm({
      patientId: firstPatient?.id ?? 0,
      appointmentId: null,
      consultationFee: 150,
      labCharges: 0,
      medicationCharges: 0,
      roomCharges: 0,
      discount: 0,
      paidAmount: 0,
      paymentMethod: 'Card',
      billingDate: '2026-11-13',
      notes: '',
    });
    setFieldErrors({});
    setSubmitError(null);
    setIsCreateOpen(true);
  }

  function handleAppointmentLink(appointmentIdRaw: string) {
    const apptId = appointmentIdRaw ? Number(appointmentIdRaw) : null;
    if (!apptId) {
      setForm((prev) => ({ ...prev, appointmentId: null }));
      return;
    }
    const appt = appointmentMap.get(apptId);
    const doc = appt ? doctorMap.get(appt.doctorId) : undefined;
    setForm((prev) => ({
      ...prev,
      appointmentId: apptId,
      consultationFee: doc ? doc.consultationFee : prev.consultationFee,
    }));
  }

  async function handleCreateBill(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    const errors = validateBillInput(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSaving(true);
    try {
      await apiFetch('/api/bills', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      await onRefresh();
      setIsCreateOpen(false);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.fieldErrors) setFieldErrors(err.fieldErrors);
        setSubmitError(err.message);
      } else {
        setSubmitError('Failed to generate patient bill.');
      }
    } finally {
      setIsSaving(false);
    }
  }

  function openPaymentModal(bill: Bill) {
    const remaining = Math.max(0, Math.round((bill.totalAmount - bill.paidAmount) * 100) / 100);
    setPayingBill(bill);
    setPaymentAmount(remaining);
    setPaymentMethod(bill.paymentMethod);
    setPaymentError(null);
  }

  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!payingBill) return;
    setPaymentError(null);
    const errors = validatePaymentRecord(payingBill, paymentAmount);
    if (errors.amount) {
      setPaymentError(errors.amount);
      return;
    }

    setIsRecordingPayment(true);
    try {
      await apiFetch(`/api/bills/${payingBill.id}/pay`, {
        method: 'POST',
        body: JSON.stringify({ amount: paymentAmount, paymentMethod }),
      });
      await onRefresh();
      setPayingBill(null);
    } catch (err) {
      setPaymentError(err instanceof ApiError ? err.message : 'Unable to record payment.');
    } finally {
      setIsRecordingPayment(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deletingBill) return;
    setIsDeleting(true);
    try {
      await apiFetch(`/api/bills/${deletingBill.id}`, { method: 'DELETE' });
      await onRefresh();
      setDeletingBill(null);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* 3-Column Financial Summary */}
      <section aria-label="Billing summary" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Total Billed</p>
          <p className="mt-1.5 text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {formatCurrency(totalsSummary.totalBilled)}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Collected Revenue</p>
          <p className="mt-1.5 text-2xl font-bold text-emerald-700 font-mono tabular-nums">
            {formatCurrency(totalsSummary.collected)}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Pending Balance</p>
          <p className="mt-1.5 text-2xl font-bold text-rose-700 font-mono tabular-nums">
            {formatCurrency(totalsSummary.pending)}
          </p>
        </div>
      </section>

      {/* Toolbar */}
      <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <label htmlFor="bill-search" className="sr-only">
            Search invoices
          </label>
          <input
            id="bill-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search invoice # or patient name..."
            className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-md bg-slate-100 p-1" role="group" aria-label="Filter by payment status">
            {(['All', 'Paid', 'Partial', 'Pending'] as const).map((st) => (
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

      {/* Bills Table */}
      <div className="rounded-lg border border-slate-200 bg-white">
        {filteredBills.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-semibold text-slate-900">No invoices match your filter</p>
            <p className="mt-1 text-xs text-slate-500">Generate a patient invoice to start tracking payments.</p>
            <button
              type="button"
              onClick={openCreateModal}
              className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
            >
              <Plus className="h-4 w-4" />
              Generate Bill
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-5 py-3">Invoice</th>
                  <th className="px-5 py-3">Patient</th>
                  <th className="px-5 py-3">Date &amp; Method</th>
                  <th className="px-5 py-3 text-right">Total</th>
                  <th className="px-5 py-3 text-right">Paid</th>
                  <th className="px-5 py-3 text-right">Balance</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredBills.map((bill) => {
                  const patient = patientMap.get(bill.patientId);
                  const balance = Math.max(0, bill.totalAmount - bill.paidAmount);
                  return (
                    <tr key={bill.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-3.5 font-mono text-xs font-medium text-slate-700 tabular-nums whitespace-nowrap">
                        {bill.invoiceNumber}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-900">{patient?.fullName ?? 'Unknown Patient'}</div>
                        <div className="text-xs text-slate-500 truncate max-w-[200px]">
                          {bill.notes || 'Standard clinical invoice'}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-600 whitespace-nowrap">
                        <span className="font-mono tabular-nums">{bill.billingDate}</span> · {bill.paymentMethod}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono text-xs font-medium text-slate-900 tabular-nums whitespace-nowrap">
                        {formatCurrency(bill.totalAmount)}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono text-xs text-emerald-700 tabular-nums whitespace-nowrap">
                        {formatCurrency(bill.paidAmount)}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono text-xs text-slate-700 tabular-nums whitespace-nowrap">
                        {formatCurrency(balance)}
                      </td>
                      <td className={`px-5 py-3.5 text-xs font-semibold whitespace-nowrap ${paymentStatusClass(bill.paymentStatus)}`}>
                        {bill.paymentStatus}
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          {bill.paymentStatus !== 'Paid' && (
                            <button
                              type="button"
                              onClick={() => openPaymentModal(bill)}
                              aria-label={`Record payment for ${bill.invoiceNumber}`}
                              className="inline-flex items-center gap-1 rounded bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-800 hover:bg-teal-100"
                            >
                              <CreditCard className="h-3.5 w-3.5" />
                              Pay
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setReceiptBill(bill)}
                            aria-label={`View receipt ${bill.invoiceNumber}`}
                            className="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                          >
                            <Receipt className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingBill(bill)}
                            aria-label={`Delete ${bill.invoiceNumber}`}
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

      {/* Generate Bill Modal */}
      <ModalDialog
        isOpen={isCreateOpen}
        title="Generate Patient Bill"
        subtitle="Itemize consultation, diagnostics, medication, and room charges."
        onClose={() => setIsCreateOpen(false)}
        maxWidthClass="max-w-2xl"
      >
        <form onSubmit={handleCreateBill} className="space-y-4" noValidate>
          {submitError && (
            <div role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
              {submitError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="bill-patient" className="block text-sm font-medium text-slate-700">
                Patient
              </label>
              <select
                id="bill-patient"
                value={form.patientId}
                onChange={(e) => setForm({ ...form, patientId: Number(e.target.value), appointmentId: null })}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
              >
                <option value={0}>Select patient...</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} ({p.code})
                  </option>
                ))}
              </select>
              {fieldErrors.patientId && <p className="mt-1 text-xs text-rose-600">{fieldErrors.patientId}</p>}
            </div>

            <div>
              <label htmlFor="bill-appt" className="block text-sm font-medium text-slate-700">
                Linked Appointment (Optional)
              </label>
              <select
                id="bill-appt"
                value={form.appointmentId ?? ''}
                onChange={(e) => handleAppointmentLink(e.target.value)}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
              >
                <option value="">None (Walk-in / Standalone)</option>
                {patientAppointments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.code} · {a.appointmentDate} ({a.reason})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="bill-consult" className="block text-sm font-medium text-slate-700">
                Consultation Fee ($)
              </label>
              <input
                id="bill-consult"
                type="number"
                min="0"
                step="0.01"
                value={form.consultationFee}
                onChange={(e) => setForm({ ...form, consultationFee: Number(e.target.value) })}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums focus:border-teal-600 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="bill-lab" className="block text-sm font-medium text-slate-700">
                Lab &amp; Diagnostics ($)
              </label>
              <input
                id="bill-lab"
                type="number"
                min="0"
                step="0.01"
                value={form.labCharges}
                onChange={(e) => setForm({ ...form, labCharges: Number(e.target.value) })}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums focus:border-teal-600 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="bill-meds" className="block text-sm font-medium text-slate-700">
                Medication Charges ($)
              </label>
              <input
                id="bill-meds"
                type="number"
                min="0"
                step="0.01"
                value={form.medicationCharges}
                onChange={(e) => setForm({ ...form, medicationCharges: Number(e.target.value) })}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums focus:border-teal-600 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="bill-room" className="block text-sm font-medium text-slate-700">
                Room &amp; Procedure ($)
              </label>
              <input
                id="bill-room"
                type="number"
                min="0"
                step="0.01"
                value={form.roomCharges}
                onChange={(e) => setForm({ ...form, roomCharges: Number(e.target.value) })}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums focus:border-teal-600 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="bill-discount" className="block text-sm font-medium text-slate-700">
                Discount ($)
              </label>
              <input
                id="bill-discount"
                type="number"
                min="0"
                step="0.01"
                value={form.discount}
                onChange={(e) => setForm({ ...form, discount: Number(e.target.value) })}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums focus:border-teal-600 focus:outline-none"
              />
              {fieldErrors.discount && <p className="mt-1 text-xs text-rose-600">{fieldErrors.discount}</p>}
            </div>

            <div>
              <label htmlFor="bill-paid" className="block text-sm font-medium text-slate-700">
                Initial Payment Received ($)
              </label>
              <input
                id="bill-paid"
                type="number"
                min="0"
                step="0.01"
                value={form.paidAmount}
                onChange={(e) => setForm({ ...form, paidAmount: Number(e.target.value) })}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums focus:border-teal-600 focus:outline-none"
              />
              {fieldErrors.paidAmount && <p className="mt-1 text-xs text-rose-600">{fieldErrors.paidAmount}</p>}
            </div>

            <div>
              <label htmlFor="bill-method" className="block text-sm font-medium text-slate-700">
                Payment Method
              </label>
              <select
                id="bill-method"
                value={form.paymentMethod}
                onChange={(e) => setForm({ ...form, paymentMethod: e.target.value as PaymentMethod })}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="bill-date" className="block text-sm font-medium text-slate-700">
                Billing Date
              </label>
              <input
                id="bill-date"
                type="date"
                value={form.billingDate}
                onChange={(e) => setForm({ ...form, billingDate: e.target.value })}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono focus:border-teal-600 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="bill-notes" className="block text-sm font-medium text-slate-700">
                Billing Notes
              </label>
              <input
                id="bill-notes"
                type="text"
                value={form.notes ?? ''}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Consultation & diagnostic panel summary"
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
              />
            </div>
          </div>

          {fieldErrors.charges && <p className="text-xs text-rose-600">{fieldErrors.charges}</p>}

          {/* Calculated Summary Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-md bg-slate-50 px-4 py-3 text-sm">
            <div>
              <span className="text-slate-500">Invoice Total:</span>{' '}
              <strong className="font-mono text-slate-900 tabular-nums">
                {formatCurrency(livePreview.totalAmount)}
              </strong>
            </div>
            <div>
              <span className="text-slate-500">Balance Due:</span>{' '}
              <strong className="font-mono text-slate-900 tabular-nums">
                {formatCurrency(livePreview.balanceDue)}
              </strong>
            </div>
            <div className={`text-xs font-semibold ${paymentStatusClass(livePreview.paymentStatus)}`}>
              Status: {livePreview.paymentStatus}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
            >
              {isSaving ? 'Generating...' : 'Generate Invoice'}
            </button>
          </div>
        </form>
      </ModalDialog>

      {/* Record Payment Modal */}
      <ModalDialog
        isOpen={Boolean(payingBill)}
        title={payingBill ? `Record Payment · ${payingBill.invoiceNumber}` : 'Record Payment'}
        subtitle={
          payingBill
            ? `Patient: ${patientMap.get(payingBill.patientId)?.fullName ?? 'Unknown'}`
            : undefined
        }
        onClose={() => setPayingBill(null)}
        maxWidthClass="max-w-md"
      >
        {payingBill && (
          <form onSubmit={handleRecordPayment} className="space-y-4">
            <div className="grid grid-cols-3 gap-2 rounded-md bg-slate-50 p-3 text-xs">
              <div>
                <span className="text-slate-500">Total</span>
                <div className="mt-0.5 font-mono font-semibold text-slate-900 tabular-nums">
                  {formatCurrency(payingBill.totalAmount)}
                </div>
              </div>
              <div>
                <span className="text-slate-500">Paid</span>
                <div className="mt-0.5 font-mono font-semibold text-emerald-700 tabular-nums">
                  {formatCurrency(payingBill.paidAmount)}
                </div>
              </div>
              <div>
                <span className="text-slate-500">Remaining</span>
                <div className="mt-0.5 font-mono font-semibold text-rose-700 tabular-nums">
                  {formatCurrency(Math.max(0, payingBill.totalAmount - payingBill.paidAmount))}
                </div>
              </div>
            </div>

            {paymentError && (
              <div role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                {paymentError}
              </div>
            )}

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="pay-amount" className="block text-sm font-medium text-slate-700">
                  Payment Amount ($)
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setPaymentAmount(Math.max(0, Math.round((payingBill.totalAmount - payingBill.paidAmount) * 100) / 100))
                  }
                  className="text-xs font-medium text-teal-700 hover:text-teal-800"
                >
                  Pay Full Balance
                </button>
              </div>
              <input
                id="pay-amount"
                type="number"
                min="0.01"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums focus:border-teal-600 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="pay-method" className="block text-sm font-medium text-slate-700">
                Payment Method
              </label>
              <select
                id="pay-method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={() => setPayingBill(null)}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isRecordingPayment}
                className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
              >
                {isRecordingPayment ? 'Recording...' : 'Confirm Payment'}
              </button>
            </div>
          </form>
        )}
      </ModalDialog>

      {/* Invoice Receipt Modal */}
      <ModalDialog
        isOpen={Boolean(receiptBill)}
        title={receiptBill ? `Invoice Receipt · ${receiptBill.invoiceNumber}` : 'Invoice Receipt'}
        subtitle="MercyCare Hospital Clinical Billing Statement"
        onClose={() => setReceiptBill(null)}
        maxWidthClass="max-w-lg"
      >
        {receiptBill && (
          <div className="space-y-4 text-sm">
            <div className="flex justify-between border-b border-slate-200 pb-3">
              <div>
                <p className="text-xs text-slate-500">Billed To</p>
                <p className="font-semibold text-slate-900">
                  {patientMap.get(receiptBill.patientId)?.fullName ?? 'Unknown Patient'}
                </p>
                <p className="text-xs text-slate-500">
                  {patientMap.get(receiptBill.patientId)?.code} · {patientMap.get(receiptBill.patientId)?.phone}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Billing Date</p>
                <p className="font-mono text-xs font-medium text-slate-900 tabular-nums">{receiptBill.billingDate}</p>
                <p className={`mt-1 text-xs font-semibold ${paymentStatusClass(receiptBill.paymentStatus)}`}>
                  {receiptBill.paymentStatus} ({receiptBill.paymentMethod})
                </p>
              </div>
            </div>

            <dl className="space-y-2 border-b border-slate-200 pb-3">
              <div className="flex justify-between">
                <dt className="text-slate-600">Consultation Fee</dt>
                <dd className="font-mono tabular-nums">{formatCurrency(receiptBill.consultationFee)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600">Lab &amp; Diagnostics</dt>
                <dd className="font-mono tabular-nums">{formatCurrency(receiptBill.labCharges)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600">Medications</dt>
                <dd className="font-mono tabular-nums">{formatCurrency(receiptBill.medicationCharges)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600">Room &amp; Procedures</dt>
                <dd className="font-mono tabular-nums">{formatCurrency(receiptBill.roomCharges)}</dd>
              </div>
              {receiptBill.discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <dt>Discount</dt>
                  <dd className="font-mono tabular-nums">-{formatCurrency(receiptBill.discount)}</dd>
                </div>
              )}
            </dl>

            <dl className="space-y-1.5">
              <div className="flex justify-between font-semibold text-slate-900">
                <dt>Total Invoice Amount</dt>
                <dd className="font-mono tabular-nums">{formatCurrency(receiptBill.totalAmount)}</dd>
              </div>
              <div className="flex justify-between text-emerald-700">
                <dt>Amount Paid</dt>
                <dd className="font-mono tabular-nums">{formatCurrency(receiptBill.paidAmount)}</dd>
              </div>
              <div className="flex justify-between font-semibold text-slate-900">
                <dt>Balance Due</dt>
                <dd className="font-mono tabular-nums">
                  {formatCurrency(Math.max(0, receiptBill.totalAmount - receiptBill.paidAmount))}
                </dd>
              </div>
            </dl>

            <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Printer className="h-4 w-4" />
                Print Statement
              </button>
              <button
                type="button"
                onClick={() => setReceiptBill(null)}
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </ModalDialog>

      <ConfirmDeleteModal
        isOpen={Boolean(deletingBill)}
        entityLabel="Invoice"
        itemName={deletingBill?.invoiceNumber ?? ''}
        isDeleting={isDeleting}
        onCancel={() => setDeletingBill(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
