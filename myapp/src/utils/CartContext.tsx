import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 购物车商品类型定义
export interface CartItem {
  id: string;
  name: string;
  price: number;
  unit: string;
  quantity: number;
  image?: string;
  category?: string;
  description?: string;
}

// 购物车上下文类型
interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getMemberPrice: () => number;
}

// 创建购物车上下文
const CartContext = createContext<CartContextType | undefined>(undefined);

// 购物车存储键名
const CART_STORAGE_KEY = '@WashApp:cart';

// 购物车提供者组件
export const CartProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  // 初始化时加载本地存储的购物车数据
  useEffect(() => {
    const loadCart = async () => {
      try {
        const savedCart = await AsyncStorage.getItem(CART_STORAGE_KEY);
        if (savedCart) {
          setItems(JSON.parse(savedCart));
          console.log('购物车数据已从本地存储加载');
        }
      } catch (error) {
        console.error('加载购物车数据失败:', error);
      }
    };
    
    loadCart();
  }, []);

  // 保存购物车数据到本地存储
  const saveCart = async (cartItems: CartItem[]) => {
    try {
      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (error) {
      console.error('保存购物车数据失败:', error);
    }
  };

  // 添加商品到购物车
  const addItem = (item: Omit<CartItem, 'quantity'>, quantity = 1) => {
    setItems(prevItems => {
      // 检查商品是否已在购物车中
      const existingItem = prevItems.find(i => i.id === item.id);
      
      let newItems;
      if (existingItem) {
        // 如果商品已存在，更新数量
        newItems = prevItems.map(i => 
          i.id === item.id 
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      } else {
        // 如果商品不存在，添加新商品
        newItems = [...prevItems, { ...item, quantity }];
      }
      
      // 保存到本地存储
      saveCart(newItems);
      return newItems;
    });
  };

  // 从购物车移除商品
  const removeItem = (id: string) => {
    setItems(prevItems => {
      const newItems = prevItems.filter(item => item.id !== id);
      saveCart(newItems);
      return newItems;
    });
  };

  // 更新购物车商品数量
  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 0) return;
    
    setItems(prevItems => {
      const newItems = quantity === 0
        ? prevItems.filter(item => item.id !== id) // 如果数量为0，则移除
        : prevItems.map(item => 
            item.id === id ? { ...item, quantity } : item
          );
      
      saveCart(newItems);
      return newItems;
    });
  };

  // 清空购物车
  const clearCart = () => {
    setItems([]);
    saveCart([]);
  };

  // 计算购物车总数量
  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  // 计算购物车总价
  const getTotalPrice = () => {
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  // 计算会员价格（假设会员价为原价的50%）
  const getMemberPrice = () => {
    return items.reduce((total, item) => total + (item.price * 0.5) * item.quantity, 0);
  };

  return (
    <CartContext.Provider 
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalPrice,
        getMemberPrice
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// 自定义Hook，用于访问购物车上下文
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart必须在CartProvider内部使用');
  }
  return context;
}; 