import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../constants/Config';
import { Link } from 'expo-router';
import { colors, spacing, borderRadius } from '../constants/Theme';
import { DollarSign, Mail, Lock } from 'lucide-react-native';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleLogin = async () => {
        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const response = await axios.post(`${API_URL}/auth/login`, { email, password });
            await login(response.data.token, response.data.user);
        } catch (e: any) {
            setError(e.response?.data?.message || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                {/* Logo */}
                <View style={styles.logoContainer}>
                    <View style={styles.logoCircle}>
                        <DollarSign size={40} color={colors.primary} />
                    </View>
                    <Text style={styles.appName}>MoneyMap</Text>
                    <Text style={styles.tagline}>Smart Finance Tracking</Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    <Text style={styles.formTitle}>Welcome Back</Text>
                    <Text style={styles.formSubtitle}>Sign in to continue</Text>

                    <View style={styles.inputContainer}>
                        <Mail size={20} color={colors.textMuted} style={styles.inputIcon} />
                        <TextInput
                            placeholder="Email"
                            placeholderTextColor={colors.textMuted}
                            style={styles.input}
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Lock size={20} color={colors.textMuted} style={styles.inputIcon} />
                        <TextInput
                            placeholder="Password"
                            placeholderTextColor={colors.textMuted}
                            style={styles.input}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>

                    {error ? (
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : null}

                    <TouchableOpacity
                        style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color={colors.textPrimary} />
                        ) : (
                            <Text style={styles.loginButtonText}>Sign In</Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>OR</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    <Link href="/register" asChild>
                        <TouchableOpacity style={styles.registerButton}>
                            <Text style={styles.registerButtonText}>Create New Account</Text>
                        </TouchableOpacity>
                    </Link>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    keyboardView: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: spacing.lg,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    logoCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.primary + '20',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
    },
    appName: {
        fontSize: 32,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    tagline: {
        color: colors.textMuted,
        fontSize: 14,
        marginTop: spacing.xs,
    },
    form: {
        backgroundColor: colors.cardBackground,
        padding: spacing.lg,
        borderRadius: borderRadius.xl,
    },
    formTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: spacing.xs,
    },
    formSubtitle: {
        color: colors.textMuted,
        marginBottom: spacing.lg,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.cardBackgroundLight,
        borderRadius: borderRadius.md,
        marginBottom: spacing.md,
        paddingHorizontal: spacing.md,
    },
    inputIcon: {
        marginRight: spacing.sm,
    },
    input: {
        flex: 1,
        paddingVertical: spacing.md,
        color: colors.textPrimary,
        fontSize: 16,
    },
    errorContainer: {
        backgroundColor: colors.danger + '20',
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginBottom: spacing.md,
    },
    errorText: {
        color: colors.danger,
        textAlign: 'center',
    },
    loginButton: {
        backgroundColor: colors.primary,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    loginButtonDisabled: {
        opacity: 0.7,
    },
    loginButtonText: {
        color: colors.textPrimary,
        fontWeight: 'bold',
        fontSize: 16,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: spacing.lg,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: colors.cardBackgroundLight,
    },
    dividerText: {
        color: colors.textMuted,
        marginHorizontal: spacing.md,
        fontSize: 12,
    },
    registerButton: {
        borderWidth: 1,
        borderColor: colors.primary,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        alignItems: 'center',
    },
    registerButtonText: {
        color: colors.primary,
        fontWeight: '600',
    },
});
