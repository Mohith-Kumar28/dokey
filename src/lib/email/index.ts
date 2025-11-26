import { ResendProvider } from './providers/resend-provider';
import { EmailServiceImpl } from './email-service';
import { EmailService } from './types';

let emailServiceInstance: EmailService | null = null;

export function getEmailService(): EmailService {
  if (!emailServiceInstance) {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }

    const provider = new ResendProvider(apiKey, process.env.RESEND_FROM_EMAIL);
    emailServiceInstance = new EmailServiceImpl(provider);
  }

  return emailServiceInstance;
}

// Export for easy access
export type { EmailService } from './types';
