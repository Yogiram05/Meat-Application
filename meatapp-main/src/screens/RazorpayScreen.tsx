import React from 'react';
import { WebView } from 'react-native-webview';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Razorpay'>;

export default function RazorpayScreen({ route, navigation }: Props) {
  const { orderId, amount } = route.params;

  const html = `
    <html>
      <body>
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
        <script>
          var options = {
            key: "${process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID}",
            amount: "${amount}",
            currency: "INR",
            name: "Meat Booking App",
            description: "Order Payment",
            order_id: "${orderId}",
            handler: function (response){
              window.ReactNativeWebView.postMessage(JSON.stringify(response));
            }
          };
          var rzp = new Razorpay(options);
          rzp.open();
        </script>
      </body>
    </html>
  `;

  return (
    <WebView
      originWhitelist={['*']}
      source={{ html }}
      onMessage={(event) => {
        const data = JSON.parse(event.nativeEvent.data);
        console.log("Payment Success:", data);

        navigation.goBack();
      }}
    />
  );
}