import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../router/Router';

type StoreDashboardScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'StoreDashboard'>;

type Props = {
  navigation: StoreDashboardScreenNavigationProp;
};

interface AdminInfo {
  adminId: string;
  name: string;
  role: string;
  storeId: string;
  storeName: string;
}

const StoreDashboard: React.FC<Props> = ({ navigation }) => {
  const [adminInfo, setAdminInfo] = useState<AdminInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 加载管理员信息
  useEffect(() => {
    const loadAdminInfo = async () => {
      try {
        const infoStr = await AsyncStorage.getItem('storeAdminInfo');
        if (infoStr) {
          const info = JSON.parse(infoStr);
          setAdminInfo(info);
        } else {
          // 如果没有信息，可能需要重新登录
          navigation.replace('StoreLogin');
        }
      } catch (error) {
        console.error('加载管理员信息失败:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAdminInfo();
  }, [navigation]);

  // 处理登出
  const handleLogout = async () => {
    try {
      // 清除存储的Token和管理员信息
      await AsyncStorage.removeItem('storeToken');
      await AsyncStorage.removeItem('storeAdminInfo');
      
      // 导航回登录页面
      navigation.replace('StoreLogin');
    } catch (error) {
      console.error('登出失败:', error);
      Alert.alert('错误', '登出失败，请稍后再试');
    }
  };

  // 处理导航到店铺信息页面
  const navigateToStoreInfo = () => {
    navigation.navigate('StoreInfo');
  };

  // 导航到服务管理页面
  const navigateToServiceManagement = () => {
    navigation.navigate('ServiceManagement');
  };

  // 导航到数据统计页面
  const navigateToDataStatistics = () => {
    navigation.navigate('DataStatistics');
  };

  // 导航到系统设置页面
  const navigateToSystemSettings = () => {
    navigation.navigate('SystemSettings');
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{adminInfo?.storeName || '门店'}</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>登出</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.adminInfoContainer}>
        <Text style={styles.welcomeText}>欢迎，{adminInfo?.name || '管理员'}</Text>
        <Text style={styles.roleText}>角色: {adminInfo?.role === 'admin' ? '管理员' : adminInfo?.role === 'manager' ? '经理' : '员工'}</Text>
      </View>

      <ScrollView style={styles.menuContainer}>
        <Text style={styles.sectionTitle}>订单管理</Text>
        <View style={styles.menuGrid}>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('OrderList', { status: 'all' })}>
            <View style={styles.menuItemIcon}>
              <Text style={styles.iconText}>📋</Text>
            </View>
            <Text style={styles.menuItemText}>全部订单</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('OrderList', { status: 'paid' })}>
            <View style={styles.menuItemIcon}>
              <Text style={styles.iconText}>💰</Text>
            </View>
            <Text style={styles.menuItemText}>待处理</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('OrderList', { status: 'processing' })}>
            <View style={styles.menuItemIcon}>
              <Text style={styles.iconText}>🔄</Text>
            </View>
            <Text style={styles.menuItemText}>处理中</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('OrderList', { status: 'completed' })}>
            <View style={styles.menuItemIcon}>
              <Text style={styles.iconText}>✅</Text>
            </View>
            <Text style={styles.menuItemText}>已完成</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>店铺管理</Text>
        <View style={styles.menuGrid}>
          <TouchableOpacity style={styles.menuItem} onPress={navigateToStoreInfo}>
            <View style={styles.menuItemIcon}>
              <Text style={styles.iconText}>🏪</Text>
            </View>
            <Text style={styles.menuItemText}>店铺信息</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem} onPress={navigateToServiceManagement}>
            <View style={styles.menuItemIcon}>
              <Text style={styles.iconText}>🧺</Text>
            </View>
            <Text style={styles.menuItemText}>服务管理</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem} onPress={navigateToDataStatistics}>
            <View style={styles.menuItemIcon}>
              <Text style={styles.iconText}>📊</Text>
            </View>
            <Text style={styles.menuItemText}>数据统计</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem} onPress={navigateToSystemSettings}>
            <View style={styles.menuItemIcon}>
              <Text style={styles.iconText}>⚙️</Text>
            </View>
            <Text style={styles.menuItemText}>系统设置</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold'
  },
  logoutButton: {
    padding: 8
  },
  logoutText: {
    color: 'white',
    fontWeight: '500'
  },
  adminInfoContainer: {
    backgroundColor: 'white',
    padding: 15,
    margin: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5
  },
  roleText: {
    fontSize: 14,
    color: '#666'
  },
  menuContainer: {
    flex: 1,
    padding: 10
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginVertical: 10,
    color: '#333'
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  menuItem: {
    backgroundColor: 'white',
    width: '48%',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  menuItemIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10
  },
  iconText: {
    fontSize: 24
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '500'
  }
});

export default StoreDashboard; 