const nodemailer = require('nodemailer');

const ENV_KEYS = {
  host: ['SMTP_HOST', 'EMAIL_HOST', 'MAIL_HOST'],
  port: ['SMTP_PORT', 'EMAIL_PORT', 'MAIL_PORT'],
  user: ['SMTP_USER', 'EMAIL_USER', 'MAIL_USER'],
  pass: ['SMTP_PASS', 'EMAIL_PASS', 'MAIL_PASS'],
  service: ['SMTP_SERVICE', 'EMAIL_SERVICE', 'MAIL_SERVICE'],
  secure: ['SMTP_SECURE', 'EMAIL_SECURE', 'MAIL_SECURE'],
  from: ['MAIL_FROM', 'SMTP_FROM', 'EMAIL_FROM'],
  fromName: ['MAIL_FROM_NAME', 'SMTP_FROM_NAME', 'EMAIL_FROM_NAME']
};

let missingConfigLogged = false;

function pickEnv(keys) {
  for (const key of keys) {
    const raw = process.env[key];
    if (raw === undefined || raw === null) continue;
    const value = typeof raw === 'string' ? raw.trim() : raw;
    if (value !== '') return value;
  }
  return undefined;
}

function toBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return undefined;
}

function resolveTransportConfig() {
  const service = pickEnv(ENV_KEYS.service);
  const host = pickEnv(ENV_KEYS.host);
  const port = pickEnv(ENV_KEYS.port);
  const user = pickEnv(ENV_KEYS.user);
  const pass = pickEnv(ENV_KEYS.pass);
  const secureRaw = pickEnv(ENV_KEYS.secure);
  const secureFlag = toBoolean(secureRaw);

  if (service && user && pass) {
    const transport = {
      service,
      auth: { user, pass }
    };
    if (secureFlag !== undefined) transport.secure = secureFlag;
    return { transport, sender: user };
  }

  if (host && port && user && pass) {
    const numericPort = Number(port);
    if (Number.isNaN(numericPort)) return null;
    const transport = {
      host,
      port: numericPort,
      secure: secureFlag !== undefined ? secureFlag : numericPort === 465,
      auth: { user, pass }
    };
    return { transport, sender: user };
  }

  return null;
}

// Builds a transporter from environment variables. If not configured, returns null.
function buildTransporter() {
  const resolved = resolveTransportConfig();
  if (!resolved) {
    if (!missingConfigLogged) {
      missingConfigLogged = true;
      console.warn(
        '[mailer] SMTP credentials missing. Set SMTP_HOST/PORT/USER/PASS (or EMAIL_/MAIL_ equivalents) to enable transactional emails.'
      );
    }
    return null;
  }

  try {
    return {
      transporter: nodemailer.createTransport(resolved.transport),
      sender: resolved.sender
    };
  } catch (err) {
    console.error('[mailer] Failed to create SMTP transporter', err);
    return null;
  }
}

function resolveFromAddress(preferredSender) {
  const manualFrom = pickEnv(ENV_KEYS.from);
  if (manualFrom) return manualFrom;

  const fromName = pickEnv(ENV_KEYS.fromName) || 'MegaMart';
  const senderEmail = preferredSender || pickEnv(ENV_KEYS.user);

  if (senderEmail) return `${fromName} <${senderEmail}>`;
  return `${fromName} <no-reply@megamart.local>`;
}

async function sendMail({ to, subject, text, html }) {
  let built = buildTransporter();
  let transporter = built?.transporter;
  let defaultSender = built?.sender;
  let usingTest = false;
  if (!transporter) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('[mailer] SMTP not configured in production. Skipping email to', to);
      return { skipped: true };
    }
    // Create Ethereal test account for development preview
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    usingTest = true;
    defaultSender = testAccount.user;
    console.log('[mailer] Using Ethereal test account for email preview.');
  }
  const from = resolveFromAddress(defaultSender);
  const info = await transporter.sendMail({ from, to, subject, text, html });
  if (usingTest) {
    const url = nodemailer.getTestMessageUrl(info);
    if (url) console.log('[mailer] Preview URL:', url);
  }
  return info;
}

function formatLoginEmail({ name, when, ip, ua }) {
  const subject = `Successful verification — Welcome to MegaMart`;
  const greeting = `Hi ${name || 'there'},`;
  const intro = `Your login has been verified successfully. Welcome back to MegaMart!`;
  const meta = `Time: ${when}\nIP: ${ip}\nDevice: ${ua}`;
  const footer = `If this wasn't you, please reset your password immediately.`;

  const text = `${greeting}\n\n${intro}\n\n${meta}\n\n${footer}`;
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.55;color:#111">
      <h2 style="margin:0 0 10px">Successful verification — Welcome to MegaMart</h2>
      <p>${greeting}</p>
      <p>${intro}</p>
      <ul>
        <li><strong>Time:</strong> ${when}</li>
        <li><strong>IP:</strong> ${ip}</li>
        <li><strong>Device:</strong> ${ua}</li>
      </ul>
      <p>${footer}</p>
      <p style="color:#666;font-size:12px;margin-top:16px">This is an automated message. Please do not reply.</p>
    </div>
  `;
  return { subject, text, html };
}

async function sendLoginEmail(user, meta = {}) {
  if (!user?.email) return;
  const when = new Date().toLocaleString();
  const payload = formatLoginEmail({
    name: user.name,
    when,
    ip: meta.ip || 'unknown',
    ua: meta.ua || 'unknown'
  });
  try {
    await sendMail({ to: user.email, ...payload });
    return true;
  } catch (err) {
    console.error('[mailer] Failed to send login email', err);
    return false;
  }
}

async function sendOtpEmail(user, otp) {
  if (!user?.email || !otp) return false;
  const subject = `Your MegaMart verification code: ${otp}`;
  const text = `Hi ${user.name || 'there'},\n\nYour one-time verification code is: ${otp}\nThis code will expire in 10 minutes.\n\nIf you did not attempt to log in, please ignore this email.`;
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.55;color:#111">
      <h2 style="margin:0 0 10px">Your MegaMart verification code</h2>
      <p>Hi ${user.name || 'there'},</p>
      <p>Your one-time verification code is:</p>
      <div style="font-size:28px;font-weight:700;letter-spacing:4px;margin:10px 0 6px">${otp}</div>
      <p style="margin:0 0 10px;color:#444">This code will expire in 10 minutes.</p>
      <p style="color:#666;font-size:12px">If you did not attempt to log in, you can safely ignore this email.</p>
    </div>
  `;
  try {
    await sendMail({ to: user.email, subject, text, html });
    return true;
  } catch (err) {
    console.error('[mailer] Failed to send OTP email', err);
    return false;
  }
}

module.exports = {
  sendMail,
  sendLoginEmail,
  sendOtpEmail
};
