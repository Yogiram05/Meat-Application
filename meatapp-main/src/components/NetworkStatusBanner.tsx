import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '../constants/DesignSystem';
import { useData } from '../context/DataContext';

export default function NetworkStatusBanner() {
    const { apiStatus, apiMessage, retryConnection } = useData();

    if (apiStatus === 'online' || apiStatus === 'unknown') {
        return null;
    }

    const isChecking = apiStatus === 'checking';

    return (
        <View style={[styles.container, isChecking ? styles.checking : styles.offline]}>
            <View style={styles.textWrap}>
                <Ionicons
                    name={isChecking ? 'cloud-upload-outline' : 'cloud-offline-outline'}
                    size={18}
                    color={Colors.white}
                />
                <Text style={styles.title} numberOfLines={1}>
                    {isChecking ? 'Connecting to backend...' : 'Backend unreachable'}
                </Text>
            </View>
            <Text style={styles.message} numberOfLines={2}>
                {apiMessage || (isChecking
                    ? 'Verifying server access and retrying automatically.'
                    : 'The app is using offline fallback data until the server is reachable.')}
            </Text>
            {!isChecking && (
                <TouchableOpacity style={styles.retryBtn} onPress={retryConnection}>
                    <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginHorizontal: Spacing.m,
        marginTop: Spacing.s,
        marginBottom: Spacing.s,
        padding: Spacing.m,
        borderRadius: 14,
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },
    offline: {
        backgroundColor: '#991B1B',
    },
    checking: {
        backgroundColor: '#B45309',
    },
    textWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    title: {
        ...Typography.button,
        color: Colors.white,
        flexShrink: 1,
    },
    message: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.95)',
        lineHeight: 18,
        marginBottom: Spacing.s,
    },
    retryBtn: {
        alignSelf: 'flex-start',
        backgroundColor: Colors.white,
        paddingHorizontal: Spacing.m,
        paddingVertical: 8,
        borderRadius: 999,
    },
    retryText: {
        color: Colors.primary,
        fontWeight: '700',
    },
});