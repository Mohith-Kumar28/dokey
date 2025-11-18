import React from 'react';
import {
  ClerkAuthProvider,
  ClerkSignIn,
  ClerkSignUp,
  ClerkSignOutButton,
  ClerkUserProfile,
  clerkUseUser,
  clerkUseAuth,
  clerkUseOrganization
} from './adapters/clerk/client';

export function AuthProvider({ isDark, children }: { isDark?: boolean; children: React.ReactNode }) {
  return <ClerkAuthProvider isDark={isDark}>{children}</ClerkAuthProvider>;
}

export function SignIn(props: any) {
  return <ClerkSignIn {...props} />;
}

export function SignUp(props: any) {
  return <ClerkSignUp {...props} />;
}

export function SignOutButton(props: any) {
  return <ClerkSignOutButton {...props} />;
}

export function UserProfile(props: any) {
  return <ClerkUserProfile {...props} />;
}

export function useUser() {
  return clerkUseUser();
}

export function useAuth() {
  return clerkUseAuth();
}

export function useOrganization() {
  return clerkUseOrganization();
}