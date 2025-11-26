// Email service interface for provider abstraction
export interface EmailService {
  sendDocumentInvitation(params: {
    to: string;
    recipientName: string;
    documentTitle: string;
    signingLink: string;
    senderName?: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

export interface EmailProvider {
  send(params: {
    to: string;
    subject: string;
    html: string;
    from?: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }>;
}
