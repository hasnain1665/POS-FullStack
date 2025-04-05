const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

exports.sendResetPasswordEmail = async (email, resetToken) => {
  const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;

  const mailOptions = {
    from: `"POS App" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Password Reset Request",
    html: `<p>You requested to reset your password. Click the link below:</p>
           <a href="${resetUrl}">Reset Password</a>
           <p>This link will expire in ${process.env.RESET_PASSWORD_EXPIRY}.</p>`,
  };

  await transporter.sendMail(mailOptions);
};
