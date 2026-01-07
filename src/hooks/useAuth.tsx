import React, { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { onAuthStateChanged, signOut as firebaseSignOut, User as FirebaseUser } from "firebase/auth";
import { auth, db } from "@/integrations/firebase/client";
import { collection, query, where, getDocs } from "firebase/firestore";

type UserRole = "admin" | "member" | "visitor" | "guest";

interface AuthUser {
  id: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  session: FirebaseUser | null;
  isLoading: boolean;
  userRole: UserRole | null;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  useEffect(() => {
    // Set up Firebase auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setSession(fbUser ?? null);

      if (fbUser) {
        const mapped: AuthUser = {
          id: fbUser.uid,
          email: fbUser.email ?? null,
          displayName: fbUser.displayName ?? null,
          photoURL: fbUser.photoURL ?? null,
        };
        setUser(mapped);
        // Defer fetching user role
        setTimeout(() => {
          fetchUserRole(fbUser.uid);
        }, 0);
      } else {
        setUser(null);
        setUserRole(null);
      }

      setIsLoading(false);
    });

    // Check for existing user immediately
    const current = auth.currentUser;
    if (current) {
      const mapped: AuthUser = {
        id: current.uid,
        email: current.email ?? null,
        displayName: current.displayName ?? null,
        photoURL: current.photoURL ?? null,
      };
      setUser(mapped);
      setSession(current);
      fetchUserRole(current.uid);
      setIsLoading(false);
    }

    return () => unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      const q = query(collection(db, "user_roles"), where("user_id", "==", userId));
      const snap = await getDocs(q);

      if (snap.empty) {
        setUserRole("member");
        return;
      }

      const roleDoc = snap.docs[0].data();
      setUserRole((roleDoc.role ?? "member") as UserRole);
    } catch (error) {
      console.error("Error fetching user role:", error);
      setUserRole("member");
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setSession(null);
    setUserRole(null);
  };

  const value = {
    user,
    session,
    isLoading,
    userRole,
    isAdmin: userRole === "admin",
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}