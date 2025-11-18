export type User = {
  id: string;
  fullName?: string;
  email: string;
  imageUrl?: string;
};

export type Organization = {
  id: string;
  name: string;
  slug?: string;
};

export type Session = {
  userId: string | null;
  orgId?: string | null;
};

export type RoleKey = string;
export type PermissionKey = string;