<template>
  <div class="dashboard-page">
    <!-- 小 banner -->
    <div class="banner">
      <div>
        <h1>紫霞公寓房屋管理系统</h1>
        <p>亲爱的房东，感谢您为紫霞公寓付出的每一天</p>
      </div>
    </div>

    <!-- 今日提醒 -->
    <el-card class="reminder-card">
      <template #header>
        <div class="card-header">
          <span>今日提醒</span>
          <span class="sub-text">需要优先关注的事项</span>
        </div>
      </template>

      <div class="reminder-grid">
        <div
          v-for="item in reminderList"
          :key="item.id"
          class="reminder-item"
        >
          <div class="reminder-title">
            {{ item.title }}
          </div>

          <div class="reminder-desc">
            {{ item.desc }}
          </div>
        </div>
      </div>
    </el-card>

    <!-- 待确认工单：放在今日提醒后面 -->
    <el-card class="pending-card">
      <template #header>
        <div class="card-header">
          <span>待确认的工单</span>
          <span class="sub-text">可直接在首页处理</span>
        </div>
      </template>

      <el-table
        :data="pendingOrderList"
        border
        style="width: 100%"
      >
        <el-table-column prop="type" label="类型" width="120">
          <template #default="scope">
            <el-tag :type="getOrderType(scope.row.type)">
              {{ scope.row.type }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="title" label="工单标题" min-width="220" />

        <el-table-column prop="tenantName" label="租客" width="120" />

        <el-table-column prop="roomNumber" label="房间号" width="100" />

        <el-table-column prop="submitTime" label="提交时间" width="170" />

        <el-table-column prop="status" label="状态" width="110">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="320">
          <template #default="scope">
            <el-button
              size="small"
              @click="openOrderDetail(scope.row)"
            >
              查看
            </el-button>

            <!-- 合同审批：通过 / 驳回 -->
            <template v-if="scope.row.type === '合同审批'">
              <el-button
                v-if="scope.row.status === '待处理'"
                size="small"
                type="success"
                @click="approveOrder(scope.row)"
              >
                通过
              </el-button>

              <el-button
                v-if="scope.row.status === '待处理'"
                size="small"
                type="warning"
                @click="rejectOrder(scope.row)"
              >
                驳回
              </el-button>
            </template>

            <!-- 其他工单：受理 / 完成 -->
            <template v-else>
              <el-button
                v-if="scope.row.status === '待处理'"
                size="small"
                type="primary"
                @click="startOrder(scope.row)"
              >
                受理
              </el-button>

              <el-button
                v-if="scope.row.status === '处理中'"
                size="small"
                type="success"
                @click="finishOrder(scope.row)"
              >
                完成
              </el-button>
            </template>

            <span
              v-if="scope.row.status !== '待处理' && scope.row.status !== '处理中'"
              class="done-text"
            >
              已处理
            </span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 数据报表 -->
    <div class="section-title">
      <h2>数据报表</h2>
      <span>每月工单处理件数、房屋租赁情况、水电使用情况</span>
    </div>

    <div class="report-grid">
      <!-- 每月工单处理件数 -->
      <el-card class="report-card work-order-report">
        <template #header>
          <div class="card-header">
            <span>每月工单处理件数</span>
          </div>
        </template>

        <div class="monthly-chart">
          <div
            v-for="item in monthlyWorkOrderStats"
            :key="item.month"
            class="monthly-row"
          >
            <div class="monthly-label">
              {{ item.month }}
            </div>

            <div class="monthly-track">
              <div
                class="monthly-segment contract"
                :style="{ width: getMonthlySegmentWidth(item.contract) }"
              ></div>

              <div
                class="monthly-segment repair"
                :style="{ width: getMonthlySegmentWidth(item.repair) }"
              ></div>

              <div
                class="monthly-segment checkout"
                :style="{ width: getMonthlySegmentWidth(item.checkout) }"
              ></div>

              <div
                class="monthly-segment other"
                :style="{ width: getMonthlySegmentWidth(item.other) }"
              ></div>
            </div>

            <div class="monthly-total">
              {{ getMonthlyTotal(item) }}
            </div>
          </div>
        </div>

        <div class="monthly-legend">
          <span><i class="legend-contract"></i>合同审批</span>
          <span><i class="legend-repair"></i>维修申请</span>
          <span><i class="legend-checkout"></i>退租申请</span>
          <span><i class="legend-other"></i>其他工单</span>
        </div>
      </el-card>

      <!-- 房屋租赁情况 -->
      <el-card class="report-card">
        <template #header>
          <div class="card-header">
            <span>房屋租赁情况</span>
          </div>
        </template>

        <div class="house-chart">
          <div
            class="donut-chart"
            :style="{ background: houseDonutStyle }"
          >
            <div class="donut-inner">
              <strong>{{ rentalRate }}%</strong>
              <span>出租率</span>
            </div>
          </div>

          <div class="legend-list">
            <div class="legend-item">
              <span class="legend-dot rented"></span>
              已出租：{{ houseStats.rented }} 间
            </div>

            <div class="legend-item">
              <span class="legend-dot vacant"></span>
              空置：{{ houseStats.vacant }} 间
            </div>

            <div class="legend-item">
              <span class="legend-dot repair-room"></span>
              维修中：{{ houseStats.repair }} 间
            </div>
          </div>
        </div>
      </el-card>

      <!-- 水电使用情况 -->
      <el-card class="report-card">
        <template #header>
          <div class="card-header">
            <span>水电使用情况</span>
          </div>
        </template>

        <div class="utility-chart">
          <div
            v-for="item in utilityStats"
            :key="item.month"
            class="utility-column"
          >
            <div class="utility-bars">
              <div
                class="utility-bar water"
                :style="{ height: item.water + '%' }"
              ></div>

              <div
                class="utility-bar electricity"
                :style="{ height: item.electricity + '%' }"
              ></div>
            </div>

            <div class="utility-month">
              {{ item.month }}
            </div>
          </div>
        </div>

        <div class="utility-legend">
          <span><i class="water-dot"></i> 用水</span>
          <span><i class="electricity-dot"></i> 用电</span>
        </div>
      </el-card>
    </div>

    <!-- 工单详情弹窗 -->
    <el-dialog
      v-model="detailVisible"
      title="工单详情"
      width="700px"
    >
      <el-descriptions border :column="2">
        <el-descriptions-item label="工单类型">
          {{ detailData.type }}
        </el-descriptions-item>

        <el-descriptions-item label="工单状态">
          <el-tag :type="getStatusType(detailData.status)">
            {{ detailData.status }}
          </el-tag>
        </el-descriptions-item>

        <el-descriptions-item label="工单标题">
          {{ detailData.title }}
        </el-descriptions-item>

        <el-descriptions-item label="提交时间">
          {{ detailData.submitTime }}
        </el-descriptions-item>

        <el-descriptions-item label="租客">
          {{ detailData.tenantName }}
        </el-descriptions-item>

        <el-descriptions-item label="房间号">
          {{ detailData.roomNumber }}
        </el-descriptions-item>
      </el-descriptions>

      <div class="detail-content">
        <h3>工单内容</h3>
        <p>{{ detailData.content || '暂无详细内容' }}</p>
      </div>

      <div
        v-if="detailData.rejectReason"
        class="detail-content reject-box"
      >
        <h3>驳回理由</h3>
        <p>{{ detailData.rejectReason }}</p>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const reminderList = [
  {
    id: 1,
    title: '水电缴费提醒',
    desc: '3 条水电账单尚未缴费，建议发送缴费通知。',
  },
  {
    id: 2,
    title: '合同审批提醒',
    desc: '1 份合同处于未生效状态，需要尽快处理。',
  },
  {
    id: 3,
    title: '空置房提醒',
    desc: '2 个空置房间可以同步到游客前台展示。',
  },
]

// 每月工单处理件数，按类型分类
const monthlyWorkOrderStats = [
  {
    month: '1月',
    contract: 2,
    repair: 3,
    checkout: 1,
    other: 1,
  },
  {
    month: '2月',
    contract: 1,
    repair: 4,
    checkout: 1,
    other: 2,
  },
  {
    month: '3月',
    contract: 3,
    repair: 2,
    checkout: 2,
    other: 1,
  },
  {
    month: '4月',
    contract: 2,
    repair: 5,
    checkout: 1,
    other: 2,
  },
  {
    month: '5月',
    contract: 4,
    repair: 3,
    checkout: 2,
    other: 3,
  },
]

const getMonthlyTotal = (item) => {
  return item.contract + item.repair + item.checkout + item.other
}

const maxMonthlyTotal = computed(() => {
  return Math.max(...monthlyWorkOrderStats.map((item) => getMonthlyTotal(item)))
})

const getMonthlySegmentWidth = (count) => {
  return `${(count / maxMonthlyTotal.value) * 100}%`
}

const houseStats = {
  total: 12,
  rented: 8,
  vacant: 3,
  repair: 1,
}

const rentalRate = computed(() => {
  return Math.round((houseStats.rented / houseStats.total) * 100)
})

const houseDonutStyle = computed(() => {
  const rentedPercent = (houseStats.rented / houseStats.total) * 100
  const vacantPercent = ((houseStats.rented + houseStats.vacant) / houseStats.total) * 100

  return `conic-gradient(
    #67c23a 0% ${rentedPercent}%,
    #e6a23c ${rentedPercent}% ${vacantPercent}%,
    #f56c6c ${vacantPercent}% 100%
  )`
})

const utilityStats = [
  {
    month: '1月',
    water: 45,
    electricity: 60,
  },
  {
    month: '2月',
    water: 52,
    electricity: 72,
  },
  {
    month: '3月',
    water: 58,
    electricity: 68,
  },
  {
    month: '4月',
    water: 63,
    electricity: 75,
  },
  {
    month: '5月',
    water: 70,
    electricity: 82,
  },
]

const detailVisible = ref(false)
const detailData = ref({})

const pendingOrderList = ref([
  {
    id: 1,
    type: '合同审批',
    title: '王五 201 房间合同审批',
    tenantName: '王五',
    roomNumber: '201',
    submitTime: '2026-05-18 10:30',
    status: '待处理',
    content: '王五已提交 201 房间租赁合同，请房东确认合同内容是否通过。',
    rejectReason: '',
  },
  {
    id: 2,
    type: '维修申请',
    title: '101 房间空调漏水',
    tenantName: '张三',
    roomNumber: '101',
    submitTime: '2026-05-18 09:20',
    status: '待处理',
    content: '租客反馈空调使用时有漏水现象，需要安排维修人员上门检查。',
    rejectReason: '',
  },
  {
    id: 3,
    type: '退租申请',
    title: '101 房间退租申请',
    tenantName: '张三',
    roomNumber: '101',
    submitTime: '2026-05-17 16:00',
    status: '待处理',
    content: '租客申请月底退租，需要检查房间并结算押金。',
    rejectReason: '',
  },
])

const openOrderDetail = (row) => {
  detailData.value = row
  detailVisible.value = true
}

const approveOrder = (row) => {
  row.status = '已通过'
  ElMessage.success(`${row.title} 已通过`)
}

const rejectOrder = (row) => {
  ElMessageBox.prompt('请输入驳回理由', '驳回工单', {
    confirmButtonText: '确认驳回',
    cancelButtonText: '取消',
    inputType: 'textarea',
    inputPattern: /\S+/,
    inputErrorMessage: '请填写驳回理由',
  })
    .then(({ value }) => {
      row.status = '已驳回'
      row.rejectReason = value
      ElMessage.warning(`${row.title} 已驳回`)
    })
    .catch(() => {
      ElMessage.info('已取消驳回')
    })
}

const startOrder = (row) => {
  row.status = '处理中'
  ElMessage.success(`${row.title} 已受理`)
}

const finishOrder = (row) => {
  row.status = '已完成'
  ElMessage.success(`${row.title} 已完成`)
}

const getOrderType = (type) => {
  if (type === '合同审批') {
    return 'success'
  }

  if (type === '维修申请') {
    return 'danger'
  }

  if (type === '退租申请') {
    return 'warning'
  }

  return 'info'
}

const getStatusType = (status) => {
  if (status === '待处理') {
    return 'warning'
  }

  if (status === '处理中') {
    return 'primary'
  }

  if (status === '已通过') {
    return 'success'
  }

  if (status === '已驳回') {
    return 'danger'
  }

  if (status === '已完成') {
    return 'info'
  }

  return ''
}
</script>

<style scoped>
.dashboard-page {
  padding: 10px;
}

/* 小 banner */
.banner {
  height: 90px;
  padding: 18px 28px;
  margin-bottom: 16px;

  display: flex;
  align-items: center;

  border-radius: 12px;

  background: linear-gradient(135deg, #001529, #16456a);
  color: #ffffff;

  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
}

.banner h1 {
  font-size: 24px;
  margin-bottom: 6px;
}

.banner p {
  font-size: 14px;
  color: #e6f4ff;
}

/* 今日提醒 */
.reminder-card {
  margin-bottom: 20px;
  border-radius: 10px;
  border-left: 5px solid #409eff;
}

.reminder-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.reminder-item {
  padding: 14px 16px;

  background: #f5f7fa;
  border-radius: 8px;
}

.reminder-title {
  font-weight: bold;
  color: #303133;
  margin-bottom: 8px;
}

.reminder-desc {
  color: #606266;
  font-size: 13px;
  line-height: 1.6;
}

/* 待确认工单 */
.pending-card {
  margin-bottom: 24px;
  border-radius: 10px;
}

.done-text {
  color: #909399;
  font-size: 13px;
}

/* 标题 */
.section-title {
  margin-bottom: 14px;
}

.section-title h2 {
  font-size: 24px;
  margin-bottom: 6px;
}

.section-title span {
  color: #909399;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  font-weight: bold;
}

.sub-text {
  color: #909399;
  font-size: 13px;
}

/* 报表区域 */
.report-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;

  margin-bottom: 24px;
}

.report-card {
  min-height: 300px;
  border-radius: 10px;
}

/* 每月工单统计图 */
.monthly-chart {
  padding-top: 8px;
}

.monthly-row {
  display: grid;
  grid-template-columns: 48px 1fr 36px;
  align-items: center;
  gap: 10px;

  margin-bottom: 18px;
}

.monthly-label {
  color: #606266;
  font-size: 14px;
}

.monthly-track {
  height: 18px;

  display: flex;

  background: #ebeef5;
  border-radius: 999px;

  overflow: hidden;
}

.monthly-segment {
  height: 100%;
}

.monthly-segment.contract {
  background: #67c23a;
}

.monthly-segment.repair {
  background: #f56c6c;
}

.monthly-segment.checkout {
  background: #e6a23c;
}

.monthly-segment.other {
  background: #409eff;
}

.monthly-total {
  text-align: right;
  color: #303133;
  font-weight: bold;
}

.monthly-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 16px;

  margin-top: 14px;

  color: #606266;
  font-size: 13px;
}

.monthly-legend i {
  display: inline-block;

  width: 10px;
  height: 10px;

  border-radius: 50%;
  margin-right: 6px;
}

.legend-contract {
  background: #67c23a;
}

.legend-repair {
  background: #f56c6c;
}

.legend-checkout {
  background: #e6a23c;
}

.legend-other {
  background: #409eff;
}

/* 房屋环形图 */
.house-chart {
  display: flex;
  align-items: center;
  gap: 26px;

  height: 220px;
}

.donut-chart {
  width: 150px;
  height: 150px;

  border-radius: 50%;

  display: flex;
  align-items: center;
  justify-content: center;
}

.donut-inner {
  width: 94px;
  height: 94px;

  border-radius: 50%;
  background: #ffffff;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.donut-inner strong {
  font-size: 26px;
  color: #303133;
}

.donut-inner span {
  color: #909399;
  font-size: 13px;
}

.legend-list {
  display: flex;
  flex-direction: column;
  gap: 14px;

  color: #606266;
}

.legend-dot {
  display: inline-block;

  width: 10px;
  height: 10px;

  border-radius: 50%;
  margin-right: 8px;
}

.legend-dot.rented {
  background: #67c23a;
}

.legend-dot.vacant {
  background: #e6a23c;
}

.legend-dot.repair-room {
  background: #f56c6c;
}

/* 水电柱状图 */
.utility-chart {
  height: 220px;

  display: flex;
  justify-content: space-around;
  align-items: flex-end;

  padding: 10px 10px 0;
}

.utility-column {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.utility-bars {
  height: 165px;

  display: flex;
  align-items: flex-end;
  gap: 6px;
}

.utility-bar {
  width: 16px;
  border-radius: 6px 6px 0 0;
}

.utility-bar.water {
  background: #409eff;
}

.utility-bar.electricity {
  background: #e6a23c;
}

.utility-month {
  margin-top: 8px;

  color: #909399;
  font-size: 13px;
}

.utility-legend {
  display: flex;
  justify-content: center;
  gap: 18px;

  color: #606266;
  font-size: 13px;
}

.utility-legend i {
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

/* 工单详情 */
.detail-content {
  margin-top: 20px;
  padding: 16px;

  background: #f5f7fa;
  border-radius: 8px;

  line-height: 1.8;
}

.detail-content h3 {
  margin-bottom: 8px;
  font-size: 16px;
}

.reject-box {
  background: #fff7e6;
  color: #a66b00;
}
</style>