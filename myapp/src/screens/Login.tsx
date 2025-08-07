import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import React, { useState, useRef } from 'react';
import axios from 'axios';
export default function Login() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 模拟请求验证码
  const handleSendCode = async () => {
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      Alert.alert('提示', '请输入正确的手机号');
      return;
    }
      // 这里可调用后端 /api/user/send-code
    const response = await axios.post('http://10.0.2.2:3000/api/user/send-code',{phone})
    Alert.alert(response.data.code.toString());
    setCountdown(60);
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleLogin = () => {
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      Alert.alert('提示', '请输入正确的手机号');
      return;
    }
    if (!code) {
      Alert.alert('提示', '请输入验证码');
      return;
    }
    // 这里可调用后端 /api/user/login
    Alert.alert('登录', `手机号: ${phone}\n验证码: ${code}`);
  };

  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#fff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        {/* Logo或标题 */}
        <Text style={styles.title}>浣熊洗护</Text>
        {/* 手机号输入框 */}
        <TextInput
          style={styles.input}
          placeholder="请输入手机号"
          placeholderTextColor="#bbb"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          maxLength={11}
        />
        {/* 验证码输入框+按钮 */}
        <View style={styles.codeRow}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0, marginRight: 10 }]}
            placeholder="请输入验证码"
            placeholderTextColor="#bbb"
            keyboardType="number-pad"
            value={code}
            onChangeText={setCode}
            maxLength={6}
          />
          <TouchableOpacity
            style={[styles.codeBtn, countdown > 0 && styles.codeBtnDisabled]}
            onPress={handleSendCode}
            disabled={countdown > 0}
          >
            <Text style={[styles.codeBtnText, countdown > 0 && { color: '#aaa' }]}> 
              {countdown > 0 ? `${countdown}s后重发` : '获取验证码'}
            </Text>
          </TouchableOpacity>
        </View>
        {/* 登录按钮 */}
        <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
          <Text style={styles.loginBtnText}>登录</Text>
        </TouchableOpacity>
        {/* 底部链接 */}
        <View style={styles.linkRow}>
          <TouchableOpacity>
            <Text style={styles.linkText}>注册账号</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#E6A23C',
    marginBottom: 40,
    letterSpacing: 2,
  },
  input: {
    width: '100%',
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#faf9f7',
    paddingHorizontal: 16,
    fontSize: 17,
    marginBottom: 18,
    color: '#222',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 18,
  },
  codeBtn: {
    height: 48,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E6A23C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeBtnDisabled: {
    borderColor: '#eee',
    backgroundColor: '#faf9f7',
  },
  codeBtnText: {
    color: '#E6A23C',
    fontSize: 15,
    fontWeight: 'bold',
  },
  loginBtn: {
    width: '100%',
    height: 48,
    backgroundColor: '#E6A23C',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 24,
    shadowColor: '#E6A23C',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
    marginTop: 8,
  },
  linkText: {
    color: '#1890FF',
    fontSize: 15,
    marginHorizontal: 8,
  },
});