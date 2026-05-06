import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/DesignSystem';
import NetworkStatusBanner from '../components/NetworkStatusBanner';
import { useData } from '../context/DataContext';

// Screens
import LoginScreen from '../screens/LoginScreen';
import AdminLoginScreen from '../screens/AdminLoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import OrderHistoryScreen from '../screens/OrderHistoryScreen';
import ProductDetailsScreen from '../screens/ProductDetailsScreen';
import CartScreen from '../screens/CartScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import RazorpayScreen from '../screens/RazorpayScreen'; // ✅ MUST

// ✅ TYPE FIX (name MUST match)
export type RootStackParamList = {
    Login: undefined;
    AdminLogin: undefined;
    Register: undefined;
    Main: undefined;
    AdminDashboard: undefined;
    ProductDetails: { product: any };
    Cart: undefined;

    Razorpay: { orderId: string; amount: number }; // ✅ IMPORTANT
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function MainTabs() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName: any;

                    if (route.name === 'Home') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'Orders') {
                        iconName = focused ? 'list' : 'list-outline';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: Colors.textLight,
            })}
        >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Orders" component={OrderHistoryScreen} />
        </Tab.Navigator>
    );
}

export default function AppNavigator() {
    const { isAdminAuthenticated } = useData();

    const ProtectedAdminDashboard = (props: any) => {
        if (!isAdminAuthenticated) {
            return <AdminLoginScreen {...props} />;
        }
        return <AdminDashboardScreen {...props} />;
    };

    return (
        <NavigationContainer>
            <NetworkStatusBanner />

            <Stack.Navigator
                initialRouteName="Login"
                screenOptions={{ headerShown: false }}
            >
                {/* Auth */}
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
                <Stack.Screen name="Register" component={RegisterScreen} />

                {/* Main */}
                <Stack.Screen name="Main" component={MainTabs} />

                <Stack.Screen
                    name="ProductDetails"
                    component={ProductDetailsScreen}
                />

                <Stack.Screen
                    name="Cart"
                    component={CartScreen}
                    options={{ title: 'My Cart' }}
                />

                {/* 🔥 PAYMENT SCREEN */}
                <Stack.Screen
                    name="Razorpay"
                    component={RazorpayScreen}
                />

                {/* Admin */}
                <Stack.Screen
                    name="AdminDashboard"
                    component={ProtectedAdminDashboard}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}