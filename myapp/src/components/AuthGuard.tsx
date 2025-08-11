import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useCart } from '../utils/CartContext';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

/**
 * 身份验证守卫组件
 * 用于保护需要登录的页面，并在用户登出时清空购物车
 */
const AuthGuard: React.FC<AuthGuardProps> = ({ children, requireAuth = true }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigation = useNavigation();
  const { clearCart } = useCart();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          if (requireAuth) {
            // 如果需要身份验证但用户未登录，则清空购物车并导航到登录页面
            clearCart();
            navigation.navigate('Login' as never);
          }
        }
      } catch (error) {
        console.error('认证检查失败:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // 监听登录状态变化
    const unsubscribe = navigation.addListener('focus', () => {
      checkAuth();
    });

    return unsubscribe;
  }, [navigation, requireAuth, clearCart]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#e2ac62" />
        <Text style={{ marginTop: 10, color: '#666' }}>正在检查登录状态...</Text>
      </View>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return null; // 不渲染子组件，等待导航到登录页面
  }

  return <>{children}</>;
};

export default AuthGuard;
