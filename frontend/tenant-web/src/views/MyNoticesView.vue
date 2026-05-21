<template>
  <div class="notice-page">
    <div class="page-header">
      <div>
        <h1>通知中心</h1>
        <p>查看房东发布的通知、账单提醒、公共区域通知和需要确认的事项。</p>
      </div>
    </div>

    <!-- 顶部统计 -->
    <div class="summary-grid">
      <el-card class="summary-card">
        <div class="summary-title">全部通知</div>
        <div class="summary-value">{{ noticeList.length }}</div>
        <div class="summary-desc">当前收到的全部通知</div>
      </el-card>

      <el-card class="summary-card">
        <div class="summary-title">未读通知</div>
        <div class="summary-value unread">{{ unreadCount }}</div>
        <div class="summary-desc">还没有查看的通知</div>
      </el-card>

      <el-card class="summary-card">
        <div class="summary-title">需确认通知</div>
        <div class="summary-value warning">{{ needConfirmCount }}</div>
        <div class="summary-desc">需要您手动确认</div>
      </el-card>

      <el-card class="summary-card">
        <div class="summary-title">已确认通知</div>
        <div class="summary-value success">{{ confirmedCount }}</div>
        <div class="summary-desc">已经确认完成</div>
      </el-card>
    </div>

    <!-- 筛选 + 列表 -->
    <el-card class="content-card">
      <template #header>
        <div class="card-header">
          <span>通知列表</span>

          <el-radio-group v-model="activeFilter" size="small">
            <el-radio-button label="全部" />
            <el-radio-button label="未读" />
            <el-radio-button label="需确认" />
            <el-radio-button label="已确认" />
          </el-radio-group>
        </div>
      </template>

      <el-table
        :data="filteredNoticeList"
        border
        style="width: 100%"
      >
        <el-table-column
          prop="title"
          label="通知标题"
          min-width="220"
        >
          <template #default="{ row }">
            <div class="notice-title-cell">
              <span
                v-if="!row.isRead"
                class="unread-dot"
              ></span>

              <span>{{ row.title }}</span>

              <el-tag
                v-if="row.needConfirm"
                size="small"
                type="warning"
              >
                需确认
              </el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column
          prop="type"
          label="通知类型"
          width="120"
        >
          <template #default="{ row }">
            <el-tag :type="getTypeTag(row.type)">
              {{ row.type }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column
          prop="publishTime"
          label="发布时间"
          width="170"
        />

        <el-table-column
          label="阅读状态"
          width="110"
        >
          <template #default="{ row }">
            <el-tag :type="row.isRead ? 'info' : 'danger'">
              {{ row.isRead ? '已读' : '未读' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column
          label="确认状态"
          width="120"
        >
          <template #default="{ row }">
            <el-tag
              v-if="row.needConfirm"
              :type="row.isConfirmed ? 'success' : 'warning'"
            >
              {{ row.isConfirmed ? '已确认' : '待确认' }}
            </el-tag>

            <span v-else class="muted-text">
              无需确认
            </span>
          </template>
        </el-table-column>

        <el-table-column
          label="操作"
          width="220"
          fixed="right"
        >
          <template #default="{ row }">
            <el-button
              size="small"
              @click="openDetail(row)"
            >
              查看
            </el-button>

            <el-button
              v-if="row.needConfirm && !row.isConfirmed"
              size="small"
              type="primary"
              @click="confirmNotice(row)"
            >
              确认
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 通知详情弹窗 -->
    <el-dialog
      v-model="detailVisible"
      title="通知详情"
      width="640px"
    >
      <div
        v-if="currentNotice"
        class="notice-detail"
      >
        <div class="detail-title">
          <h2>{{ currentNotice.title }}</h2>

          <div class="detail-tags">
            <el-tag :type="getTypeTag(currentNotice.type)">
              {{ currentNotice.type }}
            </el-tag>

            <el-tag
              v-if="currentNotice.needConfirm"
              type="warning"
            >
              需确认
            </el-tag>

            <el-tag :type="currentNotice.isRead ? 'info' : 'danger'">
              {{ currentNotice.isRead ? '已读' : '未读' }}
            </el-tag>
          </div>
        </div>

        <el-descriptions
          border
          :column="2"
        >
          <el-descriptions-item label="发布时间">
            {{ currentNotice.publishTime }}
          </el-descriptions-item>

          <el-descriptions-item label="发布人">
            {{ currentNotice.publisher }}
          </el-descriptions-item>

          <el-descriptions-item label="通知对象">
            {{ currentNotice.target }}
          </el-descriptions-item>

          <el-descriptions-item label="确认状态">
            <template v-if="currentNotice.needConfirm">
              {{ currentNotice.isConfirmed ? '已确认' : '待确认' }}
            </template>

            <template v-else>
              无需确认
            </template>
          </el-descriptions-item>
        </el-descriptions>

        <div class="detail-content">
          <h3>通知内容</h3>
          <p>{{ currentNotice.content }}</p>
        </div>
      </div>

      <template #footer>
        <el-button @click="detailVisible = false">
          关闭
        </el-button>

        <el-button
          v-if="currentNotice && currentNotice.needConfirm && !currentNotice.isConfirmed"
          type="primary"
          @click="confirmNotice(currentNotice)"
        >
          我已确认
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const activeFilter = ref('全部')
const detailVisible = ref(false)
const currentNotice = ref(null)

const noticeList = ref([
  {
    id: 1,
    title: '5月水电账单通知',
    type: '账单通知',
    content: '本月水电账单已生成，请及时进入水电账单页面查看并确认。如对账单有疑问，请联系房东。',
    publishTime: '2026-05-18 10:00',
    publisher: '房东',
    target: '101房间租客',
    needConfirm: true,
    isConfirmed: false,
    isRead: false,
  },
  {
    id: 2,
    title: '公共区域清扫通知',
    type: '公共通知',
    content: '本周六上午将进行公共区域清扫，请各位租客提前整理个人物品，避免影响清扫工作。',
    publishTime: '2026-05-17 18:30',
    publisher: '房东',
    target: '全体租客',
    needConfirm: false,
    isConfirmed: false,
    isRead: false,
  },
  {
    id: 3,
    title: '活动室使用提醒',
    type: '生活提醒',
    content: '活动室使用后请保持卫生，关闭空调、电灯等设备。晚上使用时请注意音量，不要影响其他租客休息。',
    publishTime: '2026-05-16 12:20',
    publisher: '房东',
    target: '全体租客',
    needConfirm: true,
    isConfirmed: false,
    isRead: true,
  },
  {
    id: 4,
    title: '顶楼晒场使用说明',
    type: '生活提醒',
    content: '顶楼晒场可供租客晾晒衣物，请勿长时间占用公共空间。遇到下雨天气请及时收取衣物。',
    publishTime: '2026-05-12 09:00',
    publisher: '房东',
    target: '全体租客',
    needConfirm: false,
    isConfirmed: false,
    isRead: true,
  },
  {
    id: 5,
    title: '合同续签提醒',
    type: '合同通知',
    content: '您的合同将在到期前一个月开放续签入口，如需继续居住，请在合同页面提交续签申请。',
    publishTime: '2026-05-01 14:30',
    publisher: '房东',
    target: '101房间租客',
    needConfirm: true,
    isConfirmed: true,
    isRead: true,
  },
])

const unreadCount = computed(() => {
  return noticeList.value.filter((item) => !item.isRead).length
})

const needConfirmCount = computed(() => {
  return noticeList.value.filter((item) => item.needConfirm && !item.isConfirmed).length
})

const confirmedCount = computed(() => {
  return noticeList.value.filter((item) => item.needConfirm && item.isConfirmed).length
})

const filteredNoticeList = computed(() => {
  let list = [...noticeList.value]

  if (activeFilter.value === '未读') {
    list = list.filter((item) => !item.isRead)
  }

  if (activeFilter.value === '需确认') {
    list = list.filter((item) => item.needConfirm && !item.isConfirmed)
  }

  if (activeFilter.value === '已确认') {
    list = list.filter((item) => item.needConfirm && item.isConfirmed)
  }

  return list.sort((a, b) => {
    return b.publishTime.localeCompare(a.publishTime)
  })
})

const getTypeTag = (type) => {
  if (type === '账单通知') {
    return 'warning'
  }

  if (type === '合同通知') {
    return 'success'
  }

  if (type === '公共通知') {
    return 'primary'
  }

  if (type === '生活提醒') {
    return 'info'
  }

  return ''
}

const openDetail = (notice) => {
  notice.isRead = true
  currentNotice.value = notice
  detailVisible.value = true
}

const confirmNotice = async (notice) => {
  try {
    await ElMessageBox.confirm(
      `确认已经阅读并了解「${notice.title}」吗？`,
      '通知确认',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning',
      },
    )

    notice.isRead = true
    notice.isConfirmed = true

    ElMessage.success('通知已确认')

    if (currentNotice.value && currentNotice.value.id === notice.id) {
      currentNotice.value = notice
    }
  } catch {
    ElMessage.info('已取消确认')
  }
}
</script>

<style scoped>
.notice-page {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.page-header h1 {
  margin: 0 0 8px;
  font-size: 28px;
}

.page-header p {
  margin: 0;
  color: #606266;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
}

.summary-card {
  border-radius: 12px;
}

.summary-title {
  color: #909399;
  margin-bottom: 12px;
}

.summary-value {
  font-size: 30px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 8px;
}

.summary-value.unread {
  color: #f56c6c;
}

.summary-value.warning {
  color: #e6a23c;
}

.summary-value.success {
  color: #67c23a;
}

.summary-desc {
  color: #909399;
  font-size: 13px;
}

.content-card {
  border-radius: 12px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  font-weight: bold;
}

.notice-title-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.unread-dot {
  width: 8px;
  height: 8px;

  border-radius: 50%;
  background: #f56c6c;
}

.muted-text {
  color: #909399;
  font-size: 13px;
}

.notice-detail {
  line-height: 1.8;
}

.detail-title {
  margin-bottom: 20px;
}

.detail-title h2 {
  margin: 0 0 12px;
  font-size: 24px;
}

.detail-tags {
  display: flex;
  gap: 8px;
}

.detail-content {
  margin-top: 22px;
  padding: 18px;

  background: #f5f7fa;
  border-radius: 10px;
}

.detail-content h3 {
  margin: 0 0 10px;
}

.detail-content p {
  margin: 0;
  color: #606266;
}

@media (max-width: 1000px) {
  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}

@media (max-width: 700px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>