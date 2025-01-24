const nodemailer = require("nodemailer");

let transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  auth: { user: process.env.AUTH_EMAIL, pass: process.env.AUTH_PASS, },
});

transporter.verify((error, success) => {
  if (error) { console.error("Connection to Mailtrap failed:", error); }
  else { console.log("Connection to Mailtrap succeeded:", success); }
});

const send = transporter;

module.exports = send;
