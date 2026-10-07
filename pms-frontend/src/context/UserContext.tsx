// src/context/UserContext.tsx
import React, { createContext, useContext, useState } from 'react';

export interface User {
  id: number;
  name: string;
  position: string;
}

interface UserContextType {
  currentUser: User | null;
  selectUser: (user: User) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('active_user');
    return saved ? JSON.parse(saved) : { id: 1, name: 'Alice Hartman', position: 'CEO' };
  });

  const selectUser = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('active_user', JSON.stringify(user));
  };

  return (
    <UserContext.Provider value={{ currentUser, selectUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within UserProvider');
  return context;
};