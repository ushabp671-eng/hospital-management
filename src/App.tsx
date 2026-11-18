import React, { useCallback, useEffect, useState } from 'react';
import {
  Calendar,
  Code2,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Stethoscope,
  UserCog,
  Users,
  X,
} from 'lucide-react';
import type {
  AdminUser,
  Appointment,
  Bill,
  DashboardSummary,
  Doctor,
  Patient,
  StaffMember,
} from './types/hospital';
import { apiFetch, getStoredToken, setStoredToken } from './utils/apiClient';
import { LoginScreen } from './components/LoginScreen';
import { DashboardView, type ActiveTab } from './components/DashboardView';
import { DoctorsView } from './components/DoctorsView';
import { PatientsView } from './components/PatientsView';
import { AppointmentsView } from './components/AppointmentsView';
import { BillingView } from './components/BillingView';
import { StaffView } from './components/StaffView';
import { SpringBootSourceView } from './components/SpringBootSourceView';

const NAV_ITEMS: Array<{ id: ActiveTab; label: string; section: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'dashboard', label: 'Dashboard', section: 'Overview', icon: LayoutDashboard },
  { id: 'doctors', label: 'Doctors', section: 'Clinical Staff', icon: Stethoscope },
  { id: 'patients', label: 'Patients', section: 'Patient Registry', icon: Users },
  { id: 'appointments', label: 'Appointments', section: 'Scheduling', icon: Calendar },
  { id: 'billing', label: 'Billing', section: 'Finance', icon: CreditCard },
  { id: 'staff', label: 'Staff', section: 'Operations', icon: UserCog },
  { id: 'source', label: 'Java & MySQL Source', section: 'Architecture', icon: Code2 },
];

export default function App() {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  const [createTriggers, setCreateTriggers] = useState<Record<ActiveTab, number>>({
    dashboard: 0,
    doctors: 0,
    patients: 0,
    appointments: 0,
    billing: 0,
    staff: 0,
    source: 0,
  });

  const loadWorkspaceData = useCallback(async () => {
    setDataLoading(true);
    setDataError(null);
    try {
      const payload = await apiFetch<{
        summary: DashboardSummary;
        doctors: Doctor[];
        patients: Patient[];
        staff: StaffMember[];
        appointments: Appointment[];
        bills: Bill[];
      }>('/api/dashboard');
      setSummary(payload.summary);
      setDoctors(payload.doctors);
      setPatients(payload.patients);
      setStaff(payload.staff);
      setAppointments(payload.appointments);
      setBills(payload.bills);
    } catch (err) {
      setDataError(err instanceof Error ? err.message : 'Unable to load hospital records.');
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams(window.location.search);
    const shouldAutostart = params.get('autostart') === '1';

    async function bootstrapSession() {
      try {
        const existingToken = getStoredToken();
        if (existingToken || !shouldAutostart) {
          const me = await apiFetch<{ authenticated: boolean; user: AdminUser | null }>('/api/auth/me');
          if (active && me.authenticated && me.user) {
            setAdminUser(me.user);
            await loadWorkspaceData();
            return;
          }
        }
      } catch {
        // Not signed in yet
      }

      if (shouldAutostart) {
        try {
          const res = await apiFetch<{ user: AdminUser; token: string }>('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username: 'admin', password: 'Admin@123' }),
          });
          setStoredToken(res.token);
          if (active) {
            setAdminUser(res.user);
            await loadWorkspaceData();
          }
        } catch {
          // Fall back to login screen
        }
      }
      if (active) setAuthChecking(false);
    }

    bootstrapSession().finally(() => {
      if (active) setAuthChecking(false);
    });

    return () => {
      active = false;
    };
  }, [loadWorkspaceData]);

  async function handleLoginSuccess(user: AdminUser) {
    setAdminUser(user);
    setActiveTab('dashboard');
    await loadWorkspaceData();
  }

  async function handleLogout() {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setStoredToken(null);
      setAdminUser(null);
      setSummary(null);
    }
  }

  function handlePrimaryAction() {
    if (activeTab === 'dashboard') {
      setActiveTab('appointments');
      setCreateTriggers((prev) => ({ ...prev, appointments: prev.appointments + 1 }));
      return;
    }
    setCreateTriggers((prev) => ({ ...prev, [activeTab]: prev[activeTab] + 1 }));
  }

  if (authChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-600">
        Loading MercyCare Clinical Workspace...
      </div>
    );
  }

  if (!adminUser) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  const currentNav = NAV_ITEMS.find((item) => item.id === activeTab) ?? NAV_ITEMS[0];

  const primaryActionLabel: Record<ActiveTab, string | null> = {
    dashboard: 'Book Appointment',
    doctors: 'Add Doctor',
    patients: 'Register Patient',
    appointments: 'Book Appointment',
    billing: 'Generate Bill',
    staff: 'Add Staff',
    source: null,
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 lg:flex">
      {/* Mobile Sidebar Backdrop */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
          <span className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
            MercyCare HMS
          </span>
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close navigation menu"
            className="rounded p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav aria-label="Main navigation" className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileNavOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-teal-50 text-teal-800 font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-teal-700' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <img
              src="/src/assets/images/admin_profile_avatar_1794580481275.jpg"
              alt={adminUser.displayName}
              referrerPolicy="no-referrer"
              className="h-9 w-9 shrink-0 rounded-full object-cover border border-slate-200"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">{adminUser.displayName}</p>
              <p className="truncate text-xs text-slate-500">{adminUser.role}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Shell */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation menu"
              className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 truncate">
                {currentNav.section} / <span className="text-slate-800 font-medium">{currentNav.label}</span>
              </p>
              <h1 className="text-lg font-bold tracking-tight text-slate-900 truncate">
                {currentNav.label}
              </h1>
            </div>
          </div>

          {primaryActionLabel[activeTab] && (
            <button
              type="button"
              onClick={handlePrimaryAction}
              className="inline-flex items-center gap-1.5 rounded-md bg-teal-700 px-4 py-2 text-xs sm:text-sm font-semibold text-white transition-colors hover:bg-teal-800 whitespace-nowrap shrink-0"
            >
              <Plus className="h-4 w-4" />
              {primaryActionLabel[activeTab]}
            </button>
          )}
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1280px]">
            {dataError && (
              <div role="alert" className="mb-5 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                {dataError}
              </div>
            )}

            {dataLoading && !summary ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="h-28 animate-pulse rounded-lg border border-slate-200 bg-white p-5" />
                ))}
              </div>
            ) : (
              <>
                {activeTab === 'dashboard' && summary && (
                  <DashboardView
                    summary={summary}
                    doctors={doctors}
                    patients={patients}
                    staff={staff}
                    appointments={appointments}
                    bills={bills}
                    onNavigate={setActiveTab}
                  />
                )}
                {activeTab === 'doctors' && (
                  <DoctorsView
                    doctors={doctors}
                    onRefresh={loadWorkspaceData}
                    externalCreateTrigger={createTriggers.doctors}
                  />
                )}
                {activeTab === 'patients' && (
                  <PatientsView
                    patients={patients}
                    appointments={appointments}
                    bills={bills}
                    doctors={doctors}
                    onRefresh={loadWorkspaceData}
                    externalCreateTrigger={createTriggers.patients}
                  />
                )}
                {activeTab === 'appointments' && (
                  <AppointmentsView
                    appointments={appointments}
                    patients={patients}
                    doctors={doctors}
                    onRefresh={loadWorkspaceData}
                    externalCreateTrigger={createTriggers.appointments}
                  />
                )}
                {activeTab === 'billing' && (
                  <BillingView
                    bills={bills}
                    patients={patients}
                    appointments={appointments}
                    doctors={doctors}
                    onRefresh={loadWorkspaceData}
                    externalCreateTrigger={createTriggers.billing}
                  />
                )}
                {activeTab === 'staff' && (
                  <StaffView
                    staff={staff}
                    onRefresh={loadWorkspaceData}
                    externalCreateTrigger={createTriggers.staff}
                  />
                )}
                {activeTab === 'source' && <SpringBootSourceView />}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
