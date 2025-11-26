import { Resend } from 'resend';
import { EmailProvider } from '../types';

export class ResendProvider implements EmailProvider {
  private resend: Resend;
  private fromEmail: string;

  constructor(apiKey: string, fromEmail = 'onboarding@resend.dev') {
    this.resend = new Resend(apiKey);
    this.fromEmail = fromEmail;
  }

  async send(params: {
    to: string;
    subject: string;
    html: string;
    from?: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const { data, error } = await this.resend.emails.send({
        from: params.from || this.fromEmail,
        to: params.to,
        subject: params.subject,
        html: params.html
      });

      if (error) {
        console.error('[ResendProvider] Error sending email:', error);
        return {
          success: false,
          error: error.message || 'Failed to send email'
        };
      }

      return {
        success: true,
        messageId: data?.id
      };
    } catch (error: any) {
      console.error('[ResendProvider] Exception sending email:', error);
      return {
        success: false,
        error: error.message || 'Failed to send email'
      };
    }
  }
}
