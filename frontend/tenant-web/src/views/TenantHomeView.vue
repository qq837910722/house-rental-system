<template>
  <div class="home-page">
    <!-- 欢迎区域 -->
    <div class="welcome-card">
      <div>
        <h1>欢迎回家，张三</h1>
        <p>这里是您的租客服务中心，可以查看合同、水电账单、通知和工单进度。</p>
      </div>

      <div class="room-badge">
        当前房间：101
      </div>
    </div>

    <!-- 顶部数据卡片 -->
    <div class="summary-grid">
      <el-card class="summary-card">
        <div class="summary-title">
          本月账单
        </div>

        <div class="summary-value money">
          ¥7280
        </div>

        <div class="summary-desc">
          房租 ¥6500 + 水电费 ¥780
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

      <div class="notice-list">
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

          <el-tag type="warning">
            本月待缴费
          </el-tag>
        </div>
      </template>

      <div class="utility-section">
        <!-- 左侧：当前本月账单 -->
        <div class="current-utility">
          <h3>本月水电账单</h3>

          <el-descriptions border :column="2">
            <el-descriptions-item label="账单月份">
              2026年5月
            </el-descriptions-item>

            <el-descriptions-item label="账单状态">
              待缴费
            </el-descriptions-item>

            <el-descriptions-item label="用水量">
              12 吨
            </el-descriptions-item>

            <el-descriptions-item label="水费">
              ¥60
            </el-descriptions-item>

            <el-descriptions-item label="用电量">
              360 度
            </el-descriptions-item>

            <el-descriptions-item label="电费">
              ¥720
            </el-descriptions-item>

            <el-descriptions-item label="合计金额">
              <strong class="total-money">¥780</strong>
            </el-descriptions-item>

            <el-descriptions-item label="缴费期限">
              2026-05-31
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
const goNoticePage = () => {
  router.push('/my-notices')
}

const goWorkOrderPage = () => {
  router.push('/my-work-orders')
}
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()

const noticeList = [
  {
    id: 1,
    title: '5月水电账单通知',
    content: '本月水电账单已生成，请及时确认。',
    time: '05-18',
    needConfirm: true,
  },
  {
    id: 2,
    title: '公共区域清扫通知',
    content: '本周六上午将进行公共区域清扫。',
    time: '05-17',
    needConfirm: false,
  },
  {
    id: 3,
    title: '活动室使用提醒',
    content: '活动室使用后请保持卫生，关闭空调。',
    time: '05-16',
    needConfirm: true,
  },
]

// 需要租客确认的通知
const confirmNoticeList = noticeList.filter((item) => item.needConfirm)

// 进入租客首页后，依次弹出需要确认的通知
const showConfirmNotices = async () => {
  for (const notice of confirmNoticeList) {
    await ElMessageBox.alert(notice.content, notice.title, {
      confirmButtonText: '我已确认',
      type: 'warning',
      closeOnClickModal: false,
      closeOnPressEscape: false,
    })
  }

  if (confirmNoticeList.length > 0) {
    ElMessage.success('所有需要确认的通知已确认')
  }
}

onMounted(() => {
  showConfirmNotices()
})

const utilityStats = [
  {
    month: '1月',
    waterHeight: 45,
    electricityHeight: 55,
  },
  {
    month: '2月',
    waterHeight: 50,
    electricityHeight: 62,
  },
  {
    month: '3月',
    waterHeight: 58,
    electricityHeight: 70,
  },
  {
    month: '4月',
    waterHeight: 65,
    electricityHeight: 76,
  },
  {
    month: '5月',
    waterHeight: 70,
    electricityHeight: 88,
  },
]

const workOrderList = [
  {
    id: 1,
    title: '维修申请',
    roomNumber: '101',
    submitTime: '2026-05-18 09:20',
    status: '处理中',
    statusType: 'warning',
    description: '101房间空调漏水，需要维修人员上门检查。',
    steps: [
      {
        id: 1,
        content: '提交维修申请：101房间空调漏水',
        time: '2026-05-18 09:20',
        type: 'primary',
      },
      {
        id: 2,
        content: '房东已受理，等待维修人员上门',
        time: '2026-05-18 10:10',
        type: 'success',
      },
    ],
  },
  {
    id: 2,
    title: '开门申请',
    roomNumber: '101',
    submitTime: '2026-05-16 20:30',
    status: '已完成',
    statusType: 'success',
    description: '忘带钥匙，需要协助开门。',
    steps: [
      {
        id: 1,
        content: '提交开门申请：忘带钥匙，需要协助开门',
        time: '2026-05-16 20:30',
        type: 'warning',
      },
      {
        id: 2,
        content: '开门申请已处理完成',
        time: '2026-05-16 20:50',
        type: 'success',
      },
    ],
  },
  {
    id: 3,
    title: '退租咨询',
    roomNumber: '101',
    submitTime: '2026-05-10 14:20',
    status: '待回复',
    statusType: 'info',
    description: '咨询退租流程和押金结算方式。',
    steps: [
      {
        id: 1,
        content: '提交退租咨询：咨询退租流程和押金结算方式',
        time: '2026-05-10 14:20',
        type: 'info',
      },
    ],
  },
  {
    id: 4,
    title: '维修申请',
    roomNumber: '101',
    submitTime: '2026-05-20 18:40',
    status: '待受理',
    statusType: 'danger',
    description: '101房间浴室排水较慢，希望安排检查。',
    steps: [
      {
        id: 1,
        content: '提交维修申请：浴室排水较慢',
        time: '2026-05-20 18:40',
        type: 'danger',
      },
    ],
  },
]

// 首页只显示未完成工单，并按发起时间逆序排列
const incompleteWorkOrderList = computed(() => {
  return workOrderList
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
</style>