'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

// Add a utility function to check if we're on the client side
const isClient = typeof window !== 'undefined';

// Define the shape of our auth context
type AuthContextType = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
};

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
});

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component to wrap our app
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Check for user on mount - only run on client side
  useEffect(() => {
    // Skip this effect during server-side rendering
    if (!isClient) {
      return;
    }

    const getUser = async () => {
      try {
        // First check localStorage for a stored user (backup method)
        let storedUser = null;
        try {
          const storedUserJson = localStorage.getItem('currentUser');
          if (storedUserJson) {
            storedUser = JSON.parse(storedUserJson);
            console.log("Found user in localStorage:", storedUser.email);
          }
        } catch (storageError) {
          console.error("Error reading user from localStorage:", storageError);
        }

        // Get the current session from Supabase
        const { data: { session } } = await supabase.auth.getSession();

        // Use session user if available, otherwise use stored user
        const currentUser = session?.user || storedUser;
        setUser(currentUser);

        if (currentUser) {
          console.log("User authenticated:", currentUser.email);
        } else {
          console.log("No authenticated user found");
        }

        setLoading(false);

        // Listen for auth changes
        const { data: { subscription } } = await supabase.auth.onAuthStateChange(
          (_event, session) => {
            const updatedUser = session?.user || null;
            setUser(updatedUser);

            // Update localStorage if user changes
            if (updatedUser) {
              try {
                localStorage.setItem('currentUser', JSON.stringify(updatedUser));
              } catch (storageError) {
                console.error("Error storing user in localStorage:", storageError);
              }
            } else {
              try {
                localStorage.removeItem('currentUser');
              } catch (storageError) {
                console.error("Error removing user from localStorage:", storageError);
              }
            }

            setLoading(false);
          }
        );

        // Cleanup subscription
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error("Error getting auth session:", error);
        setLoading(false);
      }
    };

    getUser();
  }, []);

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      console.log("Attempting to sign in with email:", email);

      // Check if we're in development mode with no Supabase credentials
      const isDevelopment = process.env.NODE_ENV === 'development';
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
      const hasValidCredentials = supabaseUrl.startsWith('http') && supabaseAnonKey.length > 0;

      if (isDevelopment && !hasValidCredentials) {
        console.warn("Using mock authentication in development mode");
      }

      // Attempt to sign in
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        console.error("Login error:", error);
        return { error };
      }

      if (data?.user) {
        console.log("Login successful, user:", data.user.email);

        // Set the user in state
        setUser(data.user);

        // Store the user in localStorage as a backup
        if (isClient) {
          try {
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            console.log("User stored in localStorage");
          } catch (storageError) {
            console.error("Error storing user in localStorage:", storageError);
          }
        }

        // We'll let the login page handle the redirection
        return { error: null };
      } else {
        console.error("No user returned after successful login");
        return { error: { message: "Authentication succeeded but no user was returned" } as any };
      }
    } catch (error) {
      console.error("Unexpected error during sign in:", error);
      return { error: { message: "An unexpected error occurred during login" } as any };
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    });

    if (!error) {
      // Create a user record in our users table
      await supabase.from('users').insert({
        id: (await supabase.auth.getUser()).data.user?.id,
        email,
        full_name: fullName,
      });

      router.push('/login');
    }

    return { error };
  };

  // Sign out
  const signOut = async () => {
    console.log("Signing out user");

    // Clear localStorage
    if (isClient) {
      try {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('mockSupabaseSession');
        // Clear any cookies
        document.cookie = 'mockSession=; path=/; max-age=0';
      } catch (storageError) {
        console.error("Error clearing local storage:", storageError);
      }
    }

    // Sign out from Supabase
    await supabase.auth.signOut();

    // Clear user state
    setUser(null);

    // Redirect to login page
    if (isClient) {
      console.log("Redirecting to login page");
      window.location.href = '/login';
    }
  };

  // Provide the auth context to children
  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
