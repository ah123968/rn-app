import axios from 'axios';

// 创建axios实例，只配置基础路径
const request = axios.create({
  baseURL: 'http://192.168.43.191:3000/api', // 基础URL
  timeout: 10000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
  },
});

// 封装GET请求
export const get = (url: string, params?: any, headers?: any) => {
  const finalHeaders = {
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    ...headers
  };
  return request.get(url, { params, headers: finalHeaders });
};

// 封装POST请求
export const post = (url: string, data?: any, headers?: any) => {
  return request.post(url, data, { headers });
};

// 封装PUT请求
export const put = (url: string, data?: any, headers?: any) => {
  return request.put(url, data, { headers });
};

// 封装DELETE请求
export const del = (url: string, headers?: any) => {
  return request.delete(url, { headers });
};

export default request;
