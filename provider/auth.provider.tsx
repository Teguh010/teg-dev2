"use client";
import { UserProvider } from "@/context/UserContext";

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <UserProvider>{children}</UserProvider>;
};

export default AuthProvider;
