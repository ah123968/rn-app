import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 创建axios实例，只配置基础路径
const request = axios.create({
  baseURL: 'http://192.168.26.1:3000/api', // 修改为正确的IP地址
  timeout: 10000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json',
  },
});

// 添加请求拦截器
request.interceptors.request.use(
  config => {
    console.log('请求配置:', JSON.stringify({
      url: config.url,
      method: config.method,
      baseURL: config.baseURL,
      headers: config.headers,
      data: config.data
    }));
    return config;
  },
  error => {
    console.error('请求错误:', error);
    return Promise.reject(error);
  }
);

// 添加响应拦截器
request.interceptors.response.use(
  response => {
    console.log('响应数据:', JSON.stringify({
      status: response.status,
      statusText: response.statusText,
      data: response.data
    }));
    return response;
  },
  error => {
    console.error('响应错误:', error);
    if (error.response) {
      console.error('错误状态码:', error.response.status);
      console.error('错误数据:', JSON.stringify(error.response.data));
    } else if (error.request) {
      console.error('无响应:', error.request);
    } else {
      console.error('请求配置错误:', error.message);
    }
    return Promise.reject(error);
  }
);



// 封装GET请求
export const get = async (url: string, params?: any) => {
  const response = await request.get(url, { params });
  return response.data;
};

// 封装POST请求
export const post = async (url: string, data?: any, config?: any) => {
  try {
    // 获取token并设置请求头
    const tokenString = await AsyncStorage.getItem('userToken');
    if (tokenString) {
      const tokenData = JSON.parse(tokenString);
      request.defaults.headers.common['Authorization'] = `Bearer ${tokenData.token}`;
    }
    
    // 发送请求
    const response = await request.post(url, data, config);
    return response.data;
  } catch (error) {
    console.error(`POST请求出错 (${url}):`, error);
    throw error;
  }
};

// 封装PUT请求
export const put = async (url: string, data?: any) => {
  const response = await request.put(url, data);
  return response.data;
};

// 封装DELETE请求
export const del = async (url: string) => {
  const response = await request.delete(url);
  return response.data;
};

export default request;
