import express, { type NextFunction, type Request, type Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import { HospitalStore } from './server/hospitalStore';

const PORT = Number(process.env.PORT || 3000);
const COOKIE_NAME = 'hms_session';

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const result: Record<string, string> = {};
  if (!cookieHeader) return result;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx > 0) {
      const key = part.slice(0, idx).trim();
      const val = decodeURIComponent(part.slice(idx + 1).trim());
      result[key] = val;
    }
  }
  return result;
}

function extractSessionToken(req: Request): string | undefined {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    return auth.slice(7).trim();
  }
  const cookies = parseCookies(req.headers.cookie);
  return cookies[COOKIE_NAME];
}

async function startServer() {
  const app = express();
  const store = new HospitalStore();

  app.use(express.json());

  const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    const token = extractSessionToken(req);
    const user = store.verifyToken(token);
    if (!user) {
      res.status(401).json({ error: 'Authentication required. Please sign in.' });
      return;
    }
    res.locals.adminUser = user;
    res.locals.sessionToken = token;
    next();
  };

  // Auth routes
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { username, password } = req.body ?? {};
    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required.' });
      return;
    }
    const session = store.authenticate(String(username), String(password));
    if (!session) {
      res.status(401).json({ error: 'Invalid administrator credentials. Please verify your username and password.' });
      return;
    }

    res.setHeader(
      'Set-Cookie',
      `${COOKIE_NAME}=${encodeURIComponent(session.token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`
    );
    res.json({ user: session.user, token: session.token });
  });

  app.get('/api/auth/me', (req: Request, res: Response) => {
    const token = extractSessionToken(req);
    const user = store.verifyToken(token);
    if (!user) {
      res.json({ authenticated: false, user: null });
      return;
    }
    res.json({ authenticated: true, user });
  });

  app.post('/api/auth/logout', (req: Request, res: Response) => {
    const token = extractSessionToken(req);
    store.revokeToken(token);
    res.setHeader(
      'Set-Cookie',
      `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
    );
    res.json({ ok: true });
  });

  // Dashboard
  app.get('/api/dashboard', requireAdmin, (_req: Request, res: Response) => {
    res.json({
      summary: store.getDashboardSummary(),
      doctors: store.listDoctors(),
      patients: store.listPatients(),
      staff: store.listStaff(),
      appointments: store.listAppointments(),
      bills: store.listBills(),
    });
  });

  // Doctors CRUD
  app.get('/api/doctors', requireAdmin, (_req: Request, res: Response) => {
    res.json(store.listDoctors());
  });

  app.post('/api/doctors', requireAdmin, (req: Request, res: Response) => {
    const result = store.createDoctor(req.body);
    if (result.errors) {
      res.status(400).json({ error: 'Validation failed', errors: result.errors });
      return;
    }
    res.status(201).json(result.doctor);
  });

  app.put('/api/doctors/:id', requireAdmin, (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const result = store.updateDoctor(id, req.body);
    if (result.notFound) {
      res.status(404).json({ error: 'Doctor not found' });
      return;
    }
    if (result.errors) {
      res.status(400).json({ error: 'Validation failed', errors: result.errors });
      return;
    }
    res.json(result.doctor);
  });

  app.delete('/api/doctors/:id', requireAdmin, (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const result = store.deleteDoctor(id);
    if (result.conflict) {
      res.status(409).json({ error: result.conflict });
      return;
    }
    if (!result.deleted) {
      res.status(404).json({ error: 'Doctor not found' });
      return;
    }
    res.json({ ok: true });
  });

  // Patients CRUD
  app.get('/api/patients', requireAdmin, (_req: Request, res: Response) => {
    res.json(store.listPatients());
  });

  app.post('/api/patients', requireAdmin, (req: Request, res: Response) => {
    const result = store.createPatient(req.body);
    if (result.errors) {
      res.status(400).json({ error: 'Validation failed', errors: result.errors });
      return;
    }
    res.status(201).json(result.patient);
  });

  app.put('/api/patients/:id', requireAdmin, (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const result = store.updatePatient(id, req.body);
    if (result.notFound) {
      res.status(404).json({ error: 'Patient not found' });
      return;
    }
    if (result.errors) {
      res.status(400).json({ error: 'Validation failed', errors: result.errors });
      return;
    }
    res.json(result.patient);
  });

  app.delete('/api/patients/:id', requireAdmin, (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const result = store.deletePatient(id);
    if (result.conflict) {
      res.status(409).json({ error: result.conflict });
      return;
    }
    if (!result.deleted) {
      res.status(404).json({ error: 'Patient not found' });
      return;
    }
    res.json({ ok: true });
  });

  // Staff CRUD
  app.get('/api/staff', requireAdmin, (_req: Request, res: Response) => {
    res.json(store.listStaff());
  });

  app.post('/api/staff', requireAdmin, (req: Request, res: Response) => {
    const result = store.createStaff(req.body);
    if (result.errors) {
      res.status(400).json({ error: 'Validation failed', errors: result.errors });
      return;
    }
    res.status(201).json(result.staff);
  });

  app.put('/api/staff/:id', requireAdmin, (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const result = store.updateStaff(id, req.body);
    if (result.notFound) {
      res.status(404).json({ error: 'Staff member not found' });
      return;
    }
    if (result.errors) {
      res.status(400).json({ error: 'Validation failed', errors: result.errors });
      return;
    }
    res.json(result.staff);
  });

  app.delete('/api/staff/:id', requireAdmin, (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const deleted = store.deleteStaff(id);
    if (!deleted) {
      res.status(404).json({ error: 'Staff member not found' });
      return;
    }
    res.json({ ok: true });
  });

  // Appointments CRUD
  app.get('/api/appointments', requireAdmin, (_req: Request, res: Response) => {
    res.json(store.listAppointments());
  });

  app.post('/api/appointments', requireAdmin, (req: Request, res: Response) => {
    const result = store.createAppointment(req.body);
    if (result.errors) {
      const status = result.errors.appointmentTime?.includes('already has a scheduled') ? 409 : 400;
      res.status(status).json({ error: 'Validation failed', errors: result.errors });
      return;
    }
    res.status(201).json(result.appointment);
  });

  app.put('/api/appointments/:id', requireAdmin, (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const result = store.updateAppointment(id, req.body);
    if (result.notFound) {
      res.status(404).json({ error: 'Appointment not found' });
      return;
    }
    if (result.errors) {
      const status = result.errors.appointmentTime?.includes('already has a scheduled') ? 409 : 400;
      res.status(status).json({ error: 'Validation failed', errors: result.errors });
      return;
    }
    res.json(result.appointment);
  });

  app.delete('/api/appointments/:id', requireAdmin, (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const deleted = store.deleteAppointment(id);
    if (!deleted) {
      res.status(404).json({ error: 'Appointment not found' });
      return;
    }
    res.json({ ok: true });
  });

  // Billing CRUD & Payment recording
  app.get('/api/bills', requireAdmin, (_req: Request, res: Response) => {
    res.json(store.listBills());
  });

  app.post('/api/bills', requireAdmin, (req: Request, res: Response) => {
    const result = store.createBill(req.body);
    if (result.errors) {
      res.status(400).json({ error: 'Validation failed', errors: result.errors });
      return;
    }
    res.status(201).json(result.bill);
  });

  app.post('/api/bills/:id/pay', requireAdmin, (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const { amount, paymentMethod } = req.body ?? {};
    const result = store.recordBillPayment(id, Number(amount), paymentMethod ?? 'Card');
    if (result.notFound) {
      res.status(404).json({ error: 'Bill not found' });
      return;
    }
    if (result.errors) {
      res.status(400).json({ error: 'Validation failed', errors: result.errors });
      return;
    }
    res.json(result.bill);
  });

  app.delete('/api/bills/:id', requireAdmin, (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const deleted = store.deleteBill(id);
    if (!deleted) {
      res.status(404).json({ error: 'Bill not found' });
      return;
    }
    res.json({ ok: true });
  });

  // Spring Boot & MySQL source files explorer endpoint
  app.get('/api/spring-boot-files', requireAdmin, (_req: Request, res: Response) => {
    const rootDir = path.resolve(process.cwd(), 'spring-boot-hms');
    const files: Array<{ path: string; language: string; content: string }> = [];

    const walk = (dir: string) => {
      if (!fs.existsSync(dir)) return;
      const entries = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(fullPath);
        } else {
          const relPath = path.relative(rootDir, fullPath).replace(/\\/g, '/');
          const ext = path.extname(entry.name).slice(1) || 'text';
          files.push({
            path: relPath,
            language: ext,
            content: fs.readFileSync(fullPath, 'utf-8'),
          });
        }
      }
    };

    walk(rootDir);
    res.json(files);
  });

  // Vite middleware in development, static serve in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MercyCare HMS server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
