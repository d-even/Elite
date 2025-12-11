const nodemailer = require("nodemailer");

// Replace with your email and app password (or other SMTP)
const TRANSPORTER_CONFIG = {
  service: "gmail",
  auth: {
    user: "devensawant4554@gmail.com.com",       // <-- replace
    pass: "MumbaiS1$"           // <-- replace (app password)
  }
};

const transporter = nodemailer.createTransport(TRANSPORTER_CONFIG);

async function sendEmail(to, subject, text) {
  if (!to) return;
  try {
    await transporter.sendMail({
      from: TRANSPORTER_CONFIG.auth.user,
      to,
      subject,
      text
    });
  } catch (err) {
    console.error("Failed to send email:", err);
  }
}

module.exports = { sendEmail };
