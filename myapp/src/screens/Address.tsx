import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native'
import React from 'react'
import { useNavigation } from '@react-navigation/native'

export default function Address() {
  const navigation = useNavigation()
  
  const addresses = [
    {
      id: '1',
      name: '王淼',
      phone: '13371208888',
      address: '浙江省杭州市西湖区余杭塘路866号浙江大学',
      isDefault: true
    },
    {
      id: '2',
      name: '王淼',
      phone: '13371208888',
      address: '浙江省杭州市西湖区余杭塘路866号浙江大学',
      isDefault: false
    }
  ]

  const handleEditAddress = (addressId: string) => {
    console.log('编辑地址:', addressId)
    // 这里可以添加导航到编辑地址页面的逻辑
  }

  const handleAddNewAddress = () => {
    navigation.push('NewAddress')
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {addresses.map((address) => (
          <View key={address.id} style={styles.addressCard}>
            <View style={styles.cardHeader}>
              <View style={styles.contactInfo}>
                <Text style={styles.namePhone}>
                  {address.name} {address.phone}
                </Text>
                {address.isDefault && (
                  <Text style={styles.defaultLabel}>默认地址</Text>
                )}
              </View>
            </View>
            <Text style={styles.addressText}>{address.address}</Text>
            <View style={styles.cardFooter}>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => handleEditAddress(address.id)}
              >
                <Text style={styles.editButtonText}>编辑</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
      
      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAddNewAddress}
        >
          <Text style={styles.addButtonText}>新增常用地址</Text>
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
    padding: 15,
  },
  addressCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    marginBottom: 10,
  },
  contactInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  namePhone: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  defaultLabel: {
    fontSize: 12,
    color: '#999',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 15,
  },
  cardFooter: {
    alignItems: 'flex-end',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButtonText: {
    color: '#2196f3',
    fontSize: 14,
    marginLeft: 4,
  },
  bottomButtonContainer: {
    padding: 15,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  addButton: {
    backgroundColor: '#e2ac62',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
})