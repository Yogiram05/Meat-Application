import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    Alert, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '../constants/DesignSystem';
import { useData } from '../context/DataContext';
import { requestResponse } from '../services/apiClient';

export default function RegisterScreen({ navigation }: { navigation: any }) {
    const { setCurrentUser, apiStatus, apiMessage } = useData();
    const [username, setUsername] = useState('');
    const [gmail, setGmail]       = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm]   = useState('');
    const [loading, setLoading]   = useState(false);
    const [showPass, setShowPass] = useState(false);

    const handleRegister = async () => {
        if (loading) {
            return;
        }

        if (!username.trim() || !gmail.trim() || !password || !confirm) {
            Alert.alert('Missing Fields', 'Please fill in all fields.');
            return;
        }
        if (password !== confirm) {
            Alert.alert('Password Mismatch', 'Passwords do not match. Please try again.');
            return;
        }
        if (password.length < 6) {
            Alert.alert('Weak Password', 'Password must be at least 6 characters.');
            return;
        }

        setLoading(true);
        try {
            const { response, baseUrl } = await requestResponse('/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: username.trim(), gmail: gmail.trim(), password }),
            }, { retries: 1, timeoutMs: 30000 });
            const data = await response.json();
            console.log(`[auth] register request completed via ${baseUrl}`);
            if (!response.ok) {
                Alert.alert('Registration Failed', data.error || 'Something went wrong.');
                return;
            }
            // Auto-login after registration
            await setCurrentUser(data.user);
            Alert.alert('Welcome! 🎉', `Account created for ${data.user.username}`, [
                { text: 'Start Shopping', onPress: () => navigation.replace('Main') }
            ]);
        } catch (err) {
            Alert.alert('Connection Error', 'Could not reach the server. Check your network.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {apiStatus === 'offline' && (
                        <View style={styles.networkCard}>
                            <Text style={styles.networkTitle}>Server unreachable</Text>
                            <Text style={styles.networkText}>{apiMessage || 'Registration needs the backend to be online.'}</Text>
                        </View>
                    )}

                    {/* Back */}
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={22} color={Colors.primary} />
                        <Text style={styles.backText}>Back to Login</Text>
                    </TouchableOpacity>

                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.logoCircle}>
                            <Text style={{ fontSize: 36 }}>🥩</Text>
                        </View>
                        <Text style={styles.title}>Create Account</Text>
                        <Text style={styles.subtitle}>Join Premium Meat for fresh daily orders</Text>
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
                        {/* Name */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Full Name</Text>
                            <View style={styles.inputRow}>
                                <Ionicons name="person-outline" size={18} color={Colors.textLight} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Your name"
                                    placeholderTextColor={Colors.textLight}
                                    value={username}
                                    onChangeText={setUsername}
                                    returnKeyType="next"
                                />
                            </View>
                        </View>

                        {/* Gmail */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Gmail Address</Text>
                            <View style={styles.inputRow}>
                                <Ionicons name="mail-outline" size={18} color={Colors.textLight} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="you@gmail.com"
                                    placeholderTextColor={Colors.textLight}
                                    value={gmail}
                                    onChangeText={setGmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    returnKeyType="next"
                                />
                            </View>
                        </View>

                        {/* Password */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Password</Text>
                            <View style={styles.inputRow}>
                                <Ionicons name="lock-closed-outline" size={18} color={Colors.textLight} style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, { flex: 1 }]}
                                    placeholder="Minimum 6 characters"
                                    placeholderTextColor={Colors.textLight}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPass}
                                    returnKeyType="next"
                                />
                                <TouchableOpacity onPress={() => setShowPass(!showPass)} style={{ paddingRight: 12 }}>
                                    <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textLight} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Confirm Password */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Confirm Password</Text>
                            <View style={styles.inputRow}>
                                <Ionicons name="lock-closed-outline" size={18} color={Colors.textLight} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Re-enter password"
                                    placeholderTextColor={Colors.textLight}
                                    value={confirm}
                                    onChangeText={setConfirm}
                                    secureTextEntry={!showPass}
                                    returnKeyType="done"
                                    onSubmitEditing={handleRegister}
                                />
                            </View>
                        </View>

                        {/* Password match indicator */}
                        {confirm.length > 0 && (
                            <Text style={[styles.matchHint, { color: password === confirm ? '#059669' : Colors.primary }]}>
                                {password === confirm ? '✅ Passwords match' : '❌ Passwords do not match'}
                            </Text>
                        )}

                        {/* Register button */}
                        <TouchableOpacity
                            style={[styles.registerBtn, loading && { opacity: 0.7 }]}
                            onPress={handleRegister}
                            disabled={loading}
                        >
                            {loading
                                ? <ActivityIndicator color="#fff" />
                                : <Text style={styles.registerBtnText}>Create Account 🎉</Text>
                            }
                        </TouchableOpacity>

                        {/* Already have account */}
                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Already have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.goBack()}>
                                <Text style={styles.footerLink}>Login</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollContent: {
        flexGrow: 1,
        padding: Spacing.l,
        paddingTop: Spacing.m,
        paddingBottom: Spacing.xl * 2,
    },
    networkCard: {
        backgroundColor: '#FEF2F2',
        borderColor: '#FECACA',
        borderWidth: 1,
        borderRadius: 14,
        padding: Spacing.m,
        marginBottom: Spacing.m,
    },
    networkTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#991B1B',
        marginBottom: 4,
    },
    networkText: {
        fontSize: 13,
        color: '#7F1D1D',
        lineHeight: 18,
    },
    backBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: Spacing.l,
        paddingTop: Spacing.s,
    },
    backText: {
        color: Colors.primary,
        fontWeight: '600',
        fontSize: 15,
    },
    header: {
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    logoCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#FFF5F5',
        borderWidth: 2,
        borderColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.m,
    },
    title: {
        ...Typography.h1,
        marginBottom: 4,
    },
    subtitle: {
        ...Typography.caption,
        fontSize: 14,
        color: Colors.textLight,
        textAlign: 'center',
    },
    form: {
        width: '100%',
        maxWidth: 480,
        alignSelf: 'center',
    },
    inputGroup: {
        marginBottom: Spacing.m,
    },
    label: {
        ...Typography.caption,
        fontWeight: '600',
        marginBottom: Spacing.xs,
        color: Colors.text,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 10,
        backgroundColor: Colors.surface,
        paddingHorizontal: Spacing.s,
    },
    inputIcon: {
        marginRight: 8,
        paddingLeft: 4,
    },
    input: {
        flex: 1,
        height: 50,
        fontSize: 16,
        color: Colors.text,
    },
    matchHint: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: Spacing.m,
        marginTop: -Spacing.s,
    },
    registerBtn: {
        height: 52,
        backgroundColor: Colors.primary,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: Spacing.s,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    registerBtnText: {
        color: Colors.white,
        fontWeight: 'bold',
        fontSize: 16,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: Spacing.l,
    },
    footerText: {
        color: Colors.textLight,
        fontSize: 14,
    },
    footerLink: {
        color: Colors.primary,
        fontWeight: 'bold',
        fontSize: 14,
    },
});
