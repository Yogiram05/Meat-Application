import React, { useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity, Alert,
    TextInput, Linking, ActivityIndicator, Animated, Easing, Modal,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography } from '../constants/DesignSystem';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../context/DataContext';
import TopNavBar from '../components/TopNavBar';
import RazorpayCheckoutButton from '../components/RazorpayCheckoutButton';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ── Animated cart row ─────────────────────────────────────────────────────────
function AnimatedCartItem({ item, index, onRemove }: { item: any; index: number; onRemove: () => void }) {
    const slideX = useRef(new Animated.Value(-SCREEN_W)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(slideX, {
                toValue: 0,
                duration: 380,
                delay: index * 80,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 1,
                duration: 380,
                delay: index * 80,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const handleRemove = () => {
        Animated.parallel([
            Animated.timing(slideX, {
                toValue: SCREEN_W,
                duration: 300,
                easing: Easing.in(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start(() => onRemove());
    };

    return (
        <Animated.View style={[styles.cartItem, { transform: [{ translateX: slideX }], opacity }]}>
            <View style={styles.itemInfo}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemDetails}>
                    {item.cut} • {item.quantity}kg
                    {item.cleaning && item.cleaning.length > 0 ? ` • ${item.cleaning.join(', ')}` : ''}
                </Text>
            </View>
            <View style={styles.itemPriceActions}>
                <Text style={styles.itemPrice}>{item.price}</Text>
                <TouchableOpacity onPress={handleRemove} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="trash-outline" size={20} color={Colors.error || 'red'} />
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
}

// ── Success overlay ───────────────────────────────────────────────────────────
function SuccessOverlay({ visible, isPreBooking, formatCurrency, advance, onViewOrders, onHome }: any) {
    const scale     = useRef(new Animated.Value(0)).current;
    const opacity   = useRef(new Animated.Value(0)).current;
    const checkScale = useRef(new Animated.Value(0)).current;
    const pulseAnim  = useRef(new Animated.Value(1)).current;
    const ring1      = useRef(new Animated.Value(0)).current;
    const ring2      = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            // Background fade-in
            Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
            // Card pop-in
            Animated.spring(scale, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }).start();
            // Check icon bounce
            Animated.sequence([
                Animated.delay(300),
                Animated.spring(checkScale, { toValue: 1, tension: 120, friction: 6, useNativeDriver: true }),
            ]).start();
            // Pulse rings
            const ringLoop = (anim: Animated.Value, delay: number) =>
                Animated.loop(
                    Animated.sequence([
                        Animated.delay(delay),
                        Animated.timing(anim, { toValue: 1, duration: 900, easing: Easing.out(Easing.ease), useNativeDriver: true }),
                        Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
                    ])
                ).start();
            ringLoop(ring1, 400);
            ringLoop(ring2, 900);
            // Button pulse
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.04, duration: 700, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
                ])
            ).start();
        } else {
            scale.setValue(0);
            opacity.setValue(0);
            checkScale.setValue(0);
            ring1.setValue(0);
            ring2.setValue(0);
        }
    }, [visible]);

    if (!visible) return null;

    const ringStyle = (anim: Animated.Value) => ({
        position: 'absolute' as const,
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 2,
        borderColor: '#22c55e',
        opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] }),
        transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.2] }) }],
    });

    return (
        <Modal transparent animationType="none" visible={visible}>
            <Animated.View style={[styles.overlayBg, { opacity }]}>
                <Animated.View style={[styles.overlayCard, { transform: [{ scale }] }]}>
                    {/* Rings */}
                    <View style={styles.iconWrapper}>
                        <Animated.View style={ringStyle(ring1)} />
                        <Animated.View style={ringStyle(ring2)} />
                        <Animated.View style={[styles.checkCircle, { transform: [{ scale: checkScale }] }]}>
                            <Ionicons name="checkmark" size={52} color="#fff" />
                        </Animated.View>
                    </View>

                    <Text style={styles.successTitle}>
                        {isPreBooking ? 'Pre-booking Confirmed! 🎉' : 'Order Placed! 🎉'}
                    </Text>
                    <Text style={styles.successSub}>
                        {isPreBooking
                            ? `Advance payable: ${formatCurrency(advance)}. We'll confirm soon!`
                            : `Your order is on its way to Pradeep Meat Shop via WhatsApp.`}
                    </Text>

                    {/* Stepper */}
                    <View style={styles.stepper}>
                        {['Order Placed', 'Confirmed', 'Processing', 'Delivered'].map((step, i) => (
                            <View key={i} style={styles.stepItem}>
                                <View style={[styles.stepDot, i === 0 && styles.stepDotActive]}>
                                    {i === 0
                                        ? <Ionicons name="checkmark" size={12} color="#fff" />
                                        : <View style={styles.stepDotInner} />}
                                </View>
                                {i < 3 && <View style={[styles.stepLine, i === 0 && styles.stepLineActive]} />}
                                <Text style={[styles.stepLabel, i === 0 && styles.stepLabelActive]}>{step}</Text>
                            </View>
                        ))}
                    </View>

                    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                        <TouchableOpacity style={styles.overlayPrimaryBtn} onPress={onViewOrders}>
                            <Ionicons name="receipt-outline" size={18} color="#fff" />
                            <Text style={styles.overlayPrimaryBtnText}>View My Orders</Text>
                        </TouchableOpacity>
                    </Animated.View>
                    <TouchableOpacity style={styles.overlaySecondaryBtn} onPress={onHome}>
                        <Text style={styles.overlaySecondaryBtnText}>Back to Home</Text>
                    </TouchableOpacity>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
}

// ── Main CartScreen ───────────────────────────────────────────────────────────
export default function CartScreen({ navigation }: { navigation: any }) {
    const { cart, removeFromCart, placeOrder, formatCurrency, currentUser } = useData();
    const [isPreBooking, setIsPreBooking] = React.useState(false);
    const [description, setDescription]   = React.useState('');
    const [checkingOut, setCheckingOut]   = React.useState(false);
    const [showSuccess, setShowSuccess]   = React.useState(false);
    const [advance, setAdvance]           = React.useState(0);

    // Footer slide-up
    const footerY   = useRef(new Animated.Value(200)).current;
    const footerOp  = useRef(new Animated.Value(0)).current;
    // Checkout button pulse when idle
    const btnPulse  = useRef(new Animated.Value(1)).current;
    // Pre-booking toggle flip
    const preBookFlip = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(footerY, { toValue: 0, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            Animated.timing(footerOp, { toValue: 1, duration: 450, useNativeDriver: true }),
        ]).start();

        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(btnPulse, { toValue: 1.03, duration: 800, useNativeDriver: true }),
                Animated.timing(btnPulse, { toValue: 1, duration: 800, useNativeDriver: true }),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, []);

    const togglePreBooking = () => {
        const next = !isPreBooking;
        setIsPreBooking(next);
        Animated.timing(preBookFlip, {
            toValue: next ? 1 : 0,
            duration: 300,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
        }).start();
    };

    const advancePanelHeight = preBookFlip.interpolate({ inputRange: [0, 1], outputRange: [0, 56] });
    const advancePanelOp     = preBookFlip;

    const calculateTotal = () =>
        cart.reduce((total, item) => {
            const price = parseFloat(String(item.price).replace(/[^0-9.]/g, ''));
            return total + price * item.quantity;
        }, 0);

    const paymentAmount = isPreBooking ? calculateTotal() / 2 : calculateTotal();

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        setCheckingOut(true);

        const totalAmount   = calculateTotal();
        const advanceAmount = isPreBooking ? totalAmount / 2 : 0;
        setAdvance(advanceAmount);
        const orderId = Date.now().toString();

        const newOrder = {
            items: [...cart],
            total: totalAmount,
            date: new Date().toISOString(),
            status: 'Pending' as const,
            isPreBooking,
            advancePaid: advanceAmount,
            description: description.trim(),
        };

        let message = `*New Order — Pradeep Meat Shop*\n`;
        message += `Customer: ${currentUser?.username || 'Guest'}\n`;
        message += `Order ID: #${orderId.slice(-6).toUpperCase()}\n`;
        message += `-------------------\n`;
        cart.forEach((item) => {
            message += `• ${item.title} (${item.cut}) - ${item.quantity}kg\n`;
            if (item.cleaning && item.cleaning.length > 0) message += `  Note: ${item.cleaning.join(', ')}\n`;
        });
        message += `-------------------\n`;
        if (description.trim()) message += `*Instructions:* ${description.trim()}\n`;
        message += `*Total:* ${formatCurrency(totalAmount)}\n`;
        if (isPreBooking) {
            message += `*Advance (50%):* ${formatCurrency(advanceAmount)}\n`;
            message += `*Payment Status:* Initiated via UPI\n`;
            message += `\n⚠️ *Important:* Please attach your payment screenshot in this chat as proof of advance payment.\n`;
        }

        const phoneNumber  = '919384979853';
        let whatsappMsgText = message;

        const finalizeOrder = async () => {
            await placeOrder(newOrder);
            setCheckingOut(false);
            setShowSuccess(true);
        };

        const triggerWhatsApp = (finalMsg: string) => {
            const whatsappUrl = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(finalMsg)}`;
            const webUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(finalMsg)}`;
            Linking.canOpenURL(whatsappUrl)
                .then((supported) => Linking.openURL(supported ? whatsappUrl : webUrl))
                .then(() => finalizeOrder())
                .catch(() => finalizeOrder());
        };

        if (isPreBooking) {
            // Initiate UPI Intent for local payment apps
            const upiUrl = `upi://pay?pa=9384979853@upi&pn=Pradeep%20Meat%20Shop&am=${advanceAmount}&cu=INR&tn=Advance%20Payment`;
            Linking.canOpenURL(upiUrl)
                .then((supported) => {
                    if (supported) {
                        Linking.openURL(upiUrl)
                            .then(() => {
                                Alert.alert(
                                    "Payment Initiated",
                                    "Once your payment is complete, press OK to send your order details and payment screenshot via WhatsApp.",
                                    [{ text: "OK - Open WhatsApp", onPress: () => triggerWhatsApp(whatsappMsgText) }]
                                );
                            })
                            .catch(() => triggerWhatsApp(whatsappMsgText)); // Open WP directly if UPI fails to open
                    } else {
                        // UPI apps not found, default to WP
                        whatsappMsgText += `\n(Could not open UPI app automatically. Ask for QR via chat.)`;
                        triggerWhatsApp(whatsappMsgText);
                    }
                })
                .catch(() => triggerWhatsApp(whatsappMsgText));
        } else {
            triggerWhatsApp(whatsappMsgText);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <TopNavBar
                title="My Cart"
                leftContent={
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: Spacing.xs }}>
                        <Ionicons name="arrow-back" size={24} color={Colors.white} />
                    </TouchableOpacity>
                }
            />

            <FlatList
                data={cart}
                renderItem={({ item, index }) => (
                    <AnimatedCartItem
                        key={item.id}
                        item={item}
                        index={index}
                        onRemove={() => removeFromCart(item.id)}
                    />
                )}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="cart-outline" size={64} color={Colors.border} />
                        <Text style={styles.emptyText}>Cart is empty</Text>
                    </View>
                }
            />

            {/* ── Animated Footer ── */}
            <Animated.View style={[styles.footer, { transform: [{ translateY: footerY }], opacity: footerOp }]}>
                {/* Special instructions */}
                <View style={styles.descriptionContainer}>
                    <Text style={styles.descriptionLabel}>Any special instructions?</Text>
                    <TextInput
                        style={styles.descriptionInput}
                        placeholder="E.g., Please chop into small pieces..."
                        value={description}
                        onChangeText={setDescription}
                        multiline
                    />
                </View>

                {/* Pre-booking toggle */}
                <TouchableOpacity
                    style={[styles.preBookingRow, isPreBooking && styles.preBookingRowActive]}
                    onPress={togglePreBooking}
                    activeOpacity={0.8}
                >
                    <Ionicons
                        name={isPreBooking ? 'checkbox' : 'square-outline'}
                        size={24}
                        color={Colors.primary}
                    />
                    <View style={styles.preBookTextContainer}>
                        <Text style={styles.preBookTitle}>Pre-book for Later?</Text>
                        <Text style={styles.preBookSubtitle}>Pay 50% advance now</Text>
                    </View>
                    <Ionicons
                        name={isPreBooking ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={Colors.textLight}
                    />
                </TouchableOpacity>

                {/* Animated advance row */}
                <Animated.View style={{ height: advancePanelHeight, opacity: advancePanelOp, overflow: 'hidden' }}>
                    <View style={styles.advanceRow}>
                        <Text style={styles.advanceLabel}>Advance Payable (50%)</Text>
                        <Text style={styles.advanceValue}>{formatCurrency(calculateTotal() / 2)}</Text>
                    </View>
                </Animated.View>

                {/* Total */}
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalValue}>{formatCurrency(calculateTotal())}</Text>
                </View>

                {/* Checkout button with pulse */}
                <RazorpayCheckoutButton
                    amount={paymentAmount}
                    customer={{
                        name: currentUser?.username || 'User',
                        email: currentUser?.gmail,
                    }}
                    disabled={cart.length === 0}
                    title={isPreBooking ? 'Pay Advance Online' : 'Pay Online'}
                />

                <Animated.View style={{ transform: [{ scale: checkingOut ? 1 : btnPulse }] }}>
                    <TouchableOpacity
                        style={[styles.checkoutButton, checkingOut && { opacity: 0.7 }]}
                        onPress={handleCheckout}
                        disabled={checkingOut}
                        activeOpacity={0.85}
                    >
                        {checkingOut ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <ActivityIndicator color="#fff" />
                                <Text style={styles.checkoutText}>Processing...</Text>
                            </View>
                        ) : (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Ionicons name={isPreBooking ? "card" : "logo-whatsapp"} size={20} color="#fff" />
                                <Text style={styles.checkoutText}>
                                    {isPreBooking ? 'Pay Advance & Order' : 'Place Order via WhatsApp'}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </Animated.View>
            </Animated.View>

            {/* ── Success Overlay ── */}
            <SuccessOverlay
                visible={showSuccess}
                isPreBooking={isPreBooking}
                formatCurrency={formatCurrency}
                advance={advance}
                onViewOrders={() => { setShowSuccess(false); navigation.navigate('Orders'); }}
                onHome={() => { setShowSuccess(false); navigation.navigate('Home'); }}
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
        paddingBottom: Spacing.xl,
    },
    cartItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: Colors.white,
        padding: Spacing.m,
        borderRadius: 12,
        marginBottom: Spacing.m,
        borderWidth: 1,
        borderColor: Colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },
    itemInfo: { flex: 1 },
    itemTitle: { ...Typography.body, fontWeight: '600' },
    itemDetails: { ...Typography.caption, marginTop: 4, color: Colors.textLight },
    itemPriceActions: { alignItems: 'flex-end', justifyContent: 'space-between' },
    itemPrice: { ...Typography.body, fontWeight: 'bold', color: Colors.primary },

    footer: {
        padding: Spacing.m,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        backgroundColor: Colors.white,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 10,
    },
    descriptionContainer: { marginBottom: Spacing.m },
    descriptionLabel: { ...Typography.caption, fontWeight: 'bold', color: Colors.text, marginBottom: 4 },
    descriptionInput: {
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 8,
        padding: Spacing.s,
        minHeight: 56,
        textAlignVertical: 'top',
        backgroundColor: '#FAFAFA',
        fontSize: 13,
    },
    preBookingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0FDF4',
        padding: Spacing.m,
        borderRadius: 10,
        marginBottom: Spacing.m,
        borderWidth: 1,
        borderColor: Colors.success,
    },
    preBookingRowActive: {
        backgroundColor: '#DCFCE7',
        borderColor: '#16A34A',
    },
    preBookTextContainer: { flex: 1, marginLeft: Spacing.m },
    preBookTitle: { fontWeight: 'bold', color: Colors.text, fontSize: 14 },
    preBookSubtitle: { fontSize: 12, color: Colors.textLight },

    advanceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Spacing.s,
        paddingHorizontal: Spacing.s,
        backgroundColor: '#F0FDF4',
        borderRadius: 8,
        marginBottom: Spacing.s,
    },
    advanceLabel: { ...Typography.body, fontWeight: '600', color: Colors.text },
    advanceValue: { ...Typography.h3, color: Colors.success },

    totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.m },
    totalLabel: { ...Typography.h3 },
    totalValue: { ...Typography.h2, color: Colors.primary },

    checkoutButton: {
        backgroundColor: Colors.success || '#16a34a',
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        shadowColor: Colors.success || '#16a34a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 6,
    },
    checkoutText: { ...Typography.button, fontSize: 17, color: '#fff' },

    emptyContainer: { alignItems: 'center', marginTop: Spacing.xl * 2 },
    emptyText: { ...Typography.body, color: Colors.textLight, marginTop: Spacing.m },

    // ── Success overlay ──
    overlayBg: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.55)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.l,
    },
    overlayCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: Spacing.l,
        width: '100%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.2,
        shadowRadius: 30,
        elevation: 20,
    },
    iconWrapper: {
        width: 100,
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.m,
    },
    checkCircle: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: '#22c55e',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#22c55e',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    successTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.text,
        textAlign: 'center',
        marginBottom: 6,
    },
    successSub: {
        fontSize: 13,
        color: Colors.textLight,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: Spacing.l,
    },
    // Stepper
    stepper: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'center',
        marginBottom: Spacing.l,
        width: '100%',
    },
    stepItem: {
        alignItems: 'center',
        flex: 1,
    },
    stepDot: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: Colors.border,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    stepDotActive: {
        backgroundColor: '#22c55e',
    },
    stepDotInner: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#fff',
    },
    stepLine: {
        position: 'absolute',
        top: 11,
        left: '60%',
        right: '-40%',
        height: 2,
        backgroundColor: Colors.border,
    },
    stepLineActive: {
        backgroundColor: '#22c55e',
    },
    stepLabel: {
        fontSize: 9,
        color: Colors.textLight,
        textAlign: 'center',
        fontWeight: '500',
    },
    stepLabelActive: {
        color: '#16a34a',
        fontWeight: '700',
    },
    overlayPrimaryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: Colors.primary,
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 12,
        marginBottom: Spacing.s,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    overlayPrimaryBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
    overlaySecondaryBtn: {
        paddingVertical: 10,
        paddingHorizontal: 24,
    },
    overlaySecondaryBtnText: { color: Colors.textLight, fontSize: 14, fontWeight: '600' },
});
