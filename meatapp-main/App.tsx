import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { DataProvider } from './src/context/DataContext';

export default function App() {
  return (
    <DataProvider>
      <SafeAreaProvider>
        <AppNavigator />
      </SafeAreaProvider>
    </DataProvider>
  );
}
