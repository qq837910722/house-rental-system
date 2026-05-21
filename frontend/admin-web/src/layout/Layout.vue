<template>
  <el-container class="layout-container">
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
        <el-menu-item index="/dashboard">
          <span>首页</span>
        </el-menu-item>

        <el-menu-item index="/houses">
          <span>房屋管理</span>
        </el-menu-item>

        <el-menu-item index="/tenants">
          <span>租客管理</span>
        </el-menu-item>

        <el-menu-item index="/contracts">
          <span>合同管理</span>
        </el-menu-item>

        <el-menu-item index="/notices">
          <span>通知管理</span>
        </el-menu-item>

        <el-menu-item index="/utilities">
          <span>水电管理</span>
        </el-menu-item>

        <el-menu-item index="/work-orders">
          <span>工单管理</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- 右侧主体 -->
    <el-container>
      <!-- 顶部导航 -->
      <el-header class="header">
        <div class="header-title">
          房屋管理系统后台
        </div>

        <div class="header-right">
          <!-- 通知铃铛 -->
          <el-popover
            placement="bottom-end"
            width="330"
            trigger="click"
          >
            <template #reference>
              <el-badge
                :value="unreadNoticeCount"
                :hidden="unreadNoticeCount === 0"
                class="notice-badge"
              >
                <button class="bell-button">
                  🔔
                </button>
              </el-badge>
            </template>

            <div class="notice-popover">
              <div class="notice-popover-header">
                <strong>最新通知</strong>

                <el-button
                  type="primary"
                  link
                  @click="markAllNoticeRead"
                >
                  全部已读
                </el-button>
              </div>

              <div
                v-for="notice in latestNoticeList"
                :key="notice.id"
                class="notice-popover-item"
                @click="markNoticeRead(notice)"
              >
                <div class="notice-title">
                  <span
                    v-if="!notice.read"
                    class="unread-dot"
                  ></span>

                  {{ notice.title }}
                </div>

                <div class="notice-time">
                  {{ notice.time }}
                </div>
              </div>

              <div
                v-if="latestNoticeList.length === 0"
                class="empty-notice"
              >
                暂无通知
              </div>
            </div>
          </el-popover>

          <!-- 管理员二级菜单 -->
          <el-dropdown
            trigger="hover"
            placement="bottom-end"
            @command="handleUserCommand"
          >
            <div class="user-menu">
              <div class="admin-avatar">
                管
              </div>

              <span class="admin-name">
                管理员
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

                <el-dropdown-item command="settings">
                  系统设置
                </el-dropdown-item>

                <el-dropdown-item divided command="logout">
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 页面内容 -->
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

const route = useRoute()

// 当前激活菜单
const activeMenu = computed(() => {
  return route.path
})

// 右上角通知数据：现在先用前端假数据
const latestNoticeList = ref([
  {
    id: 1,
    title: '5月房租缴纳通知已发布',
    time: '2026-05-18 10:30',
    read: false,
  },
  {
    id: 2,
    title: '201房间合同审批待处理',
    time: '2026-05-18 09:50',
    read: false,
  },
  {
    id: 3,
    title: '101房间空调维修申请',
    time: '2026-05-18 09:20',
    read: true,
  },
])

// 未读通知数量
const unreadNoticeCount = computed(() => {
  return latestNoticeList.value.filter((item) => !item.read).length
})

// 点击某条通知后设置为已读
const markNoticeRead = (notice) => {
  notice.read = true
}

// 全部已读
const markAllNoticeRead = () => {
  latestNoticeList.value.forEach((item) => {
    item.read = true
  })
}

// 管理员二级菜单点击事件
const handleUserCommand = (command) => {
  if (command === 'profile') {
    ElMessage.info('这里后面可以做个人信息页面')
  }

  if (command === 'password') {
    ElMessage.info('这里后面可以做修改密码功能')
  }

  if (command === 'settings') {
    ElMessage.info('这里后面可以做系统设置页面')
  }

  if (command === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗？', '退出确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
      .then(() => {
        ElMessage.success('已退出登录')

        // 后面接真实登录功能后，可以跳转到登录页
        // window.location.href = '/'
      })
      .catch(() => {
        ElMessage.info('已取消退出')
      })
  }
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

/* 左侧菜单 */
.sidebar {
  background: #001529;
  color: #ffffff;
}

.logo {
  height: 64px;

  display: flex;
  align-items: center;
  justify-content: center;

  font-size: 22px;
  font-weight: bold;

  color: #ffffff;
  background: #001529;

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

/* 顶部栏 */
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
  gap: 14px;
}

/* 通知铃铛 */
.notice-badge {
  display: flex;
  align-items: center;
}

.bell-button {
  width: 36px;
  height: 36px;

  border: none;
  border-radius: 50%;

  background: #f5f7fa;

  cursor: pointer;

  font-size: 17px;

  display: flex;
  align-items: center;
  justify-content: center;
}

.bell-button:hover {
  background: #ecf5ff;
}

.notice-popover-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;

  margin-bottom: 4px;
}

.notice-popover-item {
  padding: 11px 4px;

  border-bottom: 1px solid #ebeef5;

  cursor: pointer;
}

.notice-popover-item:last-child {
  border-bottom: none;
}

.notice-popover-item:hover {
  background: #f5f7fa;
}

.notice-title {
  display: flex;
  align-items: center;
  gap: 6px;

  color: #303133;
  font-size: 14px;
}

.notice-time {
  margin-top: 5px;
  padding-left: 13px;

  color: #909399;
  font-size: 12px;
}

.unread-dot {
  width: 7px;
  height: 7px;

  border-radius: 50%;

  background: #f56c6c;

  flex-shrink: 0;
}

.empty-notice {
  padding: 20px 0;
  text-align: center;
  color: #909399;
}

/* 管理员二级菜单 */
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

.admin-avatar {
  width: 32px;
  height: 32px;

  border-radius: 50%;

  background: #409eff;
  color: #ffffff;

  display: flex;
  align-items: center;
  justify-content: center;

  font-size: 14px;
  font-weight: bold;
}

.admin-name {
  color: #606266;
  font-size: 14px;
}

.arrow {
  color: #909399;
  font-size: 12px;
}

/* 主体内容 */
.main-content {
  background: #f0f2f5;

  padding: 24px;

  height: calc(100vh - 64px);
  overflow-y: auto;
}
</style>