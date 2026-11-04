const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware: Verify admin token
function verifyAdmin(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.admin = decoded;
        next();
    });
}

// ADMIN LOGIN
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.query("SELECT * FROM admins WHERE username = ?", [username], async (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.length === 0) return res.status(400).json({ error: 'Invalid credentials' });

        const admin = result[0];
        const isMatch = await bcrypt.compare(password, admin.password_hash);
        if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: admin.id, username: admin.username }, JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, username: admin.username });
    });
});

// PROTECTED: Get dashboard stats
router.get('/stats', verifyAdmin, (req, res) => {
    const queries = {
        totalProviders: "SELECT COUNT(*) AS count FROM providers WHERE status = 'approved'",
        pendingProviders: "SELECT COUNT(*) AS count FROM providers WHERE status = 'pending'",
        totalRequests: "SELECT COUNT(*) AS count FROM service_requests",
        newRequests: "SELECT COUNT(*) AS count FROM service_requests WHERE status = 'new'"
    };

    const stats = {};
    const keys = Object.keys(queries);
    let completed = 0;

    keys.forEach(key => {
        db.query(queries[key], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            stats[key] = result[0].count;
            completed++;
            if (completed === keys.length) res.json(stats);
        });
    });
});

// PROTECTED: Get pending providers
router.get('/providers/pending', verifyAdmin, (req, res) => {
    const sql = `
        SELECT p.*, c.name AS category_name
        FROM providers p
        JOIN categories c ON p.category_id = c.id
        WHERE p.status = 'pending'
        ORDER BY p.created_at DESC
    `;
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(result);
    });
});

// PROTECTED: Get all approved providers
router.get('/providers/approved', verifyAdmin, (req, res) => {
    const sql = `
        SELECT p.*, c.name AS category_name
        FROM providers p
        JOIN categories c ON p.category_id = c.id
        WHERE p.status = 'approved'
        ORDER BY p.created_at DESC
    `;
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(result);
    });
});

// PROTECTED: Approve provider
router.put('/providers/:id/approve', verifyAdmin, (req, res) => {
    db.query("UPDATE providers SET status = 'approved', is_verified = TRUE WHERE id = ?",
        [req.params.id],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Provider approved and now live' });
        });
});

// PROTECTED: Reject provider
router.put('/providers/:id/reject', verifyAdmin, (req, res) => {
    db.query("UPDATE providers SET status = 'rejected' WHERE id = ?",
        [req.params.id],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Provider rejected' });
        });
});

// PROTECTED: Delete provider
router.delete('/providers/:id', verifyAdmin, (req, res) => {
    db.query("DELETE FROM providers WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Provider deleted' });
    });
});

// PROTECTED: Get all service requests
router.get('/requests', verifyAdmin, (req, res) => {
    const sql = `
        SELECT r.*, p.business_name, p.whatsapp_number
        FROM service_requests r
        JOIN providers p ON r.provider_id = p.id
        ORDER BY r.created_at DESC
    `;
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(result);
    });
});

// PROTECTED: Update request status
router.put('/requests/:id/status', verifyAdmin, (req, res) => {
    const { status } = req.body;
    db.query("UPDATE service_requests SET status = ? WHERE id = ?",
        [status, req.params.id],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Status updated' });
        });
});

module.exports = router;
module.exports.verifyAdmin = verifyAdmin;