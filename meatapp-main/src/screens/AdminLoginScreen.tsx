import React, { useEffect, useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    StatusBar, Alert, KeyboardAvoidingView, Platform, ScrollView,
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography } from '../constants/DesignSystem';
import { useData } from '../context/DataContext';
import { requestJson } from '../services/apiClient';

export default function AdminLoginScreen({ navigation }: { navigation: any }) {
    const { adminLogin, isAdminAuthenticated, apiStatus, apiMessage } = useData();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isAdminAuthenticated) {
            navigation.replace('AdminDashboard');
        }
    }, [isAdminAuthenticated, navigation]);

    const handleLogin = async () => {
        if (loading) {
            return;
        }

        const trimmedEmail = email.trim();
        if (!trimmedEmail || !password.trim()) {
            setError('Enter both email and password.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const { data, response, baseUrl } = await requestJson<any>('/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: trimmedEmail, password }),
            }, { retries: 1, timeoutMs: 20000 });

            console.log(`[admin] login response via ${baseUrl}`, { success: data?.success, status: response.status });

            if (!response.ok || !data?.success) {
                setError(data?.error || 'Invalid admin credentials.');
                return;
            }

            await adminLogin(data.admin);
            navigation.replace('AdminDashboard');
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unable to reach server.';
            setError(message);
            Alert.alert('Admin Login Failed', message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                    <View style={styles.card}>
                        <View style={styles.iconWrap}>
                            <Text style={styles.icon}>🔐</Text>
                        </View>
                        <Text style={styles.title}>Admin Login</Text>
                        <Text style={styles.subtitle}>Authenticate to access dashboard controls.</Text>

                        {apiStatus === 'offline' && (
                            <View style={styles.banner}>
                                <Text style={styles.bannerText}>{apiMessage || 'Backend is unreachable.'}</Text>
                            </View>
                        )}

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="admin@example.com"
                                placeholderTextColor={Colors.textLight}
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Password</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter password"
                                placeholderTextColor={Colors.textLight}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                returnKeyType="done"
                                onSubmitEditing={handleLogin}
                            />
                        </View>

                        {!!error && <Text style={styles.errorText}>{error}</Text>}

                        <TouchableOpacity style={[styles.button, loading && { opacity: 0.75 }]} onPress={handleLogin} disabled={loading}>
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login</Text>}
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
                            <Text style={styles.backLinkText}>Back to user login</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF7F5' },
    scrollContent: { flexGrow: 1, justifyContent: 'center', padding: Spacing.l },
    card: { backgroundColor: Colors.white, borderRadius: 24, padding: Spacing.xl, borderWidth: 1, borderColor: '#F3D1CC', width: '100%', maxWidth: 480, alignSelf: 'center' },
    iconWrap: { alignSelf: 'center', width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.m },
    icon: { fontSize: 30 },
    title: { ...Typography.h2, textAlign: 'center', marginBottom: 4 },
    subtitle: { textAlign: 'center', color: Colors.textLight, marginBottom: Spacing.l },
    banner: { backgroundColor: '#FEF2F2', borderColor: '#FECACA', borderWidth: 1, borderRadius: 14, padding: Spacing.m, marginBottom: Spacing.m },
    bannerText: { color: '#991B1B' },
    inputGroup: { marginBottom: Spacing.m },
    label: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 8 },
    input: { borderWidth: 1, borderColor: Colors.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, color: Colors.text, backgroundColor: Colors.surface },
    errorText: { color: '#B91C1C', marginBottom: Spacing.m, fontWeight: '600' },
    button: { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    backLink: { marginTop: Spacing.m, alignItems: 'center' },
    backLinkText: { color: Colors.primary, fontWeight: '700' },
});