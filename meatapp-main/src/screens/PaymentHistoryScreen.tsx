import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography } from '../constants/DesignSystem';
import TopNavBar from '../components/TopNavBar';

// Mock Data
const PAYMENTS = [
    { id: 'TXN001', date: '2026-02-05', amount: '$120', method: 'UPI', status: 'Success' },
    { id: 'TXN002', date: '2026-02-01', amount: '$500', method: 'Credit Card', status: 'Success' },
    { id: 'TXN003', date: '2026-01-28', amount: '$90', method: 'UPI', status: 'Refunded' },
];

export default function PaymentHistoryScreen() {
    const renderPaymentItem = ({ item }: { item: any }) => (
        <View style={styles.paymentCard}>
            <View style={styles.paymentRow}>
                <View>
                    <Text style={styles.paymentAmount}>{item.amount}</Text>
                    <Text style={styles.paymentMethod}>{item.method}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.paymentStatus, { color: item.status === 'Success' ? Colors.success : Colors.textLight }]}>
                        {item.status}
                    </Text>
                    <Text style={styles.paymentDate}>{item.date}</Text>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <TopNavBar title="Payments" />
            <FlatList
                data={PAYMENTS}
                renderItem={renderPaymentItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    listContent: {
        padding: Spacing.m,
    },
    paymentCard: {
        backgroundColor: Colors.white,
        borderRadius: 8,
        padding: Spacing.m,
        marginBottom: Spacing.s,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    paymentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    paymentAmount: {
        ...Typography.h3,
        fontWeight: 'bold',
    },
    paymentMethod: {
        ...Typography.caption,
        marginTop: 4,
    },
    paymentStatus: {
        ...Typography.body,
        fontWeight: '600',
        marginBottom: 4,
    },
    paymentDate: {
        ...Typography.caption,
    },
});
