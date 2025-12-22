import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../constants/Config';
import { router } from 'expo-router';
import { colors, spacing, borderRadius } from '../constants/Theme';
import { Mail, Lock, User, ArrowLeft } from 'lucide-react-native';

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!name || !email || !password || !confirmPassword) {
            setError('Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        setError('');
        try {
            await axios.post(`${API_URL}/auth/register`, { name, email, password });
            router.replace('/login');
        } catch (e: any) {
            setError(e.response?.data?.message || 'Registration failed');
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
                <ScrollView showsVerticalScrollIndicator={false}>
                    {/* Back Button */}
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <ArrowLeft size={24} color={colors.textPrimary} />
                    </TouchableOpacity>

                    {/* Logo */}
                    <View style={styles.logoContainer}>
                        <View style={styles.logoCircle}>
                            <User size={40} color={colors.success} />
                        </View>
                        <Text style={styles.appName}>Create Account</Text>
                        <Text style={styles.tagline}>Start tracking your finances</Text>
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
                        <View style={styles.inputContainer}>
                            <User size={20} color={colors.textMuted} style={styles.inputIcon} />
                            <TextInput
                                placeholder="Your Name"
                                placeholderTextColor={colors.textMuted}
                                style={styles.input}
                                value={name}
                                onChangeText={setName}
                                autoCapitalize="words"
                            />
                        </View>

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

                        <View style={styles.inputContainer}>
                            <Lock size={20} color={colors.textMuted} style={styles.inputIcon} />
                            <TextInput
                                placeholder="Confirm Password"
                                placeholderTextColor={colors.textMuted}
                                style={styles.input}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                            />
                        </View>

                        {error ? (
                            <View style={styles.errorContainer}>
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        ) : null}

                        <TouchableOpacity
                            style={[styles.registerButton, loading && styles.registerButtonDisabled]}
                            onPress={handleRegister}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color={colors.textPrimary} />
                            ) : (
                                <Text style={styles.registerButtonText}>Create Account</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.loginLink} onPress={() => router.back()}>
                            <Text style={styles.loginLinkText}>
                                Already have an account? <Text style={styles.loginLinkBold}>Sign In</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
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
        paddingHorizontal: spacing.lg,
    },
    backButton: {
        marginTop: spacing.md,
        marginBottom: spacing.lg,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    logoCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.success + '20',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
    },
    appName: {
        fontSize: 28,
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
        marginBottom: spacing.xl,
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
    registerButton: {
        backgroundColor: colors.success,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        shadowColor: colors.success,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    registerButtonDisabled: {
        opacity: 0.7,
    },
    registerButtonText: {
        color: colors.textPrimary,
        fontWeight: 'bold',
        fontSize: 16,
    },
    loginLink: {
        alignItems: 'center',
        marginTop: spacing.lg,
    },
    loginLinkText: {
        color: colors.textMuted,
    },
    loginLinkBold: {
        color: colors.primary,
        fontWeight: '600',
    },
});
