<template>
  <div class="contract-page">
    <div class="page-header">
      <div>
        <h1>我的合同</h1>
        <p>查看您的租赁合同记录，可查看详情、续签合同并导出 PDF。</p>
      </div>
    </div>

    <!-- 合同列表 -->
    <el-card class="content-card">
      <template #header>
        <div class="card-header">
          <span>合同列表</span>

          <el-tag type="info">
            共 {{ contractList.length }} 条合同记录
          </el-tag>
        </div>
      </template>

      <el-table
        :data="contractList"
        border
        style="width: 100%"
      >
        <el-table-column
          prop="contractNo"
          label="合同编号"
          width="170"
        />

        <el-table-column
          prop="roomNumber"
          label="房间号"
          width="100"
        />

        <el-table-column
          label="租期"
          min-width="220"
        >
          <template #default="{ row }">
            {{ row.startDate }} 至 {{ row.endDate }}
          </template>
        </el-table-column>

        <el-table-column
          label="月租金"
          width="110"
        >
          <template #default="{ row }">
            ¥{{ row.monthlyRent }}
          </template>
        </el-table-column>

        <el-table-column
          label="押金"
          width="110"
        >
          <template #default="{ row }">
            ¥{{ row.deposit }}
          </template>
        </el-table-column>

        <el-table-column
          prop="signDate"
          label="签约日期"
          width="130"
        />

        <el-table-column
          label="状态"
          width="120"
        >
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column
          label="操作"
          width="330"
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
              size="small"
              type="primary"
              @click="exportContractPdf(row)"
            >
              导出PDF
            </el-button>

            <el-button
              v-if="row.status === '生效中'"
              size="small"
              type="success"
              :disabled="!canRenew(row)"
              @click="renewContract(row)"
            >
              续签
            </el-button>

            <el-tooltip
              v-if="row.status === '生效中' && !canRenew(row)"
              placement="top"
              :content="getRenewDisableReason(row)"
            >
              <span class="help-text">不可续签</span>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 合同详情弹窗 -->
    <el-dialog
      v-model="detailVisible"
      title="合同详情"
      width="760px"
    >
      <div
        v-if="currentContract"
        class="contract-detail"
      >
        <div class="contract-title">
          <h2>房屋租赁合同</h2>
          <p>合同编号：{{ currentContract.contractNo }}</p>
        </div>

        <el-descriptions
          border
          :column="2"
        >
          <el-descriptions-item label="租客姓名">
            {{ currentContract.tenantName }}
          </el-descriptions-item>

          <el-descriptions-item label="联系电话">
            {{ currentContract.phone }}
          </el-descriptions-item>

          <el-descriptions-item label="房间号">
            {{ currentContract.roomNumber }}
          </el-descriptions-item>

          <el-descriptions-item label="所属楼栋">
            {{ currentContract.buildingName }}
          </el-descriptions-item>

          <el-descriptions-item label="租期开始">
            {{ currentContract.startDate }}
          </el-descriptions-item>

          <el-descriptions-item label="租期结束">
            {{ currentContract.endDate }}
          </el-descriptions-item>

          <el-descriptions-item label="月租金">
            ¥{{ currentContract.monthlyRent }}
          </el-descriptions-item>

          <el-descriptions-item label="押金">
            ¥{{ currentContract.deposit }}
          </el-descriptions-item>

          <el-descriptions-item label="签约日期">
            {{ currentContract.signDate }}
          </el-descriptions-item>

          <el-descriptions-item label="合同状态">
            <el-tag :type="getStatusType(currentContract.status)">
              {{ currentContract.status }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <div class="contract-terms">
          <h3>合同条款摘要</h3>

          <p>1. 租客应按照合同约定时间缴纳房租、水电费等相关费用。</p>
          <p>2. 租客应爱护房屋及公共设施，不得擅自改变房屋结构。</p>
          <p>3. 如需退租，应提前一个月通知房东，并按照合同约定办理退租手续。</p>
          <p>4. 合同到期前一个月内，如双方同意，可进行续签并生成新的合同记录。</p>
        </div>
      </div>

      <template #footer>
        <el-button @click="detailVisible = false">
          关闭
        </el-button>

        <el-button
          type="primary"
          @click="exportContractPdf(currentContract)"
        >
          导出PDF
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const detailVisible = ref(false)
const currentContract = ref(null)

const contractList = ref([
  {
    id: 1,
    contractNo: 'HT20250401001',
    tenantName: '张三',
    phone: '13800000001',
    buildingName: '紫霞公寓1号楼',
    roomNumber: '101',
    startDate: '2025-04-01',
    endDate: '2026-03-31',
    monthlyRent: 6200,
    deposit: 6200,
    signDate: '2025-03-25',
    status: '已到期',
  },
  {
    id: 2,
    contractNo: 'HT20260401001',
    tenantName: '张三',
    phone: '13800000001',
    buildingName: '紫霞公寓1号楼',
    roomNumber: '101',
    startDate: '2026-04-01',
    endDate: '2027-03-31',
    monthlyRent: 6500,
    deposit: 6500,
    signDate: '2026-03-26',
    status: '生效中',
  },
])

const getStatusType = (status) => {
  if (status === '生效中') {
    return 'success'
  }

  if (status === '待确认') {
    return 'warning'
  }

  if (status === '已到期') {
    return 'info'
  }

  return ''
}

const openDetail = (contract) => {
  currentContract.value = contract
  detailVisible.value = true
}

// 是否存在待确认合同
const hasPendingContract = (contract) => {
  return contractList.value.some((item) => {
    return (
      item.roomNumber === contract.roomNumber &&
      item.tenantName === contract.tenantName &&
      item.status === '待确认'
    )
  })
}

// 是否进入到期前 30 天
const isInRenewPeriod = (contract) => {
  const today = new Date()
  const endDate = new Date(contract.endDate)

  const diffTime = endDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays >= 0 && diffDays <= 30
}

// 是否可以续签
const canRenew = (contract) => {
  return (
    contract.status === '生效中' &&
    isInRenewPeriod(contract) &&
    !hasPendingContract(contract)
  )
}

const getRenewDisableReason = (contract) => {
  if (hasPendingContract(contract)) {
    return '已有待确认的续签合同，不能重复续签'
  }

  if (!isInRenewPeriod(contract)) {
    return '只有合同到期前 30 天内才可以续签'
  }

  return '当前合同不可续签'
}

const renewContract = async (contract) => {
  if (!canRenew(contract)) {
    ElMessage.warning(getRenewDisableReason(contract))
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要续签 ${contract.roomNumber} 房间的合同吗？续签后会生成一条新的合同记录，等待房东确认。`,
      '续签确认',
      {
        confirmButtonText: '确定续签',
        cancelButtonText: '取消',
        type: 'warning',
      },
    )

    const newStartDate = addDays(contract.endDate, 1)
    const newEndDate = addYears(newStartDate, 1, -1)

    const newContract = {
      ...contract,
      id: Date.now(),
      contractNo: createContractNo(),
      startDate: newStartDate,
      endDate: newEndDate,
      signDate: getToday(),
      status: '待确认',
    }

    contractList.value.unshift(newContract)

    ElMessage.success('续签合同已生成，请等待房东确认')
  } catch {
    ElMessage.info('已取消续签')
  }
}

const getToday = () => {
  const date = new Date()
  return formatDate(date)
}

const createContractNo = () => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const random = String(Date.now()).slice(-5)

  return `HT${year}${month}${day}${random}`
}

const addDays = (baseDate, days) => {
  const date = new Date(baseDate)
  date.setDate(date.getDate() + days)

  return formatDate(date)
}

const addYears = (baseDate, years, extraDays = 0) => {
  const date = new Date(baseDate)
  date.setFullYear(date.getFullYear() + years)
  date.setDate(date.getDate() + extraDays)

  return formatDate(date)
}

const formatDate = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const exportContractPdf = (contract) => {
  if (!contract) {
    ElMessage.warning('未选择合同')
    return
  }

  const printWindow = window.open('', '_blank')

  if (!printWindow) {
    ElMessage.error('浏览器阻止了弹窗，请允许弹窗后重试')
    return
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>${contract.contractNo}</title>
        <style>
          body {
            font-family: "Microsoft YaHei", Arial, sans-serif;
            padding: 40px;
            color: #303133;
            line-height: 1.8;
          }

          h1 {
            text-align: center;
            margin-bottom: 10px;
          }

          .contract-no {
            text-align: center;
            color: #606266;
            margin-bottom: 30px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
          }

          td {
            border: 1px solid #dcdfe6;
            padding: 10px 12px;
            font-size: 14px;
          }

          .label {
            width: 20%;
            background: #f5f7fa;
            font-weight: bold;
          }

          .terms {
            margin-top: 24px;
          }

          .sign-area {
            margin-top: 60px;
            display: flex;
            justify-content: space-between;
          }

          .sign-box {
            width: 45%;
          }

          @media print {
            button {
              display: none;
            }
          }
        </style>
      </head>

      <body>
        <h1>房屋租赁合同</h1>
        <div class="contract-no">合同编号：${contract.contractNo}</div>

        <table>
          <tr>
            <td class="label">租客姓名</td>
            <td>${contract.tenantName}</td>
            <td class="label">联系电话</td>
            <td>${contract.phone}</td>
          </tr>

          <tr>
            <td class="label">所属楼栋</td>
            <td>${contract.buildingName}</td>
            <td class="label">房间号</td>
            <td>${contract.roomNumber}</td>
          </tr>

          <tr>
            <td class="label">租期开始</td>
            <td>${contract.startDate}</td>
            <td class="label">租期结束</td>
            <td>${contract.endDate}</td>
          </tr>

          <tr>
            <td class="label">月租金</td>
            <td>¥${contract.monthlyRent}</td>
            <td class="label">押金</td>
            <td>¥${contract.deposit}</td>
          </tr>

          <tr>
            <td class="label">签约日期</td>
            <td>${contract.signDate}</td>
            <td class="label">合同状态</td>
            <td>${contract.status}</td>
          </tr>
        </table>

        <div class="terms">
          <h3>合同条款</h3>
          <p>第一条：租客应按照合同约定时间缴纳房租、水电费等相关费用。</p>
          <p>第二条：租客应爱护房屋及公共设施，不得擅自改变房屋结构。</p>
          <p>第三条：租客应遵守公寓公共区域管理规定，不得影响其他租客正常生活。</p>
          <p>第四条：如需退租，应提前一个月通知房东，并按照合同约定办理退租手续。</p>
          <p>第五条：合同到期前一个月内，如双方同意续租，可重新生成续签合同记录。</p>
        </div>

        <div class="sign-area">
          <div class="sign-box">
            <p>房东签字：______________</p>
            <p>日期：______________</p>
          </div>

          <div class="sign-box">
            <p>租客签字：______________</p>
            <p>日期：______________</p>
          </div>
        </div>

        <script>
          window.onload = function () {
            window.print()
          }
        ${'</scr' + 'ipt>'}
      </body>
    </html>
  `

  printWindow.document.open()
  printWindow.document.write(html)
  printWindow.document.close()
}
</script>

<style scoped>
.contract-page {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-header h1 {
  margin: 0 0 8px;
  font-size: 28px;
}

.page-header p {
  margin: 0;
  color: #606266;
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

.contract-detail {
  line-height: 1.8;
}

.contract-title {
  text-align: center;
  margin-bottom: 24px;
}

.contract-title h2 {
  margin: 0 0 8px;
  font-size: 26px;
}

.contract-title p {
  margin: 0;
  color: #606266;
}

.contract-terms {
  margin-top: 24px;
  padding: 18px;

  background: #f5f7fa;
  border-radius: 10px;
}

.contract-terms h3 {
  margin: 0 0 12px;
}

.contract-terms p {
  margin: 0 0 8px;
  color: #606266;
}

.help-text {
  margin-left: 8px;
  color: #909399;
  font-size: 13px;
  cursor: help;
}
</style>
