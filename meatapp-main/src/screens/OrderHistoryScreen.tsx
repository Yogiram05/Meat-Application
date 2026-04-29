import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, RefreshControl, Animated, Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '../constants/DesignSystem';
import { useData } from '../context/DataContext';
import TopNavBar from '../components/TopNavBar';
import { requestJson } from '../services/apiClient';

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    Pending:    { bg: '#FFF9C4', text: '#F59E0B', border: '#FDE68A' },
    Confirmed:  { bg: '#DCFCE7', text: '#16A34A', border: '#BBF7D0' },
    Processing: { bg: '#DBEAFE', text: '#2563EB', border: '#BFDBFE' },
    Delivered:  { bg: '#F0FDF4', text: '#059669', border: '#A7F3D0' },
    Declined:   { bg: '#FEE2E2', text: '#DC2626', border: '#FECACA' },
    Cancelled:  { bg: '#F3F4F6', text: '#6B7280', border: '#E5E7EB' },
};

// ── Animated order card ───────────────────────────────────────────────────────
function OrderCard({ order, index }: { order: any; index: number }) {
    const [expanded, setExpanded] = useState(false);
    const statusStyle = STATUS_COLORS[order.status] || STATUS_COLORS['Pending'];

    // Entrance animation
    const slideY = useRef(new Animated.Value(60)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    // Expand animation
    const expandHeight = useRef(new Animated.Value(0)).current;
    const expandOp     = useRef(new Animated.Value(0)).current;
    // Status badge pulse
    const statusPulse  = useRef(new Animated.Value(1)).current;
    // Card press scale
    const pressScale   = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(slideY, {
                toValue: 0,
                duration: 420,
                delay: index * 90,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 1,
                duration: 420,
                delay: index * 90,
                useNativeDriver: true,
            }),
        ]).start();

        if (order.status === 'Pending') {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(statusPulse, { toValue: 1.12, duration: 700, useNativeDriver: true }),
                    Animated.timing(statusPulse, { toValue: 1, duration: 700, useNativeDriver: true }),
                ])
            ).start();
        }
    }, []);

    const toggleExpand = () => {
        const next = !expanded;
        setExpanded(next);

        Animated.parallel([
            Animated.timing(expandHeight, {
                toValue: next ? 1 : 0,
                duration: 320,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: false,
            }),
            Animated.timing(expandOp, {
                toValue: next ? 1 : 0,
                duration: 250,
                useNativeDriver: false,
            }),
        ]).start();
    };

    const onPressIn  = () => Animated.spring(pressScale, { toValue: 0.97, useNativeDriver: true }).start();
    const onPressOut = () => Animated.spring(pressScale, { toValue: 1, useNativeDriver: true }).start();

    const formattedDate = new Date(order.date).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });

    const estimatedLines = (order.items?.length || 0) * 28 + 80;
    const maxH = expandHeight.interpolate({ inputRange: [0, 1], outputRange: [0, estimatedLines] });

    return (
        <Animated.View style={[styles.card, { transform: [{ translateY: slideY }, { scale: pressScale }], opacity }]}>
            <TouchableOpacity
                onPress={toggleExpand}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                activeOpacity={1}
            >
                {/* Header */}
                <View style={styles.cardHeader}>
                    <View style={styles.orderMeta}>
                        <Text style={styles.orderId}>
                            Order #{String(order._id || order.id).slice(-6).toUpperCase()}
                        </Text>
                        <Text style={styles.orderDate}>{formattedDate}</Text>
                    </View>
                    <Animated.View style={[styles.statusBadge, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border, transform: order.status === 'Pending' ? [{ scale: statusPulse }] : [] }]}>
                        <View style={[styles.statusDot, { backgroundColor: statusStyle.text }]} />
                        <Text style={[styles.statusText, { color: statusStyle.text }]}>{order.status}</Text>
                    </Animated.View>
                </View>

                {/* Summary */}
                <View style={styles.summaryRow}>
                    <View style={styles.summaryLeft}>
                        <Ionicons name="bag-handle-outline" size={14} color={Colors.textLight} />
                        <Text style={styles.summaryItems}>
                            {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}
                        </Text>
                    </View>
                    <Text style={styles.summaryTotal}>₹{order.total}</Text>
                    <Animated.View style={{ transform: [{ rotate: expandHeight.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }) }] }}>
                        <Ionicons name="chevron-down" size={18} color={Colors.textLight} />
                    </Animated.View>
                </View>

                {/* Expandable content */}
                <Animated.View style={{ height: maxH, opacity: expandOp, overflow: 'hidden' }}>
                    <View style={styles.divider} />
                    {(order.items || []).map((item: any, idx: number) => (
                        <View key={idx} style={styles.itemRow}>
                            <View style={[styles.itemDot, { backgroundColor: Colors.primary }]} />
                            <Text style={styles.itemName}>{item.title}</Text>
                            <Text style={styles.itemCut}>{item.cut}</Text>
                            <Text style={styles.itemPrice}>{item.price}</Text>
                        </View>
                    ))}
                    {order.isPreBooking && (
                        <View style={styles.preBookRow}>
                            <Ionicons name="time-outline" size={14} color="#2563EB" />
                            <Text style={styles.preBookText}>
                                Pre-booking · Advance: ₹{order.advancePaid}
                            </Text>
                        </View>
                    )}
                    {order.description ? (
                        <Text style={styles.description}>📝 {order.description}</Text>
                    ) : null}
                    {order.declineReason ? (
                        <Text style={styles.declineReason}>❌ Reason: {order.declineReason}</Text>
                    ) : null}
                </Animated.View>
            </TouchableOpacity>
        </Animated.View>
    );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function OrderHistoryScreen({ navigation }: { navigation: any }) {
    const { currentUser, apiStatus, apiMessage } = useData();
    const [orders, setOrders]         = useState<any[]>([]);
    const [loading, setLoading]       = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Header slide-down
    const headerSlide = useRef(new Animated.Value(-60)).current;

    useEffect(() => {
        Animated.timing(headerSlide, { toValue: 0, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    }, []);

    const fetchOrders = async () => {
        if (!currentUser?.id) { setLoading(false); return; }
        try {
            const { data, baseUrl, response } = await requestJson<any[]>(`/orders/user/${currentUser.id}`, { method: 'GET' }, { retries: 1, timeoutMs: 20000 });
            console.log(`[orders] fetched via ${baseUrl}`);
            if (response.ok && Array.isArray(data)) setOrders(data);
        } catch (err) {
            console.warn('Could not fetch orders:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetchOrders(); }, [currentUser]);

    if (!currentUser) {
        return (
            <SafeAreaView style={styles.container}>
                <TopNavBar title="Order History" />
                <View style={styles.centered}>
                    <Ionicons name="person-outline" size={64} color={Colors.border} />
                    <Text style={styles.emptyTitle}>Not logged in</Text>
                    <Text style={styles.emptySubtitle}>Please login to view your order history.</Text>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.replace('Login')}>
                        <Text style={styles.actionBtnText}>Go to Login</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {apiStatus === 'offline' && (
                <View style={styles.networkCard}>
                    <Text style={styles.networkTitle}>Backend offline</Text>
                    <Text style={styles.networkText}>{apiMessage || 'Order history will load once the backend is reachable.'}</Text>
                </View>
            )}
            <TopNavBar
                title="My Orders"
                leftContent={
                    <View style={styles.userInfo}>
                        <Ionicons name="person-circle-outline" size={24} color="#fff" />
                        <Text style={styles.userName}>{currentUser.username}</Text>
                    </View>
                }
            />

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.loadingText}>Loading orders...</Text>
                </View>
            ) : (
                <FlatList
                    data={orders}
                    keyExtractor={(item) => item._id || item.id}
                    renderItem={({ item, index }) => <OrderCard order={item} index={index} />}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} tintColor={Colors.primary} />
                    }
                    ListEmptyComponent={
                        <View style={styles.centered}>
                            <Ionicons name="receipt-outline" size={64} color={Colors.border} />
                            <Text style={styles.emptyTitle}>No orders yet</Text>
                            <Text style={styles.emptySubtitle}>Your order history will appear here.</Text>
                            <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Home')}>
                                <Text style={styles.actionBtnText}>Start Shopping</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}
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
        paddingBottom: Spacing.xl,
    },
    networkCard: {
        backgroundColor: '#FEF2F2',
        borderColor: '#FECACA',
        borderWidth: 1,
        borderRadius: 14,
        padding: Spacing.m,
        margin: Spacing.m,
        marginBottom: 0,
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
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
        marginTop: Spacing.xl,
    },
    userInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    userName: { color: '#fff', fontWeight: '600', fontSize: 13 },

    card: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        marginBottom: Spacing.m,
        padding: Spacing.m,
        borderWidth: 1,
        borderColor: Colors.border,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Spacing.s,
    },
    orderMeta: { flex: 1 },
    orderId: { fontSize: 15, fontWeight: 'bold', color: Colors.text },
    orderDate: { fontSize: 12, color: Colors.textLight, marginTop: 2 },

    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        borderWidth: 1,
    },
    statusDot: { width: 7, height: 7, borderRadius: 4 },
    statusText: { fontSize: 12, fontWeight: '700' },

    summaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    summaryLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 },
    summaryItems: { fontSize: 13, color: Colors.textLight },
    summaryTotal: { fontSize: 15, fontWeight: 'bold', color: Colors.primary, marginRight: 4 },

    divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.s },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 7,
        backgroundColor: '#FAFAFA',
        padding: 8,
        borderRadius: 8,
    },
    itemDot: { width: 8, height: 8, borderRadius: 4 },
    itemName: { flex: 1, fontSize: 13, color: Colors.text, fontWeight: '600' },
    itemCut: { fontSize: 12, color: Colors.textLight, marginRight: 8 },
    itemPrice: { fontSize: 13, fontWeight: 'bold', color: Colors.primary },

    preBookRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 6,
        backgroundColor: '#EFF6FF',
        padding: Spacing.s,
        borderRadius: 8,
    },
    preBookText: { fontSize: 12, color: '#2563EB', fontWeight: '600' },
    description: {
        fontSize: 12,
        color: Colors.textLight,
        fontStyle: 'italic',
        marginTop: 6,
        paddingTop: 6,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    declineReason: { fontSize: 12, color: '#DC2626', marginTop: 6, fontWeight: '600' },

    emptyTitle: { ...Typography.h3, marginTop: Spacing.m, color: Colors.text },
    emptySubtitle: { fontSize: 14, color: Colors.textLight, textAlign: 'center', marginTop: 8 },
    loadingText: { color: Colors.textLight, marginTop: Spacing.m, fontSize: 14 },
    actionBtn: {
        backgroundColor: Colors.primary,
        borderRadius: 12,
        paddingVertical: 13,
        paddingHorizontal: 32,
        marginTop: Spacing.l,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
