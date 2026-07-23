import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.shixu.app',
  appName: '拾绪',
  webDir: 'dist',
  ios: {
    // 内容不被状态栏/刘海遮挡由页面自身的 safe-area 处理
    contentInset: 'never',
    backgroundColor: '#f4f1ea',
  },
  // 真机/模拟器实时预览（可选）：
  //   把下面 server 段取消注释，url 改成你 Mac 的局域网地址（npm run dev 后终端显示的 Network 地址）
  //   即可热更新，不用每次改完都重新 build + sync。
  // server: {
  //   url: 'http://192.168.x.x:5173',
  //   cleartext: true,
  // },
}

export default config
