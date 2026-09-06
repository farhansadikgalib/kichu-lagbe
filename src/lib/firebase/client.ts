"use client";

/**
 * Firebase client — used ONLY for Google sign-in (popup). Loaded lazily from
 * the Google button so Firebase never lands in the main bundle.
 */
import { getApps, initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

export function isFirebaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
}

function getFirebaseAuth() {
  const app =
    getApps()[0] ??
    initializeApp({
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    });
  return getAuth(app);
}

function makeProvider() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return provider;
}

/**
 * Opens the Google popup and returns a Firebase ID token. Popups can't
 * round-trip in an installed PWA and may be blocked in-browser; callers fall
 * back to the server-side OAuth flow (`/api/auth/google`) in those cases.
 * Firebase's own redirect flow is deliberately not used: Safari's tracking
 * prevention blocks it whenever the auth domain differs from the site's.
 */
export async function signInWithGooglePopup(): Promise<string> {
  const credential = await signInWithPopup(getFirebaseAuth(), makeProvider());
  return credential.user.getIdToken();
}
