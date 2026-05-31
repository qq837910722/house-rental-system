<template>
  <div class="home-page">
    <!-- 欢迎区域 -->
    <div class="welcome-card">
      <div>
        <h1>欢迎回家，{{ dashboardTenant.name || tenantUser.name || '租客' }}</h1>
        <p>这里是您的租客服务中心，可以查看合同、水电账单、通知和工单进度。</p>
      </div>

      <div class="room-badge">
        当前房间：{{ dashboardTenant.room_number || tenantUser.room_number || '-' }}
      </div>
    </div>

    <!-- 顶部数据卡片 -->
    <div class="summary-grid">
      <el-card class="summary-card">
        <div class="summary-title">
          本月账单
        </div>

        <div class="summary-value money">
          ¥{{ summary.totalDue }}
        </div>

        <div class="summary-desc">
          房租 ¥{{ summary.monthlyRent }} + 水电费 ¥{{ summary.utilityAmount }}
        </div>
      </el-card>

      <el-card class="summary-card">
        <div class="summary-title">
          待处理工单
        </div>

        <div class="summary-value warning">
          {{ incompleteWorkOrderList.length }}
        </div>

        <div class="summary-desc">
          有 {{ incompleteWorkOrderList.length }} 条未完成工单需要关注
        </div>
      </el-card>
    </div>

    <!-- 最新通知 -->
    <el-card class="content-card">
      <template #header>
        <div class="card-header">
          <span>最新通知</span>

          <el-button type="primary" link  @click="goNoticePage">
            查看全部
          </el-button>
        </div>
      </template>

      <el-empty
        v-if="noticeList.length === 0"
        description="暂无最新通知"
      />

      <div
        v-else
        class="notice-list"
      >
        <div
          v-for="notice in noticeList"
          :key="notice.id"
          class="notice-item"
        >
          <div>
            <h4>
              {{ notice.title }}

              <el-tag
                v-if="notice.needConfirm"
                size="small"
                type="warning"
              >
                需确认
              </el-tag>
            </h4>

            <p>{{ notice.content }}</p>
          </div>

          <span>{{ notice.time }}</span>
        </div>
      </div>
    </el-card>

    <!-- 水电账单 + 每月用水用电统计 -->
    <el-card class="content-card">
      <template #header>
        <div class="card-header">
          <span>水电账单</span>

          <el-tag :type="getUtilityStatusType(latestBill.status)">
            {{ latestBill.status || '暂无账单' }}
          </el-tag>
        </div>
      </template>

      <div class="utility-section">
        <!-- 左侧：当前本月账单 -->
        <div class="current-utility">
          <h3>本月水电账单</h3>

          <el-descriptions border :column="2">
            <el-descriptions-item label="账单月份">
              {{ latestBill.billMonth || '暂无' }}
            </el-descriptions-item>

            <el-descriptions-item label="账单状态">
              {{ latestBill.status || '暂无账单' }}
            </el-descriptions-item>

            <el-descriptions-item label="用水量">
              {{ latestBill.waterUsage || 0 }} 吨
            </el-descriptions-item>

            <el-descriptions-item label="水费">
              ¥{{ latestBill.waterFee || 0 }}
            </el-descriptions-item>

            <el-descriptions-item label="用电量">
              {{ latestBill.electricityUsage || 0 }} 度
            </el-descriptions-item>

            <el-descriptions-item label="电费">
              ¥{{ latestBill.electricityFee || 0 }}
            </el-descriptions-item>

            <el-descriptions-item label="合计金额">
              <strong class="total-money">¥{{ latestBill.totalAmount || 0 }}</strong>
            </el-descriptions-item>

            <el-descriptions-item label="缴费期限">
              {{ latestBill.dueDate || '暂无' }}
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 右侧：每月水电统计图 -->
        <div class="utility-chart-card">
          <h3>每月用水用电情况</h3>

          <div class="utility-chart">
            <div
              v-for="item in utilityStats"
              :key="item.month"
              class="utility-column"
            >
              <div class="bar-area">
                <div
                  class="bar water-bar"
                  :style="{ height: item.waterHeight + '%' }"
                ></div>

                <div
                  class="bar electricity-bar"
                  :style="{ height: item.electricityHeight + '%' }"
                ></div>
              </div>

              <div class="month-label">
                {{ item.month }}
              </div>
            </div>
          </div>

          <div class="chart-legend">
            <span>
              <i class="water-dot"></i>
              用水量
            </span>

            <span>
              <i class="electricity-dot"></i>
              用电量
            </span>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 我的工单：只显示未完成工单，按发起时间逆序 -->
    <el-card class="content-card">
      <template #header>
        <div class="card-header">
          <span>我的工单</span>

          <el-button type="primary" link    @click="goWorkOrderPage">
            更多
          </el-button>
        </div>
      </template>

      <el-empty
        v-if="incompleteWorkOrderList.length === 0"
        description="暂无未完成工单"
      />

      <div
        v-else
        class="work-order-grid"
      >
        <div
          v-for="order in incompleteWorkOrderList"
          :key="order.id"
          class="work-order-card"
        >
          <div class="work-order-header">
            <div>
              <h3>{{ order.title }}</h3>
              <p>{{ order.roomNumber }} 房间 ｜ {{ order.submitTime }}</p>
            </div>

            <el-tag :type="order.statusType">
              {{ order.status }}
            </el-tag>
          </div>

          <div class="work-order-desc">
            {{ order.description }}
          </div>

          <el-timeline class="work-order-timeline">
            <el-timeline-item
              v-for="step in order.steps"
              :key="step.id"
              :timestamp="step.time"
              :type="step.type"
            >
              {{ step.content }}
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import request from '../utils/request'

const router = useRouter()
const noticeList = ref([])
const workOrderList = ref([])
const dashboardTenant = ref({})
const summary = ref({
  monthlyRent: 0,
  utilityAmount: 0,
  totalDue: 0,
})
const latestBill = ref({})
const utilityRawStats = ref([])

const tenantUser = computed(() => {
  try {
    return JSON.parse(localStorage.getItem('tenant_user') || '{}')
  } catch {
    return {}
  }
})

const tenantId = computed(() => tenantUser.value.tenant_id || tenantUser.value.id)

const formatDate = (date) => {
  if (!date) return ''
  return String(date).slice(5, 10)
}

const mapNotice = (notice) => ({
  id: notice.id,
  title: notice.title,
  content: notice.content,
  time: formatDate(notice.publish_time),
  needConfirm: Number(notice.need_confirm) === 1 && Number(notice.is_confirmed) !== 1,
})

const getNoticeList = async () => {
  if (!tenantId.value) return

  const res = await request.get('/tenant/notices', {
    params: { tenant_id: tenantId.value },
  })

  if (res.code === 200) {
    noticeList.value = (res.data || []).slice(0, 3).map(mapNotice)
  }
}

const formatDateTime = (date) => {
  if (!date) return ''
  return String(date).replace('T', ' ').slice(0, 16)
}

const getWorkOrderStatusType = (status) => {
  if (status === '待处理') return 'warning'
  if (status === '处理中') return 'primary'
  if (status === '已完成') return 'success'
  if (status === '已驳回') return 'danger'
  return 'info'
}

const mapWorkOrder = (order) => ({
  id: order.id,
  title: order.title,
  roomNumber: order.room_number || tenantUser.value.room_number || '',
  submitTime: formatDateTime(order.created_at),
  status: order.status === '待处理' ? '待受理' : order.status,
  statusType: getWorkOrderStatusType(order.status),
  description: order.content,
  steps: [
    {
      id: `${order.id}-submit`,
      content: `提交${order.type}`,
      time: formatDateTime(order.created_at),
      type: 'primary',
    },
    ...(order.handle_result
      ? [{
          id: `${order.id}-handle`,
          content: order.handle_result,
          time: formatDateTime(order.handle_time),
          type: getWorkOrderStatusType(order.status),
        }]
      : []),
  ],
})

const goNoticePage = () => {
  router.push('/my-notices')
}

const goWorkOrderPage = () => {
  router.push('/my-work-orders')
}

const formatMonth = (month) => {
  if (!month) return ''
  return `${String(month).slice(5)}月`
}

const mapLatestBill = (bill) => {
  if (!bill) return {}

  return {
    billMonth: bill.bill_month,
    status: bill.status,
    waterUsage: Number(bill.water_usage || 0),
    waterFee: Number(bill.water_fee || 0),
    electricityUsage: Number(bill.electricity_usage || 0),
    electricityFee: Number(bill.electricity_fee || 0),
    totalAmount: Number(bill.total_amount || 0),
    dueDate: bill.due_date ? String(bill.due_date).slice(0, 10) : '',
  }
}

const maxWaterUsage = computed(() => {
  if (utilityRawStats.value.length === 0) return 1
  return Math.max(1, ...utilityRawStats.value.map((item) => Number(item.water_usage || 0)))
})

const maxElectricityUsage = computed(() => {
  if (utilityRawStats.value.length === 0) return 1
  return Math.max(1, ...utilityRawStats.value.map((item) => Number(item.electricity_usage || 0)))
})

const utilityStats = computed(() => {
  return utilityRawStats.value.map((item) => ({
    month: formatMonth(item.month),
    waterHeight: Math.max(8, Math.round((Number(item.water_usage || 0) / maxWaterUsage.value) * 90)),
    electricityHeight: Math.max(
      8,
      Math.round((Number(item.electricity_usage || 0) / maxElectricityUsage.value) * 90),
    ),
  }))
})

const getUtilityStatusType = (status) => {
  if (status === '已缴费') return 'success'
  if (status === '已逾期') return 'danger'
  return 'warning'
}

const getDashboardData = async () => {
  if (!tenantId.value) return

  const res = await request.get('/tenant/dashboard', {
    params: { tenant_id: tenantId.value },
  })

  if (res.code === 200) {
    const data = res.data || {}
    dashboardTenant.value = data.tenant || {}
    summary.value = {
      monthlyRent: Number(data.summary?.monthlyRent || 0),
      utilityAmount: Number(data.summary?.utilityAmount || 0),
      totalDue: Number(data.summary?.totalDue || 0),
    }
    latestBill.value = mapLatestBill(data.latestBill)
    utilityRawStats.value = data.utilityStats || []
    noticeList.value = (data.notices || []).map(mapNotice)
    workOrderList.value = (data.workOrders || []).map(mapWorkOrder)
  }
}

onMounted(getDashboardData)

// 首页只显示未完成工单，并按发起时间逆序排列
const incompleteWorkOrderList = computed(() => {
  return workOrderList.value
    .filter((order) => order.status !== '已完成')
    .sort((a, b) => {
      return b.submitTime.localeCompare(a.submitTime)
    })
})
</script>

<style scoped>
.home-page {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.welcome-card {
  padding: 28px 32px;

  display: flex;
  align-items: center;
  justify-content: space-between;

  border-radius: 14px;

  background: linear-gradient(135deg, #001529, #16456a);
  color: #ffffff;

  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.12);
}

.welcome-card h1 {
  margin: 0 0 10px;
  font-size: 28px;
}

.welcome-card p {
  margin: 0;
  color: #e6f4ff;
}

.room-badge {
  padding: 10px 18px;

  border-radius: 999px;

  background: rgba(255, 255, 255, 0.16);

  font-weight: bold;
}

/* 顶部统计卡片 */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
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
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 8px;
}

.summary-value.money {
  color: #f56c6c;
}

.summary-value.warning {
  color: #e6a23c;
}

.summary-desc {
  color: #909399;
  font-size: 13px;
}

/* 内容卡片 */
.content-card {
  border-radius: 12px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  font-weight: bold;
}

/* 通知列表 */
.notice-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.notice-item {
  display: flex;
  justify-content: space-between;
  gap: 16px;

  padding-bottom: 14px;

  border-bottom: 1px solid #ebeef5;
}

.notice-item:last-child {
  border-bottom: none;
}

.notice-item h4 {
  display: flex;
  align-items: center;
  gap: 8px;

  margin: 0 0 6px;
  color: #303133;
}

.notice-item p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.notice-item span {
  color: #909399;
  font-size: 13px;
  white-space: nowrap;
}

/* 水电账单区域 */
.utility-section {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 24px;
}

.current-utility h3,
.utility-chart-card h3 {
  margin: 0 0 18px;
  font-size: 18px;
}

.total-money {
  color: #f56c6c;
  font-size: 18px;
}

/* 水电统计图 */
.utility-chart-card {
  padding-left: 10px;
}

.utility-chart {
  height: 260px;

  display: flex;
  align-items: flex-end;
  justify-content: space-around;

  padding: 20px 10px 0;

  background: #f8fafc;
  border-radius: 12px;
}

.utility-column {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.bar-area {
  height: 190px;

  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.bar {
  width: 18px;
  border-radius: 8px 8px 0 0;
}

.water-bar {
  background: #409eff;
}

.electricity-bar {
  background: #e6a23c;
}

.month-label {
  margin-top: 10px;
  color: #606266;
  font-size: 13px;
}

.chart-legend {
  margin-top: 14px;

  display: flex;
  justify-content: center;
  gap: 24px;

  color: #606266;
  font-size: 13px;
}

.chart-legend i {
  display: inline-block;

  width: 10px;
  height: 10px;

  border-radius: 50%;
  margin-right: 6px;
}

.water-dot {
  background: #409eff;
}

.electricity-dot {
  background: #e6a23c;
}

/* 我的工单并列卡片 */
.work-order-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}

.work-order-card {
  padding: 18px;

  border: 1px solid #ebeef5;
  border-radius: 12px;

  background: #ffffff;

  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.04);
}

.work-order-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;

  margin-bottom: 12px;
}

.work-order-header h3 {
  margin: 0 0 6px;

  font-size: 18px;
  color: #303133;
}

.work-order-header p {
  margin: 0;

  color: #909399;
  font-size: 13px;
}

.work-order-desc {
  margin-bottom: 18px;
  padding: 10px 12px;

  background: #f5f7fa;
  border-radius: 8px;

  color: #606266;
  font-size: 14px;
  line-height: 1.6;
}

.work-order-timeline {
  padding-left: 4px;
}

.work-order-timeline :deep(.el-timeline-item__content) {
  color: #303133;
  font-size: 14px;
}

.work-order-timeline :deep(.el-timeline-item__timestamp) {
  color: #909399;
  font-size: 12px;
}

@media (max-width: 1000px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }

  .utility-section {
    grid-template-columns: 1fr;
  }

  .work-order-grid {
    grid-template-columns: 1fr;
  }

  .welcome-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 18px;
  }
}

@media (max-width: 700px) {
  .home-page {
    gap: 14px;
  }

  .welcome-card {
    padding: 20px;
    border-radius: 12px;
    gap: 14px;
  }

  .welcome-card h1 {
    font-size: 24px;
    line-height: 1.25;
  }

  .welcome-card p {
    font-size: 14px;
    line-height: 1.7;
  }

  .room-badge {
    width: 100%;
    box-sizing: border-box;
    border-radius: 12px;
    text-align: center;
  }

  .content-card :deep(.el-card__body) {
    padding: 14px;
  }

  .card-header {
    gap: 10px;
    flex-wrap: wrap;
  }

  .summary-value {
    font-size: 24px;
  }

  .notice-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }

  .notice-item h4 {
    flex-wrap: wrap;
  }

  .utility-section {
    gap: 16px;
  }

  .current-utility h3,
  .utility-chart-card h3 {
    font-size: 16px;
  }

  .current-utility :deep(.el-descriptions__table) {
    display: block;
  }

  .current-utility :deep(.el-descriptions__tbody) {
    display: block;
  }

  .current-utility :deep(.el-descriptions__row) {
    display: block;
  }

  .current-utility :deep(.el-descriptions__cell) {
    display: block;
    width: 100% !important;
    box-sizing: border-box;
  }

  .utility-chart-card {
    padding-left: 0;
  }

  .utility-chart {
    height: 220px;
    padding: 16px 8px 0;
    overflow-x: auto;
    justify-content: flex-start;
    gap: 18px;
  }

  .bar-area {
    height: 160px;
  }

  .work-order-card {
    padding: 14px;
  }

  .work-order-header {
    flex-direction: column;
  }
}
</style>
