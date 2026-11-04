const express = require('express');
const router = express.Router();
const db = require('../db');

// PUBLIC: Get all approved providers
router.get('/', (req, res) => {
    const sql = `
        SELECT p.*, c.name AS category_name, c.icon AS category_icon
        FROM providers p
        JOIN categories c ON p.category_id = c.id
        WHERE p.status = 'approved'
        ORDER BY p.is_verified DESC, p.rating DESC
    `;
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(result);
    });
});

// PUBLIC: Get single provider by ID
router.get('/:id', (req, res) => {
    const sql = `
        SELECT p.*, c.name AS category_name
        FROM providers p
        JOIN categories c ON p.category_id = c.id
        WHERE p.id = ? AND p.status = 'approved'
    `;
    db.query(sql, [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.length === 0) return res.status(404).json({ error: 'Provider not found' });
        res.json(result[0]);
    });
});

// PUBLIC: Get all categories
router.get('/meta/categories', (req, res) => {
    db.query("SELECT * FROM categories", (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(result);
    });
});

// PUBLIC: Provider submits business (no login)
router.post('/submit', (req, res) => {
    const {
        business_name, owner_name, category_id, location,
        phone, whatsapp_number, email, description
    } = req.body;

    // Validation
    if (!business_name || !owner_name || !category_id || !location || !phone || !whatsapp_number) {
        return res.status(400).json({ error: 'Please fill all required fields' });
    }

    const sql = `
        INSERT INTO providers 
        (business_name, owner_name, category_id, location, phone, whatsapp_number, email, description, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `;

    db.query(sql, [business_name, owner_name, category_id, location, phone, whatsapp_number, email, description],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({
                message: 'Business submitted successfully! We will review and approve it shortly.',
                id: result.insertId
            });
        });
});

module.exports = router;