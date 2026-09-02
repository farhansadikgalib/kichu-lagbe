"use client";

/**
 * Firebase client — used ONLY for Google sign-in (popup). Loaded lazily from
 * the Google button so Firebase never lands in the main bundle.
 */
import { getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  getRedirectResult,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
} from "firebase/auth";

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

/** Opens the Google popup and returns a Firebase ID token. */
export async function signInWithGooglePopup(): Promise<string> {
  const credential = await signInWithPopup(getFirebaseAuth(), makeProvider());
  return credential.user.getIdToken();
}

/* Popups never return in installed PWAs (iOS especially) and can be blocked
   in-browser; the redirect flow below covers both. A sessionStorage flag marks
   the round-trip so the login page knows to collect the result on return. */

const REDIRECT_FLAG = "kl-google-redirect";

export function isStandaloneDisplay() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && (navigator as { standalone?: boolean }).standalone === true)
  );
}

export async function signInWithGoogleRedirect(): Promise<void> {
  sessionStorage.setItem(REDIRECT_FLAG, "1");
  await signInWithRedirect(getFirebaseAuth(), makeProvider());
}

export function hasPendingRedirect() {
  return sessionStorage.getItem(REDIRECT_FLAG) === "1";
}

/** Completes a redirect sign-in; returns null if none happened. */
export async function consumeRedirectResult(): Promise<string | null> {
  sessionStorage.removeItem(REDIRECT_FLAG);
  const result = await getRedirectResult(getFirebaseAuth());
  return result ? result.user.getIdToken() : null;
}
