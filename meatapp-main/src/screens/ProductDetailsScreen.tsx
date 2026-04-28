import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography } from '../constants/DesignSystem';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../context/DataContext';
import TopNavBar from '../components/TopNavBar';

const CUT_OPTIONS = ['Biryani Cut', 'Gravy Cut', 'Fry Cut', 'Curry Cut', 'Whole Meat'];
const SKINLESS_EXTRA_CHARGE = 20;

export default function ProductDetailsScreen({ route, navigation }: { route: any, navigation: any }) {
    const { product } = route.params;
    const [selectedCut, setSelectedCut] = useState(CUT_OPTIONS[0]);
    const [quantity, setQuantity] = useState(1);
    const [isSkinless, setIsSkinless] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const { addToCart, shopStatus } = useData();

    // Price calculation
    const productTitle = product.title || product.name || 'Product';
    const basePriceNum = parseFloat(String(product.price).replace(/[^0-9.]/g, '')) || 0;
    const currentPricePerKg = isSkinless ? basePriceNum + SKINLESS_EXTRA_CHARGE : basePriceNum;
    const totalPrice = currentPricePerKg * quantity;

    const handleAddToCart = () => {
        if (!shopStatus) {
            alert('Sorry, the shop is currently closed.');
            return;
        }
        
        const cartItem = {
            id: Date.now().toString(),
            title: productTitle,
            price: `₹${currentPricePerKg}`,
            cut: selectedCut,
            quantity: quantity,
            cleaning: isSkinless ? [`Skinless/Cleaned (+₹${SKINLESS_EXTRA_CHARGE})`] : [],
        };
        addToCart(cartItem);
        setShowSuccessModal(true);
    };

    const incrementQty = () => setQuantity(q => q + 0.5);
    const decrementQty = () => setQuantity(q => (q > 0.5 ? q - 0.5 : 0.5));

    const categoryLabel =
        String(product.category || product.type || '').toLowerCase() === 'chicken' ? '🐔 Chicken' :
        String(product.category || product.type || '').toLowerCase() === 'mutton' ? '🐐 Mutton' :
        String(product.category || product.type || '').toLowerCase() === 'combo' ? '🎁 Combo' : '🌟 Special';

    return (
        <SafeAreaView style={styles.container}>
            {/* ─── Consistent TopNavBar with back button ─── */}
            <TopNavBar
                title={productTitle}
                leftContent={
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color={Colors.white} />
                    </TouchableOpacity>
                }
                rightContent={
                    <TouchableOpacity onPress={() => navigation.navigate('Cart')} style={styles.cartBtn}>
                        <Ionicons name="cart-outline" size={24} color={Colors.white} />
                    </TouchableOpacity>
                }
            />

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* ─── Hero Image ─── */}
                {product.image || product.imageUrl ? (
                    <Image source={{ uri: product.image || product.imageUrl }} style={styles.heroImage} resizeMode="cover" />
                ) : (
                    <View style={[styles.heroImage, styles.heroPlaceholder]}>
                        <Text style={{ fontSize: 60 }}>🥩</Text>
                    </View>
                )}

                {/* Category badge overlaid at bottom of image */}
                <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>{categoryLabel}</Text>
                </View>

                <View style={styles.content}>
                    {/* Title + Price */}
                    <View style={styles.headerRow}>
                        <Text style={styles.title}>{productTitle}</Text>
                        <View style={styles.priceBox}>
                            <Text style={styles.price}>₹{currentPricePerKg}</Text>
                            <Text style={styles.unit}>/kg</Text>
                        </View>
                    </View>

                    {product.description ? (
                        <Text style={styles.description}>{product.description}</Text>
                    ) : (
                        <Text style={styles.description}>
                            Fresh, tender, and high-quality meat sourced directly from the farm. Perfect for your family feast.
                        </Text>
                    )}

                    <View style={styles.divider} />

                    {/* Cut Selection */}
                    <Text style={styles.sectionTitle}>Select Cut Type</Text>
                    <View style={styles.optionsGrid}>
                        {CUT_OPTIONS.map((cut) => (
                            <TouchableOpacity
                                key={cut}
                                style={[styles.optionChip, selectedCut === cut && styles.optionChipSelected]}
                                onPress={() => setSelectedCut(cut)}
                            >
                                <Text style={[styles.optionText, selectedCut === cut && styles.optionTextSelected]}>
                                    {cut}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.divider} />

                    {/* Cleaning Preference */}
                    <Text style={styles.sectionTitle}>Cleaning Preference</Text>
                    <TouchableOpacity style={styles.checkboxContainer} onPress={() => setIsSkinless(!isSkinless)}>
                        <Ionicons
                            name={isSkinless ? 'checkbox' : 'square-outline'}
                            size={24}
                            color={Colors.primary}
                        />
                        <View style={{ marginLeft: Spacing.s }}>
                            <Text style={styles.checkboxLabel}>Skinless / Cleaned</Text>
                            <Text style={styles.checkboxSubLabel}>(+ ₹{SKINLESS_EXTRA_CHARGE} / kg)</Text>
                        </View>
                    </TouchableOpacity>

                    <View style={styles.divider} />

                    {/* Quantity */}
                    <Text style={styles.sectionTitle}>Quantity (kg)</Text>
                    <View style={styles.quantityRow}>
                        <TouchableOpacity style={styles.qtyButton} onPress={decrementQty}>
                            <Ionicons name="remove" size={24} color={Colors.primary} />
                        </TouchableOpacity>
                        <Text style={styles.qtyText}>{quantity} kg</Text>
                        <TouchableOpacity style={styles.qtyButton} onPress={incrementQty}>
                            <Ionicons name="add" size={24} color={Colors.primary} />
                        </TouchableOpacity>
                    </View>

                    {/* Stock hint */}
                    <View style={styles.stockContainer}>
                        <Ionicons name="time-outline" size={16} color="#D35400" />
                        <Text style={styles.stockText}>Only a few kgs left! Order soon.</Text>
                    </View>
                </View>
            </ScrollView>

            {/* ─── Footer CTA ─── */}
            <View style={styles.footer}>
                <View style={styles.footerTotal}>
                    <Text style={styles.footerTotalLabel}>Total Amount</Text>
                    <Text style={styles.footerTotalPrice}>₹{totalPrice}</Text>
                </View>
                <TouchableOpacity style={styles.addToCartButton} onPress={handleAddToCart}>
                    <Ionicons name="cart" size={20} color={Colors.white} />
                    <Text style={styles.addToCartText}>Add to Cart</Text>
                </TouchableOpacity>
            </View>

            {/* ─── Success Modal ─── */}
            <Modal visible={showSuccessModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalIconWrapper}>
                            <Ionicons name="checkmark-circle" size={64} color="#16A34A" />
                        </View>
                        <Text style={styles.modalTitle}>Item Added Successfully!</Text>
                        <Text style={styles.modalSub}>{productTitle} is now in your cart.</Text>
                        
                        <View style={styles.modalActions}>
                            <TouchableOpacity 
                                style={[styles.modalBtn, styles.modalSecondaryBtn]} 
                                onPress={() => {
                                    setShowSuccessModal(false);
                                    navigation.navigate('Home');
                                }}
                            >
                                <Text style={styles.modalSecondaryBtnText}>Continue Shopping</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={[styles.modalBtn, styles.modalPrimaryBtn]} 
                                onPress={() => {
                                    setShowSuccessModal(false);
                                    navigation.navigate('Cart');
                                }}
                            >
                                <Text style={styles.modalPrimaryBtnText}>Go to Cart</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    backBtn: { padding: 4 },
    cartBtn: { padding: 4 },

    heroImage: {
        width: '100%',
        height: 240,
    },
    heroPlaceholder: {
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    categoryBadge: {
        position: 'absolute',
        top: 56 + 240 - 20, // below topnav + image
        left: Spacing.m,
        backgroundColor: 'rgba(0,0,0,0.55)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
    },
    categoryBadgeText: { color: Colors.white, fontWeight: 'bold', fontSize: 12 },

    content: { padding: Spacing.l },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.s },
    title: { ...Typography.h2, flex: 1, marginRight: Spacing.s },
    priceBox: { alignItems: 'flex-end' },
    price: { ...Typography.h2, color: Colors.primary },
    unit: { fontSize: 13, color: Colors.textLight },
    description: { ...Typography.body, color: Colors.textLight, lineHeight: 22, marginBottom: Spacing.m },
    divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.m },
    sectionTitle: { ...Typography.h3, marginBottom: Spacing.m },

    optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.s },
    optionChip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface },
    optionChipSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    optionText: { ...Typography.body, fontSize: 14 },
    optionTextSelected: { color: Colors.white, fontWeight: '600' },

    checkboxContainer: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.s },
    checkboxLabel: { ...Typography.body, fontWeight: '600' },
    checkboxSubLabel: { fontSize: 12, color: Colors.primary, marginTop: 2 },

    quantityRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, padding: Spacing.s, borderRadius: 12, alignSelf: 'flex-start' },
    qtyButton: { padding: Spacing.s, backgroundColor: Colors.white, borderRadius: 8, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
    qtyText: { ...Typography.h3, marginHorizontal: Spacing.xl, minWidth: 60, textAlign: 'center' },

    stockContainer: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.l, backgroundColor: '#FFF4E6', padding: Spacing.s, borderRadius: 8 },
    stockText: { ...Typography.caption, color: '#D35400', marginLeft: Spacing.xs },

    footer: { 
        padding: Spacing.m, 
        borderTopWidth: 1, 
        borderTopColor: Colors.border, 
        backgroundColor: Colors.white,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    footerTotal: { flex: 1 },
    footerTotalLabel: { fontSize: 12, color: Colors.textLight, fontWeight: '500' },
    footerTotalPrice: { ...Typography.h2, color: Colors.primary },
    addToCartButton: { backgroundColor: Colors.primary, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, alignItems: 'center', flexDirection: 'row', gap: 8 },
    addToCartText: { ...Typography.button, fontSize: 16, color: Colors.white },

    // Modal styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: Spacing.l },
    modalCard: { backgroundColor: Colors.white, width: '100%', borderRadius: 20, padding: Spacing.xl, alignItems: 'center', shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
    modalIconWrapper: { marginBottom: Spacing.m },
    modalTitle: { ...Typography.h2, textAlign: 'center', marginBottom: Spacing.s },
    modalSub: { ...Typography.body, color: Colors.textLight, textAlign: 'center', marginBottom: Spacing.xl },
    modalActions: { flexDirection: 'row', width: '100%', gap: Spacing.s },
    modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
    modalSecondaryBtn: { backgroundColor: '#F3F4F6' },
    modalSecondaryBtnText: { color: Colors.text, fontWeight: '600', fontSize: 14 },
    modalPrimaryBtn: { backgroundColor: Colors.primary },
    modalPrimaryBtnText: { color: Colors.white, fontWeight: 'bold', fontSize: 14 },
});

