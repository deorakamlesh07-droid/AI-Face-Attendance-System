import nodemailer from "nodemailer";
import { env } from "../config/env.js";

const transporter = nodemailer.createTransport({
  host: env.smtpHost,
  port: env.smtpPort,
  secure: env.smtpPort === 465,
  auth: env.smtpUser ? { user: env.smtpUser, pass: env.smtpPass } : undefined
});

export const sendEmail = async ({ to, subject, html }) => {
  if (!to) {
    return;
  }

  await transporter.sendMail({
    from: env.smtpFrom,
    to,
    subject,
    html
  });
};
