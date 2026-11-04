const API = 'http://localhost:3000/api';
const token = localStorage.getItem('adminToken');

if (!token) {
    window.location.href = 'login.html';
}

const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
};

// ---- TAB NAVIGATION ----
function showTab(tab, el) {
    ['dashboard', 'pending', 'approved', 'requests'].forEach(t => {
        document.getElementById(t + 'Tab').style.display = 'none';
    });
    document.getElementById(tab + 'Tab').style.display = 'block';

    document.querySelectorAll('.sidebar a').forEach(a => a.classList.remove('active'));
    if (el) el.classList.add('active');

    if (tab === 'dashboard') loadStats();
    if (tab === 'pending') loadPending();
    if (tab === 'approved') loadApproved();
    if (tab === 'requests') loadRequests();
}

// ---- LOGOUT ----
function logout() {
    localStorage.removeItem('adminToken');
    window.location.href = 'login.html';
}

// ---- STATS ----
async function loadStats() {
    try {
        const res = await fetch(`${API}/admin/stats`, { headers });
        if (res.status === 401 || res.status === 403) return logout();
        const s = await res.json();
        document.getElementById('statApproved').textContent = s.totalProviders;
        document.getElementById('statPending').textContent = s.pendingProviders;
        document.getElementById('statRequests').textContent = s.totalRequests;
        document.getElementById('statNew').textContent = s.newRequests;
        document.getElementById('pendingCount').textContent = s.pendingProviders > 0 ? `(${s.pendingProviders})` : '';
    } catch (err) {
        console.error(err);
    }
}

// ---- PENDING ----
async function loadPending() {
    const res = await fetch(`${API}/admin/providers/pending`, { headers });
    const data = await res.json();
    const tbody = document.getElementById('pendingBody');
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty">No pending submissions</td></tr>';
        return;
    }

    data.forEach(p => {
        tbody.innerHTML += `
            <tr>
                <td><b>${p.business_name}</b></td>
                <td>${p.owner_name}</td>
                <td>${p.category_name}</td>
                <td>${p.location}</td>
                <td>${p.whatsapp_number}</td>
                <td>${new Date(p.created_at).toLocaleDateString()}</td>
                <td>
                    <button class="btn-approve" onclick="approve(${p.id})">Approve</button>
                    <button class="btn-reject" onclick="reject(${p.id})">Reject</button>
                </td>
            </tr>
        `;
    });
}

async function approve(id) {
    if (!confirm('Approve this provider? They will appear on the homepage.')) return;
    await fetch(`${API}/admin/providers/${id}/approve`, { method: 'PUT', headers });
    loadPending();
    loadStats();
}

async function reject(id) {
    if (!confirm('Reject this provider?')) return;
    await fetch(`${API}/admin/providers/${id}/reject`, { method: 'PUT', headers });
    loadPending();
    loadStats();
}

// ---- APPROVED ----
async function loadApproved() {
    const res = await fetch(`${API}/admin/providers/approved`, { headers });
    const data = await res.json();
    const tbody = document.getElementById('approvedBody');
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty">No approved providers yet</td></tr>';
        return;
    }

    data.forEach(p => {
        tbody.innerHTML += `
            <tr>
                <td><b>${p.business_name}</b></td>
                <td>${p.category_name}</td>
                <td>${p.location}</td>
                <td>${p.whatsapp_number}</td>
                <td><button class="btn-delete" onclick="deleteProvider(${p.id})">Delete</button></td>
            </tr>
        `;
    });
}

async function deleteProvider(id) {
    if (!confirm('Permanently delete this provider?')) return;
    await fetch(`${API}/admin/providers/${id}`, { method: 'DELETE', headers });
    loadApproved();
    loadStats();
}

// ---- REQUESTS ----
async function loadRequests() {
    const res = await fetch(`${API}/admin/requests`, { headers });
    const data = await res.json();
    const tbody = document.getElementById('requestsBody');
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty">No service requests yet</td></tr>';
        return;
    }

    data.forEach(r => {
        const badgeClass = `badge-${r.status}`;
        tbody.innerHTML += `
            <tr>
                <td>${r.customer_name}</td>
                <td>${r.customer_phone}</td>
                <td>${r.business_name}</td>
                <td>${r.message.substring(0, 50)}${r.message.length > 50 ? '...' : ''}</td>
                <td><span class="badge ${badgeClass}">${r.status}</span></td>
                <td>
                    <select onchange="updateStatus(${r.id}, this.value)" style="padding:5px;border-radius:3px;">
                        <option value="new" ${r.status==='new'?'selected':''}>New</option>
                        <option value="contacted" ${r.status==='contacted'?'selected':''}>Contacted</option>
                        <option value="completed" ${r.status==='completed'?'selected':''}>Completed</option>
                    </select>
                </td>
            </tr>
        `;
    });
}

async function updateStatus(id, status) {
    await fetch(`${API}/admin/requests/${id}/status`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status })
    });
}

// ---- INIT ----
loadStats();