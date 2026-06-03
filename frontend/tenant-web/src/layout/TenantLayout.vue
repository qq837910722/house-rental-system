<template>
  <el-container class="tenant-layout">
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

    <el-container>
      <el-header class="header">
        <button class="mobile-menu-button" type="button" aria-label="打开菜单" @click="mobileMenuVisible = true">
          ☰
        </button>

        <div class="header-title">
          租客服务平台
        </div>

        <div class="header-right">
          <el-badge :value="noticeBadgeValue" :hidden="noticeBadgeValue === 0" class="notice-badge">
            <button class="bell-button" title="通知中心" @click="goNotices">
              🔔
            </button>
          </el-badge>

          <el-dropdown trigger="hover" @command="handleCommand">
            <div class="user-menu">
              <div class="avatar">
                {{ tenantInitial }}
              </div>

              <span class="user-name">
                {{ tenantUser.name || '租客' }}
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

    <el-drawer
      v-model="mobileMenuVisible"
      title="紫霞公寓"
      direction="ltr"
      size="76%"
      class="mobile-drawer"
    >
      <el-menu
        router
        :default-active="activeMenu"
        background-color="#001529"
        text-color="#ffffff"
        active-text-color="#409eff"
        class="side-menu mobile-drawer-menu"
        @select="closeMobileMenu"
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
    </el-drawer>

    <el-dialog
      v-model="confirmDialogVisible"
      title="待确认通知"
      width="560px"
      :close-on-click-modal="false"
    >
      <div v-if="currentConfirmNotice" class="confirm-notice">
        <div class="confirm-title">
          {{ currentConfirmNotice.title }}
        </div>
        <div class="confirm-meta">
          <el-tag :type="getTypeTag(currentConfirmNotice.type)">
            {{ currentConfirmNotice.type }}
          </el-tag>
          <span>{{ currentConfirmNotice.publishTime }}</span>
          <span>{{ currentConfirmNotice.source }}</span>
        </div>
        <div class="confirm-content">
          {{ currentConfirmNotice.content }}
        </div>
        <div class="confirm-progress">
          {{ confirmNoticeIndex + 1 }} / {{ pendingConfirmNotices.length }}
        </div>
      </div>

      <template #footer>
        <el-button @click="goNotices">
          去通知中心
        </el-button>
        <el-button type="primary" :loading="confirmLoading" @click="confirmCurrentNotice">
          我已确认
        </el-button>
      </template>
    </el-dialog>
  </el-container>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'

const route = useRoute()
const router = useRouter()

const noticeList = ref([])
const confirmDialogVisible = ref(false)
const confirmNoticeIndex = ref(0)
const confirmLoading = ref(false)
const mobileMenuVisible = ref(false)

const tenantUser = computed(() => {
  try {
    return JSON.parse(localStorage.getItem('tenant_user') || '{}')
  } catch {
    return {}
  }
})

const tenantId = computed(() => tenantUser.value.tenant_id || tenantUser.value.id)

const tenantInitial = computed(() => {
  return tenantUser.value.name ? tenantUser.value.name.slice(0, 1) : '租'
})

const activeMenu = computed(() => route.path)

const pendingConfirmNotices = computed(() => {
  return noticeList.value.filter((notice) => notice.needConfirm && !notice.isConfirmed)
})

const noticeBadgeValue = computed(() => {
  const count = noticeList.value.filter((notice) => {
    return !notice.isRead || (notice.needConfirm && !notice.isConfirmed)
  }).length

  return count > 99 ? '99+' : count
})

const currentConfirmNotice = computed(() => {
  return pendingConfirmNotices.value[confirmNoticeIndex.value] || null
})

const formatDateTime = (date) => {
  if (!date) return ''
  return String(date).replace('T', ' ').slice(0, 16)
}

const mapNotice = (notice) => ({
  id: notice.id,
  title: notice.title,
  type: notice.type,
  content: notice.content,
  publishTime: formatDateTime(notice.publish_time),
  source: notice.source || '房东发布',
  needConfirm: Number(notice.need_confirm) === 1,
  isConfirmed: Number(notice.is_confirmed) === 1,
  isRead: Number(notice.is_read) === 1,
})

const getNoticeList = async () => {
  if (!tenantId.value) return

  try {
    const res = await request.get('/tenant/notices', {
      params: { tenant_id: tenantId.value },
    })

    if (res.code === 200) {
      noticeList.value = (res.data || []).map(mapNotice)
      if (pendingConfirmNotices.value.length > 0) {
        confirmNoticeIndex.value = 0
        confirmDialogVisible.value = true
      }
    }
  } catch (error) {
    console.error('获取通知失败：', error)
  }
}

const getTypeTag = (type) => {
  if (type === '账单通知') return 'warning'
  if (type === '合同通知') return 'success'
  if (type === '公共通知') return 'primary'
  if (type === '生活提醒') return 'info'
  return ''
}

const goNotices = () => {
  confirmDialogVisible.value = false
  mobileMenuVisible.value = false
  router.push('/my-notices')
}

const closeMobileMenu = () => {
  mobileMenuVisible.value = false
}

const confirmCurrentNotice = async () => {
  const notice = currentConfirmNotice.value
  if (!notice || !tenantId.value) return

  try {
    confirmLoading.value = true
    const res = await request.post(`/tenant/notices/${notice.id}/confirm`, {
      tenant_id: tenantId.value,
    })

    if (res.code === 200) {
      ElMessage.success('通知已确认')
      await getNoticeList()

      if (pendingConfirmNotices.value.length === 0) {
        confirmDialogVisible.value = false
        return
      }

      if (confirmNoticeIndex.value >= pendingConfirmNotices.value.length) {
        confirmNoticeIndex.value = pendingConfirmNotices.value.length - 1
      }
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '确认通知失败')
  } finally {
    confirmLoading.value = false
  }
}

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
        localStorage.removeItem('tenant_user')
        router.push('/login')
      })
      .catch(() => {
        ElMessage.info('已取消退出')
      })
  }
}

onMounted(getNoticeList)
</script>

<style scoped>
.tenant-layout {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
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

.mobile-menu-button {
  display: none;
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 10px;
  background: #f5f7fa;
  color: #303133;
  font-size: 20px;
  cursor: pointer;
}

.header-title {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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

.confirm-title {
  font-size: 20px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 12px;
}

.confirm-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #909399;
  font-size: 13px;
  margin-bottom: 16px;
}

.confirm-content {
  padding: 16px;
  border-radius: 8px;
  background: #f5f7fa;
  color: #606266;
  line-height: 1.8;
  white-space: pre-wrap;
}

.confirm-progress {
  margin-top: 12px;
  color: #909399;
  font-size: 13px;
  text-align: right;
}

@media (max-width: 768px) {
  .tenant-layout {
    display: block;
  }

  .sidebar {
    display: none;
  }

  .tenant-layout > .el-container {
    width: 100%;
    min-width: 0;
  }

  .header {
    height: 56px;
    padding: 0 12px;
    gap: 8px;
  }

  .mobile-menu-button {
    display: flex;
    flex: 0 0 auto;
  }

  .header-title {
    flex: 1 1 auto;
    font-size: 16px;
  }

  .header-right {
    flex: 0 0 auto;
    gap: 8px;
  }

  .bell-button {
    width: 32px;
    height: 32px;
    font-size: 15px;
  }

  .user-menu {
    gap: 6px;
    padding: 4px 6px;
  }

  .avatar {
    width: 30px;
    height: 30px;
  }

  .user-name {
    max-width: 70px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .arrow {
    display: none;
  }

  .main-content {
    height: calc(100vh - 56px);
    padding: 12px;
    overflow-x: hidden;
  }

  .confirm-meta {
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 8px;
  }

  :deep(.el-dialog) {
    width: 92vw !important;
  }

  :deep(.el-drawer__header) {
    margin-bottom: 0;
    padding: 18px 20px;
    background: #001529;
    color: #ffffff;
  }

  :deep(.el-drawer__body) {
    padding: 0;
    background: #001529;
  }

  .mobile-drawer-menu {
    border-right: none;
  }
}
</style>
