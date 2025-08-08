import axios from 'axios';

// 创建axios实例，只配置基础路径
const request = axios.create({
  baseURL: 'http://192.168.43.191:3000/api', // 基础URL
  timeout: 10000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json',
  },
});



// 封装GET请求
export const get = (url: string, params?: any) => {
  return request.get(url, { params });
};

// 封装POST请求
export const post = (url: string, data?: any) => {
  return request.post(url, data);
};

// 封装PUT请求
export const put = (url: string, data?: any) => {
  return request.put(url, data);
};

// 封装DELETE请求
export const del = (url: string) => {
  return request.delete(url);
};

export default request;
