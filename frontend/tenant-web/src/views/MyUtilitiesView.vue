<template>
  <div class="utilities-page">
    <div class="page-header">
      <div>
        <h1>水电账单</h1>
        <p>查看每月水电使用情况、账单金额，并确认待确认账单。</p>
      </div>
    </div>

    <!-- 本月账单概览 -->
    <div class="summary-grid">
      <el-card class="summary-card">
        <div class="summary-title">本月用水量</div>
        <div class="summary-value water">12 吨</div>
        <div class="summary-desc">水费：¥60</div>
      </el-card>

      <el-card class="summary-card">
        <div class="summary-title">本月用电量</div>
        <div class="summary-value electricity">360 度</div>
        <div class="summary-desc">电费：¥720</div>
      </el-card>

      <el-card class="summary-card">
        <div class="summary-title">本月合计</div>
        <div class="summary-value money">¥780</div>
        <div class="summary-desc">水费 + 电费</div>
      </el-card>

      <el-card class="summary-card">
        <div class="summary-title">账单状态</div>
        <div class="summary-value warning">待确认</div>
        <div class="summary-desc">请确认本月水电账单</div>
      </el-card>
    </div>

    <!-- 统计图 -->
    <el-card class="content-card">
      <template #header>
        <div class="card-header">
          <span>每月用水用电统计</span>
          <span class="card-subtitle">最近 6 个月</span>
        </div>
      </template>

      <div class="chart-section">
        <div
          v-for="item in utilityChartList"
          :key="item.month"
          class="chart-column"
        >
          <div class="bar-area">
            <div
              class="bar water-bar"
              :style="{ height: item.waterHeight + '%' }"
            >
              <span>{{ item.water }}吨</span>
            </div>

            <div
              class="bar electricity-bar"
              :style="{ height: item.electricityHeight + '%' }"
            >
              <span>{{ item.electricity }}度</span>
            </div>
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
    </el-card>

    <!-- 账单列表 -->
    <el-card class="content-card">
      <template #header>
        <div class="card-header">
          <span>账单列表</span>

          <el-tag type="info">
            共 {{ billList.length }} 条账单
          </el-tag>
        </div>
      </template>

      <el-table
        :data="sortedBillList"
        border
        style="width: 100%"
      >
        <el-table-column
          prop="month"
          label="账单月份"
          width="120"
        />

        <el-table-column
          prop="roomNumber"
          label="房间号"
          width="100"
        />

        <el-table-column
          label="用水量"
          width="110"
        >
          <template #default="{ row }">
            {{ row.waterUsage }} 吨
          </template>
        </el-table-column>

        <el-table-column
          label="水费"
          width="110"
        >
          <template #default="{ row }">
            ¥{{ row.waterFee }}
          </template>
        </el-table-column>

        <el-table-column
          label="用电量"
          width="110"
        >
          <template #default="{ row }">
            {{ row.electricityUsage }} 度
          </template>
        </el-table-column>

        <el-table-column
          label="电费"
          width="110"
        >
          <template #default="{ row }">
            ¥{{ row.electricityFee }}
          </template>
        </el-table-column>

        <el-table-column
          label="合计金额"
          width="120"
        >
          <template #default="{ row }">
            <strong class="amount">¥{{ row.totalFee }}</strong>
          </template>
        </el-table-column>

        <el-table-column
          prop="deadline"
          label="缴费期限"
          width="130"
        />

        <el-table-column
          label="状态"
          width="110"
        >
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ row.status }}
            </el-tag>
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
              v-if="row.status === '待确认'"
              size="small"
              type="primary"
              @click="confirmBill(row)"
            >
              确认账单
            </el-button>

            <el-button
              v-if="row.status === '待缴费'"
              size="small"
              type="success"
              @click="payBill(row)"
            >
              去缴费
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 账单详情弹窗 -->
    <el-dialog
      v-model="detailVisible"
      title="水电账单详情"
      width="680px"
    >
      <div
        v-if="currentBill"
        class="bill-detail"
      >
        <el-descriptions
          border
          :column="2"
        >
          <el-descriptions-item label="账单月份">
            {{ currentBill.month }}
          </el-descriptions-item>

          <el-descriptions-item label="房间号">
            {{ currentBill.roomNumber }}
          </el-descriptions-item>

          <el-descriptions-item label="上月水表">
            {{ currentBill.lastWaterMeter }}
          </el-descriptions-item>

          <el-descriptions-item label="本月水表">
            {{ currentBill.currentWaterMeter }}
          </el-descriptions-item>

          <el-descriptions-item label="用水量">
            {{ currentBill.waterUsage }} 吨
          </el-descriptions-item>

          <el-descriptions-item label="水费单价">
            ¥{{ currentBill.waterPrice }} / 吨
          </el-descriptions-item>

          <el-descriptions-item label="水费">
            ¥{{ currentBill.waterFee }}
          </el-descriptions-item>

          <el-descriptions-item label="上月电表">
            {{ currentBill.lastElectricityMeter }}
          </el-descriptions-item>

          <el-descriptions-item label="本月电表">
            {{ currentBill.currentElectricityMeter }}
          </el-descriptions-item>

          <el-descriptions-item label="用电量">
            {{ currentBill.electricityUsage }} 度
          </el-descriptions-item>

          <el-descriptions-item label="电费单价">
            ¥{{ currentBill.electricityPrice }} / 度
          </el-descriptions-item>

          <el-descriptions-item label="电费">
            ¥{{ currentBill.electricityFee }}
          </el-descriptions-item>

          <el-descriptions-item label="合计金额">
            <strong class="amount">¥{{ currentBill.totalFee }}</strong>
          </el-descriptions-item>

          <el-descriptions-item label="账单状态">
            <el-tag :type="getStatusType(currentBill.status)">
              {{ currentBill.status }}
            </el-tag>
          </el-descriptions-item>

          <el-descriptions-item label="生成日期">
            {{ currentBill.createDate }}
          </el-descriptions-item>

          <el-descriptions-item label="缴费期限">
            {{ currentBill.deadline }}
          </el-descriptions-item>
        </el-descriptions>

        <div class="detail-note">
          <h3>说明</h3>
          <p>
            水电费用根据本月实际使用量计算。若您对账单有疑问，请及时联系房东或在工单申请中提交问题。
          </p>
        </div>
      </div>

      <template #footer>
        <el-button @click="detailVisible = false">
          关闭
        </el-button>

        <el-button
          v-if="currentBill && currentBill.status === '待确认'"
          type="primary"
          @click="confirmBill(currentBill)"
        >
          确认账单
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const detailVisible = ref(false)
const currentBill = ref(null)

const billList = ref([
  {
    id: 1,
    month: '2026-05',
    roomNumber: '101',
    lastWaterMeter: 120,
    currentWaterMeter: 132,
    waterUsage: 12,
    waterPrice: 5,
    waterFee: 60,
    lastElectricityMeter: 2300,
    currentElectricityMeter: 2660,
    electricityUsage: 360,
    electricityPrice: 2,
    electricityFee: 720,
    totalFee: 780,
    createDate: '2026-05-18',
    deadline: '2026-05-31',
    status: '待确认',
  },
  {
    id: 2,
    month: '2026-04',
    roomNumber: '101',
    lastWaterMeter: 110,
    currentWaterMeter: 120,
    waterUsage: 10,
    waterPrice: 5,
    waterFee: 50,
    lastElectricityMeter: 1980,
    currentElectricityMeter: 2300,
    electricityUsage: 320,
    electricityPrice: 2,
    electricityFee: 640,
    totalFee: 690,
    createDate: '2026-04-18',
    deadline: '2026-04-30',
    status: '已缴费',
  },
  {
    id: 3,
    month: '2026-03',
    roomNumber: '101',
    lastWaterMeter: 101,
    currentWaterMeter: 110,
    waterUsage: 9,
    waterPrice: 5,
    waterFee: 45,
    lastElectricityMeter: 1700,
    currentElectricityMeter: 1980,
    electricityUsage: 280,
    electricityPrice: 2,
    electricityFee: 560,
    totalFee: 605,
    createDate: '2026-03-18',
    deadline: '2026-03-31',
    status: '已缴费',
  },
  {
    id: 4,
    month: '2026-02',
    roomNumber: '101',
    lastWaterMeter: 93,
    currentWaterMeter: 101,
    waterUsage: 8,
    waterPrice: 5,
    waterFee: 40,
    lastElectricityMeter: 1450,
    currentElectricityMeter: 1700,
    electricityUsage: 250,
    electricityPrice: 2,
    electricityFee: 500,
    totalFee: 540,
    createDate: '2026-02-18',
    deadline: '2026-02-28',
    status: '已缴费',
  },
  {
    id: 5,
    month: '2026-01',
    roomNumber: '101',
    lastWaterMeter: 86,
    currentWaterMeter: 93,
    waterUsage: 7,
    waterPrice: 5,
    waterFee: 35,
    lastElectricityMeter: 1230,
    currentElectricityMeter: 1450,
    electricityUsage: 220,
    electricityPrice: 2,
    electricityFee: 440,
    totalFee: 475,
    createDate: '2026-01-18',
    deadline: '2026-01-31',
    status: '已缴费',
  },
])

const sortedBillList = computed(() => {
  return [...billList.value].sort((a, b) => {
    return b.month.localeCompare(a.month)
  })
})

const maxWaterUsage = computed(() => {
  return Math.max(...billList.value.map((item) => item.waterUsage))
})

const maxElectricityUsage = computed(() => {
  return Math.max(...billList.value.map((item) => item.electricityUsage))
})

const utilityChartList = computed(() => {
  return [...billList.value]
    .sort((a, b) => {
      return a.month.localeCompare(b.month)
    })
    .map((item) => {
      return {
        month: item.month.slice(5) + '月',
        water: item.waterUsage,
        electricity: item.electricityUsage,
        waterHeight: Math.round((item.waterUsage / maxWaterUsage.value) * 80),
        electricityHeight: Math.round((item.electricityUsage / maxElectricityUsage.value) * 80),
      }
    })
})

const getStatusType = (status) => {
  if (status === '待确认') {
    return 'warning'
  }

  if (status === '待缴费') {
    return 'danger'
  }

  if (status === '已缴费') {
    return 'success'
  }

  return 'info'
}

const openDetail = (bill) => {
  currentBill.value = bill
  detailVisible.value = true
}

const confirmBill = async (bill) => {
  try {
    await ElMessageBox.confirm(
      `确认 ${bill.month} 的水电账单无误吗？确认后账单状态会变为“待缴费”。`,
      '账单确认',
      {
        confirmButtonText: '确认无误',
        cancelButtonText: '取消',
        type: 'warning',
      },
    )

    bill.status = '待缴费'

    ElMessage.success('账单已确认，请及时缴费')
  } catch {
    ElMessage.info('已取消确认')
  }
}

const payBill = async (bill) => {
  try {
    await ElMessageBox.confirm(
      `确认已经缴纳 ${bill.month} 的水电费 ¥${bill.totalFee} 吗？`,
      '缴费确认',
      {
        confirmButtonText: '确认已缴费',
        cancelButtonText: '取消',
        type: 'warning',
      },
    )

    bill.status = '已缴费'

    ElMessage.success('缴费状态已更新')
  } catch {
    ElMessage.info('已取消操作')
  }
}
</script>

<style scoped>
.utilities-page {
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

/* 顶部概览 */
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

.summary-value.water {
  color: #409eff;
}

.summary-value.electricity {
  color: #e6a23c;
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

.content-card {
  border-radius: 12px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  font-weight: bold;
}

.card-subtitle {
  color: #909399;
  font-size: 13px;
  font-weight: normal;
}

/* 统计图 */
.chart-section {
  height: 300px;

  display: flex;
  align-items: flex-end;
  justify-content: space-around;

  padding: 26px 18px 0;

  background: #f8fafc;
  border-radius: 12px;
}

.chart-column {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.bar-area {
  height: 220px;

  display: flex;
  align-items: flex-end;
  gap: 10px;
}

.bar {
  width: 28px;

  position: relative;

  border-radius: 10px 10px 0 0;

  min-height: 28px;
}

.bar span {
  position: absolute;
  top: -24px;
  left: 50%;

  transform: translateX(-50%);

  font-size: 12px;
  white-space: nowrap;
  color: #606266;
}

.water-bar {
  background: #409eff;
}

.electricity-bar {
  background: #e6a23c;
}

.month-label {
  margin-top: 12px;
  color: #606266;
  font-size: 14px;
}

.chart-legend {
  margin-top: 16px;

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

/* 金额 */
.amount {
  color: #f56c6c;
}

/* 详情 */
.bill-detail {
  line-height: 1.8;
}

.detail-note {
  margin-top: 22px;
  padding: 16px;

  background: #f5f7fa;
  border-radius: 10px;
}

.detail-note h3 {
  margin: 0 0 8px;
}

.detail-note p {
  margin: 0;
  color: #606266;
}

@media (max-width: 1000px) {
  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 700px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }

  .chart-section {
    overflow-x: auto;
    justify-content: flex-start;
    gap: 30px;
  }

  .chart-column {
    min-width: 80px;
  }
}
</style>