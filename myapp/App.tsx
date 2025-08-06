/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import CartScreen from './src/screens/CartScreen';
import OrdersScreen from './src/screens/OrdersScreen';
import ProfileScreen from './src/screens/ProfileScreen';

// Import tab icons
import { HomeIcon, CartIcon, OrdersIcon, ProfileIcon } from './src/components/TabIcons';

// Create bottom tab navigator
const Tab = createBottomTabNavigator();

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <Tab.Navigator
          screenOptions={{
            tabBarActiveTintColor: '#FF6347',
            tabBarInactiveTintColor: '#AAAAAA',
            tabBarStyle: {
              height: 60,
              paddingBottom: 10,
              paddingTop: 5,
            },
          }}
        >
          <Tab.Screen 
            name="Home" 
            component={HomeScreen} 
            options={{
              tabBarLabel: '首页',
              tabBarIcon: ({ focused }) => <HomeIcon focused={focused} />,
            }} 
          />
          <Tab.Screen 
            name="Cart" 
            component={CartScreen} 
            options={{
              tabBarLabel: '购物车',
              tabBarIcon: ({ focused }) => <CartIcon focused={focused} />,
            }} 
          />
          <Tab.Screen 
            name="Orders" 
            component={OrdersScreen} 
            options={{
              tabBarLabel: '订单',
              tabBarIcon: ({ focused }) => <OrdersIcon focused={focused} />,
            }} 
          />
          <Tab.Screen 
            name="Profile" 
            component={ProfileScreen} 
            options={{
              tabBarLabel: '我的',
              tabBarIcon: ({ focused }) => <ProfileIcon focused={focused} />,
            }} 
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
