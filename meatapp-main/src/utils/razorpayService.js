import RazorpayCheckout from 'react-native-razorpay';
import { BASE_URL } from '../services/apiConfig';

const API_BASE = `${BASE_URL}/api`;
const RAZORPAY_KEY_ID = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_Se8fJ73HC9pUCW';

async function createOrder(amount) {
    const response = await fetch(`${API_BASE}/payment/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
    });

    const data = await response.json();

    if (!response.ok || !data?.success || !data.order) {
        throw new Error(data?.message || 'Unable to create payment order.');
    }

    return data.order;
}

async function verifyPayment(payment) {
    const response = await fetch(`${API_BASE}/payment/verify-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payment),
    });

    const data = await response.json();

    if (!response.ok || !data?.success) {
        throw new Error(data?.message || 'Payment verification failed.');
    }

    return data;
}

export const initiatePayment = async (amount, customer = {}) => {
    try {
        const order = await createOrder(amount);

        const options = {
            key: RAZORPAY_KEY_ID,
            amount: order.amount,
            currency: 'INR',
            name: 'Premium Meat',
            description: 'Order Payment',
            order_id: order.id,
            prefill: {
                email: customer.email || 'test@gmail.com',
                contact: customer.contact || '9999999999',
                name: customer.name || 'User',
            },
            theme: { color: '#E53935' },
        };

        const payment = await RazorpayCheckout.open(options);
        await verifyPayment(payment);

        return { success: true, order, payment };
    } catch (error) {
        console.log('PAYMENT ERROR:', error);
        return { success: false, error };
    }
};
