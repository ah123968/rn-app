import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 导入商家端页面组件
import StoreLogin from '../view/StoreLogin';
import StoreDashboard from '../view/StoreDashboard';
import OrderList from '../view/OrderList';
import OrderDetail from '../view/OrderDetail';
import StoreInfo from '../view/StoreInfo';
import ServiceManagement from '../view/ServiceManagement';
import DataStatistics from '../view/DataStatistics';
import SystemSettings from '../view/SystemSettings';

// 创建导航堆栈并定义参数类型
export type RootStackParamList = {
  StoreLogin: undefined;
  StoreDashboard: undefined;
  OrderList: { status: string };
  OrderDetail: { orderId: string };
  StoreInfo: undefined;
  ServiceManagement: undefined;
  DataStatistics: undefined;
  SystemSettings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const Router = () => {
  // 商家登录状态
  const [isStoreLoggedIn, setIsStoreLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 检查商家登录状态
    const checkStoreLoginStatus = async () => {
      try {
        // 检查商家登录状态
        const storeToken = await AsyncStorage.getItem('storeToken');
        setIsStoreLoggedIn(storeToken !== null);
        
        setIsLoading(false);
      } catch (e) {
        console.log('登录状态检查失败:', e);
        setIsStoreLoggedIn(false);
        setIsLoading(false);
      }
    };

    checkStoreLoginStatus();
  }, []);

  if (isLoading) {
    // 如果正在加载，可以显示一个加载界面
    return null; // 或者返回一个加载组件
  }

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={isStoreLoggedIn ? "StoreDashboard" : "StoreLogin"}
          screenOptions={{
            headerShown: false
          }}
        >
          {/* 商家端路由 */}
          <Stack.Screen 
            name="StoreLogin" 
            component={StoreLogin} 
            options={{
              headerShown: false
            }}
          />
          
          <Stack.Screen 
            name="StoreDashboard" 
            component={StoreDashboard}
            options={{
              headerShown: false
            }}
          />
          
          <Stack.Screen 
            name="OrderList" 
            component={OrderList}
            options={{
              headerShown: false
            }}
          />
          
          <Stack.Screen 
            name="OrderDetail" 
            component={OrderDetail}
            options={{
              headerShown: false
            }}
          />
          
          <Stack.Screen 
            name="StoreInfo" 
            component={StoreInfo}
            options={{
              headerShown: false
            }}
          />
          
          <Stack.Screen 
            name="ServiceManagement" 
            component={ServiceManagement}
            options={{
              headerShown: false
            }}
          />
          
          <Stack.Screen 
            name="DataStatistics" 
            component={DataStatistics}
            options={{
              headerShown: false
            }}
          />
          
          <Stack.Screen 
            name="SystemSettings" 
            component={SystemSettings}
            options={{
              headerShown: false
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default Router; 