'use client';

import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  useDocument,
  useUpdateDocument,
  useSyncDocument
} from '@/features/documents/queries';
import { PDFViewer } from './components/pdf-viewer';
import { PageThumbnails } from './components/page-thumbnails';
import { FieldProperties } from './components/field-properties';
import { RecipientSelector } from './components/recipient-selector';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useEditorStore } from './store/use-editor-store';
import { debounce } from 'lodash';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { DraggableSidebarItem } from './components/draggable-sidebar-item';

interface DocumentEditorProps {
  id: string;
}

export function DocumentEditor({ id }: DocumentEditorProps) {
  const docQuery = useDocument(id);
  const saveMutation = useUpdateDocument(id);
  const syncMutation = useSyncDocument(id);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [activeDragItem, setActiveDragItem] = useState<{
    type: string;
    label: string;
  } | null>(null);
  const [selectedRecipientFilter, setSelectedRecipientFilter] = useState('all');

  // Zustand Store
  const { pages, setDocument, addField, setSaving, isSaving, selectedFieldId } =
    useEditorStore();

  // Initialize store when document loads
  useEffect(() => {
    if (docQuery.data) {
      let storePages;

      if (docQuery.data.pages && docQuery.data.pages.length > 0) {
        console.log('Loading pages from API:', docQuery.data.pages);
        // Document has pages from PDF
        storePages = docQuery.data.pages.map((p) => ({
          id: p.id,
          pageNumber: p.pageNumber,
          width: p.width,
          height: p.height,
          fields: p.fields.map((f) => {
            console.log(
              '[Load] Mapping field:',
              f.id,
              'Raw properties from DB:',
              f.properties
            );
            // Ensure properties is an object
            const props = (f.properties as any) || {};
            const mapped = {
              id: f.id,
              type: f.type,
              x: f.x,
              y: f.y,
              width: f.width,
              height: f.height,
              pageId: p.id,
              value: f.value,
              required: f.required,
              recipientId: f.recipientId,
              label: f.label || undefined,
              placeholder: props.placeholder,
              defaultValue: props.defaultValue,
              options: props.options
            };
            console.log('[Load] Mapped field:', mapped);
            return mapped;
          })
        }));
      } else {
        // New document without PDF - create default pages
        const defaultPageWidth = 612; // 8.5 inches at 72 DPI
        const defaultPageHeight = 792; // 11 inches at 72 DPI

        storePages = Array.from({ length: 11 }, (_, index) => ({
          id: `temp-page-${index + 1}`,
          pageNumber: index + 1,
          width: defaultPageWidth,
          height: defaultPageHeight,
          fields: []
        }));
      }

      setDocument(storePages, docQuery.data.recipients || []);
    }
  }, [docQuery.data, setDocument]);

  // Use ref to store the latest mutation to avoid recreating the debounced function
  const syncMutationRef = useRef(syncMutation);
  useEffect(() => {
    syncMutationRef.current = syncMutation;
  }, [syncMutation]);

  // Track when we're updating IDs internally to prevent triggering another save
  const isUpdatingIdsRef = useRef(false);

  // Create stable debounced save function using ref
  const debouncedSave = useMemo(() => {
    const saveChanges = async (pages: any[]) => {
      try {
        setSaving(true);

        const result = await syncMutationRef.current.mutateAsync({ pages });

        // Update field IDs if there are any mappings
        if (
          result.fieldIdMappings &&
          Object.keys(result.fieldIdMappings).length > 0
        ) {
          isUpdatingIdsRef.current = true; // Set flag before updating

          // Use the pages we just saved (with all their properties intact)
          // instead of fetching fresh state which might have changed
          const updatedPages = pages.map((page) => ({
            ...page,
            fields: page.fields.map((field: any) => {
              const newId = result.fieldIdMappings[field.id];
              if (newId) {
                return { ...field, id: newId };
              }
              return field;
            })
          }));

          useEditorStore.setState({ pages: updatedPages });

          // Reset flag after a short delay to allow the state update to complete
          setTimeout(() => {
            isUpdatingIdsRef.current = false;
          }, 100);
        }

        setSaving(false);
        toast.success('Saved');
      } catch (error) {
        console.error('[Auto-save] Error:', error);
        setSaving(false);
        toast.error('Failed to save changes');
      }
    };
    return debounce(saveChanges, 2000);
  }, [setSaving]); // Only recreate if setSaving changes (which it shouldn't)

  // Auto-save subscription
  useEffect(() => {
    const unsub = useEditorStore.subscribe(
      (state) => state.pages,
      (pages) => {
        // Don't trigger save if we're just updating IDs internally
        if (isUpdatingIdsRef.current) {
          return;
        }
        debouncedSave(pages);
      }
    );
    return () => {
      unsub();
      debouncedSave.cancel();
    };
  }, [debouncedSave]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to deselect field
      if (e.key === 'Escape' && selectedFieldId) {
        useEditorStore.getState().selectField(null);
      }

      // Delete to remove selected field
      if (e.key === 'Delete' && selectedFieldId) {
        const field = pages
          .flatMap((p) =>
            p.fields.map((f) => ({ ...f, pageNumber: p.pageNumber }))
          )
          .find((f) => f.id === selectedFieldId);
        if (field) {
          useEditorStore.getState().deleteField(field.pageNumber, field.id);
          useEditorStore.getState().selectField(null);
        }
      }

      // Cmd/Ctrl + D to duplicate
      if ((e.metaKey || e.ctrlKey) && e.key === 'd' && selectedFieldId) {
        e.preventDefault();
        const field = pages
          .flatMap((p) =>
            p.fields.map((f) => ({ ...f, pageNumber: p.pageNumber }))
          )
          .find((f) => f.id === selectedFieldId);
        if (field) {
          const newField = {
            ...field,
            id: `temp_${Date.now()}`,
            x: field.x + 20,
            y: field.y + 20
          };
          useEditorStore.getState().addField(field.pageNumber, newField);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedFieldId, pages]);

  if (docQuery.isLoading) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <Icons.spinner className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  if (docQuery.error) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <div className='space-y-2 text-center'>
          <p className='text-destructive text-lg font-semibold'>
            Error loading document
          </p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  const doc = docQuery.data!;

  const handleTitleEdit = () => {
    setTitleValue(doc.title);
    setIsEditingTitle(true);
  };

  const handleTitleSave = async () => {
    if (titleValue.trim() && titleValue !== doc.title) {
      try {
        await saveMutation.mutateAsync({ title: titleValue.trim() });
        toast.success('Title updated');
      } catch (error) {
        toast.error('Failed to update title');
      }
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setIsEditingTitle(false);
    }
  };

  const handleDragStart = (event: any) => {
    const { active } = event;
    setActiveDragItem(active.data.current);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    setActiveDragItem(null);

    if (over && over.data.current?.isPage) {
      const pageNumber = over.data.current.pageNumber;

      // Calculate position relative to the page
      const dropRect = active.rect.current.translated;
      const pageRect = over.rect;

      if (dropRect && pageRect) {
        const x = dropRect.left - pageRect.left;
        const y = dropRect.top - pageRect.top;

        if (active.data.current?.isField) {
          // Moving an existing field
          const fieldId = active.data.current.fieldId;
          const sourcePage = pages.find((p) =>
            p.fields.some((f) => f.id === fieldId)
          );

          if (sourcePage) {
            if (sourcePage.pageNumber !== pageNumber) {
              useEditorStore
                .getState()
                .updateField(sourcePage.pageNumber, fieldId, {
                  x,
                  y,
                  pageId: pages.find((p) => p.pageNumber === pageNumber)?.id
                });
            } else {
              useEditorStore
                .getState()
                .updateField(pageNumber, fieldId, { x, y });
            }
          }
        } else {
          // Creating a new field from sidebar
          const fieldType = active.data.current.type;
          const page = pages.find((p) => p.pageNumber === pageNumber);

          if (page) {
            addField(pageNumber, {
              id: `temp_${Date.now()}`,
              type: fieldType,
              x,
              y,
              width: 150,
              height: 40,
              pageId: page.id,
              required: false
            });
            toast.success(
              `Added ${active.data.current.label} to page ${pageNumber}`
            );
          } else {
            toast.error('Failed to add field - page not found');
          }
        }
      }
    }
  };

  // Deselect field when clicking on canvas background
  const handleCanvasClick = (e: React.MouseEvent) => {
    // Only deselect if clicking directly on the canvas or page wrapper, not on a field
    // The field's onClick has stopPropagation, so this should work
    useEditorStore.getState().selectField(null);
  };

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className='bg-background flex h-screen flex-col'>
        {/* Top Toolbar */}
        <div className='bg-card flex items-center justify-between border-b px-4 py-2'>
          <div className='flex items-center gap-2'>
            <Button
              variant='ghost'
              size='icon'
              onClick={() => window.history.back()}
            >
              <Icons.chevronLeft className='h-4 w-4' />
            </Button>
            <div className='flex flex-col'>
              {isEditingTitle ? (
                <Input
                  value={titleValue}
                  onChange={(e) => setTitleValue(e.target.value)}
                  onBlur={handleTitleSave}
                  onKeyDown={handleTitleKeyDown}
                  className='h-7 text-sm font-medium'
                  autoFocus
                />
              ) : (
                <button
                  onClick={handleTitleEdit}
                  className='hover:text-primary text-left text-sm font-medium'
                >
                  {doc.title}
                </button>
              )}
              <span className='text-muted-foreground text-xs'>
                Draft • All documents
              </span>
            </div>
          </div>

          <div className='flex items-center gap-2'>
            <Button variant='ghost' size='icon' title='Undo'>
              <Icons.arrowRight className='h-4 w-4 rotate-180' />
            </Button>
            <Button variant='ghost' size='icon' title='Redo'>
              <Icons.arrowRight className='h-4 w-4' />
            </Button>

            <div className='bg-border mx-2 h-6 w-px' />

            <Button variant='ghost' size='sm'>
              <Icons.user className='mr-2 h-4 w-4' />
              Invite
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className='bg-green-600 text-white hover:bg-green-700'>
                  Send
                  <Icons.chevronRight className='ml-2 h-4 w-4 rotate-90' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-56'>
                <div className='px-2 py-1.5 text-sm font-semibold'>
                  Send document via
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Icons.user className='mr-2 h-4 w-4' />
                  Email / Text (SMS)
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Icons.arrowRight className='mr-2 h-4 w-4' />
                  Link
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant='ghost' size='icon' title='View mode'>
              <Icons.eye className='h-4 w-4' />
            </Button>

            <Button variant='ghost' size='icon' title='Comments'>
              <Icons.message className='h-4 w-4' />
            </Button>

            <Button variant='ghost' size='icon' title='Info'>
              <Icons.info className='h-4 w-4' />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='ghost' size='icon'>
                  <Icons.ellipsis className='h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-64'>
                <DropdownMenuItem>
                  <Icons.settings className='mr-2 h-4 w-4' />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Icons.arrowRight className='mr-2 h-4 w-4' />
                  Workflow
                  <span className='ml-auto rounded bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-800'>
                    UPGRADE
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Icons.check className='mr-2 h-4 w-4' />
                  Resolved comments/suggestions
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className='text-muted-foreground px-2 py-1.5 text-xs font-semibold'>
                  Collaborate
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Icons.page className='mr-2 h-4 w-4' />
                  Convert to Template
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Icons.download className='mr-2 h-4 w-4' />
                  Download
                  <Icons.chevronRight className='ml-auto h-4 w-4' />
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Icons.printer className='mr-2 h-4 w-4' />
                  Print
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className='text-destructive'>
                  <Icons.trash className='mr-2 h-4 w-4' />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Main Content Area */}
        <div className='flex flex-1 overflow-hidden'>
          {/* Left Sidebar - Page Thumbnails */}
          <PageThumbnails
            pdfUrl={doc.pdfUrl || undefined}
            currentPage={1} // TODO: Track current page state
            onPageSelect={(page) => {
              const element = document.getElementById(`page_container_${page}`);
              if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
              }
            }}
          />

          {/* Document Canvas */}
          <div
            className='bg-muted/30 flex-1 overflow-y-auto p-8'
            onClick={handleCanvasClick}
          >
            <div className='mx-auto max-w-4xl space-y-4'>
              {/* Page Header */}
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <h2 className='text-lg font-semibold'>{doc.title}</h2>
                  <span className='text-muted-foreground text-sm'>
                    • 1 page
                  </span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='ghost' size='icon'>
                      <Icons.ellipsis className='h-4 w-4' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    <DropdownMenuItem>
                      <Icons.settings className='mr-2 h-4 w-4' />
                      Page properties
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Icons.page className='mr-2 h-4 w-4' />
                      Duplicate page
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Icons.arrowRight className='mr-2 h-4 w-4' />
                      Merge with page above
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Icons.add className='mr-2 h-4 w-4' />
                      Add to Content Library
                      <span className='ml-auto text-xs'>⭐ Upgrade</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className='text-destructive'>
                      <Icons.trash className='mr-2 h-4 w-4' />
                      Delete page
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Add Page Button */}
              <Button
                variant='outline'
                size='sm'
                className='w-full'
                onClick={(e) => {
                  e.stopPropagation();
                  // Find the last page number
                  const lastPage =
                    pages.length > 0 ? pages[pages.length - 1].pageNumber : 0;
                  // Optimistically add page
                  const newPage = {
                    id: `temp_page_${Date.now()}`,
                    pageNumber: lastPage + 1,
                    width: 800,
                    height: 1100,
                    fields: []
                  };
                  useEditorStore.getState().addPage(lastPage, newPage);
                }}
              >
                <Icons.add className='mr-2 h-4 w-4' />
                Add page
              </Button>

              {/* Document Page */}
              <Card className='dark:bg-card min-h-[11in] bg-white shadow-lg'>
                <PDFViewer
                  documentId={id}
                  pdfUrl={doc.pdfUrl || undefined}
                  pages={pages}
                  selectedRecipientId={selectedRecipientFilter}
                  onPdfUploaded={(url) => {
                    toast.success('PDF uploaded');
                    docQuery.refetch();
                  }}
                />
              </Card>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className='bg-card w-80 overflow-y-auto border-l'>
            <Tabs defaultValue='fields' className='flex h-full flex-col'>
              <div className='border-b'>
                <div className='px-4 py-3'>
                  <div className='mb-2 flex items-center justify-between'>
                    <h3 className='text-sm font-semibold'>Content</h3>
                    <Button variant='ghost' size='icon' className='h-6 w-6'>
                      <Icons.close className='h-4 w-4' />
                    </Button>
                  </div>
                </div>
                <TabsList className='grid w-full grid-cols-2 rounded-none'>
                  <TabsTrigger value='fields' className='text-xs'>
                    Fillable fields
                  </TabsTrigger>
                  <TabsTrigger value='blocks' className='text-xs'>
                    Blocks 🔒
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Fillable Fields Tab */}
              <TabsContent
                value='fields'
                className='mt-0 flex h-full flex-col p-0'
              >
                {selectedFieldId ? (
                  <FieldProperties />
                ) : (
                  <div className='flex h-full flex-col space-y-4 p-4'>
                    <div className='space-y-2'>
                      <label className='text-muted-foreground text-xs font-semibold uppercase'>
                        Fillable fields for
                      </label>
                      <RecipientSelector
                        value={selectedRecipientFilter}
                        onValueChange={setSelectedRecipientFilter}
                      />
                    </div>

                    {selectedRecipientFilter !== 'all' && (
                      <p className='text-muted-foreground text-xs'>
                        Showing fields for selected recipient
                      </p>
                    )}

                    <div className='space-y-2'>
                      <DraggableSidebarItem
                        type='text'
                        label='Text field'
                        icon={<Icons.page className='h-4 w-4' />}
                      />
                      <DraggableSidebarItem
                        type='signature'
                        label='Signature'
                        icon={<Icons.user className='h-4 w-4' />}
                      />
                      <DraggableSidebarItem
                        type='initials'
                        label='Initials'
                        icon={<Icons.user className='h-4 w-4' />}
                      />
                      <DraggableSidebarItem
                        type='date'
                        label='Date'
                        icon={<Icons.calendar className='h-4 w-4' />}
                      />
                      <DraggableSidebarItem
                        type='checkbox'
                        label='Checkbox'
                        icon={<Icons.check className='h-4 w-4' />}
                      />
                      <DraggableSidebarItem
                        type='radio'
                        label='Radio buttons'
                        icon={<Icons.chevronRight className='h-4 w-4' />}
                      />
                      <DraggableSidebarItem
                        type='dropdown'
                        label='Dropdown'
                        icon={<Icons.chevronDown className='h-4 w-4' />}
                      />
                      <DraggableSidebarItem
                        type='billing'
                        label='Billing details'
                        icon={<Icons.billing className='h-4 w-4' />}
                      />
                      <DraggableSidebarItem
                        type='stamp'
                        label='Stamp'
                        icon={<Icons.save className='h-4 w-4' />}
                      />
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Blocks Tab */}
              <TabsContent value='blocks' className='mt-0 flex-1 space-y-4 p-4'>
                <div className='space-y-2'>
                  <Button
                    variant='outline'
                    className='w-full justify-start'
                    size='sm'
                  >
                    <Icons.page className='mr-2 h-4 w-4' />
                    Text
                  </Button>
                  <Button
                    variant='outline'
                    className='w-full justify-start'
                    size='sm'
                  >
                    <Icons.media className='mr-2 h-4 w-4' />
                    Image
                  </Button>
                  <Button
                    variant='outline'
                    className='w-full justify-start'
                    size='sm'
                  >
                    <span className='mr-2'>🎥</span>
                    Video
                  </Button>
                  <Button
                    variant='outline'
                    className='w-full justify-start'
                    size='sm'
                  >
                    <span className='mr-2'>📊</span>
                    Table
                  </Button>
                  <Button
                    variant='outline'
                    className='w-full justify-start'
                    size='sm'
                  >
                    <Icons.billing className='mr-2 h-4 w-4' />
                    Pricing table
                  </Button>
                  <Button
                    variant='outline'
                    className='w-full justify-start'
                    size='sm'
                  >
                    <span className='mr-2'>💰</span>
                    Quote builder
                    <span className='ml-auto rounded bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700'>
                      UPDATED
                    </span>
                  </Button>
                  <Button
                    variant='outline'
                    className='w-full justify-start'
                    size='sm'
                  >
                    <span className='mr-2'>📄</span>
                    Page break
                    <span className='text-muted-foreground ml-auto text-xs'>
                      ⌃ X
                    </span>
                  </Button>
                  <Button
                    variant='outline'
                    className='w-full justify-start'
                    size='sm'
                  >
                    <span className='mr-2'>📑</span>
                    Table of contents
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      <DragOverlay>
        {activeDragItem ? (
          <div
            className='flex items-center justify-center border border-blue-500 bg-blue-50/80 text-xs text-blue-700 shadow-lg'
            style={{
              width: (activeDragItem as any).width || 150,
              height: (activeDragItem as any).height || 40
            }}
          >
            <span className='truncate px-1 font-medium'>
              {activeDragItem.label || (activeDragItem as any).type}
            </span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
