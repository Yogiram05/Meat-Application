import React from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useData } from '../context/DataContext';
import type { CartItem as DataCartItem } from '../context/DataContext';
import TopNavBar from '../components/TopNavBar';
import { BASE_URL } from '../services/apiConfig';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Cart'>;
type CartItem = Pick<DataCartItem, 'id' | 'title' | 'price' | 'quantity'>;

type CreateOrderResponse = {
  success?: boolean;
  order?: {
    id?: string;
    amount?: number;
  };
};

export default function CartScreen({ navigation }: Props) {

  const { cart, removeFromCart, placeOrder, currentUser } = useData();

  const calculateTotal = () =>
    cart.reduce((total, item) => {
      const price = parseFloat(String(item.price).replace(/[^0-9.]/g, ''));
      return total + price * item.quantity;
    }, 0);

  const buildOrderPayload = (paymentMethod: string) => ({
    items: cart.map((item) => ({
      id: item.id,
      title: item.title,
      price: item.price,
      quantity: item.quantity,
      cut: item.cut,
      cleaning: item.cleaning,
    })),
    subtotal: calculateTotal(),
    total: calculateTotal(),
    paymentMethod,
    paymentStatus: paymentMethod === 'Razorpay' ? 'Pending' : 'Paid on Delivery',
    status: 'Pending' as const,
    date: new Date().toISOString(),
    userId: currentUser?.id || null,
    userName: currentUser?.username || 'Guest',
    customerName: currentUser?.username || 'Guest',
    customerEmail: currentUser?.gmail || '',
    customerPhone: '',
    customerAddress: '',
    description: '',
  });

  const handleOnlinePayment = async () => {
    try {
      if (cart.length === 0) {
        Alert.alert("Cart empty");
        return;
      }

      const totalAmount = calculateTotal();

      const orderSaved = await placeOrder(buildOrderPayload('Razorpay'));
      if (!orderSaved) {
        Alert.alert('Error', 'Order could not be saved. Check backend connectivity.');
        return;
      }

      const res = await fetch(`${BASE_URL}/api/payment/create-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount: totalAmount }),
      });

      const data: CreateOrderResponse = await res.json();

      if (!data.success || !data.order?.id || typeof data.order.amount !== 'number') {
        throw new Error("Order creation failed");
      }

      navigation.navigate("Razorpay", {
        orderId: data.order.id,
        amount: data.order.amount,
      });

    } catch (err: unknown) {
      console.log("PAYMENT ERROR:", err);
      Alert.alert("Error", "Payment failed");
    }
  };

  const handleWhatsAppOrder = async () => {
    if (cart.length === 0) return;

    const totalAmount = calculateTotal();
    const snapshot = [...cart];

    const orderSaved = await placeOrder(buildOrderPayload('WhatsApp'));
    if (!orderSaved) {
      Alert.alert('Error', 'Order could not be saved. Check backend connectivity.');
      return;
    }

    let message = `New Order\n`;

    if (currentUser?.username) {
      message += `Customer: ${currentUser.username}\n`;
    }

    snapshot.forEach((item) => {
      message += `${item.title} - ${item.quantity}kg\n`;
    });

    message += `Total: ₹${totalAmount}`;

    const url = `https://wa.me/919384979853?text=${encodeURIComponent(message)}`;
    Linking.openURL(url);
  };

  return (
    <SafeAreaView style={styles.container}>

      <TopNavBar
        title="My Cart"
        leftContent={
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        }
      />

      <FlatList
        data={cart}
        keyExtractor={(item: CartItem) => item.id}
        renderItem={({ item }: { item: CartItem }) => (
          <View style={styles.cartItem}>
            <Text style={styles.title}>{item.title}</Text>
            <Text>{item.quantity}kg</Text>
            <Text style={styles.price}>{item.price}</Text>

            <TouchableOpacity onPress={() => removeFromCart(item.id)}>
              <Ionicons name="trash" size={20} color="red" />
            </TouchableOpacity>
          </View>
        )}
      />

      <View style={styles.footer}>
        <Text style={styles.total}>Total: ₹{calculateTotal()}</Text>

        <TouchableOpacity style={styles.payBtn} onPress={handleOnlinePayment}>
          <Text style={styles.btnText}>Pay Online</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.whatsappBtn} onPress={handleWhatsAppOrder}>
          <Text style={styles.btnText}>Order via WhatsApp</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  cartItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },

  title: { fontSize: 16, fontWeight: 'bold' },
  price: { color: 'red' },

  footer: {
    padding: 15,
    borderTopWidth: 1,
    borderColor: '#ddd',
  },

  total: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  payBtn: {
    backgroundColor: '#1E88E5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },

  whatsappBtn: {
    backgroundColor: '#25D366',
    padding: 15,
    borderRadius: 10,
  },

  btnText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});