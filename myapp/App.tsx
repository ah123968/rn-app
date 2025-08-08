/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState, useEffect } from 'react';
import { StatusBar, useColorScheme, View, Text, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import cart provider
import { CartProvider } from './src/utils/CartContext';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import CartScreen from './src/screens/CartScreen';
import OrdersScreen from './src/screens/OrdersScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import UserData  from './src/screens/UserData';
import VipUser from './src/screens/VipUser';
import Coupon from './src/screens/Coupon';
import BadPro  from './src/screens/BadPro';
import Invoice from './src/screens/Invoice';
import Address from './src/screens/Address';
import NewAddress from './src/screens/NewAddress';
import Introduce from './src/screens/Introduce';
import Record from './src/screens/Record';
import JoinWash from './src/screens/JoinWash';
import AllStore from './src/screens/AllStore';
import Login from './src/screens/Login';

// Import tab icons
import { HomeIcon, CartIcon, OrdersIcon, ProfileIcon } from './src/components/TabIcons';

// Create navigators
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Tab Navigator Component
function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#FF6347',
        tabBarInactiveTintColor: '#AAAAAA',
        headerShown: false,
        tabBarStyle: {
          height: 50,
          paddingBottom: 10,
          paddingTop: 5,
        },
        headerStyle: {
          backgroundColor: '#e2ac62', // 设置标题栏背景颜色为橙棕色
          height: 50, // 减少标题栏高度
          elevation: 0, // 移除 Android 阴影
          shadowOpacity: 0, // 移除 iOS 阴影
        },
        headerTintColor: '#FFFFFF', // 设置标题文字颜色
        headerTitleStyle: {
          fontWeight: 'bold',
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
          title: "我的",
          headerTitleAlign: "center",
          tabBarIcon: ({ focused }) => <ProfileIcon focused={focused} />,
        }} 
      />
    </Tab.Navigator>
  );
}

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // 检查本地存储的token
      const tokenString = await AsyncStorage.getItem('userToken');
      if (tokenString) {
        const tokenData = JSON.parse(tokenString);
        if (tokenData.token) {
          // token存在，用户已登录
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('检查认证状态失败:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#E6A23C" />
          <Text style={{ marginTop: 10, color: '#666' }}>正在检查登录状态...</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <CartProvider>
        <NavigationContainer>
          <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
          <Stack.Navigator
            screenOptions={{
              headerShown: false, // 隐藏 Stack Navigator 的默认标题栏
            }}
            initialRouteName={isAuthenticated ? "MainTabs" : "Login"}
          >
            <Stack.Screen 
              name="MainTabs" 
              component={TabNavigator}
              options={{
                title: '主页',
              }}
            />
            {/* 这里可以添加其他需要嵌套的页面 */}
          
            <Stack.Screen 
              name="DetailScreen" 
              component={UserData}
              options={{
                headerShown: true,
                title: '用户信息',
              }}
            />
            <Stack.Screen 
              name="VipUser" 
              component={VipUser}
              options={{
                headerShown: true,
                title: '会员卡包',
              }}
            />
            <Stack.Screen
              name="Coupon"
              component={Coupon}
              options={{
                title: '优惠券',
                headerShown: true,
              }}
            />
            <Stack.Screen
              name="BadPro"
              component={BadPro}
              options={{
                title: '售后订单',
                headerShown: true,
              }}
            />
            <Stack.Screen
              name="Invoice"
              component={Invoice}
              options={{
                title: '开发票',
                headerShown: true,
              }}
            />
            <Stack.Screen
              name="Address"
              component={Address}
              options={{
                title: '地址管理',
                headerShown: true,
              }}
            />
            <Stack.Screen
              name="NewAddress"
              component={NewAddress}
              options={{
                title: '新增地址',
                headerShown: true,
              }}
            />
            <Stack.Screen
              name="Introduce"
              component={Introduce}
              options={{
                title: '关于熊洗洗',
                headerShown: true,
              }}
            />
            <Stack.Screen
              name="JoinWash"
              component={JoinWash}
              options={{
                title: '加盟洗店',
                headerShown: true,
              }}
            />
            <Stack.Screen
              name="Record"
              component={Record}
              options={{
                title: '订单记录',
                headerShown: true,
              }}
            />
            <Stack.Screen
              name="AllStore"
              component={AllStore}
              options={{
                title: '区域切换',
                headerShown: true,
              }}
            />
            <Stack.Screen
              name="Login"
              component={Login}
              options={{
                title: '登录',
              
              }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </CartProvider>
    </SafeAreaProvider>
  );
}

export default App;
