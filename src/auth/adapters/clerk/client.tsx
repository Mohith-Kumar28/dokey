import React, { ReactNode } from 'react';
import { ClerkProvider, SignIn, SignUp, SignOutButton, UserProfile, useUser, useAuth, useOrganization } from '@clerk/nextjs';
import { dark } from '@clerk/themes';

export function ClerkAuthProvider({ isDark, children }: { isDark?: boolean; children: ReactNode }) {
  const appearance = isDark ? { baseTheme: dark } : undefined;
  return <ClerkProvider appearance={appearance}>{children}</ClerkProvider>;
}

export { SignIn as ClerkSignIn, SignUp as ClerkSignUp, SignOutButton as ClerkSignOutButton, UserProfile as ClerkUserProfile };
export { useUser as clerkUseUser, useAuth as clerkUseAuth, useOrganization as clerkUseOrganization };