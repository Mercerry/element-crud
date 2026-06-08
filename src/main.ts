import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import 'normalize.css';
import 'element-plus/dist/index.css';
import './styles/app.less';
import App from './App.vue';
import DynamicCrud from './index';

createApp(App).use(ElementPlus).use(DynamicCrud).mount('#app');
