import { getAppBaseUrl } from "./mail"

export function resetPasswordEmailHTML(params: {
  resetUrl: string
  siteName?: string
  slogan?: string
  logoUrl?: string
  supportEmail?: string
}) {
  const base = getAppBaseUrl()
  const siteName = params.siteName || "PyLearn"
  const slogan = params.slogan || "Learn Python. Play. Progress."
  const logoUrl = params.logoUrl || `${base}/brand-snake.svg`
  const supportEmail = params.supportEmail || "info@pylearn.net"

  // Basic, responsive, inline-styled layout compatible with most clients
  return `
  <!doctype html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
      <title>${siteName} - Reset your password</title>
      <style>
        @media only screen and (max-width: 620px) {
          .container { width: 100% !important; padding: 0 16px !important; }
          .content { padding: 20px !important; }
          h1 { font-size: 22px !important; }
        }
        a.btn { background: #3B82F6; color: #fff !important; text-decoration: none; padding: 12px 18px; border-radius: 8px; display: inline-block; font-weight: 600; }
        .muted { color: #6b7280; }
        .card { border: 1px solid #e5e7eb; border-radius: 12px; }
      </style>
    </head>
    <body style="margin:0;background:#f8fafc;font-family:Inter,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center" style="padding: 32px 0;">
            <table class="container" role="presentation" cellpadding="0" cellspacing="0" width="620" style="width:620px;">
              <tr>
                <td style="padding:0 16px;">
                  <table width="100%" role="presentation" cellpadding="0" cellspacing="0" class="card" style="background:#ffffff">
                    <tr>
                      <td class="content" style="padding:32px 32px 16px 32px; text-align:center;">
                        <img src="${logoUrl}" alt="${siteName} logo" width="56" height="56" style="display:block;margin:0 auto 12px auto;" />
                        <div style="font-size:14px;letter-spacing:.12em;text-transform:uppercase;color:#64748b;">${siteName}</div>
                        <div style="font-size:13px;color:#94a3b8;margin-top:4px;">${slogan}</div>
                      </td>
                    </tr>
                    <tr>
                      <td class="content" style="padding:0 32px 24px 32px;">
                        <h1 style="margin:0 0 8px 0;font-size:24px;line-height:1.3;">Reset your password</h1>
                        <p style="margin:0 0 12px 0;color:#334155;font-size:15px;">We received a request to reset your password. Click the button below to create a new password.</p>
                        <p style="margin:0 0 20px 0;">
                          <a class="btn" href="${params.resetUrl}" target="_blank" rel="noopener noreferrer">Reset password</a>
                        </p>
                        <p class="muted" style="margin:0 0 12px 0;font-size:13px;">This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.</p>
                        <div style="margin-top:20px;padding:12px 14px;background:#f1f5f9;border-radius:10px;font-size:12px;color:#334155;word-break:break-all;">
                          If the button above doesn't work, copy and paste this URL into your browser:<br/>
                          <a href="${params.resetUrl}" style="color:#2563eb;text-decoration:underline;">${params.resetUrl}</a>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td class="content" style="padding:16px 32px 28px 32px;border-top:1px solid #e5e7eb;">
                        <p class="muted" style="margin:0;font-size:12px;">Need help? Contact us at <a href="mailto:${supportEmail}" style="color:#2563eb;text-decoration:underline;">${supportEmail}</a>.</p>
                      </td>
                    </tr>
                  </table>
                  <div style="text-align:center;margin-top:16px;color:#94a3b8;font-size:12px;">
                    © ${new Date().getFullYear()} ${siteName}. All rights reserved.
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `
}
