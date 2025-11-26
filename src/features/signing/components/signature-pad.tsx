'use client';

import { useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';

interface SignaturePadProps {
  onSave: (dataUrl: string) => void;
  onClear?: () => void;
  initialValue?: string;
}

export function SignaturePad({
  onSave,
  onClear,
  initialValue
}: SignaturePadProps) {
  const sigCanvasRef = useRef<SignatureCanvas>(null);

  useEffect(() => {
    if (initialValue && sigCanvasRef.current) {
      sigCanvasRef.current.fromDataURL(initialValue);
    }
  }, [initialValue]);

  const handleClear = () => {
    sigCanvasRef.current?.clear();
    onClear?.();
  };

  const handleSave = () => {
    if (sigCanvasRef.current) {
      const dataUrl = sigCanvasRef.current.toDataURL();
      onSave(dataUrl);
    }
  };

  return (
    <div className='space-y-3'>
      <div className='relative rounded-lg border-2 border-dashed border-gray-300 bg-white'>
        <SignatureCanvas
          ref={sigCanvasRef}
          canvasProps={{
            className: 'w-full h-48 cursor-crosshair',
            style: { touchAction: 'none' }
          }}
          backgroundColor='white'
        />
      </div>

      <div className='flex justify-between gap-2'>
        <Button variant='outline' size='sm' onClick={handleClear} type='button'>
          <Icons.trash className='mr-2 h-4 w-4' />
          Clear
        </Button>
        <Button
          size='sm'
          onClick={handleSave}
          type='button'
          className='bg-purple-600 hover:bg-purple-700'
        >
          Save Signature
        </Button>
      </div>
    </div>
  );
}
