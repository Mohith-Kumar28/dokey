'use client';

import dynamic from 'next/dynamic';
import { Icons } from '@/components/icons';

const PageThumbnailsClient = dynamic(
  () =>
    import('./page-thumbnails-client').then((mod) => mod.PageThumbnailsClient),
  {
    ssr: false,
    loading: () => (
      <div className='bg-muted/10 flex h-full w-52 items-center justify-center border-r'>
        <Icons.spinner className='text-muted-foreground h-6 w-6 animate-spin' />
      </div>
    )
  }
);

interface PageThumbnailsProps {
  pdfUrl?: string;
  currentPage: number;
  onPageSelect: (page: number) => void;
}

export function PageThumbnails(props: PageThumbnailsProps) {
  return <PageThumbnailsClient {...props} />;
}
