/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

// 确保在应用启动时初始化必要的模块
import 'react-native-gesture-handler';

AppRegistry.registerComponent(appName, () => App);
