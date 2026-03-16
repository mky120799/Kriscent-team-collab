import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "@/config/firebase";

export type AuthUser = {
  _id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "MEMBER";
  teamId: string | null;
  firebaseUid: string;
};

/**
 * REGISTER
 */
export const registerUser = async ({
  name,
  email,
  password,
}: {
  name: string;
  email: string;
  password: string;
}) => {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password,
  );

  const firebaseUid = userCredential.user.uid;

  const res = await fetch(`${import.meta.env.VITE_API_URL}/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      firebaseUid,
      name,
      email,
    }),
  });

  if (!res.ok) {
    throw new Error("User registration failed");
  }

  return res.json();
};

/**
 * LOGIN
 */
export const loginUser = async ({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<AuthUser> => {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password,
  );

  const idToken = await userCredential.user.getIdToken();

  const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ idToken }),
  });

  if (!res.ok) {
    throw new Error("Login failed");
  }

  const data = await res.json();
  return data.user as AuthUser;
};

/**
 * GET ME
 */
export const getMe = async (): Promise<AuthUser> => {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("No firebase user found");

  const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to get user info");
  }

  const data = await res.json();
  return data.user as AuthUser;
};
