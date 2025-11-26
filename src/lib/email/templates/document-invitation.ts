export function createDocumentInvitationEmail(params: {
  recipientName: string;
  documentTitle: string;
  signingLink: string;
  senderName?: string;
}): { subject: string; html: string } {
  const { recipientName, documentTitle, signingLink, senderName } = params;

  const subject = `${senderName || 'Someone'} invited you to sign "${documentTitle}"`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document Signing Invitation</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f7f3ff; color: #000000;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f7f3ff;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="text-align: center; padding: 32px 32px 24px;">
              <div style="width: 64px; height: 64px; margin: 0 auto; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 32px;">
              <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; text-align: center; color: #18181b;">
                You've been invited to sign a document
              </h1>
              
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #52525b; text-align: center;">
                Hi ${recipientName},
              </p>
              
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #52525b;">
                ${senderName || 'Someone'} has sent you <strong>"${documentTitle}"</strong> to review and sign.
              </p>

              <p style="margin: 0 0 32px; font-size: 14px; line-height: 1.6; color: #71717a;">
                This document requires your signature. Please click the button below to review and complete the signing process.
              </p>

              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center;">
                    <a href="${signingLink}" target="_blank" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);">
                      Review and Sign Document
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Link fallback -->
              <p style="margin: 24px 0 0; font-size: 12px; line-height: 1.6; color: #a1a1aa; text-align: center;">
                Or copy and paste this link in your browser:<br>
                <a href="${signingLink}" style="color: #8b5cf6; text-decoration: underline; word-break: break-all;">${signingLink}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; text-align: center; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0 0 8px; font-size: 14px; color: #71717a;">
                This link is unique to you and should not be shared.
              </p>
              <p style="margin: 0; font-size: 12px; color: #a1a1aa;">
                If you have any questions or did not expect this email, please contact ${senderName || 'the sender'}.
              </p>
            </td>
          </tr>

        </table>

        <!-- Footer branding -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 24px auto 0;">
          <tr>
            <td style="text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #a1a1aa;">
                Powered by <strong style="color: #8b5cf6;">Dokey</strong>
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return { subject, html };
}
