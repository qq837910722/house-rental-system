<template>
  <el-container class="layout-container">
    <!-- 左侧菜单 -->
    <el-aside width="220px" class="sidebar">
      <div class="logo">
        <img src="/images/zixia-brand.jpg" alt="紫霞公寓" />
        <div>
          <strong>紫霞公寓</strong>
          <span>租好房</span>
        </div>
      </div>

      <el-menu
        router
        :default-active="activeMenu"
        background-color="transparent"
        text-color="#fff8df"
        active-text-color="#222222"
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
          紫霞公寓 · 房屋管理系统后台
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
                {{ adminInitial }}
              </div>

              <span class="admin-name">
                {{ adminUser.name || adminUser.username || 'admin' }}
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
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()

const adminUser = computed(() => {
  try {
    return JSON.parse(localStorage.getItem('admin_user') || '{}')
  } catch {
    return {}
  }
})

const adminInitial = computed(() => {
  return (adminUser.value.name || adminUser.value.username || 'A').slice(0, 1)
})

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
        localStorage.removeItem('admin_user')
        ElMessage.success('已退出登录')
        router.replace('/')
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
  background: #fff8ec;
}

/* 左侧菜单 */
.sidebar {
  background:
    linear-gradient(180deg, rgba(45, 36, 31, 0.98), rgba(29, 24, 21, 0.99)),
    radial-gradient(circle at 42px 120px, rgba(255, 198, 24, 0.24), transparent 120px);
  color: #fff8df;
  border-right: 4px solid #ff7b5f;
}

.logo {
  min-height: 104px;
  padding: 16px 18px;

  display: flex;
  align-items: center;
  gap: 12px;

  color: #fff8df;
  background: rgba(20, 16, 14, 0.42);

  border-bottom: 2px solid rgba(255, 199, 31, 0.55);
}

.logo img {
  width: 54px;
  height: 54px;
  object-fit: cover;
  border-radius: 14px;
  border: 2px solid #ffc61a;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.22);
}

.logo strong {
  display: block;
  font-size: 21px;
  font-weight: 900;
  letter-spacing: 1px;
}

.logo span {
  display: block;
  margin-top: 2px;
  color: #ffc61a;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 6px;
}

.side-menu {
  border-right: none;
}

.side-menu :deep(.el-menu-item) {
  height: 58px;
  font-size: 15px;
  margin: 7px 12px;
  border-radius: 14px;
  color: #fff8df;
  font-weight: 700;
}

.side-menu :deep(.el-menu-item:hover) {
  background: rgba(255, 198, 24, 0.18);
  color: #ffc61a;
}

.side-menu :deep(.el-menu-item.is-active) {
  background: #ffc61a;
  color: #222222;
  box-shadow: 0 8px 18px rgba(255, 123, 95, 0.26);
}

/* 顶部栏 */
.header {
  height: 72px;

  display: flex;
  align-items: center;
  justify-content: space-between;

  padding: 0 28px;

  background:
    linear-gradient(90deg, rgba(255, 248, 236, 0.96), rgba(255, 243, 218, 0.96)),
    radial-gradient(circle at 88% 0%, rgba(255, 198, 24, 0.22), transparent 160px);

  border-bottom: 3px solid #ffc61a;
}

.header-title {
  position: relative;
  font-size: 20px;
  font-weight: 900;
  color: #242424;
  letter-spacing: 0.5px;
}

.header-title::before {
  content: '';
  display: inline-block;
  width: 14px;
  height: 14px;
  margin-right: 10px;
  border-radius: 4px 12px 4px 12px;
  background: #ff7b5f;
  box-shadow: 14px 0 0 #ffc61a, 28px 0 0 #8c5a2b;
  vertical-align: -1px;
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

  background: #fff4d6;
  border: 2px solid #ffc61a;

  cursor: pointer;

  font-size: 17px;

  display: flex;
  align-items: center;
  justify-content: center;
}

.bell-button:hover {
  background: #ffe29a;
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
  background: #fff0cc;
}

.admin-avatar {
  width: 32px;
  height: 32px;

  border-radius: 50%;

  background: #ff7b5f;
  color: #ffffff;

  display: flex;
  align-items: center;
  justify-content: center;

  font-size: 14px;
  font-weight: bold;
}

.admin-name {
  color: #242424;
  font-size: 14px;
}

.arrow {
  color: #909399;
  font-size: 12px;
}

/* 主体内容 */
.main-content {
  background:
    radial-gradient(circle at 94% 34px, rgba(255, 198, 24, 0.22) 0 42px, transparent 43px),
    radial-gradient(circle at 28px 92%, rgba(255, 123, 95, 0.14) 0 72px, transparent 73px),
    linear-gradient(180deg, #fff8ec 0%, #fff3da 100%);

  padding: 24px;

  height: calc(100vh - 72px);
  overflow-y: auto;
}
</style>
