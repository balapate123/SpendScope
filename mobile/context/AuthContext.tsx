import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { API_URL } from '../constants/Config';
import { router } from 'expo-router';

interface User {
    id: string;
    email: string;
    name?: string;
    preferences: any;
    netWorth: number;
    monthlyIncome: number;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (token: string, user: User) => Promise<void>;
    logout: () => Promise<void>;
    updateUser: (data: Partial<User>) => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    login: async () => { },
    logout: async () => { },
    updateUser: () => { },
    refreshUser: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        checkLogin();
    }, []);

    const checkLogin = async () => {
        try {
            const token = await SecureStore.getItemAsync('token');
            if (token) {
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                const response = await axios.get(`${API_URL}/users/me`);
                setUser(response.data);
            }
        } catch (e) {
            // Silently handle - user is not logged in
            await SecureStore.deleteItemAsync('token');
            delete axios.defaults.headers.common['Authorization'];
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (token: string, userData: User) => {
        await SecureStore.setItemAsync('token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(userData);
        router.replace('/(tabs)');
    };

    const logout = async () => {
        await SecureStore.deleteItemAsync('token');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
        router.replace('/login');
    };

    const updateUser = (data: Partial<User>) => {
        if (user) {
            setUser({ ...user, ...data });
        }
    };

    const refreshUser = async () => {
        try {
            const response = await axios.get(`${API_URL}/users/me`);
            setUser(response.data);
        } catch (e) {
            // Silently handle
        }
    };

    const isAuthenticated = !!user;

    return (
        <AuthContext.Provider value={{ user, isLoading, isAuthenticated, login, logout, updateUser, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};
