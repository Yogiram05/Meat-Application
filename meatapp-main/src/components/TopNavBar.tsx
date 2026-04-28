import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography } from '../constants/DesignSystem';

interface TopNavBarProps {
    title?: string;
    leftContent?: React.ReactNode;
    rightContent?: React.ReactNode;
}

export default function TopNavBar({ title, leftContent, rightContent }: TopNavBarProps) {
    return (
        <View style={styles.container}>
            <View style={styles.leftSection}>
                {leftContent}
            </View>
            <View style={styles.centerSection}>
                {title && <Text style={styles.title}>{title}</Text>}
            </View>
            <View style={styles.rightSection}>
                {rightContent}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.primary, // Premium Red Background
        paddingHorizontal: Spacing.m,
        paddingVertical: Spacing.m,
        // Elevation for Android
        elevation: 6,
        // Shadow for iOS
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        borderBottomLeftRadius: 16, // Added subtle curve
        borderBottomRightRadius: 16,
    },
    leftSection: {
        flex: 1,
        alignItems: 'flex-start',
        justifyContent: 'center',
    },
    centerSection: {
        flex: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rightSection: {
        flex: 1,
        alignItems: 'flex-end',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: Spacing.s,
    },
    title: {
        ...Typography.h3,
        color: Colors.white, // White text for contrast
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
});
