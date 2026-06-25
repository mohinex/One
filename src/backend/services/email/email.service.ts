import nodemailer from "nodemailer";
import handlebars from "handlebars";

export interface SendEmailOptions {
  to: string;
  subject: string;
  template: string; // HTML template name
  context: Record<string, any>;
}

let transporterInstance: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporterInstance) {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || "465");
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
      transporterInstance = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
    } else {
      console.warn("SMTP settings are incomplete. Mailer running in terminal stream debugger mode.");
      // Standard local JSON fallback stream
      transporterInstance = nodemailer.createTransport({
        jsonTransport: true,
      });
    }
  }
  return transporterInstance;
}

// Pre-defined templates using Handlebars compilation
const templates: Record<string, string> = {
  welcome: `
    <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 8px;">
      <h2 style="color: #DC2626;">Welcome to Eurosia One</h2>
      <p>Hi {{name}},</p>
      <p>Thank you for registering on Eurosia One — the next generation AI Operating System database platform.</p>
      <p>Your user tier: <strong>USER</strong> is now ready. Click the link below to verify your email address:</p>
      <div style="margin: 24px 0;">
        <a href="{{verifyUrl}}" style="background: #DC2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Verify Email</a>
      </div>
      <p>If you did not sign up for Eurosia, please ignore this message.</p>
    </div>
  `,
  "verify-email": `
    <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 8px;">
      <h2 style="color: #DC2626;">Email Verification Request</h2>
      <p>Hi {{name}},</p>
      <p>Please click the button below to verify your account:</p>
      <div style="margin: 24px 0;">
        <a href="{{verifyUrl}}" style="background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Verify Email Address</a>
      </div>
      <p>Token details: <code style="background-color: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-family: monospace;">{{token}}</code></p>
    </div>
  `,
  "reset-password": `
    <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 8px;">
      <h2 style="color: #DC2626;">Password Reset Request</h2>
      <p>Hi {{name}},</p>
      <p>You requested a password reset for Eurosia One. Click the button below to update your password (expires in 1 hour):</p>
      <div style="margin: 24px 0;">
        <a href="{{resetUrl}}" style="background: #EF4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
      </div>
      <p>If you did not request this, please ignore this email and your password will remain secure.</p>
    </div>
  `,
  "subscription-notification": `
    <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 8px;">
      <h2 style="color: #10B981;">Subscription Status Changed</h2>
      <p>Hi {{name}},</p>
      <p>Your subscription to <strong>Eurosia One</strong> has been updated:</p>
      <p>New Plan: <strong>{{planName}}</strong></p>
      <p>Status: <span style="background: #ECFDF5; color: #047857; padding: 4px 8px; border-radius: 4px; font-weight: bold;">{{status}}</span></p>
      <p>Current Period Ends: {{periodEnd}}</p>
      <p>Thank you for partnering with Eurosia One OS!</p>
    </div>
  `,
  "magic-link-email": `
    <div style="font-family: 'Inter', sans-serif; padding: 32px; color: #1e293b; max-width: 580px; margin: 20px auto; border: 1px solid #e2e8f0; border-radius: 16px; background: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="background: #dc2626; color: white; font-weight: 900; font-size: 20px; padding: 8px 16px; border-radius: 12px; display: inline-block;">E</span>
        <h2 style="color: #0f172a; margin-top: 16px; font-size: 22px; font-weight: 800; tracking: -0.025em;">Eurosia One - Secure Portal Handshake</h2>
      </div>
      <p style="font-size: 15px; line-height: 1.6; color: #475569;">Hi {{name}},</p>
      <p style="font-size: 15px; line-height: 1.6; color: #475569;">You requested a secure, passwordless magic login to your Eurosia AI Operating System workspace.</p>
      <p style="font-size: 14px; color: #475569; margin-bottom: 24px;">Click the button below to sign in instantly and verify your active login session:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{magicVerifyUrl}}" style="background: #0f172a; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 14px; display: inline-block; transition: all 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">Secure Login Now</a>
      </div>
      <p style="font-size: 12px; color: #64748b; line-height: 1.5;">This magic handshake link is highly secure and is valid for the next <b>15 minutes</b> only. It can be used exactly once.</p>
      <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
      <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">Eurosia One Platform • 12K+ Developer Workspaces Automated • Security Grade TLS/AES-256</p>
    </div>
  `,
  "otp-email": `
    <div style="font-family: 'Inter', sans-serif; padding: 32px; color: #1e293b; max-width: 580px; margin: 20px auto; border: 1px solid #e2e8f0; border-radius: 16px; background: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="background: #dc2626; color: white; font-weight: 900; font-size: 20px; padding: 8px 16px; border-radius: 12px; display: inline-block;">E</span>
        <h2 style="color: #0f172a; margin-top: 16px; font-size: 22px; font-weight: 800; tracking: -0.025em;">Your OTP Verification Code</h2>
      </div>
      <p style="font-size: 15px; line-height: 1.6; color: #475569;">Hi {{name}},</p>
      <p style="font-size: 15px; line-height: 1.6; color: #475569;">Use the secure verification code below to authorize your login on Eurosia One:</p>
      <div style="text-align: center; margin: 30px 0; background: #f8fafc; padding: 18px; border-radius: 12px; border: 1px dashed #cbd5e1;">
        <span style="font-family: monospace; font-size: 32px; font-weight: 900; tracking: 0.15em; color: #0f172a;">{{otp}}</span>
      </div>
      <p style="font-size: 12px; color: #64748b; line-height: 1.5;">This OTP code will expire in <b>5 minutes</b>. Please do not share this code with anyone.</p>
      <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
      <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">Eurosia One Platform • 12K+ Developer Workspaces Automated • Security Grade TLS/AES-256</p>
    </div>
  `,
};

export async function sendEmail(options: SendEmailOptions): Promise<any> {
  const transporter = getTransporter();
  const templateHtml = templates[options.template];
  if (!templateHtml) {
    throw new Error(`Email template "${options.template}" not found.`);
  }

  const compiled = handlebars.compile(templateHtml);
  const html = compiled(options.context);

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || "Eurosia One"}" <${process.env.EMAIL_FROM || "noreply@eurosaone.com"}>`,
    to: options.to,
    subject: options.subject,
    html,
  };

  const info = await transporter.sendMail(mailOptions);
  
  if ((transporter as any).options?.jsonTransport) {
    console.log("------------------ INBOX SIMULATOR ------------------");
    console.log("To:", options.to);
    console.log("Subject:", options.subject);
    console.log("Template:", options.template);
    console.log("Context JSON:", JSON.stringify(options.context, null, 2));
    console.log("-----------------------------------------------------");
  }

  return info;
}
