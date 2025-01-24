const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require("dotenv").config();
const passport = require("passport");
const session = require("express-session");
const { mongoose } = require("mongoose");
const cookieParser = require("cookie-parser");
const { errorHandler } = require("./middleware/errorHandler");
const converterRoutes = require('./routes/converter.routes');

const app = express();
const PORT = 5000;

//*********** database connection ***********//
// mongoose.connect(process.env.MONGODB_URL, { dbName: "daily-invoice-db", })
//   .then(() => console.log("Database Connected"))
//   .catch((err) => console.log("Database not connected", err));

//*********** middleware ***********//
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));

//*********** Create corsOptions object with your desired configuration ***********//
const corsOptions = {
  origin: ["http://localhost:3000", "http://localhost:5173",],
  methods: "GET,POST,DELETE,PUT", // Set the allowed HTTP methods
  optionsSuccessStatus: 200, // Set the status code for successful preflight requests
};

//*********** Pass corsOptions to the CORS middleware ***********//
app.use(cors({ corsOptions, credentials: true }));


//*********** define routes ***********//
app.use('/api/converter', converterRoutes);

//*********** Error Handling Middleware ***********//
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({ error: 'Internal Server Error' });
})

//*********** Start Server ***********//
app.listen(PORT, () => { console.log(`Server running on http://localhost:${PORT}`); });
