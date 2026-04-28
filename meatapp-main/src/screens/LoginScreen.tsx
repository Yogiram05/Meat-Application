import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    StatusBar, Alert, KeyboardAvoidingView, Platform, ScrollView,
    TouchableWithoutFeedback, Keyboard,
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography } from '../constants/DesignSystem';
import { useData } from '../context/DataContext';
import { requestResponse } from '../services/apiClient';

const Logo = () => (
    <View style={styles.logoContainer}>
        <View style={styles.logoCircle}>
            <Text style={styles.logoIcon}>🥩</Text>
        </View>
        <Text style={styles.appName}>Premium Meat</Text>
        <Text style={styles.appTagline}>Fresh. Local. Delivered.</Text>
    </View>
);

export default function LoginScreen({ navigation }: { navigation: any }) {
    console.log('🔁 LOGIN RENDER');

    const { setCurrentUser, apiStatus, apiMessage } = useData();
    const [tab, setTab]           = useState<'user' | 'admin'>('user');
    const [gmail, setGmail]       = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading]   = useState(false);

    const handleUserLogin = async () => {
        if (loading) {
            return;
        }

        if (!gmail.trim() || !password.trim()) {
            Alert.alert('Missing Fields', 'Please enter your email and password.');
            return;
        }
        setLoading(true);
        try {
            const { response, baseUrl } = await requestResponse('/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ gmail: gmail.trim(), password }),
            }, { retries: 1, timeoutMs: 30000 });
            const data = await response.json();
            console.log(`[auth] login request completed via ${baseUrl}`);
            if (!response.ok) {
                Alert.alert('Login Failed', data.error || 'Invalid credentials.');
                return;
            }
            await setCurrentUser(data.user);
            navigation.replace('Main');
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Could not reach the server. Check your network.';
            Alert.alert('Connection Error', message);
        } finally {
            setLoading(false);
        }
    };

    const isUser  = tab === 'user';
    const isAdmin = tab === 'admin';

    return (
        <SafeAreaView style={styles.container}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <KeyboardAvoidingView
                    style={styles.keyboardWrap}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        <StatusBar barStyle="dark-content" />

                        <View style={styles.header}>
                            <View style={styles.logoCircle}>
                                <Text style={styles.logoIcon}>🥩</Text>
                            </View>
                            <Text style={styles.brand}>Premium Meat</Text>
                            <Text style={styles.subtitle}>Fresh. Local. Delivered.</Text>
                        </View>

                        <View style={styles.toggleContainer}>
                            <TouchableOpacity
                                style={[styles.toggleBtn, isUser && styles.active]}
                                onPress={() => { setTab('user'); setGmail(''); setPassword(''); }}
                            >
                                <Text style={isUser ? styles.activeText : styles.inactiveText}>👤 User Login</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.toggleBtn, isAdmin && styles.active]}
                                onPress={() => { setTab('admin'); setGmail(''); setPassword(''); }}
                            >
                                <Text style={isAdmin ? styles.activeText : styles.inactiveText}>🔐 Admin</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.title}>{isUser ? 'Welcome Back 👋' : 'Admin Login'}</Text>
                        <Text style={styles.desc}>
                            {isUser
                                ? 'Sign in to order the freshest meat.'
                                : 'Sign in to manage products, orders and shop settings.'}
                        </Text>

                        {apiStatus === 'offline' && (
                            <View style={styles.networkCard}>
                                <Text style={styles.networkTitle}>Server unreachable</Text>
                                <Text style={styles.networkText}>
                                    {apiMessage || 'Check that the backend is running and both devices are on the same network.'}
                                </Text>
                            </View>
                        )}

                        {isUser && (
                            <>
                                <Text style={styles.label}>Gmail Address</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="you@gmail.com"
                                    placeholderTextColor={Colors.textLight}
                                    value={gmail}
                                    onChangeText={setGmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    blurOnSubmit={true}
                                    returnKeyType="next"
                                />

                                <Text style={styles.label}>Password</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="••••••••"
                                    placeholderTextColor={Colors.textLight}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                    blurOnSubmit={true}
                                    returnKeyType="done"
                                    onSubmitEditing={handleUserLogin}
                                />

                                <TouchableOpacity
                                    style={[styles.button, loading && { opacity: 0.7 }]}
                                    onPress={handleUserLogin}
                                    disabled={loading}
                                >
                                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login</Text>}
                                </TouchableOpacity>

                                <View style={styles.bottomRow}>
                                    <Text style={styles.link} onPress={() => navigation.navigate('Register')}>Create New Account</Text>
                                    <Text style={styles.link}>Forgot Password?</Text>
                                </View>
                            </>
                        )}

                        {isAdmin && (
                            <>
                                <Text style={styles.adminHint}>Use a verified admin account to continue.</Text>
                                <TouchableOpacity
                                    style={styles.button}
                                    onPress={() => navigation.navigate('AdminLogin')}
                                >
                                    <Text style={styles.buttonText}>🔐 Open Admin Login</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </ScrollView>
                </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    keyboardWrap: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingTop: 10,
        flexGrow: 1,
        justifyContent: 'flex-start',
    },
    header: {
        alignItems: 'center',
        marginTop: 25,
        marginBottom: 8,
    },
    brand: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#e53935',
        marginTop: 10,
    },
    subtitle: {
        color: '#777',
        marginTop: 5,
        textAlign: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: Spacing.l,
    },
    logoCircle: {
        width: 84,
        height: 84,
        borderRadius: 42,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.s,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
        elevation: 6,
    },
    logoIcon: {
        fontSize: 38,
    },
    appName: {
        ...(Typography?.h2 || {}),
        color: Colors.primary,
        marginBottom: 2,
    },
    appTagline: {
        fontSize: 13,
        color: Colors.textLight,
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#eee',
        borderRadius: 12,
        padding: 4,
        marginBottom: 10,
    },
    toggleBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: 'center',
    },
    active: {
        backgroundColor: Colors.primary,
    },
    activeText: {
        color: '#fff',
        fontWeight: '600',
    },
    inactiveText: {
        color: '#555',
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        marginTop: 5,
        marginBottom: 2,
    },
    desc: {
        color: '#777',
        marginBottom: 8,
    },
    label: {
        marginBottom: 5,
        color: '#555',
    },
    input: {
        width: '100%',
        backgroundColor: '#f0f0f0',
        padding: 14,
        borderRadius: 10,
        marginBottom: 15,
    },
    button: {
        width: '100%',
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#e53935',
        marginTop: 10,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    bottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 15,
    },
    link: {
        color: '#e53935',
        fontWeight: '500',
    },
    adminHint: {
        fontSize: 13,
        color: Colors.textLight,
        marginTop: Spacing.s,
        marginBottom: Spacing.xs,
        textAlign: 'center',
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
});
