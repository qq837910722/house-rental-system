<template>
  <el-container class="tenant-layout">
    <!-- 左侧菜单 -->
    <el-aside width="220px" class="sidebar">
      <div class="logo">
        紫霞公寓
      </div>

      <el-menu
        router
        :default-active="activeMenu"
        background-color="#001529"
        text-color="#ffffff"
        active-text-color="#409eff"
        class="side-menu"
      >
        <el-menu-item index="/home">
          <span>首页</span>
        </el-menu-item>

        <el-menu-item index="/my-contract">
          <span>我的合同</span>
        </el-menu-item>

        <el-menu-item index="/my-utilities">
          <span>水电账单</span>
        </el-menu-item>

        <el-menu-item index="/my-notices">
          <span>通知中心</span>
        </el-menu-item>

        <el-menu-item index="/my-work-orders">
          <span>工单申请</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- 右侧内容 -->
    <el-container>
      <el-header class="header">
        <div class="header-title">
          租客服务平台
        </div>

        <div class="header-right">
          <el-badge :value="2" class="notice-badge">
            <button class="bell-button">
              🔔
            </button>
          </el-badge>

          <el-dropdown trigger="hover" @command="handleCommand">
            <div class="user-menu">
              <div class="avatar">
                张
              </div>

              <span class="user-name">
                张三
              </span>

              <span class="arrow">
                ▾
              </span>
            </div>

            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  个人信息
                </el-dropdown-item>

                <el-dropdown-item command="password">
                  修改密码
                </el-dropdown-item>

                <el-dropdown-item divided command="logout">
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

const route = useRoute()

const activeMenu = computed(() => {
  return route.path
})

const handleCommand = (command) => {
  if (command === 'profile') {
    ElMessage.info('后面可以做个人信息页面')
  }

  if (command === 'password') {
    ElMessage.info('后面可以做修改密码页面')
  }

  if (command === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗？', '退出确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
      .then(() => {
        window.location.href = '/login'
      })
      .catch(() => {
        ElMessage.info('已取消退出')
      })
  }
}
</script>

<style scoped>
.tenant-layout {
  height: 100vh;
}

.sidebar {
  background: #001529;
}

.logo {
  height: 64px;

  display: flex;
  align-items: center;
  justify-content: center;

  color: #ffffff;
  font-size: 22px;
  font-weight: bold;

  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.side-menu {
  border-right: none;
}

.side-menu :deep(.el-menu-item) {
  height: 58px;
  font-size: 15px;
}

.side-menu :deep(.el-menu-item.is-active) {
  background: #001f33;
}

.header {
  height: 64px;

  display: flex;
  align-items: center;
  justify-content: space-between;

  padding: 0 28px;

  background: #ffffff;
  border-bottom: 1px solid #ebeef5;
}

.header-title {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.bell-button {
  width: 36px;
  height: 36px;

  border: none;
  border-radius: 50%;

  background: #f5f7fa;

  cursor: pointer;
  font-size: 17px;
}

.bell-button:hover {
  background: #ecf5ff;
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 8px;

  padding: 6px 10px;

  border-radius: 18px;
  cursor: pointer;
}

.user-menu:hover {
  background: #f5f7fa;
}

.avatar {
  width: 32px;
  height: 32px;

  border-radius: 50%;

  background: #409eff;
  color: #ffffff;

  display: flex;
  align-items: center;
  justify-content: center;

  font-weight: bold;
}

.user-name {
  color: #606266;
  font-size: 14px;
}

.arrow {
  color: #909399;
  font-size: 12px;
}

.main-content {
  height: calc(100vh - 64px);

  padding: 24px;

  background: #f0f2f5;
  overflow-y: auto;
}
</style>