import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import {
  useSendDocument,
  useCreateRecipient
} from '@/features/documents/queries';
import { toast } from 'sonner';
import { Recipient } from '../store/use-editor-store';

interface SendDocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  documentTitle: string;
  recipients: Recipient[];
  mode: 'email' | 'link';
}

export function SendDocumentModal({
  open,
  onOpenChange,
  documentId,
  documentTitle,
  recipients,
  mode
}: SendDocumentModalProps) {
  const sendMutation = useSendDocument(documentId);
  const createRecipientMutation = useCreateRecipient(documentId);

  const [title, setTitle] = useState(documentTitle);
  const [isSuccess, setIsSuccess] = useState(false);
  const [generatedLinks, setGeneratedLinks] = useState<Record<string, string>>(
    {}
  );
  const [isGenerating, setIsGenerating] = useState(false);

  // Add Recipient State
  const [isAddingRecipient, setIsAddingRecipient] = useState(false);
  const [newRecipientName, setNewRecipientName] = useState('');
  const [newRecipientEmail, setNewRecipientEmail] = useState('');

  // Reset state when opening
  useEffect(() => {
    if (open) {
      setTitle(documentTitle);
      setIsSuccess(false);
      setGeneratedLinks({});
      setIsGenerating(false);
      setIsAddingRecipient(false);
      setNewRecipientName('');
      setNewRecipientEmail('');
    }
  }, [open, documentTitle]);

  const handleSendEmail = async () => {
    try {
      await sendMutation.mutateAsync({
        title,
        deliveryMethod: 'email'
      });
      setIsSuccess(true);
      toast.success('Document sent successfully');
    } catch (error) {
      toast.error('Failed to send document');
    }
  };

  const handleGenerateLinks = async () => {
    setIsGenerating(true);
    try {
      const result = await sendMutation.mutateAsync({
        deliveryMethod: 'link'
      });

      if (result.links) {
        setGeneratedLinks(result.links);
      }
      toast.success('Links generated');
    } catch (error) {
      toast.error('Failed to generate links');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddRecipient = async () => {
    if (!newRecipientName || !newRecipientEmail) return;

    try {
      await createRecipientMutation.mutateAsync({
        name: newRecipientName,
        email: newRecipientEmail,
        role: 'signer',
        deliveryMethod: 'email'
      });
      setIsAddingRecipient(false);
      setNewRecipientName('');
      setNewRecipientEmail('');
      toast.success('Recipient added');
    } catch (error) {
      toast.error('Failed to add recipient');
    }
  };

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success('Link copied to clipboard');
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  if (isSuccess && mode === 'email') {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className='sm:max-w-md'>
          <div className='flex flex-col items-center justify-center space-y-4 py-8 text-center'>
            <div className='rounded-full bg-green-100 p-3'>
              <Icons.check className='h-8 w-8 text-green-600' />
            </div>
            <DialogTitle>Document Sent!</DialogTitle>
            <DialogDescription>
              Your document has been sent to {recipients.length} recipients.
            </DialogDescription>
            <Button onClick={handleClose} className='w-full max-w-xs'>
              Return to Editor
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-xl'>
        <DialogHeader>
          <DialogTitle>
            {mode === 'email' ? 'Review recipients' : 'Share link'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'email'
              ? 'Confirm the recipients below before sending the document.'
              : 'Generate links to share the document manually.'}
          </DialogDescription>
        </DialogHeader>

        {mode === 'email' ? (
          <div className='space-y-6 py-4'>
            <div className='space-y-2'>
              <label className='text-sm font-medium'>Document name *</label>
              <input
                className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className='space-y-3'>
              {recipients.map((recipient) => (
                <div
                  key={recipient.id}
                  className='flex items-center justify-between rounded-md border p-3'
                >
                  <div className='flex items-center gap-3'>
                    <div
                      className='flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white'
                      style={{ backgroundColor: recipient.color }}
                    >
                      {recipient.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className='flex items-center gap-2'>
                        <span className='text-sm font-medium'>
                          {recipient.name}
                        </span>
                        <span className='rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 uppercase'>
                          {recipient.role}
                        </span>
                      </div>
                      <div className='text-muted-foreground text-xs'>
                        {recipient.email}
                      </div>
                    </div>
                  </div>
                  <div className='text-muted-foreground bg-muted flex items-center gap-2 rounded px-2 py-1 text-sm'>
                    Email
                    <Icons.chevronDown className='h-3 w-3' />
                  </div>
                </div>
              ))}

              {isAddingRecipient ? (
                <div className='bg-muted/20 space-y-3 rounded-md border p-3'>
                  <div className='grid grid-cols-2 gap-3'>
                    <div className='space-y-1'>
                      <label className='text-xs font-medium'>Name</label>
                      <input
                        className='border-input bg-background flex h-8 w-full rounded-md border px-2 py-1 text-sm'
                        placeholder='John Doe'
                        value={newRecipientName}
                        onChange={(e) => setNewRecipientName(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <div className='space-y-1'>
                      <label className='text-xs font-medium'>Email</label>
                      <input
                        className='border-input bg-background flex h-8 w-full rounded-md border px-2 py-1 text-sm'
                        placeholder='john@example.com'
                        value={newRecipientEmail}
                        onChange={(e) => setNewRecipientEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className='flex justify-end gap-2'>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => setIsAddingRecipient(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size='sm'
                      onClick={handleAddRecipient}
                      disabled={
                        !newRecipientName ||
                        !newRecipientEmail ||
                        createRecipientMutation.isPending
                      }
                    >
                      {createRecipientMutation.isPending ? 'Adding...' : 'Add'}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant='ghost'
                  className='text-muted-foreground hover:text-foreground pl-0 hover:bg-transparent'
                  onClick={() => setIsAddingRecipient(true)}
                >
                  <Icons.add className='mr-2 h-4 w-4' />
                  Add recipient
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className='space-y-6 py-4'>
            {Object.keys(generatedLinks).length === 0 ? (
              <div className='bg-muted/30 flex flex-col items-center justify-center rounded-lg border border-dashed py-10 text-center'>
                <div className='bg-muted mb-4 rounded-full p-3'>
                  <Icons.link className='text-muted-foreground h-6 w-6' />
                </div>
                <h3 className='text-lg font-medium'>Generate links to share</h3>
                <p className='text-muted-foreground mb-6 max-w-sm text-sm'>
                  Once links are generated, the document will be in Sent status.
                </p>
                <Button
                  onClick={handleGenerateLinks}
                  disabled={isGenerating}
                  className='bg-emerald-600 text-white hover:bg-emerald-700'
                >
                  {isGenerating ? (
                    <>
                      <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
                      Generating...
                    </>
                  ) : (
                    'Generate links'
                  )}
                </Button>
              </div>
            ) : (
              <div className='space-y-4'>
                <div className='text-muted-foreground text-sm'>
                  Links are unique for each recipient. Make sure that the
                  intended recipients/signers are the only ones accessing the
                  document through their link.
                </div>
                {recipients.map((recipient) => (
                  <div key={recipient.id} className='flex items-center gap-4'>
                    <div className='flex-shrink-0'>
                      <div
                        className='flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white'
                        style={{ backgroundColor: recipient.color }}
                      >
                        {recipient.name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div className='flex-1 space-y-1'>
                      <div className='flex items-center gap-2'>
                        <span className='text-sm font-medium'>
                          {recipient.name}
                        </span>
                        <span className='text-muted-foreground text-xs font-medium uppercase'>
                          {recipient.role}
                        </span>
                      </div>
                      <div className='text-muted-foreground text-xs'>
                        {recipient.email}
                      </div>
                    </div>
                    <div className='flex flex-[2] gap-2'>
                      <input
                        readOnly
                        value={generatedLinks[recipient.id]}
                        className='border-input bg-muted/50 text-muted-foreground flex h-9 w-full rounded-md border px-3 py-1 text-xs shadow-sm focus-visible:outline-none'
                      />
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => copyLink(generatedLinks[recipient.id])}
                      >
                        Copy
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {mode === 'email' ? (
            <Button
              onClick={handleSendEmail}
              disabled={recipients.length === 0 || sendMutation.isPending}
              className='w-full bg-emerald-600 text-white hover:bg-emerald-700 sm:w-auto'
            >
              {sendMutation.isPending ? (
                <>
                  <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
                  Sending...
                </>
              ) : (
                'Continue'
              )}
            </Button>
          ) : (
            <Button
              onClick={handleClose}
              className='bg-emerald-600 text-white hover:bg-emerald-700'
            >
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
