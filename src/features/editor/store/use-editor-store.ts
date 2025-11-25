import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { debounce } from 'lodash';

export type Field = {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pageId: string;
  value?: string | null;
  required?: boolean;
  recipientId?: string | null;
  label?: string;
  placeholder?: string;
  defaultValue?: string;
  options?: string[];
};

export type Page = {
  id: string;
  pageNumber: number;
  width: number;
  height: number;
  fields: Field[];
  pdfPageIndex?: number; // 1-based index of the source PDF page
};

export type Recipient = {
  id: string;
  email: string;
  name: string;
  role: string;
  color: string;
};

interface EditorState {
  pages: Page[];
  recipients: Recipient[];
  activePage: number;
  isSaving: boolean;
  selectedFieldId: string | null;

  // Actions
  setDocument: (pages: Page[], recipients: Recipient[]) => void;
  selectField: (fieldId: string | null) => void;
  addField: (pageNumber: number, field: Field) => void;
  updateField: (
    pageNumber: number,
    fieldId: string,
    updates: Partial<Field>
  ) => void;
  deleteField: (pageNumber: number, fieldId: string) => void;
  duplicateField: (pageNumber: number, fieldId: string) => void;
  addPage: (afterPageNumber: number, newPage: Page) => void;
  duplicatePage: (pageNumber: number) => void;
  deletePage: (pageNumber: number) => void;
  addRecipient: (recipient: Recipient) => void;
  setActivePage: (pageNumber: number) => void;
  setSaving: (isSaving: boolean) => void;
}

export const useEditorStore = create<EditorState>()(
  subscribeWithSelector((set, get) => ({
    pages: [],
    recipients: [],
    activePage: 1,
    isSaving: false,
    selectedFieldId: null,

    setDocument: (pages, recipients) => set({ pages, recipients }),

    selectField: (fieldId) => set({ selectedFieldId: fieldId }),

    addField: (pageNumber, field) =>
      set((state) => ({
        pages: state.pages.map((p) =>
          p.pageNumber === pageNumber
            ? { ...p, fields: [...p.fields, field] }
            : p
        )
      })),

    updateField: (pageNumber, fieldId, updates) =>
      set((state) => {
        return {
          pages: state.pages.map((p) =>
            p.pageNumber === pageNumber
              ? {
                  ...p,
                  fields: p.fields.map((f) => {
                    if (f.id === fieldId) {
                      const updated = { ...f, ...updates };

                      return updated;
                    }
                    return f;
                  })
                }
              : p
          )
        };
      }),

    deleteField: (pageNumber, fieldId) =>
      set((state) => {
        return {
          pages: state.pages.map((p) =>
            p.pageNumber === pageNumber
              ? {
                  ...p,
                  fields: p.fields.filter((f) => {
                    const keep = f.id !== fieldId;

                    return keep;
                  })
                }
              : p
          ),
          selectedFieldId:
            state.selectedFieldId === fieldId ? null : state.selectedFieldId
        };
      }),

    duplicateField: (pageNumber, fieldId) =>
      set((state) => {
        const page = state.pages.find((p) => p.pageNumber === pageNumber);
        if (!page) return state;

        const field = page.fields.find((f) => f.id === fieldId);
        if (!field) return state;

        const newField = {
          ...field,
          id: `temp_${Date.now()}`,
          x: field.x + 20,
          y: field.y + 20
        };

        return {
          pages: state.pages.map((p) =>
            p.pageNumber === pageNumber
              ? { ...p, fields: [...p.fields, newField] }
              : p
          ),
          selectedFieldId: newField.id
        };
      }),

    addPage: (afterPageNumber, newPage) =>
      set((state) => {
        const newPages = [...state.pages];
        // Insert after the specified page
        const index = newPages.findIndex(
          (p) => p.pageNumber === afterPageNumber
        );
        if (index !== -1) {
          newPages.splice(index + 1, 0, newPage);
          // Re-index subsequent pages
          for (let i = index + 2; i < newPages.length; i++) {
            newPages[i].pageNumber = newPages[i].pageNumber + 1;
          }
        } else {
          // If adding to the end or if list is empty (though afterPageNumber suggests existing)
          newPages.push(newPage);
        }
        return { pages: newPages };
      }),

    duplicatePage: (pageNumber) =>
      set((state) => {
        const pageToDuplicate = state.pages.find(
          (p) => p.pageNumber === pageNumber
        );
        if (!pageToDuplicate) return state;

        const newPage: Page = {
          ...pageToDuplicate,
          id: `temp_page_${Date.now()}`,
          pageNumber: pageNumber + 1,
          fields: pageToDuplicate.fields.map((f) => ({
            ...f,
            id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            pageId: `temp_page_${Date.now()}` // Will be updated by backend
          }))
        };

        const newPages = [...state.pages];
        const index = newPages.findIndex((p) => p.pageNumber === pageNumber);

        // Insert new page
        newPages.splice(index + 1, 0, newPage);

        // Re-index subsequent pages
        for (let i = index + 2; i < newPages.length; i++) {
          newPages[i].pageNumber = i + 1;
        }

        return { pages: newPages };
      }),

    deletePage: (pageNumber) =>
      set((state) => {
        const newPages = state.pages.filter((p) => p.pageNumber !== pageNumber);

        // Re-index pages
        newPages.forEach((p, index) => {
          p.pageNumber = index + 1;
        });

        return { pages: newPages };
      }),

    addRecipient: (recipient) =>
      set((state) => ({
        recipients: [...state.recipients, recipient]
      })),

    setActivePage: (pageNumber) => set({ activePage: pageNumber }),
    setSaving: (isSaving) => set({ isSaving })
  }))
);
