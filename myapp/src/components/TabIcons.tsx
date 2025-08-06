import React from 'react';
import { Text, StyleSheet } from 'react-native';

type IconProps = {
  focused: boolean;
};

export const HomeIcon = ({ focused }: IconProps) => {
  return (
    <Text style={[styles.icon, focused ? styles.focused : styles.inactive]}>🏠</Text>
  );
};

export const CartIcon = ({ focused }: IconProps) => {
  return (
    <Text style={[styles.icon, focused ? styles.focused : styles.inactive]}>🛒</Text>
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
}); 