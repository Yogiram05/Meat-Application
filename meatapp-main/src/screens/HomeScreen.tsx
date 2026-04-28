import React, { useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ImageStyle, Alert, Linking, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography } from '../constants/DesignSystem';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../context/DataContext';
import TopNavBar from '../components/TopNavBar';

// ─── Image picker for meat products (by category + title keyword) ───────────
function getMeatImage(item: any): string {
    const explicitImage = String(item.image || item.imageUrl || '').trim();
    if (explicitImage) return explicitImage;

    const title = String(item.title || item.name || '').toLowerCase();
    const category = String(item.category || item.type || '').trim().toLowerCase();

    // Exact Sub-Product Matching First
    if (title.includes('wing')) return 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&q=80&w=500';
    if (title.includes('nalli') || title.includes('marrow')) return 'https://images.unsplash.com/photo-1615937691196-85dd47fc8974?auto=format&fit=crop&q=80&w=500';
    if (title.includes('brain')) return 'https://images.unsplash.com/photo-1516684732162-798a0062be99?auto=format&fit=crop&q=80&w=500';
    if (title.includes('kudal') || title.includes('intestine') || title.includes('boti')) return 'https://images.unsplash.com/photo-1594910103130-9b37f4150df7?auto=format&fit=crop&q=80&w=500';
    if (title.includes('blood') || title.includes('ratham')) return 'https://images.unsplash.com/photo-1579541094056-bb6b69fd518a?auto=format&fit=crop&q=80&w=500';
    if (title.includes('thala kari') || title.includes('head')) return 'https://images.unsplash.com/photo-1542614471-001ccf2bbd39?auto=format&fit=crop&q=80&w=500';
    if (title.includes('chop')) return 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=500';
    if (title.includes('full') || title.includes('whole')) return 'https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?auto=format&fit=crop&q=80&w=500';
    if (title.includes('breast') || title.includes('boneless chicken')) return 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&q=80&w=500';
    if (title.includes('leg') || title.includes('drumstick')) return 'https://images.unsplash.com/photo-1598103442097-8b74394b95c8?auto=format&fit=crop&q=80&w=500';
    if (title.includes('keema') || title.includes('mince')) return 'https://images.unsplash.com/photo-1608877907149-a206d75ba011?auto=format&fit=crop&q=80&w=500';

    if (category === 'chicken' || title.includes('chicken') || title.includes('broiler') || title.includes('country') || title.includes('hen')) {
        if (title.includes('boneless') || title.includes('breast')) {
            return 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&q=80&w=500';
        }
        if (title.includes('leg') || title.includes('thigh') || title.includes('drumstick')) {
            return 'https://images.unsplash.com/photo-1598103442097-8b74394b95c8?auto=format&fit=crop&q=80&w=500';
        }
        return 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?auto=format&fit=crop&q=80&w=500';
    }
    if (category === 'mutton' || title.includes('mutton') || title.includes('goat') || title.includes('lamb')) {
        if (title.includes('boneless') || title.includes('keema') || title.includes('mince')) {
            return 'https://images.unsplash.com/photo-1608877907149-a206d75ba011?auto=format&fit=crop&q=80&w=500';
        }
        return 'https://images.unsplash.com/photo-1603048297172-c92544798d5e?auto=format&fit=crop&q=80&w=500';
    }
    // SubProduct / other
    if (title.includes('liver') || title.includes('kidney') || title.includes('gizzard')) {
        return 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&q=80&w=500';
    }
    return 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?auto=format&fit=crop&q=80&w=500';
}

// Removed mock data as it's now in Context
const SCREEN_W = Dimensions.get('window').width;

const normalizeText = (value: unknown) => String(value ?? '').trim().toLowerCase();
const normalizeExact = (value: unknown) => String(value ?? '').trim();
const getProductTitle = (product: any) => product?.title || product?.name || '';
const getProductCategory = (product: any) => normalizeExact(product?.category || product?.type);
const matchesCategory = (product: any, expected: string) => getProductCategory(product) === String(expected ?? '').trim();
const getDisplayImage = (product: any) => String(product?.image || product?.imageUrl || getMeatImage(product) || '').trim();

export default function HomeScreen({ navigation }: { navigation: any }) {
    const { chickenRate, muttonRate, shopStatus, addToCart, cart, products, currentUser, logout } = useData();

    const chickenProducts = products.filter((product) => matchesCategory(product, 'Chicken') || normalizeText(getProductTitle(product)).includes('chicken'));

    // Mutton: base cuts + special sub-products (Thala Kari, Kudal, Blood, Brain, Nalli)
    const muttonSpecialNames = ['thala kari', 'kudal', 'blood', 'brain', 'nalli'];
    const muttonSubProducts = products.filter(
        product => matchesCategory(product, 'SubProduct') &&
        muttonSpecialNames.some(name => normalizeText(getProductTitle(product)).includes(name))
    );
    const muttonProducts = [
        ...products.filter(product => matchesCategory(product, 'Mutton') || normalizeText(getProductTitle(product)).includes('mutton')),
        ...muttonSubProducts,
    ];

    const handleProfilePress = () => {
        const name = currentUser?.username || 'Guest';
        Alert.alert(`Hi, ${name}! 👋`, 'What would you like to do?', [
            { text: 'Cancel', style: 'cancel' },
            { text: '📦 My Orders', onPress: () => navigation.navigate('Orders') },
            {
                text: 'Logout',
                style: 'destructive',
                onPress: async () => { await logout(); navigation.replace('Login'); }
            }
        ]);
    };

    const handleAddToCart = (item: any) => {
        if (!shopStatus) {
            Alert.alert('Shop Closed', 'Sorry, the shop is currently closed.');
            return;
        }
        const cartItem = {
            id: Date.now().toString(),
            title: item.title,
            price: item.price,
            cut: item.cut || 'Standard',
            quantity: 1,
            cleaning: [],
        };
        addToCart(cartItem);
        Alert.alert('Added to Cart', `${item.title} has been added to your cart!`);
    };

    const renderProductCard = (item: any, accent: string, bgAccent: string) => {
        const img = getDisplayImage(item);
        return (
            <TouchableOpacity
                key={item.id}
                style={[styles.productCard, { borderLeftColor: accent, borderLeftWidth: 4 }]}
                onPress={() => navigation.navigate('ProductDetails', { product: { ...item, image: img } })}
                activeOpacity={0.8}
            >
                <Image source={{ uri: img }} style={styles.productCardImage} resizeMode="cover" />
                <View style={styles.productCardInfo}>
                    <Text style={styles.productCardTitle} numberOfLines={1}>{item.title}</Text>
                    {item.description ? (
                        <Text style={styles.productCardDesc} numberOfLines={2}>{item.description}</Text>
                    ) : null}
                    <View style={styles.productCardFooter}>
                        <Text style={[styles.productCardPrice, { color: accent }]}>{item.price}</Text>
                        <TouchableOpacity
                            style={[styles.productCardBtn, { backgroundColor: accent }]}
                            onPress={() => handleAddToCart({ ...item, cut: 'Standard' })}
                        >
                            <Ionicons name="add" size={14} color="#fff" />
                            <Text style={styles.productCardBtnText}>Add</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* ── Brand NavBar ── */}
                <TopNavBar
                    title="Premium Meat"
                    leftContent={
                        <View style={styles.shopStatusRow}>
                            <View style={[styles.statusBadge, { backgroundColor: Colors.white }]}>
                                <Text style={[styles.statusBadgeText, { color: shopStatus ? Colors.success : Colors.error }]}>{shopStatus ? '● OPEN' : '● CLOSED'}</Text>
                            </View>
                        </View>
                    }
                    rightContent={
                        <View style={styles.headerActions}>
                            {/* Cart Button */}
                            <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Cart')}>
                                <Ionicons name="cart-outline" size={28} color={Colors.white} />
                                {cart.length > 0 && (
                                    <View style={[styles.badge, { backgroundColor: Colors.white, borderColor: Colors.primary }]}>
                                        <Text style={[styles.badgeText, { color: Colors.primary }]}>{cart.length}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.profileButton} onPress={handleProfilePress}>
                                <Ionicons name="person-circle-outline" size={32} color={Colors.white} />
                            </TouchableOpacity>
                        </View>
                    }
                />
                {/* Greeting sub-header */}
                <View style={styles.greetingBar}>
                    <Text style={styles.greeting}>Hello, {currentUser?.username || 'Guest'}! 👋</Text>
                    <Text style={styles.location}>📍 Anna Nagar, Chennai</Text>
                </View>

                {/* Shop Status Banner */}
                {!shopStatus && (
                    <View style={styles.closedBanner}>
                        <Text style={styles.closedText}>⚠️ SHOP IS CURRENTLY CLOSED</Text>
                    </View>
                )}

                {/* Daily Rates */}
                <View style={styles.rateContainer}>
                    <View style={styles.rateItem}>
                        <Text style={styles.rateTitle}>Chicken 🐔</Text>
                        <Text style={styles.rateValue}>{chickenRate}</Text>
                    </View>
                    <View style={styles.rateDivider} />
                    <View style={styles.rateItem}>
                        <Text style={styles.rateTitle}>Mutton 🐐</Text>
                        <Text style={styles.rateValue}>{muttonRate}</Text>
                    </View>
                </View>

                {/* ── CHICKEN + MUTTON: Continuous Vertical List ── */}
                <View>
                    {/* ── CHICKEN SECTION ── */}
                    <View style={{ paddingHorizontal: Spacing.m, paddingBottom: Spacing.m }}>
                        <View style={styles.pageHeader}>
                            <View style={[styles.pageIconBadge, { backgroundColor: '#FFF3E0' }]}>
                                <Text style={{ fontSize: 24 }}>🐔</Text>
                            </View>
                            <View style={{ marginLeft: Spacing.s }}>
                                <Text style={[styles.pageTitle, { color: '#D84315' }]}>Chicken</Text>
                                <Text style={styles.pageSub}>Farm fresh · Daily cuts</Text>
                            </View>
                        </View>

                        {chickenProducts.map(item => {
                            const img = getDisplayImage(item);
                            return (
                                <TouchableOpacity
                                    key={item.id}
                                    style={[styles.pageCard, { borderLeftColor: '#E64A19', borderLeftWidth: 4 }]}
                                    onPress={() => navigation.navigate('ProductDetails', { product: { ...item, image: img } })}
                                    activeOpacity={0.85}
                                >
                                    <Image source={{ uri: img }} style={styles.pageCardImage as ImageStyle} resizeMode="cover" />
                                    <View style={styles.pageCardBody}>
                                        <Text style={styles.pageCardTitle}>{getProductTitle(item)}</Text>
                                        <Text style={[styles.pageCardPrice, { color: '#E64A19' }]}>{item.price}</Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                        {chickenProducts.length === 0 && (
                            <Text style={styles.emptyText}>No chicken products available</Text>
                        )}
                    </View>

                    {/* ── MUTTON SECTION ── */}
                    <View style={{ paddingBottom: Spacing.l }}>
                        <View style={[styles.pageHeader, { paddingHorizontal: Spacing.m }]}>
                            <View style={[styles.pageIconBadge, { backgroundColor: '#F3E5F5' }]}>
                                <Text style={{ fontSize: 24 }}>🐐</Text>
                            </View>
                            <View style={{ marginLeft: Spacing.s }}>
                                <Text style={[styles.pageTitle, { color: '#6A1B9A' }]}>Mutton & Specials</Text>
                                <Text style={styles.pageSub}>Premium cuts + Thala Kari, Kudal &amp; more</Text>
                            </View>
                        </View>

                        <ScrollView 
                            horizontal 
                            showsHorizontalScrollIndicator={false} 
                            contentContainerStyle={{ paddingHorizontal: Spacing.m, gap: Spacing.s, paddingBottom: Spacing.s }}
                        >
                            {muttonProducts.map(item => {
                                const img = getDisplayImage(item);
                                return (
                                    <TouchableOpacity
                                        key={item.id}
                                        style={styles.muttonCard}
                                        onPress={() => navigation.navigate('ProductDetails', { product: { ...item, image: img } })}
                                        activeOpacity={0.85}
                                    >
                                        <Image source={{ uri: img }} style={styles.muttonCardImage as ImageStyle} resizeMode="cover" />
                                        <View style={styles.muttonCardBody}>
                                            <Text style={styles.muttonCardTitle} numberOfLines={2}>{getProductTitle(item)}</Text>
                                            <Text style={[styles.muttonCardPrice, { color: '#7B1FA2' }]}>{item.price}</Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                        {muttonProducts.length === 0 && (
                            <Text style={[styles.emptyText, { paddingHorizontal: Spacing.m }]}>No mutton products available</Text>
                        )}
                    </View>
                </View>



                {/* Contact Us Section */}
                <View style={[styles.section, styles.contactSection]}>
                    <Text style={styles.sectionTitle}>Contact Us 📞</Text>
                    <View style={styles.contactCard}>
                        {/* Shop Info Row */}
                        <View style={styles.contactHeader}>
                            <View style={styles.contactIconCircle}>
                                <Text style={{ fontSize: 28 }}>🥩</Text>
                            </View>
                            <View style={{ marginLeft: Spacing.m }}>
                                <Text style={styles.contactShopName}>Pradeep Meat Shop</Text>
                                <Text style={styles.contactAddress}>📍 Anna Nagar, Chennai, TN</Text>
                            </View>
                        </View>

                        {/* Divider */}
                        <View style={styles.contactDivider} />

                        {/* Action Buttons Row */}
                        <View style={styles.contactActions}>
                            <TouchableOpacity
                                style={styles.contactActionBtn}
                                onPress={() => Linking.openURL('tel:9384979853')}
                            >
                                <View style={[styles.contactBtnIcon, { backgroundColor: '#ECFDF5' }]}>
                                    <Ionicons name="call" size={22} color="#059669" />
                                </View>
                                <Text style={styles.contactBtnLabel}>Call</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.contactActionBtn}
                                onPress={() => Linking.openURL('whatsapp://send?phone=919384979853')}
                            >
                                <View style={[styles.contactBtnIcon, { backgroundColor: '#F0FFF4' }]}>
                                    <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
                                </View>
                                <Text style={styles.contactBtnLabel}>WhatsApp</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.contactActionBtn}
                                onPress={() => Linking.openURL('https://maps.app.goo.gl/search/Anna+Nagar,+Chennai')}
                            >
                                <View style={[styles.contactBtnIcon, { backgroundColor: '#FFF5F5' }]}>
                                    <Ionicons name="location" size={22} color={Colors.primary} />
                                </View>
                                <Text style={styles.contactBtnLabel}>Maps</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollContent: {
        paddingBottom: Spacing.xl,
        paddingHorizontal: Spacing.m,
        paddingTop: Spacing.xl, // added padding top
    },
    location: {
        ...Typography.caption,
        color: Colors.textLight,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        marginLeft: Spacing.s,
    },
    statusBadgeText: {
        color: Colors.white,
        fontSize: 10,
        fontWeight: 'bold',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconButton: {
        marginRight: Spacing.m,
        position: 'relative',
        padding: 4,
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: Colors.error || 'red',
        borderRadius: 10,
        width: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: Colors.white,
    },
    badgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    profileButton: {
        padding: Spacing.xs,
    },
    filterContainer: {
        paddingHorizontal: Spacing.m,
        marginBottom: Spacing.m,
        gap: Spacing.s,
    },
    filterPill: {
        paddingHorizontal: Spacing.m,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.border,
        marginRight: Spacing.s,
    },
    filterPillActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    filterText: {
        fontSize: 13,
        color: Colors.textLight,
        fontWeight: '600',
    },
    filterTextActive: {
        color: Colors.white,
    },
    section: {
        marginTop: Spacing.l,
    },
    sectionTitle: {
        ...Typography.h3,
        marginLeft: Spacing.m,
        marginBottom: Spacing.m,
    },
    horizontalList: {
        paddingHorizontal: Spacing.m,
    },
    rateContainer: {
        backgroundColor: Colors.surface,
        margin: Spacing.m,
        padding: Spacing.m,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    rateItem: {
        alignItems: 'center',
    },
    rateTitle: {
        ...Typography.caption,
        fontWeight: '600',
        color: Colors.textLight,
        marginBottom: 4,
    },
    rateValue: {
        ...Typography.h2,
        color: Colors.primary,
        fontWeight: 'bold',
    },
    rateDivider: {
        width: 1,
        height: 30,
        backgroundColor: Colors.border,
    },
    closedBanner: {
        backgroundColor: Colors.error,
        margin: Spacing.m,
        marginBottom: 0,
        padding: Spacing.s,
        borderRadius: 8,
        alignItems: 'center',
    },
    closedText: {
        color: Colors.white,
        fontWeight: 'bold',
        fontSize: 12,
    },
    contactSection: {
        marginBottom: Spacing.xl,
    },
    contactCard: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: Spacing.m,
        marginHorizontal: Spacing.m,
        borderWidth: 1,
        borderColor: Colors.border,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
    },
    contactHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.m,
    },
    contactIconCircle: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#FFF5F5',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    contactInfo: {
        flex: 1,
    },
    contactShopName: {
        ...Typography.body,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 2,
    },
    contactAddress: {
        ...Typography.caption,
        color: Colors.textLight,
        lineHeight: 18,
    },
    contactDivider: {
        height: 1,
        backgroundColor: Colors.border,
        marginBottom: Spacing.m,
    },
    contactActions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    contactActionBtn: {
        alignItems: 'center',
        gap: 6,
    },
    contactBtnIcon: {
        width: 52,
        height: 52,
        borderRadius: 26,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    contactBtnLabel: {
        fontSize: 12,
        color: Colors.textLight,
        fontWeight: '600',
        marginTop: 2,
    },
    // new greeting bar
    greetingBar: {
        paddingHorizontal: Spacing.m,
        paddingVertical: Spacing.s,
        backgroundColor: '#FFF8F8',
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    greeting: {
        ...Typography.h3,
        color: Colors.text,
        marginBottom: 2,
    },
    shopStatusRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    // ── NEW meat product card styles ──────────────────────────────────────────
    meatCard: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        overflow: 'hidden' as const,
        borderWidth: 1,
        borderColor: Colors.border,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.09,
        shadowRadius: 8,
    },
    meatCardImage: {
        width: '100%' as any,
        height: 150,
    } as any,
    meatCategoryBadge: {
        position: 'absolute' as const,
        top: 10,
        left: 10,
        backgroundColor: 'rgba(255,255,255,0.92)',
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    meatCategoryText: {
        fontSize: 11,
        fontWeight: '700' as const,
        color: Colors.text,
    },
    meatCardBody: {
        padding: Spacing.m,
    },
    meatCardTitle: {
        fontSize: 15,
        fontWeight: '700' as const,
        color: Colors.text,
        flex: 1,
        marginRight: 4,
    },
    meatCardPrice: {
        fontSize: 15,
        fontWeight: 'bold' as const,
        color: Colors.primary,
    },
    meatCardDesc: {
        fontSize: 12,
        color: Colors.textLight,
        marginTop: 6,
        lineHeight: 18,
        fontStyle: 'italic' as const,
    },
    meatAddBtn: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        backgroundColor: Colors.primary,
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 14,
        marginTop: 10,
        gap: 4,
        alignSelf: 'flex-start' as const,
    },
    meatAddBtnText: {
        color: Colors.white,
        fontWeight: '700' as const,
        fontSize: 13,
    },
    // ── New Chicken / Mutton section styles ───────────────────────────────────
    sectionHeader: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        paddingHorizontal: Spacing.m,
        marginBottom: Spacing.m,
    },
    sectionIconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    sectionHeading: {
        fontSize: 20,
        fontWeight: 'bold' as const,
    },
    sectionSub: {
        fontSize: 12,
        color: Colors.textLight,
        marginTop: 2,
    },
    productList: {
        paddingHorizontal: Spacing.m,
        gap: Spacing.m,
    },
    productCard: {
        flexDirection: 'row' as const,
        backgroundColor: Colors.white,
        borderRadius: 14,
        overflow: 'hidden' as const,
        borderWidth: 1,
        borderColor: Colors.border,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 6,
        marginBottom: Spacing.s,
    },
    productCardImage: {
        width: 100,
        height: 100,
    } as any,
    productCardInfo: {
        flex: 1,
        padding: Spacing.s,
        justifyContent: 'space-between' as const,
    },
    productCardTitle: {
        fontSize: 14,
        fontWeight: '700' as const,
        color: Colors.text,
    },
    productCardDesc: {
        fontSize: 11,
        color: Colors.textLight,
        marginTop: 2,
        lineHeight: 16,
        fontStyle: 'italic' as const,
    },
    productCardFooter: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'space-between' as const,
        marginTop: Spacing.xs,
    },
    productCardPrice: {
        fontSize: 14,
        fontWeight: 'bold' as const,
    },
    productCardBtn: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        borderRadius: 8,
        paddingVertical: 5,
        paddingHorizontal: 10,
        gap: 3,
    },
    productCardBtnText: {
        color: '#fff',
        fontWeight: '700' as const,
        fontSize: 12,
    },
    emptyText: {
        color: Colors.textLight,
        fontStyle: 'italic' as const,
        fontSize: 13,
        textAlign: 'center' as const,
        paddingVertical: Spacing.m,
    },
    // ── Side-by-side Chicken / Mutton dual section ────────────────────────────
    dualSectionRow: {
        flexDirection: 'row' as const,
        marginTop: Spacing.l,
        paddingHorizontal: Spacing.s,
        alignItems: 'flex-start' as const,
    },
    chickenColumn: {
        flex: 1,
        marginRight: 4,
    },
    muttonColumn: {
        flex: 1,
        marginLeft: 4,
    },
    colHeader: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        marginBottom: Spacing.s,
        paddingHorizontal: 4,
    },
    colIconBadge: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    colTitle: {
        fontSize: 14,
        fontWeight: 'bold' as const,
    },
    colSub: {
        fontSize: 10,
        color: Colors.textLight,
    },
    // Chicken cards (vertical within left column)
    colCard: {
        backgroundColor: Colors.white,
        borderRadius: 10,
        overflow: 'hidden' as const,
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: Spacing.s,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.07,
        shadowRadius: 4,
    },
    colCardImage: {
        width: '100%' as any,
        height: 80,
    } as any,
    colCardBody: {
        padding: 8,
    },
    colCardTitle: {
        fontSize: 12,
        fontWeight: '700' as const,
        color: Colors.text,
        marginBottom: 2,
    },
    colCardPrice: {
        fontSize: 12,
        fontWeight: 'bold' as const,
        marginBottom: 6,
    },
    colAddBtn: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        borderRadius: 6,
        paddingVertical: 4,
        paddingHorizontal: 8,
        gap: 2,
        alignSelf: 'flex-start' as const,
    },
    colAddBtnText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700' as const,
    },
    // Mutton cards (horizontal scroll in right column)
    muttonScrollContent: {
        flexDirection: 'column' as const,
        gap: Spacing.s,
        paddingBottom: 4,
    },
    muttonCard: {
        backgroundColor: Colors.white,
        borderRadius: 10,
        overflow: 'hidden' as const,
        borderWidth: 1,
        borderColor: Colors.border,
        width: 130,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.07,
        shadowRadius: 4,
    },
    muttonCardImage: {
        width: '100%' as any,
        height: 75,
    } as any,
    muttonCardBody: {
        padding: 8,
    },
    muttonCardTitle: {
        fontSize: 11,
        fontWeight: '700' as const,
        color: Colors.text,
        marginBottom: 2,
    },
    muttonCardPrice: {
        fontSize: 11,
        fontWeight: 'bold' as const,
        marginBottom: 6,
    },
    // ── Full-width paged swiper (Chicken / Mutton) ────────────────────────────
    pageSwiperHint: {
        marginHorizontal: Spacing.m,
        marginTop: Spacing.s,
        marginBottom: Spacing.s,
        backgroundColor: '#FFF8F0',
        borderRadius: 10,
        paddingVertical: 8,
        paddingHorizontal: Spacing.m,
        borderWidth: 1,
        borderColor: '#FFE0CC',
    },
    pageSwiperHintText: {
        fontSize: 13,
        color: '#C0392B',
        fontWeight: '600',
        textAlign: 'center' as const,
    },
    pageSwiper: {
        flex: 0,
    },
    page: {
        width: '100%' as any,
        paddingHorizontal: Spacing.m,
        paddingBottom: Spacing.l,
    },
    pageHeader: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        marginBottom: Spacing.m,
        paddingVertical: Spacing.s,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    pageIconBadge: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
    },
    pageTitle: {
        fontSize: 20,
        fontWeight: 'bold' as const,
    },
    pageSub: {
        fontSize: 12,
        color: Colors.textLight,
        marginTop: 2,
    },
    pageCard: {
        flexDirection: 'row' as const,
        backgroundColor: Colors.white,
        borderRadius: 12,
        marginBottom: Spacing.m,
        overflow: 'hidden' as const,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
    },
    pageCardImage: {
        width: 90,
        height: 90,
    },
    pageCardBody: {
        flex: 1,
        padding: Spacing.s,
        justifyContent: 'space-between' as const,
    },
    pageCardTitle: {
        fontSize: 14,
        fontWeight: '700' as const,
        color: Colors.text,
        marginBottom: 2,
    },
    pageCardPrice: {
        fontSize: 14,
        fontWeight: 'bold' as const,
        marginBottom: 4,
    },
    pageAddBtn: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 6,
        alignSelf: 'flex-start' as const,
        gap: 4,
    },
    pageAddBtnText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700' as const,
    },
});

