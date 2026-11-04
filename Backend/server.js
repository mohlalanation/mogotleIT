const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const providersRouter = require('./Routes/providers');
const requestsRouter = require('./Routes/requests');
const adminRouter = require('./Routes/admin');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api/providers', providersRouter);
app.use('/api/requests', requestsRouter);
app.use('/api/admin', adminRouter);

// Health check
app.get('/', (req, res) => {
    res.json({ message: 'MogotelT API is running ✅' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});