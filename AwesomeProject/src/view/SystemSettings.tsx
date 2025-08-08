import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Switch,
  Alert,
  TextInput
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../router/Router';

// API配置
const API_BASE_URL = 'http://192.168.43.51:3000'; // 修改为您后端的实际IP地址

type SystemSettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SystemSettings'>;

type Props = {
  navigation: SystemSettingsScreenNavigationProp;
};

interface Settings {
  notifications: boolean;
  soundEnabled: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
  darkMode: boolean;
  language: string;
  orderAutoConfirm: boolean;
  urgentOrderAlerts: boolean;
  printReceipts: boolean;
}

const SystemSettings: React.FC<Props> = ({ navigation }) => {
  const [settings, setSettings] = useState<Settings>({
    notifications: true,
    soundEnabled: true,
    autoRefresh: true,
    refreshInterval: 60,
    darkMode: false,
    language: 'zh',
    orderAutoConfirm: false,
    urgentOrderAlerts: true,
    printReceipts: true
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [refreshIntervalInput, setRefreshIntervalInput] = useState('60');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError('');

      // 获取认证Token
      const token = await AsyncStorage.getItem('storeToken');
      if (!token) {
        navigation.replace('StoreLogin');
        return;
      }

      // 从本地存储加载设置
      const savedSettings = await AsyncStorage.getItem('storeSettings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(parsedSettings);
        setRefreshIntervalInput(parsedSettings.refreshInterval.toString());
      }

      // 尝试从API加载设置
      try {
        const response = await fetch(`${API_BASE_URL}/api/store-admin/settings`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const result = await response.json();
          if (result.code === 0) {
            setSettings(result.data.settings);
            setRefreshIntervalInput(result.data.settings.refreshInterval.toString());
          }
        } else {
          // API请求失败，使用默认设置或本地存储的设置
          setError('无法获取最新设置，使用本地设置');
        }
      } catch (fetchError) {
        console.error('获取系统设置失败:', fetchError);
        setError('无法连接服务器，使用本地设置');
      }
    } catch (error) {
      console.error('加载系统设置失败:', error);
      setError('加载系统设置失败');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);

      // 验证刷新间隔输入
      const refreshInterval = parseInt(refreshIntervalInput, 10);
      if (isNaN(refreshInterval) || refreshInterval < 10) {
        Alert.alert('错误', '刷新间隔必须是不小于10的数字');
        setSaving(false);
        return;
      }

      // 更新设置对象
      const updatedSettings = {
        ...settings,
        refreshInterval
      };
      
      // 保存到本地存储
      await AsyncStorage.setItem('storeSettings', JSON.stringify(updatedSettings));

      // 尝试保存到API
      const token = await AsyncStorage.getItem('storeToken');
      if (token) {
        try {
          const response = await fetch(`${API_BASE_URL}/api/store-admin/settings`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              settings: updatedSettings
            })
          });

          if (!response.ok) {
            setError('无法同步设置到服务器，但已保存到本地');
          }
        } catch (fetchError) {
          console.error('保存设置到服务器失败:', fetchError);
          setError('无法连接服务器，设置已保存到本地');
        }
      }

      // 更新本地状态
      setSettings(updatedSettings);
      Alert.alert('成功', '设置已保存');
      
    } catch (error) {
      console.error('保存设置失败:', error);
      Alert.alert('错误', '保存设置失败');
    } finally {
      setSaving(false);
    }
  };

  // 切换设置状态
  const toggleSetting = (key: keyof Settings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // 更改语言设置
  const changeLanguage = (lang: string) => {
    setSettings(prev => ({
      ...prev,
      language: lang
    }));
  };

  // 渲染设置项开关
  const renderSettingSwitch = (key: keyof Settings, label: string, description: string) => (
    <View style={styles.settingItem}>
      <View style={styles.settingTextContainer}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <Switch
        value={settings[key] as boolean}
        onValueChange={() => toggleSetting(key)}
        trackColor={{ false: '#767577', true: '#81b0ff' }}
        thumbColor={settings[key] ? '#007AFF' : '#f4f3f4'}
      />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>加载系统设置中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>返回</Text>
        </TouchableOpacity>
        <Text style={styles.title}>系统设置</Text>
        <TouchableOpacity 
          style={styles.saveButton} 
          onPress={saveSettings}
          disabled={saving}
        >
          <Text style={styles.saveText}>{saving ? '保存中...' : '保存'}</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>通知设置</Text>

          {renderSettingSwitch(
            'notifications', 
            '推送通知', 
            '接收新订单和其他重要通知'
          )}

          {renderSettingSwitch(
            'soundEnabled', 
            '通知声音', 
            '收到通知时播放提示音'
          )}

          {renderSettingSwitch(
            'urgentOrderAlerts', 
            '加急订单提醒', 
            '接收加急订单的特别提醒'
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>自动化设置</Text>

          {renderSettingSwitch(
            'autoRefresh', 
            '自动刷新', 
            '定期自动刷新订单列表'
          )}

          {settings.autoRefresh && (
            <View style={styles.inputSettingItem}>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>刷新间隔 (秒)</Text>
                <Text style={styles.settingDescription}>自动刷新的时间间隔</Text>
              </View>
              <TextInput
                style={styles.input}
                value={refreshIntervalInput}
                onChangeText={setRefreshIntervalInput}
                keyboardType="numeric"
                maxLength={3}
              />
            </View>
          )}

          {renderSettingSwitch(
            'orderAutoConfirm', 
            '自动接单', 
            '自动接受新订单'
          )}

          {renderSettingSwitch(
            'printReceipts', 
            '自动打印小票', 
            '订单完成时自动打印小票'
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>显示设置</Text>

          {renderSettingSwitch(
            'darkMode', 
            '深色模式', 
            '使用深色背景显示界面'
          )}

          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>语言</Text>
              <Text style={styles.settingDescription}>选择应用界面语言</Text>
            </View>
            <View style={styles.languageSelector}>
              <TouchableOpacity
                style={[
                  styles.languageButton,
                  settings.language === 'zh' && styles.languageButtonActive
                ]}
                onPress={() => changeLanguage('zh')}
              >
                <Text
                  style={[
                    styles.languageButtonText,
                    settings.language === 'zh' && styles.languageButtonTextActive
                  ]}
                >
                  中文
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.languageButton,
                  settings.language === 'en' && styles.languageButtonActive
                ]}
                onPress={() => changeLanguage('en')}
              >
                <Text
                  style={[
                    styles.languageButtonText,
                    settings.language === 'en' && styles.languageButtonTextActive
                  ]}
                >
                  English
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>关于</Text>
          <View style={styles.aboutContainer}>
            <Text style={styles.appNameText}>洗衣店商家管理系统</Text>
            <Text style={styles.versionText}>版本 1.0.0</Text>
            <Text style={styles.copyrightText}>© 2023 洗衣通. 保留所有权利。</Text>
          </View>
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
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 15
  },
  backButton: {
    padding: 5
  },
  backText: {
    color: 'white',
    fontSize: 16
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold'
  },
  saveButton: {
    padding: 5
  },
  saveText: {
    color: 'white',
    fontSize: 16
  },
  content: {
    flex: 1,
    padding: 10
  },
  errorContainer: {
    padding: 10,
    backgroundColor: '#FFECB3',
    borderRadius: 5,
    margin: 10
  },
  errorText: {
    color: '#F57C00',
    textAlign: 'center'
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  inputSettingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  settingTextContainer: {
    flex: 1
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500'
  },
  settingDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 5,
    width: 50,
    textAlign: 'center',
    fontSize: 14
  },
  languageSelector: {
    flexDirection: 'row'
  },
  languageButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginLeft: 5,
    backgroundColor: '#f0f0f0'
  },
  languageButtonActive: {
    backgroundColor: '#007AFF'
  },
  languageButtonText: {
    fontSize: 14,
    color: '#333'
  },
  languageButtonTextActive: {
    color: 'white'
  },
  aboutContainer: {
    alignItems: 'center',
    paddingVertical: 10
  },
  appNameText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5
  },
  versionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5
  },
  copyrightText: {
    fontSize: 12,
    color: '#999'
  }
});

export default SystemSettings; 