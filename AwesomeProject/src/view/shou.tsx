import { Text, View, StyleSheet, TouchableOpacity } from 'react-native'
import React, { Component } from 'react'
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../router/Router';
import type { RouteProp } from '@react-navigation/native';

type ShouScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Shou'>;

type ShouScreenRouteProp = RouteProp<RootStackParamList, 'Shou'>;

type Props = {
  navigation: ShouScreenNavigationProp;
  route: ShouScreenRouteProp;
};

export default class Shou extends Component<Props> {
  // 模拟登出方法
  handleLogout = () => {
    // 在实际应用中，这里应该清除存储的用户令牌
    // AsyncStorage.removeItem('userToken');
    
    // 登出后导航回登录页面
    this.props.navigation.replace('Login');
  };

  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>首页</Text>
        <Text style={styles.welcomeText}>欢迎使用我们的应用</Text>
        
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={this.handleLogout}
        >
          <Text style={styles.buttonText}>登出</Text>
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
    marginBottom: 10,
  },
  welcomeText: {
    fontSize: 16,
    marginBottom: 20,
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
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