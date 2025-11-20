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
};

export type Page = {
  id: string;
  pageNumber: number;
  width: number;
  height: number;
  fields: Field[];
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
      set((state) => ({
        pages: state.pages.map((p) =>
          p.pageNumber === pageNumber
            ? {
                ...p,
                fields: p.fields.map((f) =>
                  f.id === fieldId ? { ...f, ...updates } : f
                )
              }
            : p
        )
      })),

    deleteField: (pageNumber, fieldId) =>
      set((state) => ({
        pages: state.pages.map((p) =>
          p.pageNumber === pageNumber
            ? {
                ...p,
                fields: p.fields.filter((f) => f.id !== fieldId)
              }
            : p
        ),
        selectedFieldId:
          state.selectedFieldId === fieldId ? null : state.selectedFieldId
      })),

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

    addRecipient: (recipient) =>
      set((state) => ({
        recipients: [...state.recipients, recipient]
      })),

    setActivePage: (pageNumber) => set({ activePage: pageNumber }),
    setSaving: (isSaving) => set({ isSaving })
  }))
);
