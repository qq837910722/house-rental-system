<template>
  <div class="login-container">

    <!-- 背景遮罩 -->
    <div class="mask"></div>

    <!-- 左侧标题 -->
    <div class="left-panel">
      <div class="system-title">
        <h1>紫霞公寓</h1>
        <p>亲爱的房东，感谢您为紫霞公寓付出的每一分</p>
      </div>
    </div>

    <!-- 右侧登录框 -->
    <div class="login-box">
      <h2>欢迎回家</h2>
      <p class="sub-title">请输入您的账号信息</p>

      <el-input
        v-model="username"
        placeholder="请输入用户名"
        class="input-item"
        size="large"
      />

      <el-input
        v-model="password"
        type="password"
        placeholder="请输入密码"
        class="input-item"
        size="large"
        show-password
      />

    <el-button type="primary" class="login-btn" size="large" @click="handleLogin">
        登录
    </el-button>
    </div>

    <div class="footer">© 2026 紫霞公寓房屋管理系统 版权所有，有任何问题请联系管理员18988287793   </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const username = ref('')
const password = ref('')

const router = useRouter()

const handleLogin = () => {
  router.push('/dashboard')
}
</script>

<style scoped>

/* 整个页面 */
.login-container {
  width: 100%;
  height: 100%;

  display: flex;
  justify-content: space-between;
  align-items: center;

  padding: 0 10%;

  position: relative;

  overflow: hidden;

  background-image: url('https://images.unsplash.com/photo-1514565131-fce0801e5785?q=80&w=2070&auto=format&fit=crop');

  background-size: cover;
  background-position: center;
}

/* 黑色遮罩 */
.mask {
  position: absolute;
  inset: 0;

  background: rgba(0, 0, 0, 0.45);
}

/* 左侧标题 */
.left-panel {
  z-index: 2;

  color: white;
}

.system-title h1 {
  font-size: 72px;
  font-weight: bold;

  margin-bottom: 20px;

  letter-spacing: 4px;
}

.system-title p {
  font-size: 24px;

  color: rgba(255,255,255,0.9);
}

/* 登录框 */
.login-box {
  z-index: 2;

  width: 420px;

  background: rgba(255,255,255,0.95);

  padding: 50px;

  border-radius: 20px;

  box-shadow: 0 10px 40px rgba(0,0,0,0.3);
}

/* 标题 */
.login-box h2 {
  font-size: 36px;

  margin-bottom: 10px;

  color: #333;
}

.sub-title {
  color: #888;

  margin-bottom: 30px;
}

/* 输入框 */
.input-item {
  margin-bottom: 20px;
}

/* 登录按钮 */
.login-btn {
  width: 100%;

  height: 45px;

  font-size: 18px;

  margin-top: 10px;
}
/* 底部版权 */
.footer {
  position: absolute;

  bottom: 20px;
  left: 50%;

  transform: translateX(-50%);

  color: rgba(255,255,255,0.8);

  font-size: 14px;

  z-index: 2;

  letter-spacing: 1px;
}


</style>