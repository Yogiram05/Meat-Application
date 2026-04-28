import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, Modal, FlatList, StatusBar, ActivityIndicator, Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography } from '../constants/DesignSystem';
import { useData } from '../context/DataContext';
import { Ionicons } from '@expo/vector-icons';
import TopNavBar from '../components/TopNavBar';

const DECLINE_REASONS = [
    'Item Out of Stock',
    'Delivery Area Unserviceable',
    'Store Closed',
    'Other',
];

// Category display config
const CATEGORY_COLOR: Record<string, string> = {
    Chicken: '#FFF7ED',
    Mutton: '#FDF2F8',
    SubProduct: '#EFF6FF',
};
const CATEGORY_TEXT: Record<string, string> = {
    Chicken: '#C2410C',
    Mutton: '#9D174D',
    SubProduct: '#1D4ED8',
};

const normalizeText = (value: unknown) => String(value ?? '').trim().toLowerCase();
const getProductTitle = (product: any) => product?.title || product?.name || '';
const getProductCategory = (product: any) => String(product?.category || product?.type || '').trim();
const matchesCategory = (product: any, expected: string) => getProductCategory(product) === String(expected ?? '').trim();
const getCategoryKey = (category: any) => {
    const normalized = normalizeText(category);

    if (normalized === 'chicken') return 'Chicken';
    if (normalized === 'mutton') return 'Mutton';
    if (normalized === 'subproduct') return 'SubProduct';
    return String(category || '');
};
const getCategoryLabel = (category: any) => {
    const normalized = normalizeText(category);

    if (normalized === 'subproduct') return '🌟 Special';
    if (normalized === 'chicken') return '🐔 Chicken';
    if (normalized === 'mutton') return '🐐 Mutton';
    return String(category || 'Unknown');
};

export default function AdminDashboardScreen({ navigation }: { navigation: any }) {
    const {
        orders, updateOrderStatus, formatCurrency,
        shopStatus, chickenRate, muttonRate, updateConfig,
        products, updateProduct, addProduct, deleteProduct, isLoadingProducts, refreshProducts, refreshAll,
        adminSession, adminLogout,
    } = useData();

    const [activeTab, setActiveTab] = useState<'Dashboard' | 'Orders' | 'Products'>('Products');

    // Rate inputs
    const [localChickenRate, setLocalChickenRate] = useState(chickenRate);
    const [localMuttonRate, setLocalMuttonRate] = useState(muttonRate);

    React.useEffect(() => {
        setLocalChickenRate(chickenRate);
        setLocalMuttonRate(muttonRate);
    }, [chickenRate, muttonRate]);

    const handleUpdateRates = async () => {
        const ok = await updateConfig({ chickenRate: localChickenRate, muttonRate: localMuttonRate });
        if (ok) {
            alert('✅ Rates updated and saved to database!');
        } else {
            alert('⚠️ Rates updated locally but NOT saved to database.\n\nMake sure the backend server is running and both app and server are on the same network.');
        }
    };

    const toggleShopStatus = async () => {
        const ok = await updateConfig({ shopStatus: !shopStatus });
        if (!ok) {
            alert('⚠️ Shop status changed locally but NOT saved to database.\n\nCheck backend server.');
        }
    };

    // Order state
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [declineModalVisible, setDeclineModalVisible] = useState(false);
    const [orderDetailVisible, setOrderDetailVisible] = useState(false);
    const [selectedReason, setSelectedReason] = useState(DECLINE_REASONS[0]);
    const [additionalNotes, setAdditionalNotes] = useState('');

    // Product edit state
    const [productEditModalVisible, setProductEditModalVisible] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [editForm, setEditForm] = useState({
        title: '', price: '', originalPrice: '', description: '',
        category: 'Chicken', inStock: true, cutOptions: '', image: ''
    });

    // Product category filter
    const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

    const CATEGORIES = ['All', 'Chicken', 'Mutton', 'SubProduct'];

    const filteredProducts = categoryFilter && categoryFilter !== 'All'
        ? products.filter(p => matchesCategory(p, categoryFilter))
        : products;

    // ─── Order Actions ────────────────────────────────────────────────────────
    const handleAcceptOrder = (order: any) => {
        updateOrderStatus(order.id, 'Processing');
        setOrderDetailVisible(false);
    };
    const handleDeclinePress = (order: any) => {
        setSelectedOrder(order);
        setDeclineModalVisible(true);
    };
    const confirmDecline = () => {
        if (selectedOrder) {
            const reason = selectedReason === 'Other' ? additionalNotes : selectedReason;
            updateOrderStatus(selectedOrder.id, 'Cancelled', reason);
            setDeclineModalVisible(false);
            setOrderDetailVisible(false);
            setSelectedOrder(null);
            setAdditionalNotes('');
        }
    };
    const openOrderDetails = (order: any) => { setSelectedOrder(order); setOrderDetailVisible(true); };

    // ─── Product Actions ──────────────────────────────────────────────────────
    const handleAddNewProduct = () => {
        setSelectedProduct(null);
        setEditForm({
            title: '', price: '', originalPrice: '', description: '',
            category: 'Chicken', inStock: true, cutOptions: '', image: ''
        });
        setProductEditModalVisible(true);
    };

    const handleEditProduct = (product: any) => {
        setSelectedProduct(product);
        setEditForm({
            title: getProductTitle(product),
            price: product.price || '',
            originalPrice: product.originalPrice || product.oldPrice || '',
            description: product.description || '',
            category: getProductCategory(product) || 'Chicken',
            inStock: product.inStock !== false, // default true
            cutOptions: product.cutOptions ? product.cutOptions.join(', ') : '',
            image: product.image || '',
        });
        setProductEditModalVisible(true);
    };

    const handleSaveProduct = async () => {
        const payload = {
            title: editForm.title,
            price: editForm.price,
            originalPrice: editForm.originalPrice,
            description: editForm.description,
            category: editForm.category,
            inStock: editForm.inStock,
            cutOptions: editForm.cutOptions.split(',').map(s => s.trim()).filter(s => s),
            image: editForm.image
        };

        if (selectedProduct) {
            const id = selectedProduct.id;
            const isFromDB = /^[a-f\d]{24}$/i.test(id);
            if (!isFromDB) {
                setProductEditModalVisible(false);
                setTimeout(() => alert('❌ Cannot save to database! Products are from offline fallback. Refresh products first.'), 300);
                return;
            }
            const ok = await updateProduct(id, payload);
            setProductEditModalVisible(false);
            setTimeout(() => {
                if (ok) alert('✅ Product saved to database successfully!');
                else alert('⚠️ Product updated on screen but NOT saved to database.');
            }, 300);
        } else {
            const ok = await addProduct(payload);
            setProductEditModalVisible(false);
            setTimeout(() => {
                if (ok) alert('✅ New product added to database successfully!');
                else alert('⚠️ Failed to add product to database.');
            }, 300);
        }
    };

    const handleDeleteProduct = async () => {
        if (!selectedProduct) return;
        const id = selectedProduct.id;
        const isFromDB = /^[a-f\d]{24}$/i.test(id);
        if (!isFromDB) {
            setProductEditModalVisible(false);
            setTimeout(() => alert('❌ Cannot delete offline fallback items.'), 300);
            return;
        }
        const ok = await deleteProduct(id);
        setProductEditModalVisible(false);
        setTimeout(() => {
            if (ok) alert('✅ Product deleted successfully!');
            else alert('⚠️ Failed to delete product.');
        }, 300);
    };

    // ─── Sub-Components ───────────────────────────────────────────────────────

    const TopNavigation = () => (
        <View style={styles.topNav}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topNavScroll}>
                {(['Dashboard', 'Orders', 'Products'] as const).map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.navItem, activeTab === tab && styles.navItemActive]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Ionicons
                            name={tab === 'Orders' ? 'list' : tab === 'Dashboard' ? 'grid' : 'cube-outline'}
                            size={18}
                            color={activeTab === tab ? Colors.primary : Colors.textLight}
                        />
                        <Text style={[styles.navText, activeTab === tab && styles.navTextActive]}>{tab}</Text>
                        {tab === 'Products' && (
                            <View style={styles.countBadge}>
                                <Text style={styles.countBadgeText}>{products.length}</Text>
                            </View>
                        )}
                        {tab === 'Orders' && orders.length > 0 && (
                            <View style={[styles.countBadge, { backgroundColor: Colors.primary }]}>
                                <Text style={[styles.countBadgeText, { color: Colors.white }]}>{orders.length}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );

    const ShopControlWidget = () => (
        <View style={styles.shopControlWidget}>
            <View style={styles.statusRow}>
                <View>
                    <Text style={styles.widgetLabel}>SHOP STATUS</Text>
                    <Text style={[styles.widgetStatusText, { color: shopStatus ? Colors.success : Colors.error }]}>
                        {shopStatus ? '● OPEN' : '● CLOSED'}
                    </Text>
                </View>
                <TouchableOpacity
                    style={[styles.toggleBtn, { backgroundColor: shopStatus ? Colors.error : Colors.success }]}
                    onPress={toggleShopStatus}
                >
                    <Text style={styles.toggleText}>{shopStatus ? 'Close Shop' : 'Open Shop'}</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.ratesRow}>
                <View style={styles.rateInputGroup}>
                    <Text style={styles.rateLabel}>🐔 Chicken Rate</Text>
                    <TextInput style={styles.rateInput} value={localChickenRate} onChangeText={setLocalChickenRate} />
                </View>
                <View style={styles.rateInputGroup}>
                    <Text style={styles.rateLabel}>🐐 Mutton Rate</Text>
                    <TextInput style={styles.rateInput} value={localMuttonRate} onChangeText={setLocalMuttonRate} />
                </View>
                <TouchableOpacity style={styles.updateRatesBtn} onPress={handleUpdateRates}>
                    <Text style={styles.updateBtnText}>Update Rates</Text>
                </TouchableOpacity>
            </View>
            {/* Publish to Users button */}
            <TouchableOpacity
                style={styles.publishBtn}
                onPress={async () => {
                    await refreshAll();
                    alert('✅ Prices refreshed! Users will see the latest prices.');
                }}
            >
                <Ionicons name="cloud-upload-outline" size={16} color={Colors.white} />
                <Text style={styles.publishBtnText}>Publish Prices to Users</Text>
            </TouchableOpacity>
        </View>
    );

    const OrderCard = ({ item }: { item: any }) => (
        <TouchableOpacity style={styles.orderCard} onPress={() => openOrderDetails(item)} activeOpacity={0.9}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.cardOrderId}>ORDER #{item.id.toString().slice(-6).toUpperCase()}</Text>
                    <Text style={styles.cardTime}>{new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
                {item.status === 'Pending' && <View style={styles.badgePending}><Text style={styles.badgeText}>PENDING</Text></View>}
                {item.status === 'Processing' && <View style={styles.badgeProcessing}><Text style={styles.badgeText}>PROCESSING</Text></View>}
                {item.status === 'Cancelled' && <View style={styles.badgeCancelled}><Text style={styles.badgeText}>CANCELLED</Text></View>}
            </View>
            <View style={styles.divider} />
            <View style={styles.cardBody}>
                <View style={styles.customerRow}>
                    <Ionicons name="person-circle" size={32} color={Colors.textLight} />
                    <View style={{ marginLeft: 8 }}>
                        <Text style={styles.customerName}>Customer</Text>
                        <Text style={styles.itemCount}>{item.items?.length ?? 0} Items</Text>
                    </View>
                </View>
                <Text style={styles.totalAmount}>{formatCurrency(item.total)}</Text>
            </View>
            {item.status === 'Pending' && (
                <View style={styles.cardActions}>
                    <TouchableOpacity style={styles.btnDecline} onPress={() => handleDeclinePress(item)}>
                        <Text style={styles.btnDeclineText}>Decline</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.btnAccept} onPress={() => handleAcceptOrder(item)}>
                        <Text style={styles.btnAcceptText}>Accept Order</Text>
                    </TouchableOpacity>
                </View>
            )}
        </TouchableOpacity>
    );

    // Product Card — clean mobile-friendly layout
    const ProductCard = ({ item }: { item: any }) => (
        <View style={styles.productCard}>
            {/* Header row: category badge chip */}
            <View style={styles.productCardTopRow}>
                <View style={{flexDirection: 'row', gap: 6, alignItems:'center'}}>
                    <View style={[styles.categoryBadge, {
                        backgroundColor: CATEGORY_COLOR[getCategoryKey(item.category)] || '#F9FAFB',
                    }]}>
                        <Text style={[styles.categoryBadgeText, { color: CATEGORY_TEXT[getCategoryKey(item.category)] || Colors.textLight }]}>
                            {getCategoryLabel(item.category)}
                        </Text>
                    </View>
                    {item.inStock === false && (
                        <View style={[styles.categoryBadge, { backgroundColor: '#FEF2F2' }]}>
                            <Text style={[styles.categoryBadgeText, { color: Colors.error }]}>Out of Stock</Text>
                        </View>
                    )}
                </View>
                <TouchableOpacity style={styles.btnEditProduct} onPress={() => handleEditProduct(item)}>
                    <Ionicons name="create-outline" size={18} color={Colors.primary} />
                    <Text style={styles.btnEditProductText}>Edit</Text>
                </TouchableOpacity>
            </View>
            {/* Product name */}
                    <Text style={styles.productTitle} numberOfLines={2}>{getProductTitle(item)}</Text>
            {/* Price row */}
            <View style={styles.priceRow}>
                <Text style={styles.productPrice}>{item.price}</Text>
                {(item.originalPrice || item.oldPrice) && (
                    <Text style={styles.productOriginalPrice}>{item.originalPrice || item.oldPrice}</Text>
                )}
            </View>
            {/* Description */}
            {item.description ? (
                <Text style={styles.productDesc} numberOfLines={2}>{item.description}</Text>
            ) : null}
        </View>
    );

    // ─── Main Render ──────────────────────────────────────────────────────────
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.layout}>
                <TopNavBar
                    title="Premium Meat — Admin"
                    rightContent={
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            {adminSession && (
                                <Text style={{ color: Colors.white, fontSize: 12, maxWidth: 120 }} numberOfLines={1}>
                                    {adminSession.displayName}
                                </Text>
                            )}
                            <TouchableOpacity
                                style={styles.logoutButton}
                                onPress={async () => {
                                    await adminLogout();
                                    navigation.replace('AdminLogin');
                                }}
                            >
                                <Ionicons name="log-out-outline" size={24} color={Colors.white} />
                            </TouchableOpacity>
                        </View>
                    }
                />

                <TopNavigation />

                {/* ── TAB CONTENT ── */}

                {activeTab === 'Orders' && (
                    <FlatList
                        data={orders}
                        renderItem={({ item }) => <OrderCard item={item} />}
                        keyExtractor={item => item.id.toString()}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View style={styles.placeholder}>
                                <Ionicons name="clipboard-outline" size={64} color={Colors.border} />
                                <Text style={styles.placeholderText}>No orders yet</Text>
                            </View>
                        }
                    />
                )}

                {activeTab === 'Products' && (
                    <View style={{ flex: 1 }}>
                        {/* Shop Control widget — collapsible header inside Products tab */}
                        <ScrollView
                            style={{ flex: 1 }}
                            showsVerticalScrollIndicator={false}
                            stickyHeaderIndices={[0]}
                        >
                            {/* Sticky: Shop widget + filter bar */}
                            <View>
                                <ShopControlWidget />
                                {/* Products Header */}
                                <View style={styles.productsHeader}>
                                    <Text style={styles.productsHeaderTitle}>
                                        Products ({filteredProducts.length})
                                    </Text>
                                    <View style={{flexDirection: 'row', gap: 8}}>
                                        <TouchableOpacity style={styles.addBtn} onPress={handleAddNewProduct}>
                                            <Ionicons name="add" size={16} color={Colors.white} />
                                            <Text style={styles.addBtnText}>New</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.refreshBtn} onPress={refreshProducts}>
                                            {isLoadingProducts
                                                ? <ActivityIndicator size="small" color={Colors.primary} />
                                                : <Ionicons name="refresh" size={20} color={Colors.primary} />
                                            }
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                {/* Category Filter pills */}
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={styles.categoryFilterContainer}
                                    nestedScrollEnabled
                                >
                                    {CATEGORIES.map(cat => {
                                        const isActive = categoryFilter === cat || (!categoryFilter && cat === 'All');
                                        return (
                                            <TouchableOpacity
                                                key={cat}
                                                style={[styles.filterPill, isActive && styles.filterPillActive]}
                                                onPress={() => setCategoryFilter(cat === 'All' ? null : cat)}
                                            >
                                                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                                                    {cat === 'SubProduct' ? 'Special' : cat}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </ScrollView>
                            </View>

                            {/* Product list (non-FlatList so it works inside ScrollView) */}
                            {isLoadingProducts && filteredProducts.length === 0 ? (
                                <View style={styles.placeholder}>
                                    <ActivityIndicator size="large" color={Colors.primary} />
                                    <Text style={styles.placeholderText}>Loading products...</Text>
                                </View>
                            ) : filteredProducts.length === 0 ? (
                                <View style={styles.placeholder}>
                                    <Ionicons name="cube-outline" size={64} color={Colors.border} />
                                    <Text style={styles.placeholderText}>No products found</Text>
                                </View>
                            ) : (
                                <View style={styles.listContent}>
                                    {filteredProducts.map(item => (
                                        <ProductCard key={item.id?.toString() ?? item.title} item={item} />
                                    ))}
                                </View>
                            )}
                        </ScrollView>
                    </View>
                )}

                {activeTab === 'Dashboard' && (
                    <ScrollView contentContainerStyle={styles.listContent}>
                        <ShopControlWidget />
                        <View style={styles.dashboardGrid}>
                            <View style={[styles.statCard, { backgroundColor: '#FFF7ED' }]}>
                                <Ionicons name="cube-outline" size={32} color="#C2410C" />
                                <Text style={styles.statNumber}>{products.length}</Text>
                                <Text style={styles.statLabel}>Products</Text>
                            </View>
                            <View style={[styles.statCard, { backgroundColor: '#ECFDF5' }]}>
                                <Ionicons name="list-outline" size={32} color="#065F46" />
                                <Text style={styles.statNumber}>{orders.length}</Text>
                                <Text style={styles.statLabel}>Orders</Text>
                            </View>
                            <View style={[styles.statCard, { backgroundColor: shopStatus ? '#ECFDF5' : '#FEF2F2' }]}>
                                <Ionicons name="storefront-outline" size={32} color={shopStatus ? Colors.success : Colors.error} />
                                <Text style={[styles.statNumber, { color: shopStatus ? Colors.success : Colors.error }]}>
                                    {shopStatus ? 'OPEN' : 'CLOSED'}
                                </Text>
                                <Text style={styles.statLabel}>Shop Status</Text>
                            </View>
                            <View style={[styles.statCard, { backgroundColor: '#EFF6FF' }]}>
                                <Ionicons name="checkmark-circle-outline" size={32} color="#1D4ED8" />
                                <Text style={styles.statNumber}>
                                    {orders.filter(o => o.status === 'Processing').length}
                                </Text>
                                <Text style={styles.statLabel}>Processing</Text>
                            </View>
                        </View>
                        <View style={[styles.statCard, { marginHorizontal: 0, marginTop: 0, backgroundColor: '#FFF8F8' }]}>
                            <Text style={styles.statLabel}>Today's Rates</Text>
                            <Text style={{ ...Typography.h2, color: Colors.primary, marginTop: 4 }}>
                                🐔 {chickenRate}  |  🐐 {muttonRate}
                            </Text>
                        </View>
                    </ScrollView>
                )}
            </View>

            {/* ── ORDER DETAIL MODAL ── */}
            <Modal visible={orderDetailVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Order Details</Text>
                            <TouchableOpacity onPress={() => setOrderDetailVisible(false)}>
                                <Ionicons name="close-circle" size={30} color={Colors.textLight} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalBody}>
                            <View style={styles.modalSection}>
                                <Text style={styles.labelSmall}>ORDER ID</Text>
                                <Text style={styles.value}>#{selectedOrder?.id.toString().slice(-6).toUpperCase()}</Text>
                            </View>
                            <View style={styles.divider} />
                            <Text style={styles.sectionHeader}>Items</Text>
                            {selectedOrder?.items?.map((item: any, index: number) => (
                                <View key={index} style={styles.itemRow}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.itemName}>{item.title}</Text>
                                        <Text style={styles.itemMeta}>{item.cut} • {item.quantity}kg</Text>
                                    </View>
                                    <Text style={styles.itemPrice}>{formatCurrency(item.price)}</Text>
                                </View>
                            ))}
                            <View style={styles.divider} />
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>Total Amount</Text>
                                <Text style={styles.totalValue}>{formatCurrency(selectedOrder?.total)}</Text>
                            </View>
                        </ScrollView>
                        {selectedOrder?.status === 'Pending' && (
                            <View style={styles.modalFooter}>
                                <TouchableOpacity style={styles.modalDeclineBtn} onPress={() => {
                                    setOrderDetailVisible(false);
                                    setTimeout(() => handleDeclinePress(selectedOrder), 300);
                                }}>
                                    <Text style={styles.modalDeclineText}>Decline</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.modalAcceptBtn} onPress={() => handleAcceptOrder(selectedOrder)}>
                                    <Text style={styles.modalBtnText}>Accept Order</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>

            {/* ── DECLINE REASON MODAL ── */}
            <Modal visible={declineModalVisible} animationType="fade" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.smallModalContent}>
                        <Text style={styles.modalTitle}>Reason for Cancellation</Text>
                        {DECLINE_REASONS.map(reason => (
                            <TouchableOpacity
                                key={reason}
                                style={[styles.reasonOption, selectedReason === reason && styles.reasonOptionSelected]}
                                onPress={() => setSelectedReason(reason)}
                            >
                                <Text style={[styles.reasonText, selectedReason === reason && styles.reasonTextSelected]}>{reason}</Text>
                            </TouchableOpacity>
                        ))}
                        {selectedReason === 'Other' && (
                            <TextInput
                                style={styles.notesInput}
                                placeholder="Additional details..."
                                value={additionalNotes}
                                onChangeText={setAdditionalNotes}
                                multiline
                            />
                        )}
                        <View style={styles.smallModalActions}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setDeclineModalVisible(false)}>
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.confirmDeclineBtn} onPress={confirmDecline}>
                                <Text style={styles.confirmDeclineText}>Confirm</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* ── PRODUCT EDIT MODAL ── */}
            <Modal visible={productEditModalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>{selectedProduct ? 'Edit Product' : 'New Product'}</Text>
                                {selectedProduct && (
                                    <View style={[styles.categoryBadge, { backgroundColor: CATEGORY_COLOR[getCategoryKey(selectedProduct.category)] || '#F9FAFB', marginTop: 4, alignSelf: 'flex-start' }]}>
                                        <Text style={[styles.categoryBadgeText, { color: CATEGORY_TEXT[getCategoryKey(selectedProduct.category)] || Colors.textLight }]}>
                                            {getCategoryLabel(selectedProduct.category)}
                                        </Text>
                                    </View>
                                )}
                            </View>
                            <TouchableOpacity onPress={() => setProductEditModalVisible(false)}>
                                <Ionicons name="close-circle" size={30} color={Colors.textLight} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalBody}>
                            <Text style={[styles.inputLabel]}>Category</Text>
                            <View style={{ flexDirection: 'row', gap: 8, marginTop: 4, marginBottom: Spacing.m }}>
                                {['Chicken', 'Mutton', 'SubProduct'].map(cat => (
                                    <TouchableOpacity
                                        key={cat}
                                        style={[styles.catPickBtn, editForm.category === cat && styles.catPickBtnActive]}
                                        onPress={() => setEditForm(p => ({...p, category: cat}))}
                                    >
                                        <Text style={[styles.catPickText, editForm.category === cat && styles.catPickTextActive]}>
                                            {cat === 'SubProduct' ? 'Special' : cat}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.m, backgroundColor: '#F9FAFB', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: Colors.border }}>
                                <Text style={[styles.inputLabel, {marginBottom: 0}]}>In Stock</Text>
                                <Switch
                                    value={editForm.inStock}
                                    onValueChange={val => setEditForm(p => ({...p, inStock: val}))}
                                    trackColor={{ false: '#D1D5DB', true: '#34D399' }}
                                />
                            </View>

                            <Text style={styles.inputLabel}>Product Name</Text>
                            <TextInput
                                style={styles.editInput}
                                value={editForm.title}
                                onChangeText={val => setEditForm(p => ({ ...p, title: val }))}
                                placeholder="e.g. Morning Fresh Chicken"
                            />

                            <View style={{ flexDirection: 'row', gap: Spacing.s, marginTop: Spacing.m }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.inputLabel}>Price</Text>
                                    <TextInput
                                        style={styles.editInput}
                                        value={editForm.price}
                                        onChangeText={val => setEditForm(p => ({ ...p, price: val }))}
                                        placeholder="e.g. ₹220/kg"
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.inputLabel}>Original Price</Text>
                                    <TextInput
                                        style={styles.editInput}
                                        value={editForm.originalPrice}
                                        onChangeText={val => setEditForm(p => ({ ...p, originalPrice: val }))}
                                        placeholder="e.g. ₹250/kg"
                                    />
                                </View>
                            </View>

                            <Text style={[styles.inputLabel, { marginTop: Spacing.m }]}>Cut Options (comma separated)</Text>
                            <TextInput
                                style={styles.editInput}
                                value={editForm.cutOptions}
                                onChangeText={val => setEditForm(p => ({ ...p, cutOptions: val }))}
                                placeholder="e.g. Curry Cut, Biryani Cut, Boneless"
                            />

                            <Text style={[styles.inputLabel, { marginTop: Spacing.m }]}>Description</Text>
                            <TextInput
                                style={[styles.editInput, { height: 80, textAlignVertical: 'top' }]}
                                value={editForm.description}
                                onChangeText={val => setEditForm(p => ({ ...p, description: val }))}
                                placeholder="Short description..."
                                multiline
                            />

                            <Text style={[styles.inputLabel, { marginTop: Spacing.m }]}>Image URL (Optional)</Text>
                            <TextInput
                                style={[styles.editInput, { marginBottom: Spacing.xl}]}
                                value={editForm.image}
                                onChangeText={val => setEditForm(p => ({ ...p, image: val }))}
                                placeholder="https://..."
                            />
                        </ScrollView>
                        <View style={styles.modalFooter}>
                            {selectedProduct && (
                                <TouchableOpacity style={styles.deleteBtnTop} onPress={handleDeleteProduct}>
                                    <Ionicons name="trash" size={22} color={Colors.white} />
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity style={[styles.modalDeclineBtn, { flex: 1 }]} onPress={() => setProductEditModalVisible(false)}>
                                <Text style={styles.modalDeclineText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalAcceptBtn, { flex: 1.5 }]} onPress={handleSaveProduct}>
                                <Text style={styles.modalBtnText}>{selectedProduct ? 'Save Changes' : 'Create Product'}</Text>
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
    layout: { flex: 1 },

    // Top Nav
    topNav: { flexDirection: 'row', backgroundColor: Colors.white, borderBottomWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.s },
    topNavScroll: { alignItems: 'center', paddingRight: Spacing.m },
    navItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.m, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent', marginRight: Spacing.s },
    navItemActive: { borderBottomColor: Colors.primary },
    navText: { fontSize: 14, marginLeft: 6, color: Colors.textLight, fontWeight: '600' },
    navTextActive: { color: Colors.primary, fontWeight: 'bold' },
    logoutButton: { padding: Spacing.s },
    countBadge: { backgroundColor: '#F3F4F6', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1, marginLeft: 4 },
    countBadgeText: { fontSize: 11, fontWeight: 'bold', color: Colors.textLight },

    // Shop Control Widget
    shopControlWidget: {
        backgroundColor: Colors.white,
        borderRadius: 0,
        padding: Spacing.m,
        borderBottomWidth: 1,
        borderColor: Colors.border,
    },
    statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.m },
    widgetLabel: { fontSize: 10, color: Colors.textLight, fontWeight: 'bold', letterSpacing: 1 },
    widgetStatusText: { ...Typography.h3, marginTop: 2 },
    toggleBtn: { paddingHorizontal: Spacing.m, paddingVertical: 8, borderRadius: 8 },
    toggleText: { color: Colors.white, fontWeight: 'bold', fontSize: 13 },
    ratesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.s, alignItems: 'flex-end' },
    rateInputGroup: { flex: 1, minWidth: 120 },
    rateLabel: { fontSize: 11, color: Colors.textLight, marginBottom: 4, fontWeight: '600' },
    rateInput: { borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 8, backgroundColor: '#F9FAFB', fontSize: 14 },
    updateRatesBtn: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.m, paddingVertical: 10, borderRadius: 8, alignSelf: 'flex-end' },
    updateBtnText: { color: Colors.white, fontWeight: 'bold', fontSize: 12 },
    // Publish button
    publishBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#16A34A',
        borderRadius: 8,
        paddingVertical: 10,
        marginTop: Spacing.m,
        gap: 8,
    },
    publishBtnText: { color: Colors.white, fontWeight: 'bold', fontSize: 13 },

    // Products Header
    productsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.m, paddingVertical: Spacing.s, backgroundColor: Colors.white, borderBottomWidth: 1, borderColor: Colors.border },
    productsHeaderTitle: { ...Typography.h3 },
    refreshBtn: { padding: 6, backgroundColor: '#FFF5F5', borderRadius: 8, borderWidth: 1, borderColor: Colors.border },

    // Category Filter — same as HomeScreen filterPill
    categoryFilterContainer: { paddingHorizontal: Spacing.m, paddingVertical: Spacing.s, gap: Spacing.s, backgroundColor: Colors.white, borderBottomWidth: 1, borderColor: Colors.border },
    filterPill: { paddingHorizontal: Spacing.m, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, marginRight: Spacing.s },
    filterPillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    filterText: { fontSize: 13, color: Colors.textLight, fontWeight: '600' },
    filterTextActive: { color: Colors.white },

    // List
    listContent: { padding: Spacing.m, paddingBottom: 40 },
    placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 60, gap: Spacing.m },
    placeholderText: { ...Typography.body, color: Colors.textLight },

    // Order Card
    orderCard: { backgroundColor: Colors.white, borderRadius: 12, padding: Spacing.m, marginBottom: Spacing.m, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    cardOrderId: { fontWeight: 'bold', color: Colors.text, fontSize: 14 },
    cardTime: { fontSize: 12, color: Colors.textLight, marginTop: 2 },
    badgePending: { backgroundColor: '#FFF7ED', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    badgeProcessing: { backgroundColor: '#F0FDF4', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    badgeCancelled: { backgroundColor: '#FEF2F2', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    badgeText: { fontSize: 10, fontWeight: 'bold', color: Colors.text },
    divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: Spacing.m },
    cardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.m },
    customerRow: { flexDirection: 'row', alignItems: 'center' },
    customerName: { fontWeight: '600', color: Colors.text, fontSize: 14 },
    itemCount: { fontSize: 12, color: Colors.textLight },
    totalAmount: { ...Typography.h3, color: Colors.primary },
    cardActions: { flexDirection: 'row', gap: Spacing.m },
    btnAccept: { flex: 1, backgroundColor: Colors.primary, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
    btnAcceptText: { color: Colors.white, fontWeight: 'bold', fontSize: 14 },
    btnDecline: { flex: 1, borderWidth: 1, borderColor: Colors.border, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
    btnDeclineText: { color: Colors.textLight, fontWeight: '600' },

    // Product Card
    productCard: {
        backgroundColor: Colors.white,
        borderRadius: 14,
        padding: Spacing.m,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.07,
        shadowRadius: 6,
    },
    productCardTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    categoryBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    categoryBadgeText: { fontSize: 11, fontWeight: '700' },
    productTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 6, lineHeight: 22 },
    priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
    productPrice: { fontSize: 16, fontWeight: 'bold', color: Colors.primary },
    productOriginalPrice: { fontSize: 13, textDecorationLine: 'line-through', color: Colors.textLight },
    productDesc: { fontSize: 13, color: Colors.textLight, fontStyle: 'italic', lineHeight: 19, marginTop: 2 },
    btnEditProduct: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#FFF5F5',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    btnEditProductText: { color: Colors.primary, fontWeight: '700', fontSize: 13 },

    // Dashboard
    dashboardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.m, marginBottom: Spacing.m },
    statCard: { flex: 1, minWidth: '45%', backgroundColor: Colors.white, borderRadius: 12, padding: Spacing.m, alignItems: 'center', gap: 6, elevation: 1, borderWidth: 1, borderColor: '#F3F4F6' },
    statNumber: { ...Typography.h1, color: Colors.text },
    statLabel: { ...Typography.caption, color: Colors.textLight, fontWeight: '600' },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '92%', maxHeight: '85%', backgroundColor: Colors.white, borderRadius: 16, overflow: 'hidden' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: Spacing.m, borderBottomWidth: 1, borderColor: Colors.border },
    modalTitle: { ...Typography.h3 },
    modalBody: { padding: Spacing.m },
    modalSection: { marginBottom: Spacing.m },
    labelSmall: { fontSize: 10, color: Colors.textLight, fontWeight: 'bold', letterSpacing: 1, marginBottom: 4 },
    value: { fontSize: 16, color: Colors.text, fontWeight: '500' },
    sectionHeader: { ...Typography.h3, marginBottom: Spacing.m },
    itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.s },
    itemName: { fontWeight: '600', fontSize: 14, color: Colors.text },
    itemMeta: { fontSize: 12, color: Colors.textLight, marginTop: 2 },
    itemPrice: { fontWeight: '600', color: Colors.text },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.s },
    totalLabel: { ...Typography.h2 },
    totalValue: { ...Typography.h1, color: Colors.primary },
    modalFooter: { padding: Spacing.m, borderTopWidth: 1, borderColor: Colors.border, flexDirection: 'row', gap: Spacing.m },
    modalAcceptBtn: { flex: 2, backgroundColor: Colors.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
    modalBtnText: { color: Colors.white, fontWeight: 'bold', fontSize: 16 },
    modalDeclineBtn: { flex: 1, backgroundColor: '#FEF2F2', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
    modalDeclineText: { color: Colors.error, fontWeight: 'bold', fontSize: 16 },

    // Decline Reason Modal
    smallModalContent: { width: '85%', backgroundColor: Colors.white, borderRadius: 16, padding: Spacing.l },
    reasonOption: { padding: Spacing.m, borderRadius: 10, marginBottom: Spacing.s, borderWidth: 1, borderColor: Colors.border, backgroundColor: '#F9FAFB' },
    reasonOptionSelected: { borderColor: Colors.error, backgroundColor: '#FEF2F2' },
    reasonText: { color: Colors.text, fontSize: 14 },
    reasonTextSelected: { color: Colors.error, fontWeight: 'bold' },
    notesInput: { borderWidth: 1, borderColor: Colors.border, borderRadius: 10, padding: Spacing.m, height: 80, textAlignVertical: 'top', marginTop: Spacing.s, fontSize: 14 },
    smallModalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: Spacing.l, gap: Spacing.m, alignItems: 'center' },
    cancelBtn: { padding: 10 },
    cancelBtnText: { color: Colors.textLight, fontWeight: '600' },
    confirmDeclineBtn: { backgroundColor: Colors.error, paddingHorizontal: Spacing.l, paddingVertical: 12, borderRadius: 8 },
    confirmDeclineText: { color: Colors.white, fontWeight: 'bold' },

    // Edit Input
    inputLabel: { fontSize: 12, color: Colors.textLight, marginBottom: 4, fontWeight: '600' },
    editInput: { borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 12, backgroundColor: '#F9FAFB', fontSize: 15 },
    catPickBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: Colors.border, backgroundColor: '#F9FAFB' },
    catPickBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    catPickText: { fontSize: 13, color: Colors.textLight, fontWeight: '600' },
    catPickTextActive: { color: Colors.white, fontWeight: '700' },
    addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    addBtnText: { color: Colors.white, fontWeight: 'bold', fontSize: 13 },
    deleteBtnTop: { backgroundColor: Colors.error, padding: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
