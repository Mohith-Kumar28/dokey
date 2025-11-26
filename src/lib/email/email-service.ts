import { EmailService, EmailProvider } from './types';
import { createDocumentInvitationEmail } from './templates/document-invitation';

export class EmailServiceImpl implements EmailService {
  constructor(private provider: EmailProvider) {}

  async sendDocumentInvitation(params: {
    to: string;
    recipientName: string;
    documentTitle: string;
    signingLink: string;
    senderName?: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const { subject, html } = createDocumentInvitationEmail(params);

    return this.provider.send({
      to: params.to,
      subject,
      html
    });
  }
}
