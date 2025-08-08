import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../router/Router';

type StoreDashboardScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'StoreDashboard'>;

type Props = {
  navigation: StoreDashboardScreenNavigationProp;
};

interface StoreInfo {
  id: string;
  name: string;
  address: string;
  phone: string;
  store?: {
    name: string;
  }
}

interface AdminInfo {
  id: string;
  name: string;
  role: string;
}

const API_BASE_URL = 'http://192.168.43.51:3000'; // 使用您实际的后端服务器IP

const StoreDashboard: React.FC<Props> = ({ navigation }) => {
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);
  const [adminInfo, setAdminInfo] = useState<AdminInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [migratingData, setMigratingData] = useState(false);

  useEffect(() => {
    loadStoreInfo();
  }, []);

  const loadStoreInfo = async () => {
    setLoading(true);
    try {
      console.log('StoreDashboard: 开始加载商家信息');
      
      // 获取token
      const token = await AsyncStorage.getItem('storeAdminToken');
      console.log('StoreDashboard: 获取token状态:', token ? '成功' : '失败');
      
      if (!token) {
        console.log('StoreDashboard: 未找到token，重定向到登录页');
        navigation.replace('StoreLogin');
        return;
      }

      // 获取管理员和商店信息
      const response = await fetch(`${API_BASE_URL}/api/store-admin/info`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('StoreDashboard: API响应状态码:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP错误! 状态码: ${response.status}`);
      }

      const data = await response.json();
      console.log('StoreDashboard: API数据:', JSON.stringify(data).substring(0, 100) + '...');

      if (data.code === 0 && data.data) {
        console.log('StoreDashboard: 成功获取商店和管理员信息');
        
        setAdminInfo({
          id: data.data.adminId,
          name: data.data.name,
          role: data.data.role
        });

        setStoreInfo({
          id: data.data.store.id,
          name: data.data.name,
          address: data.data.store.address,
          phone: data.data.store.phone || '未设置',
          store: {
            name: data.data.store.name
          }
        });
        
        // 更新AsyncStorage中的管理员信息，确保是最新的
        await AsyncStorage.setItem('storeAdminInfo', JSON.stringify({
          adminId: data.data.adminId,
          name: data.data.name,
          role: data.data.role,
          storeId: data.data.store.id,
          storeName: data.data.store.name
        }));
      } else {
        console.error('StoreDashboard: API返回错误:', data.message);
        // 使用本地存储的信息作为备份
        const infoStr = await AsyncStorage.getItem('storeAdminInfo');
        if (infoStr) {
          const info = JSON.parse(infoStr);
          setStoreInfo({
            id: info.storeId || '',
            name: info.storeName || '未知店铺',
            address: '未知地址',
            phone: '未设置',
            store: {
              name: info.storeName || '未知店铺'
            }
          });
          setAdminInfo({
            id: info.adminId || '',
            name: info.name || '未知',
            role: info.role || 'admin'
          });
        }
      }
    } catch (error) {
      console.error('StoreDashboard: 加载商家信息失败:', error);
      Alert.alert('错误', '加载商家信息失败: ' + (error instanceof Error ? error.message : '未知错误'));
      
      // 使用本地存储的信息作为备份
      try {
        const infoStr = await AsyncStorage.getItem('storeAdminInfo');
        if (infoStr) {
          const info = JSON.parse(infoStr);
          setStoreInfo({
            id: info.storeId || '',
            name: info.storeName || '未知店铺',
            address: '未知地址',
            phone: '未设置',
            store: {
              name: info.storeName || '未知店铺'
            }
          });
          setAdminInfo({
            id: info.adminId || '',
            name: info.name || '未知',
            role: info.role || 'admin'
          });
        }
      } catch (e) {
        console.error('StoreDashboard: 读取本地存储失败:', e);
      }
    } finally {
      setLoading(false);
    }
  };

  const migrateOrderStatuses = async () => {
    try {
      setMigratingData(true);
      const token = await AsyncStorage.getItem('storeAdminToken');
      
      if (!token) {
        Alert.alert('错误', '用户未登录，无法添加数据');
        return;
      }
      
      // 调用快速生成测试订单的API
      const response = await fetch(`${API_BASE_URL}/api/order/quick-test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`服务器错误: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.code === 0) {
        Alert.alert('成功', `已添加${data.data.count}条新订单数据。请返回订单页面刷新查看。`);
      } else {
        Alert.alert('错误', data.message || '添加订单数据失败');
      }
    } catch (error) {
      console.error('添加订单数据失败:', error);
      Alert.alert('错误', `添加订单数据失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setMigratingData(false);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('storeAdminToken');
      await AsyncStorage.removeItem('storeAdminInfo');
      // 返回登录页面
      navigation.replace('StoreLogin');
    } catch (error) {
      console.error('退出登录失败:', error);
      Alert.alert('错误', '退出登录失败，请重试');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{storeInfo?.name || '商家管理系统'}</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>退出登录</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.welcomeContainer}>
          <View style={styles.welcomeContent}>
            <Text style={styles.welcomeText}>欢迎, {adminInfo?.name || '管理员'}!</Text>
            <Text style={styles.addressText}>{storeInfo?.address || '地址未设置'}</Text>
          </View>
        </View>

        {/* 数据迁移按钮 - 仅用于开发调试 */}
        <TouchableOpacity 
          style={styles.migrateButton}
          onPress={migrateOrderStatuses}
          disabled={migratingData}
        >
          <Text style={styles.migrateButtonText}>
            {migratingData ? '添加中...' : '添加测试数据'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>订单管理</Text>
        <View style={styles.menuGrid}>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate('OrderList', { status: 'paid' })}
          >
            <View style={[styles.menuIcon, { backgroundColor: '#FF9800' }]}>
              <Text style={styles.iconText}>📃</Text>
            </View>
            <Text style={styles.menuText}>全部订单</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate('OrderList', { status: 'paid' })}
          >
            <View style={[styles.menuIcon, { backgroundColor: '#FF9800' }]}>
              <Text style={styles.iconText}>💰</Text>
            </View>
            <Text style={styles.menuText}>待处理</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate('OrderList', { status: 'washing' })}
          >
            <View style={[styles.menuIcon, { backgroundColor: '#2196F3' }]}>
              <Text style={styles.iconText}>🔄</Text>
            </View>
            <Text style={styles.menuText}>洗护中</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate('OrderList', { status: 'ready' })}
          >
            <View style={[styles.menuIcon, { backgroundColor: '#4CAF50' }]}>
              <Text style={styles.iconText}>✓</Text>
            </View>
            <Text style={styles.menuText}>已完成</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>商店管理</Text>
        <View style={styles.menuGrid}>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate('StoreInfo')}
          >
            <View style={[styles.menuIcon, { backgroundColor: '#9C27B0' }]}>
              <Text style={styles.iconText}>🏪</Text>
            </View>
            <Text style={styles.menuText}>店铺信息</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate('ServiceManagement')}
          >
            <View style={[styles.menuIcon, { backgroundColor: '#E91E63' }]}>
              <Text style={styles.iconText}>🧵</Text>
            </View>
            <Text style={styles.menuText}>服务管理</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate('DataStatistics')}
          >
            <View style={[styles.menuIcon, { backgroundColor: '#3F51B5' }]}>
              <Text style={styles.iconText}>📊</Text>
            </View>
            <Text style={styles.menuText}>数据统计</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate('SystemSettings')}
          >
            <View style={[styles.menuIcon, { backgroundColor: '#607D8B' }]}>
              <Text style={styles.iconText}>⚙️</Text>
            </View>
            <Text style={styles.menuText}>系统设置</Text>
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
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666'
  },
  header: {
    backgroundColor: '#007AFF',
    paddingTop: 15,
    paddingBottom: 15,
    paddingHorizontal: 15,
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
    padding: 5
  },
  logoutText: {
    color: 'white',
    fontSize: 14
  },
  content: {
    flex: 1,
    padding: 15
  },
  welcomeContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    flexDirection: 'row'
  },
  welcomeContent: {
    flex: 1
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333'
  },
  addressText: {
    fontSize: 14,
    color: '#666'
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333'
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    justifyContent: 'space-between'
  },
  menuItem: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    alignItems: 'center'
  },
  menuIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10
  },
  iconText: {
    fontSize: 24,
    color: 'white'
  },
  menuText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500'
  },
  // 新增样式
  migrateButton: {
    backgroundColor: '#FF5722',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
    alignItems: 'center'
  },
  migrateButtonText: {
    color: 'white',
    fontWeight: 'bold'
  }
});

export default StoreDashboard; 