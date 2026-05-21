<template>
  <div class="login-page">
    <div class="mask"></div>

    <!-- 左侧介绍 -->
    <div class="left-panel">
      <div class="brand">
        <div class="brand-logo">
          紫
        </div>

        <div>
          <h1>紫霞公寓</h1>
          <p>租客服务平台</p>
        </div>
      </div>

      <div class="slogan">
        <h2>欢迎回家</h2>
        <p>在线查看合同、水电账单、通知和维修进度</p>
      </div>

      <div class="feature-list">
        <div class="feature-item">
          <span>01</span>
          <p>查看我的房间与合同信息</p>
        </div>

        <div class="feature-item">
          <span>02</span>
          <p>查看并确认水电账单</p>
        </div>

        <div class="feature-item">
          <span>03</span>
          <p>提交维修、开门、退租等申请</p>
        </div>
      </div>
    </div>

    <!-- 右侧登录框 -->
    <div class="login-card">
      <div class="card-title">
        <h2>租客登录</h2>
        <p>请输入您的账号信息</p>
      </div>

      <el-form>
        <el-form-item>
          <el-input
            v-model="loginForm.phone"
            size="large"
            placeholder="请输入手机号"
            clearable
          />
        </el-form-item>

        <el-form-item>
          <el-input
            v-model="loginForm.password"
            size="large"
            type="password"
            placeholder="请输入密码"
            show-password
            clearable
          />
        </el-form-item>

        <div class="login-options">
          <el-checkbox v-model="loginForm.remember">
            记住我
          </el-checkbox>

          <span class="forgot-password">
            忘记密码？
          </span>
        </div>

        <el-button
          type="primary"
          size="large"
          class="login-button"
          @click="handleLogin"
        >
          登录
        </el-button>

        <div class="other-entry">
          <span @click="goVisitor">
            我是游客，去看房
          </span>
        </div>
      </el-form>

      <div class="test-account">
        <p>测试账号：</p>
        <p>手机号：13800000001</p>
        <p>密码：123456</p>
      </div>
    </div>

    <!-- 底部版权 -->
    <div class="footer">
      © 2026 紫霞公寓房屋管理系统 版权所有
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()

const loginForm = reactive({
  phone: '',
  password: '',
  remember: true,
})

const handleLogin = () => {
  if (!loginForm.phone) {
    ElMessage.warning('请输入手机号')
    return
  }

  if (!loginForm.password) {
    ElMessage.warning('请输入密码')
    return
  }

  if (loginForm.phone === '13800000001' && loginForm.password === '123456') {
  ElMessage.success('登录成功')
  router.push('/home')
  return
}

  ElMessage.error('手机号或密码错误')
}

const goVisitor = () => {
  window.location.href = 'http://localhost:5175/'
}
</script>

<style scoped>
.login-page {
  width: 100vw;
  height: 100vh;

  position: relative;

  display: flex;
  align-items: center;
  justify-content: space-between;

  padding: 0 10%;

  overflow: hidden;

  background-image: url('https://images.unsplash.com/photo-1514565131-fce0801e5785?q=80&w=2070&auto=format&fit=crop');
  background-size: cover;
  background-position: center;
}

.mask {
  position: absolute;
  inset: 0;

  background: rgba(0, 21, 41, 0.58);
  z-index: 1;
}

.left-panel {
  position: relative;
  z-index: 2;

  width: 52%;

  color: #ffffff;
}

.brand {
  display: flex;
  align-items: center;
  gap: 16px;

  margin-bottom: 90px;
}

.brand-logo {
  width: 54px;
  height: 54px;

  border-radius: 16px;

  background: rgba(255, 255, 255, 0.18);

  display: flex;
  align-items: center;
  justify-content: center;

  font-size: 28px;
  font-weight: bold;
}

.brand h1 {
  font-size: 30px;
  margin: 0 0 4px;
}

.brand p {
  margin: 0;
  color: #e6f4ff;
}

.slogan h2 {
  font-size: 64px;
  margin: 0 0 22px;
}

.slogan p {
  font-size: 22px;
  color: #e6f4ff;
  margin: 0;
}

.feature-list {
  margin-top: 60px;

  display: flex;
  flex-direction: column;
  gap: 18px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 16px;

  font-size: 16px;
  color: #f5f7fa;
}

.feature-item span {
  width: 36px;
  height: 36px;

  border-radius: 50%;

  background: rgba(255, 255, 255, 0.18);

  display: flex;
  align-items: center;
  justify-content: center;

  font-weight: bold;
}

.feature-item p {
  margin: 0;
}

.login-card {
  position: relative;
  z-index: 2;

  width: 430px;

  padding: 42px 40px;

  background: rgba(255, 255, 255, 0.96);

  border-radius: 18px;

  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.25);
}

.card-title {
  margin-bottom: 30px;
}

.card-title h2 {
  font-size: 30px;
  color: #303133;
  margin: 0 0 10px;
}

.card-title p {
  margin: 0;
  color: #909399;
}

.login-options {
  display: flex;
  justify-content: space-between;
  align-items: center;

  margin-bottom: 22px;
}

.forgot-password {
  color: #409eff;
  cursor: pointer;
  font-size: 14px;
}

.login-button {
  width: 100%;
}

.other-entry {
  margin-top: 20px;
  text-align: center;
}

.other-entry span {
  color: #409eff;
  cursor: pointer;
  font-size: 14px;
}

.test-account {
  margin-top: 24px;
  padding: 12px 16px;

  background: #f5f7fa;
  border-radius: 10px;

  color: #606266;
  font-size: 13px;
  line-height: 1.7;
}

.test-account p {
  margin: 0;
}

.footer {
  position: absolute;
  left: 0;
  bottom: 20px;

  width: 100%;

  text-align: center;

  z-index: 2;

  color: rgba(255, 255, 255, 0.78);
  font-size: 13px;
}

@media (max-width: 900px) {
  .login-page {
    justify-content: center;
    padding: 0 20px;
  }

  .left-panel {
    display: none;
  }

  .login-card {
    width: 100%;
    max-width: 420px;
  }
}
</style>