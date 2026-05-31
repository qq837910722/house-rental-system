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

    <el-button type="primary" class="login-btn" size="large" :loading="loginLoading" @click="handleLogin">
        登录
    </el-button>
    </div>

    <div class="footer">© 2026 紫霞公寓房屋管理系统 版权所有，有任何问题请联系管理员18988287793   </div>
  </div>
    <el-dialog
      v-model="passwordDialogVisible"
      title="首次登录请修改密码"
      width="420px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
    >
      <el-form>
        <el-form-item label="新密码">
          <el-input
            v-model="newPassword"
            type="password"
            show-password
            placeholder="请输入新密码，至少6位"
          />
        </el-form-item>
        <el-form-item label="确认密码">
          <el-input
            v-model="confirmPassword"
            type="password"
            show-password
            placeholder="请再次输入新密码"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button type="primary" :loading="changePasswordLoading" @click="handleForceChangePassword">
          确认修改
        </el-button>
      </template>
    </el-dialog>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '../utils/request'

const username = ref('')
const password = ref('')
const loginLoading = ref(false)
const passwordDialogVisible = ref(false)
const changePasswordLoading = ref(false)
const newPassword = ref('')
const confirmPassword = ref('')
const pendingUser = ref(null)

const router = useRouter()

const handleLogin = async () => {
  if (!username.value) {
    ElMessage.warning('请输入用户名')
    return
  }

  if (!password.value) {
    ElMessage.warning('请输入密码')
    return
  }

  try {
    loginLoading.value = true
    const res = await request.post('/admin/login', {
      username: username.value,
      password: password.value,
    })

    if (res.code === 200) {
      if (res.data.must_change_password) {
        pendingUser.value = res.data
        passwordDialogVisible.value = true
        ElMessage.warning('首次登录需要先修改初始密码')
        return
      }

      localStorage.setItem('admin_user', JSON.stringify(res.data))
      ElMessage.success('登录成功')
      router.push('/dashboard')
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '用户名或密码错误')
  } finally {
    loginLoading.value = false
  }
}

const handleForceChangePassword = async () => {
  if (!newPassword.value || newPassword.value.length < 6) {
    ElMessage.warning('新密码至少 6 位')
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    ElMessage.warning('两次输入的新密码不一致')
    return
  }

  try {
    changePasswordLoading.value = true
    const res = await request.post('/users/change-password', {
      user_id: pendingUser.value.user_id,
      old_password: password.value,
      new_password: newPassword.value,
      role: 'admin',
    })

    if (res.code === 200) {
      ElMessage.success('密码已修改，请使用新密码重新登录')
      passwordDialogVisible.value = false
      password.value = ''
      newPassword.value = ''
      confirmPassword.value = ''
      pendingUser.value = null
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '修改密码失败')
  } finally {
    changePasswordLoading.value = false
  }
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

  background:
    radial-gradient(circle at 15% 20%, rgba(255, 198, 26, 0.28), transparent 180px),
    radial-gradient(circle at 85% 78%, rgba(255, 123, 95, 0.2), transparent 220px),
    linear-gradient(135deg, #fff8ec, #fff0cc);
}

/* 黑色遮罩 */
.mask {
  position: absolute;
  inset: 0;

  background:
    linear-gradient(90deg, rgba(45, 36, 31, 0.78), rgba(87, 57, 36, 0.22)),
    radial-gradient(circle at 22% 38%, rgba(255, 198, 26, 0.18), transparent 280px),
    url('/images/zixia-building.png');
  background-repeat: no-repeat;
  background-size: auto, auto, cover;
  background-position: center, center, center;
  opacity: 0.95;
}

/* 左侧标题 */
.left-panel {
  z-index: 2;

  color: #fff8df;
}

.system-title h1 {
  font-size: 72px;
  font-weight: bold;

  margin-bottom: 20px;

  letter-spacing: 4px;
}

.system-title p {
  font-size: 24px;

  color: rgba(255, 248, 223, 0.9);
}

/* 登录框 */
.login-box {
  z-index: 2;

  width: 420px;

  background: rgba(255, 248, 236, 0.95);

  padding: 50px;

  border: 3px solid #ffc61a;
  border-radius: 22px;

  box-shadow: 0 18px 42px rgba(47, 47, 45, 0.22);
}

/* 标题 */
.login-box h2 {
  font-size: 36px;

  margin-bottom: 10px;

  color: #252523;
}

.sub-title {
  color: #6f6b60;

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
  background: #ff7b5f;
  border-color: #ff7b5f;
}
/* 底部版权 */
.footer {
  position: absolute;

  bottom: 20px;
  left: 50%;

  transform: translateX(-50%);

  color: #2f2f2d;

  font-size: 14px;

  z-index: 2;

  letter-spacing: 1px;
}


</style>
