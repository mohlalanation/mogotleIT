const express = require('express');
const router = express.Router();
const db = require('../db');

// PUBLIC: Customer submits a service request
router.post('/', (req, res) => {
    const { provider_id, customer_name, customer_phone, customer_email, message } = req.body;

    if (!provider_id || !customer_name || !customer_phone || !message) {
        return res.status(400).json({ error: 'Please fill all required fields' });
    }

    // Verify provider exists and is approved
    db.query("SELECT id FROM providers WHERE id = ? AND status = 'approved'", [provider_id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.length === 0) return res.status(404).json({ error: 'Provider not available' });

        const sql = `
            INSERT INTO service_requests 
            (provider_id, customer_name, customer_phone, customer_email, message)
            VALUES (?, ?, ?, ?, ?)
        `;
        db.query(sql, [provider_id, customer_name, customer_phone, customer_email, message], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ message: 'Request sent! The provider will contact you soon.' });
        });
    });
});

module.exports = router;