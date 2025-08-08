import React from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { useCart } from '../utils/CartContext';

type IconProps = {
  focused: boolean;
};

export const HomeIcon = ({ focused }: IconProps) => {
  return (
    <Text style={[styles.icon, focused ? styles.focused : styles.inactive]}>🏠</Text>
  );
};

export const CartIcon = ({ focused }: IconProps) => {
  const { getTotalItems } = useCart();
  const count = getTotalItems();

  return (
    <View>
      <Text style={[styles.icon, focused ? styles.focused : styles.inactive]}>🛒</Text>
      {count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
        </View>
      )}
    </View>
  );
};

export const OrdersIcon = ({ focused }: IconProps) => {
  return (
    <Text style={[styles.icon, focused ? styles.focused : styles.inactive]}>📋</Text>
  );
};

export const ProfileIcon = ({ focused }: IconProps) => {
  return (
    <Text style={[styles.icon, focused ? styles.focused : styles.inactive]}>👤</Text>
  );
};

const styles = StyleSheet.create({
  icon: {
    fontSize: 24,
  },
  focused: {
    color: '#FF6347', // Tomato color when focused
  },
  inactive: {
    color: '#AAAAAA', // Gray when not focused
  },
  badge: {
    position: 'absolute',
    right: -6,
    top: -3,
    backgroundColor: 'red',
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
}); 