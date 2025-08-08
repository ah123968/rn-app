import { Text, View, StyleSheet, TouchableOpacity } from 'react-native'
import React, { Component } from 'react'
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../router/Router';
import type { RouteProp } from '@react-navigation/native';
import axios from 'axios';
type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

type LoginScreenRouteProp = RouteProp<RootStackParamList, 'Login'>;

type Props = {
  navigation: LoginScreenNavigationProp;
  route: LoginScreenRouteProp;
};

export default class Login extends Component<Props> {
  // 模拟登录方法
  handleLogin = () => {
    // 在实际应用中，这里应该进行实际的登录请求
    // 登录成功后，存储用户令牌到AsyncStorage
    
    // 模拟登录成功
    // AsyncStorage.setItem('userToken', 'fake-token');
    
    // 登录成功后导航到首页
    axios.post(`http://192.168.43.51:3000/api/store-admin/login`,{
      username: '15900001111',
      password: 'password'
    }).then(res => {
      console.log(res);
    })
    this.props.navigation.replace('Shou');
  };

  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>登录</Text>
        
        {/* 这里可以添加用户名和密码输入框 */}
        
        <TouchableOpacity 
          style={styles.loginButton} 
          onPress={this.handleLogin}
        >
          <Text style={styles.buttonText}>登录</Text>
        </TouchableOpacity>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});