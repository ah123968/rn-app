import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../router/Router';

type StoreLoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'StoreLogin'>;

type Props = {
  navigation: StoreLoginScreenNavigationProp;
};

// API配置 - 根据不同环境选择合适的基础URL
const API_BASE_URL = 'http://192.168.43.51:3000';  // 使用您实际的后端服务器IP

// 使用您电脑的实际IP地址，如果在真实设备上测试
// const API_BASE_URL = 'http://192.168.x.x:3000';  

const StoreLogin: React.FC<Props> = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 处理登录
  const handleLogin = async () => {
    try {
      // 验证输入
      if (!username || !password) {
        setErrorMsg('用户名和密码不能为空');
        return;
      }

      setIsLoading(true);
      setErrorMsg('');

      console.log('尝试登录到:', `${API_BASE_URL}/api/store-admin/login`);

      // 调用API登录
      const response = await fetch(`${API_BASE_URL}/api/store-admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      console.log('登录响应:', data);

      if (response.ok) {
        // 登录成功，保存token和商家信息
        await AsyncStorage.setItem('storeAdminToken', data.data.token);
        await AsyncStorage.setItem('storeAdminInfo', JSON.stringify({
          adminId: data.data.adminId,
          name: data.data.name,
          role: data.data.role,
          storeId: data.data.store.id,
          storeName: data.data.store.name
        }));

        console.log('Token已存储:', data.data.token);
        console.log('商家信息已存储');

        // 导航到商家首页
        navigation.replace('StoreDashboard');
      } else {
        // 登录失败
        setErrorMsg(data.message || '登录失败，请检查账号密码');
      }
    } catch (error) {
      console.error('登录错误:', error);
      setErrorMsg('网络错误，请稍后再试');
    } finally {
      setIsLoading(false);
    }
  };

  // 用于开发测试的模拟登录
  const handleMockLogin = async () => {
    try {
      setIsLoading(true);
      
      // 模拟网络请求延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 模拟登录成功，创建假数据
      const mockLoginData = {
        token: 'mock-jwt-token-' + Date.now(),
        adminId: 'admin-id-001',
        name: '门店管理员',
        role: 'admin',
        store: {
          id: 'store-001',
          name: '洁净洗衣店'
        }
      };
      
      // 保存数据到AsyncStorage
      await AsyncStorage.setItem('storeAdminToken', mockLoginData.token);
      await AsyncStorage.setItem('storeAdminInfo', JSON.stringify({
        adminId: mockLoginData.adminId,
        name: mockLoginData.name,
        role: mockLoginData.role,
        storeId: mockLoginData.store.id,
        storeName: mockLoginData.store.name
      }));

      console.log('模拟Token已存储:', mockLoginData.token);
      console.log('模拟商家信息已存储');

      // 导航到商家首页
      navigation.replace('StoreDashboard');
    } catch (error) {
      console.error('模拟登录错误:', error);
      setErrorMsg('登录失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.logoContainer}>
        <View style={styles.logoPlaceholder}>
          <Text style={styles.logoText}>洗衣</Text>
        </View>
        <Text style={styles.title}>商家管理系统</Text>
      </View>

      <View style={styles.formContainer}>
        {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>账号</Text>
          <TextInput
            style={styles.input}
            placeholder="请输入商家账号"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>密码</Text>
          <TextInput
            style={styles.input}
            placeholder="请输入密码"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginButtonText}>登录</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.testAccountText}>
          测试账号: shop3 / 密码: 123456
        </Text>

        <TouchableOpacity 
          style={styles.mockLoginButton}
          onPress={handleMockLogin}
          disabled={isLoading}
        >
          <Text style={styles.mockLoginText}>离线模拟登录</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footerText}>需要帮助？请联系系统管理员</Text>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#f5f5f5'
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40
  },
  logoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10
  },
  logoText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333'
  },
  formContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  inputContainer: {
    marginBottom: 20
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333'
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16
  },
  loginButton: {
    backgroundColor: '#007AFF',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600'
  },
  mockLoginButton: {
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  mockLoginText: {
    color: '#666',
    fontSize: 14
  },
  errorText: {
    color: 'red',
    marginBottom: 15,
    textAlign: 'center'
  },
  footerText: {
    marginTop: 20,
    textAlign: 'center',
    color: '#666'
  },
  testAccountText: {
    marginTop: 15,
    textAlign: 'center',
    color: '#888',
    fontSize: 12
  }
});

export default StoreLogin; 