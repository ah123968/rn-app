import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, ScrollView, Alert } from 'react-native'
import React, { useState } from 'react'

export default function NewAddress() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    selectedAddress: '',
    detailAddress: '',
    isDefault: false
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSelectAddress = () => {
    console.log('选择地址')
    // 这里可以添加导航到地址选择页面或地图选择页面的逻辑
    Alert.alert('提示', '这里将跳转到地图选择页面')
  }

  const handleSave = () => {
    // 验证必填字段
    if (!formData.name || !formData.phone || !formData.selectedAddress || !formData.detailAddress) {
      Alert.alert('提示', '请填写完整信息')
      return
    }

    // 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/
    if (!phoneRegex.test(formData.phone)) {
      Alert.alert('提示', '请输入正确的手机号码')
      return
    }

    console.log('保存地址:', formData)
    Alert.alert('成功', '地址保存成功', [
      {
        text: '确定',
        onPress: () => {
          // 这里可以添加返回上一页的逻辑
        }
      }
    ])
  }

  const toggleDefault = () => {
    setFormData(prev => ({
      ...prev,
      isDefault: !prev.isDefault
    }))
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* 联系人信息 */}
        <View style={styles.section}>
          <View style={styles.inputRow}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>👤</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="请输入姓名"
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
            />
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.inputRow}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>📞</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="请输入手机号"
              value={formData.phone}
              onChangeText={(value) => handleInputChange('phone', value)}
              keyboardType="phone-pad"
              maxLength={11}
            />
          </View>
        </View>

        {/* 地址选择 */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.inputRow}
            onPress={handleSelectAddress}
          >
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>📍</Text>
            </View>
            <View style={styles.addressSelector}>
              <Text style={formData.selectedAddress ? styles.selectedText : styles.placeholderText}>
                {formData.selectedAddress || '请选择地址'}
              </Text>
              <Text style={styles.chevron}>›</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 详细地址 */}
        <View style={styles.section}>
          <View style={styles.inputRow}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>🏠</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="楼层及门牌号,例如3单元501"
              value={formData.detailAddress}
              onChangeText={(value) => handleInputChange('detailAddress', value)}
            />
          </View>
        </View>

        {/* 默认地址设置 */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.inputRow}
            onPress={toggleDefault}
          >
            <View style={styles.iconContainer}>
              <Text style={[styles.icon, formData.isDefault && styles.activeIcon]}>
                {formData.isDefault ? '🔵' : '⚪'}
              </Text>
            </View>
            <Text style={styles.defaultText}>设为常用地址</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>保存地址</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    marginBottom: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  iconContainer: {
    width: 30,
    alignItems: 'center',
    marginRight: 15,
  },
  icon: {
    fontSize: 20,
    color: '#e2ac62',
  },
  activeIcon: {
    color: '#2196f3',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  addressSelector: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
  },
  chevron: {
    fontSize: 18,
    color: '#ccc',
    marginLeft: 10,
  },
  defaultText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginLeft: 60,
  },
  bottomButtonContainer: {
    padding: 15,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  saveButton: {
    backgroundColor: '#e2ac62',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
})