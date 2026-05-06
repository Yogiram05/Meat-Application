import { BASE_URL } from '../services/apiConfig';

const API_BASE = `${BASE_URL}/api`;

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

export const initiatePayment = async (amount, navigation) => {
    try {
        const order = await createOrder(amount);

        // ✅ Navigate to Razorpay WebView screen
        navigation.navigate("Payment", {
            orderId: order.id,
            amount: order.amount
        });

        return { success: true, order };

    } catch (error) {
        console.log("PAYMENT ERROR:", error);
        return { success: false, error };
    }
};