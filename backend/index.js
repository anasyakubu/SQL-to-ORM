const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const converterRoutes = require('./routes/converter.routes');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/api/converter', converterRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({ error: 'Internal Server Error' });
})

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
