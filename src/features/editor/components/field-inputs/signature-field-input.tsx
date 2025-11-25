import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';

interface SignatureFieldInputProps {
  value: string | null | undefined;
  onSave: (value: string) => void;
  onCancel: () => void;
  className?: string;
  type?: 'signature' | 'stamp';
}

export function SignatureFieldInput({
  value,
  onSave,
  onCancel,
  className,
  type = 'signature'
}: SignatureFieldInputProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(!!value);
  const [activeTab, setActiveTab] = useState('draw');
  const [typedText, setTypedText] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  // Initialize canvas context
  useEffect(() => {
    console.log('SignatureFieldInput mounted, type:', type);
    if (activeTab === 'draw') {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.strokeStyle = type === 'stamp' ? '#ef4444' : '#000000'; // Red for stamp, black for signature
    }
  }, [activeTab, type]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasSignature(true);

    const { offsetX, offsetY } = getCoordinates(e, canvas);
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { offsetX, offsetY } = getCoordinates(e, canvas);
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const getCoordinates = (
    e: React.MouseEvent | React.TouchEvent,
    canvas: HTMLCanvasElement
  ) => {
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const rect = canvas.getBoundingClientRect();
    return {
      offsetX: clientX - rect.left,
      offsetY: clientY - rect.top
    };
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (activeTab === 'draw') {
      const canvas = canvasRef.current;
      if (!canvas) return;
      if (!hasSignature) {
        onSave('');
        return;
      }
      onSave(canvas.toDataURL('image/png'));
    } else if (activeTab === 'type') {
      // Convert typed text to image
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.font = '48px "Dancing Script", cursive'; // Use a script font if available
        ctx.fillStyle = type === 'stamp' ? '#ef4444' : '#000000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(typedText, canvas.width / 2, canvas.height / 2);
        onSave(canvas.toDataURL('image/png'));
      }
    } else if (activeTab === 'upload') {
      if (uploadedImage) {
        onSave(uploadedImage);
      }
    }
  };

  const title = type === 'stamp' ? 'Stamp' : 'Signature';

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
          <TabsList className='grid w-full grid-cols-3'>
            <TabsTrigger value='draw'>Draw</TabsTrigger>
            <TabsTrigger value='type'>Type</TabsTrigger>
            <TabsTrigger value='upload'>Upload</TabsTrigger>
          </TabsList>

          <TabsContent value='draw' className='mt-4'>
            <div className='flex flex-col items-center gap-4'>
              <div className='flex w-full justify-center overflow-hidden rounded-md border bg-white shadow-sm'>
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={200}
                  className='cursor-crosshair touch-none'
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
              </div>
              <div className='text-muted-foreground text-xs'>
                Draw above using your mouse or finger
              </div>
              <Button
                variant='outline'
                size='sm'
                onClick={handleClear}
                type='button'
              >
                Clear
              </Button>
            </div>
          </TabsContent>

          <TabsContent value='type' className='mt-4'>
            <div className='flex flex-col gap-4 py-4'>
              <div className='space-y-2'>
                <Label htmlFor='signature-text'>
                  Type your {title.toLowerCase()}
                </Label>
                <Input
                  id='signature-text'
                  value={typedText}
                  onChange={(e) => setTypedText(e.target.value)}
                  placeholder={`Your ${title.toLowerCase()}...`}
                />
              </div>
              <div className='flex h-32 items-center justify-center rounded-md border bg-white'>
                {typedText ? (
                  <div
                    className={cn(
                      'font-cursive text-4xl',
                      type === 'stamp' ? 'text-red-500' : 'text-black'
                    )}
                    style={{ fontFamily: '"Dancing Script", cursive' }}
                  >
                    {typedText}
                  </div>
                ) : (
                  <span className='text-muted-foreground text-sm'>
                    Preview will appear here
                  </span>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value='upload' className='mt-4'>
            <div className='flex flex-col items-center gap-4 rounded-md border-2 border-dashed py-8'>
              <Input
                type='file'
                accept='image/*'
                onChange={handleFileUpload}
                className='hidden'
                id='signature-upload'
              />
              <Label
                htmlFor='signature-upload'
                className='flex cursor-pointer flex-col items-center gap-2'
              >
                <Icons.upload className='text-muted-foreground h-8 w-8' />
                <span className='text-muted-foreground text-sm'>
                  Click to upload image
                </span>
              </Label>
              {uploadedImage && (
                <div className='mt-4 rounded border bg-white p-2'>
                  <img
                    src={uploadedImage}
                    alt='Uploaded'
                    className='max-h-32 object-contain'
                  />
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className='flex justify-end gap-2 sm:justify-end'>
          <Button variant='ghost' onClick={onCancel} type='button'>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            type='button'
            disabled={
              (activeTab === 'draw' && !hasSignature) ||
              (activeTab === 'type' && !typedText) ||
              (activeTab === 'upload' && !uploadedImage)
            }
          >
            Accept and sign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
