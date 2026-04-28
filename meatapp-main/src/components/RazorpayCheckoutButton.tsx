import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { initiatePayment } from '../utils/razorpayService';

type RazorpayCheckoutButtonProps = {
    amount: number;
    customer?: {
        name?: string;
        email?: string;
        contact?: string;
    };
    disabled?: boolean;
    title?: string;
    onSuccess?: () => void;
};

export default function RazorpayCheckoutButton({
    amount,
    customer,
    disabled,
    title,
    onSuccess,
}: RazorpayCheckoutButtonProps) {
    const [loading, setLoading] = useState(false);

    const handlePress = async () => {
        if (loading || disabled || amount <= 0) {
            return;
        }

        setLoading(true);
        const result = await initiatePayment(amount, customer);
        setLoading(false);

        if (result.success) {
            Alert.alert('Payment Success', 'Your payment was completed successfully.');
            onSuccess?.();
            return;
        }

        Alert.alert('Payment Failed', 'Unable to complete the payment.');
    };

    return (
        <TouchableOpacity
            style={[styles.button, (loading || disabled) && { opacity: 0.7 }]}
            onPress={handlePress}
            disabled={loading || disabled}
            activeOpacity={0.85}
        >
            {loading ? (
                <ActivityIndicator color="#fff" />
            ) : (
                <Text style={styles.text}>{title || `Pay Online ₹${Math.round(amount)}`}</Text>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        backgroundColor: '#1E88E5',
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        marginBottom: 10,
    },
    text: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});
