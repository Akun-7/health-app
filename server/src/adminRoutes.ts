import express from 'express';
import { listPendingDoctors, setVerificationStatus } from './userStore';

// Single shared-secret token, not per-admin auth. Good enough for "only the
// one person who owns this deploy can use it", not a real access-control
// system — see the CLAUDE.md warning next to ADMIN_TOKEN.
function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const adminToken = process.env.ADMIN_TOKEN;
  const provided = req.header('x-admin-token');
  if (!adminToken || provided !== adminToken) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  next();
}

export function createAdminRouter() {
  const router = express.Router();

  router.get('/admin', (_req, res) => {
    res.type('html').send(ADMIN_PAGE_HTML);
  });

  router.get('/api/admin/pending-doctors', requireAdmin, (_req, res) => {
    const doctors = listPendingDoctors().map((u) => ({
      id: u.id,
      email: u.email,
      createdAt: u.createdAt,
      licenseDocumentBase64: u.licenseDocumentBase64,
    }));
    res.json({ doctors });
  });

  router.post('/api/admin/doctors/:id/verify', requireAdmin, (req, res) => {
    const { approved } = req.body ?? {};
    if (typeof approved !== 'boolean') {
      res.status(400).json({ error: 'invalid_input' });
      return;
    }
    const user = setVerificationStatus(req.params.id, approved ? 'approved' : 'rejected');
    if (!user) {
      res.status(404).json({ error: 'not_found' });
      return;
    }
    res.json({ ok: true });
  });

  return router;
}

// Plain, unstyled admin page — deliberately minimal, meant for one person
// (the project owner) to eyeball license photos and approve/reject doctors.
const ADMIN_PAGE_HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>HealthTrack Admin</title>
</head>
<body>
<h1>Pending doctor verifications</h1>
<p>
  Admin token: <input id="token" type="password" style="width:300px">
  <button id="load">Load</button>
</p>
<div id="status"></div>
<div id="list"></div>
<script>
function headers() {
  return { 'x-admin-token': document.getElementById('token').value, 'Content-Type': 'application/json' };
}

async function load() {
  const status = document.getElementById('status');
  const list = document.getElementById('list');
  status.textContent = 'Loading...';
  list.innerHTML = '';
  const res = await fetch('/api/admin/pending-doctors', { headers: headers() });
  if (!res.ok) {
    status.textContent = 'Failed to load (' + res.status + '). Check token.';
    return;
  }
  const data = await res.json();
  status.textContent = data.doctors.length + ' pending';
  data.doctors.forEach((doctor) => {
    const row = document.createElement('div');
    row.style.border = '1px solid #ccc';
    row.style.padding = '12px';
    row.style.margin = '12px 0';

    const email = document.createElement('div');
    email.textContent = doctor.email + ' (' + new Date(doctor.createdAt).toLocaleString() + ')';
    row.appendChild(email);

    if (doctor.licenseDocumentBase64) {
      const img = document.createElement('img');
      img.src = doctor.licenseDocumentBase64;
      img.style.maxWidth = '400px';
      img.style.display = 'block';
      row.appendChild(img);
    }

    const approveBtn = document.createElement('button');
    approveBtn.textContent = 'Approve';
    approveBtn.onclick = () => verify(doctor.id, true);
    row.appendChild(approveBtn);

    const rejectBtn = document.createElement('button');
    rejectBtn.textContent = 'Reject';
    rejectBtn.onclick = () => verify(doctor.id, false);
    row.appendChild(rejectBtn);

    list.appendChild(row);
  });
}

async function verify(id, approved) {
  const res = await fetch('/api/admin/doctors/' + id + '/verify', {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ approved }),
  });
  if (res.ok) {
    load();
  } else {
    alert('Failed (' + res.status + ')');
  }
}

document.getElementById('load').addEventListener('click', load);
</script>
</body>
</html>`;
