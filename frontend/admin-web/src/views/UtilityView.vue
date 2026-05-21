<template>
  <div class="utility-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <div>
        <h1>水电管理</h1>
        <p>管理租客水费、电费、燃气费账单，支持费用计算和缴费状态管理。</p>
      </div>

      <el-button type="primary" @click="openAddDialog">
        新增账单
      </el-button>
    </div>

    <!-- 搜索筛选区 -->
    <el-card class="filter-card">
      <el-form inline>
        <el-form-item label="关键词">
          <el-input
            v-model="searchKeyword"
            placeholder="租客姓名 / 房间号 / 账单编号"
            clearable
            style="width: 260px"
          />
        </el-form-item>

        <el-form-item label="楼栋">
          <el-select
            v-model="buildingFilter"
            placeholder="请选择楼栋"
            clearable
            style="width: 180px"
          >
            <el-option
              v-for="building in buildingList"
              :key="building.id"
              :label="building.name"
              :value="building.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="缴费状态">
          <el-select
            v-model="statusFilter"
            placeholder="请选择状态"
            clearable
            style="width: 160px"
          >
            <el-option label="未缴费" value="未缴费" />
            <el-option label="已缴费" value="已缴费" />
            <el-option label="已逾期" value="已逾期" />
          </el-select>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 账单列表 -->
    <el-card class="table-card">
      <el-table :data="filteredBillList" border style="width: 100%">
        <el-table-column prop="billNo" label="账单编号" width="160" />

        <el-table-column prop="tenantName" label="租客姓名" width="120" />

        <el-table-column prop="buildingName" label="所属楼栋" width="160" />

        <el-table-column prop="roomNumber" label="房间号" width="100" />

        <el-table-column prop="billMonth" label="账单月份" width="120" />

        <el-table-column label="水费" width="110">
          <template #default="scope">
            ¥{{ scope.row.waterFee }}
          </template>
        </el-table-column>

        <el-table-column label="电费" width="110">
          <template #default="scope">
            ¥{{ scope.row.electricityFee }}
          </template>
        </el-table-column>

        <el-table-column label="燃气费" width="110">
          <template #default="scope">
            ¥{{ scope.row.gasFee }}
          </template>
        </el-table-column>

        <el-table-column label="其他费用" width="110">
          <template #default="scope">
            ¥{{ scope.row.otherFee }}
          </template>
        </el-table-column>

        <el-table-column label="合计金额" width="130">
          <template #default="scope">
            <strong>¥{{ scope.row.totalAmount }}</strong>
          </template>
        </el-table-column>

        <el-table-column prop="dueDate" label="缴费截止日" width="140" />

        <el-table-column prop="status" label="缴费状态" width="120">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="280" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="openEditDialog(scope.row)">
              编辑
            </el-button>

            <el-button
              v-if="scope.row.status !== '已缴费'"
              size="small"
              type="success"
              @click="markAsPaid(scope.row.id)"
            >
              确认缴费
            </el-button>

            <el-button
              size="small"
              type="primary"
              @click="sendPaymentNotice(scope.row)"
            >
              发送通知
            </el-button>

            <el-button
              size="small"
              type="danger"
              @click="deleteBill(scope.row.id)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增 / 编辑账单弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑水电账单' : '新增水电账单'"
      width="1080px"
      top="5vh"
      class="utility-dialog"
    >
      <el-form label-width="110px">
        <div class="form-layout">
          <!-- 左侧：账单基础信息 -->
          <div class="form-left">
            <el-form-item label="租客" required>
              <el-select
                v-model="form.tenantId"
                placeholder="请选择租客"
                style="width: 100%"
                @change="handleTenantChange"
              >
                <el-option
                  v-for="tenant in tenantList"
                  :key="tenant.id"
                  :label="`${tenant.name} - ${tenant.roomNumber}`"
                  :value="tenant.id"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="账单编号" required>
              <el-input v-model="form.billNo" placeholder="系统自动生成" />
            </el-form-item>

            <el-form-item label="租客姓名">
              <el-input v-model="form.tenantName" disabled />
            </el-form-item>

            <el-form-item label="手机号">
              <el-input v-model="form.phone" disabled />
            </el-form-item>

            <el-form-item label="所属楼栋">
              <el-input v-model="form.buildingName" disabled />
            </el-form-item>

            <el-form-item label="房间号">
              <el-input v-model="form.roomNumber" disabled />
            </el-form-item>

            <el-form-item label="账单月份" required>
              <el-date-picker
                v-model="form.billMonth"
                type="month"
                placeholder="请选择月份"
                value-format="YYYY-MM"
                style="width: 100%"
              />
            </el-form-item>

            <el-form-item label="缴费截止日" required>
              <el-date-picker
                v-model="form.dueDate"
                type="date"
                placeholder="请选择截止日"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>

            <el-form-item label="缴费状态" required>
              <el-select
                v-model="form.status"
                placeholder="请选择状态"
                style="width: 100%"
              >
                <el-option label="未缴费" value="未缴费" />
                <el-option label="已缴费" value="已缴费" />
                <el-option label="已逾期" value="已逾期" />
              </el-select>
            </el-form-item>
          </div>

          <!-- 中间：水电气读数 -->
          <div class="form-middle">
            <div class="section-title">水费</div>

            <el-form-item label="上次水表">
              <el-input v-model="form.waterPrevious" placeholder="例如：100" />
            </el-form-item>

            <el-form-item label="本次水表">
              <el-input v-model="form.waterCurrent" placeholder="例如：120" />
            </el-form-item>

            <el-form-item label="水费单价">
              <el-input v-model="form.waterUnitPrice" placeholder="例如：4" />
            </el-form-item>

            <div class="calc-box">
              用水量：{{ waterUsage }} 吨　
              水费：¥{{ waterFee }}
            </div>

            <div class="section-title">电费</div>

            <el-form-item label="上次电表">
              <el-input v-model="form.electricityPrevious" placeholder="例如：300" />
            </el-form-item>

            <el-form-item label="本次电表">
              <el-input v-model="form.electricityCurrent" placeholder="例如：380" />
            </el-form-item>

            <el-form-item label="电费单价">
              <el-input v-model="form.electricityUnitPrice" placeholder="例如：1.2" />
            </el-form-item>

            <div class="calc-box">
              用电量：{{ electricityUsage }} 度　
              电费：¥{{ electricityFee }}
            </div>
          </div>

          <!-- 右侧：燃气和汇总 -->
          <div class="form-right">
            <div class="section-title">燃气费</div>

            <el-form-item label="上次燃气表">
              <el-input v-model="form.gasPrevious" placeholder="例如：50" />
            </el-form-item>

            <el-form-item label="本次燃气表">
              <el-input v-model="form.gasCurrent" placeholder="例如：65" />
            </el-form-item>

            <el-form-item label="燃气单价">
              <el-input v-model="form.gasUnitPrice" placeholder="例如：3.5" />
            </el-form-item>

            <div class="calc-box">
              燃气用量：{{ gasUsage }} m³　
              燃气费：¥{{ gasFee }}
            </div>

            <el-divider />

            <el-form-item label="其他费用">
              <el-input v-model="form.otherFee" placeholder="例如：0" />
            </el-form-item>

            <el-form-item label="备注">
              <el-input
                v-model="form.remark"
                type="textarea"
                :rows="4"
                placeholder="例如：包含公共区域清扫费等"
              />
            </el-form-item>

            <div class="summary-box">
              <p><strong>费用汇总</strong></p>
              <p>水费：¥{{ waterFee }}</p>
              <p>电费：¥{{ electricityFee }}</p>
              <p>燃气费：¥{{ gasFee }}</p>
              <p>其他费用：¥{{ numberValue(form.otherFee) }}</p>
              <p class="total">合计：¥{{ totalAmount }}</p>
            </div>
          </div>
        </div>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">
          取消
        </el-button>

        <el-button type="primary" @click="submitForm">
          确认
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 楼栋数据
const buildingList = ref([
  {
    id: 'building-1',
    name: '紫霞公寓1号楼',
  },
  {
    id: 'building-2',
    name: '紫霞公寓2号楼',
  },
])

// 租客数据：后面从租客管理 / 后端接口获取
const tenantList = ref([
  {
    id: 1,
    name: '张三',
    phone: '13800000001',
    buildingId: 'building-1',
    buildingName: '紫霞公寓1号楼',
    roomNumber: '101',
  },
  {
    id: 2,
    name: '王五',
    phone: '13800000002',
    buildingId: 'building-2',
    buildingName: '紫霞公寓2号楼',
    roomNumber: '201',
  },
])

// 账单列表：前端假数据
const billList = ref([
  {
    id: 1,
    billNo: 'SD202605001',
    tenantId: 1,
    tenantName: '张三',
    phone: '13800000001',
    buildingId: 'building-1',
    buildingName: '紫霞公寓1号楼',
    roomNumber: '101',
    billMonth: '2026-05',
    waterPrevious: 100,
    waterCurrent: 120,
    waterUnitPrice: 4,
    waterUsage: 20,
    waterFee: 80,
    electricityPrevious: 300,
    electricityCurrent: 380,
    electricityUnitPrice: 1.2,
    electricityUsage: 80,
    electricityFee: 96,
    gasPrevious: 50,
    gasCurrent: 65,
    gasUnitPrice: 3.5,
    gasUsage: 15,
    gasFee: 52.5,
    otherFee: 0,
    totalAmount: 228.5,
    dueDate: '2026-05-25',
    status: '未缴费',
    remark: '',
  },
  {
    id: 2,
    billNo: 'SD202605002',
    tenantId: 2,
    tenantName: '王五',
    phone: '13800000002',
    buildingId: 'building-2',
    buildingName: '紫霞公寓2号楼',
    roomNumber: '201',
    billMonth: '2026-05',
    waterPrevious: 80,
    waterCurrent: 95,
    waterUnitPrice: 4,
    waterUsage: 15,
    waterFee: 60,
    electricityPrevious: 200,
    electricityCurrent: 260,
    electricityUnitPrice: 1.2,
    electricityUsage: 60,
    electricityFee: 72,
    gasPrevious: 30,
    gasCurrent: 40,
    gasUnitPrice: 3.5,
    gasUsage: 10,
    gasFee: 35,
    otherFee: 0,
    totalAmount: 167,
    dueDate: '2026-05-25',
    status: '已缴费',
    remark: '',
  },
])

const searchKeyword = ref('')
const buildingFilter = ref('')
const statusFilter = ref('')

const dialogVisible = ref(false)
const isEdit = ref(false)

const form = reactive({
  id: null,
  billNo: '',
  tenantId: '',
  tenantName: '',
  phone: '',
  buildingId: '',
  buildingName: '',
  roomNumber: '',
  billMonth: '',
  waterPrevious: '',
  waterCurrent: '',
  waterUnitPrice: 4,
  electricityPrevious: '',
  electricityCurrent: '',
  electricityUnitPrice: 1.2,
  gasPrevious: '',
  gasCurrent: '',
  gasUnitPrice: 3.5,
  otherFee: 0,
  dueDate: '',
  status: '',
  remark: '',
})

// 数字转换
const numberValue = (value) => {
  const num = Number(value)

  if (Number.isNaN(num)) {
    return 0
  }

  return num
}

// 计算用量
const getUsage = (current, previous) => {
  const usage = numberValue(current) - numberValue(previous)

  if (usage < 0) {
    return 0
  }

  return Number(usage.toFixed(2))
}

// 计算费用
const getFee = (usage, unitPrice) => {
  return Number((numberValue(usage) * numberValue(unitPrice)).toFixed(2))
}

const waterUsage = computed(() => {
  return getUsage(form.waterCurrent, form.waterPrevious)
})

const waterFee = computed(() => {
  return getFee(waterUsage.value, form.waterUnitPrice)
})

const electricityUsage = computed(() => {
  return getUsage(form.electricityCurrent, form.electricityPrevious)
})

const electricityFee = computed(() => {
  return getFee(electricityUsage.value, form.electricityUnitPrice)
})

const gasUsage = computed(() => {
  return getUsage(form.gasCurrent, form.gasPrevious)
})

const gasFee = computed(() => {
  return getFee(gasUsage.value, form.gasUnitPrice)
})

const totalAmount = computed(() => {
  const total =
    waterFee.value +
    electricityFee.value +
    gasFee.value +
    numberValue(form.otherFee)

  return Number(total.toFixed(2))
})

// 搜索筛选
const filteredBillList = computed(() => {
  return billList.value.filter((bill) => {
    const keywordMatch =
      !searchKeyword.value ||
      bill.tenantName.includes(searchKeyword.value) ||
      bill.roomNumber.includes(searchKeyword.value) ||
      bill.billNo.includes(searchKeyword.value)

    const buildingMatch =
      !buildingFilter.value ||
      bill.buildingId === buildingFilter.value

    const statusMatch =
      !statusFilter.value ||
      bill.status === statusFilter.value

    return keywordMatch && buildingMatch && statusMatch
  })
})

// 自动生成账单编号
const generateBillNo = () => {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const random = Math.floor(Math.random() * 900 + 100)

  return `SD${y}${m}${d}${random}`
}

const resetForm = () => {
  form.id = null
  form.billNo = generateBillNo()
  form.tenantId = ''
  form.tenantName = ''
  form.phone = ''
  form.buildingId = ''
  form.buildingName = ''
  form.roomNumber = ''
  form.billMonth = ''
  form.waterPrevious = ''
  form.waterCurrent = ''
  form.waterUnitPrice = 4
  form.electricityPrevious = ''
  form.electricityCurrent = ''
  form.electricityUnitPrice = 1.2
  form.gasPrevious = ''
  form.gasCurrent = ''
  form.gasUnitPrice = 3.5
  form.otherFee = 0
  form.dueDate = ''
  form.status = '未缴费'
  form.remark = ''
}

const openAddDialog = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

const openEditDialog = (row) => {
  isEdit.value = true

  form.id = row.id
  form.billNo = row.billNo
  form.tenantId = row.tenantId
  form.tenantName = row.tenantName
  form.phone = row.phone
  form.buildingId = row.buildingId
  form.buildingName = row.buildingName
  form.roomNumber = row.roomNumber
  form.billMonth = row.billMonth
  form.waterPrevious = row.waterPrevious
  form.waterCurrent = row.waterCurrent
  form.waterUnitPrice = row.waterUnitPrice
  form.electricityPrevious = row.electricityPrevious
  form.electricityCurrent = row.electricityCurrent
  form.electricityUnitPrice = row.electricityUnitPrice
  form.gasPrevious = row.gasPrevious
  form.gasCurrent = row.gasCurrent
  form.gasUnitPrice = row.gasUnitPrice
  form.otherFee = row.otherFee
  form.dueDate = row.dueDate
  form.status = row.status
  form.remark = row.remark

  dialogVisible.value = true
}

// 选择租客后自动带出房间信息
const handleTenantChange = (tenantId) => {
  const tenant = tenantList.value.find((item) => item.id === tenantId)

  if (!tenant) {
    return
  }

  form.tenantName = tenant.name
  form.phone = tenant.phone
  form.buildingId = tenant.buildingId
  form.buildingName = tenant.buildingName
  form.roomNumber = tenant.roomNumber
}

const submitForm = () => {
  if (
    !form.billNo ||
    !form.tenantId ||
    !form.billMonth ||
    !form.dueDate ||
    !form.status
  ) {
    ElMessage.warning('请填写必填项：租客、账单编号、账单月份、缴费截止日和缴费状态')
    return
  }

  const billData = {
    id: isEdit.value ? form.id : Date.now(),
    billNo: form.billNo,
    tenantId: form.tenantId,
    tenantName: form.tenantName,
    phone: form.phone,
    buildingId: form.buildingId,
    buildingName: form.buildingName,
    roomNumber: form.roomNumber,
    billMonth: form.billMonth,
    waterPrevious: numberValue(form.waterPrevious),
    waterCurrent: numberValue(form.waterCurrent),
    waterUnitPrice: numberValue(form.waterUnitPrice),
    waterUsage: waterUsage.value,
    waterFee: waterFee.value,
    electricityPrevious: numberValue(form.electricityPrevious),
    electricityCurrent: numberValue(form.electricityCurrent),
    electricityUnitPrice: numberValue(form.electricityUnitPrice),
    electricityUsage: electricityUsage.value,
    electricityFee: electricityFee.value,
    gasPrevious: numberValue(form.gasPrevious),
    gasCurrent: numberValue(form.gasCurrent),
    gasUnitPrice: numberValue(form.gasUnitPrice),
    gasUsage: gasUsage.value,
    gasFee: gasFee.value,
    otherFee: numberValue(form.otherFee),
    totalAmount: totalAmount.value,
    dueDate: form.dueDate,
    status: form.status,
    remark: form.remark,
  }

  if (isEdit.value) {
    const index = billList.value.findIndex((item) => item.id === form.id)

    if (index !== -1) {
      billList.value[index] = billData
    }

    ElMessage.success('水电账单修改成功')
  } else {
    billList.value.push(billData)
    ElMessage.success('新增水电账单成功')
  }

  dialogVisible.value = false
}

const markAsPaid = (id) => {
  const bill = billList.value.find((item) => item.id === id)

  if (bill) {
    bill.status = '已缴费'
    ElMessage.success('已确认缴费')
  }
}

const sendPaymentNotice = (row) => {
  ElMessage.success(`已向 ${row.tenantName} 发送 ${row.billMonth} 水电缴费通知`)
}

const deleteBill = (id) => {
  ElMessageBox.confirm('确定要删除这条水电账单吗？', '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      billList.value = billList.value.filter((item) => item.id !== id)
      ElMessage.success('删除成功')
    })
    .catch(() => {
      ElMessage.info('已取消删除')
    })
}

const getStatusType = (status) => {
  if (status === '已缴费') {
    return 'success'
  }

  if (status === '未缴费') {
    return 'warning'
  }

  if (status === '已逾期') {
    return 'danger'
  }

  return ''
}
</script>

<style scoped>
.utility-page {
  padding: 10px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  margin-bottom: 20px;
}

.page-header h1 {
  font-size: 28px;
  margin-bottom: 8px;
}

.page-header p {
  color: #666;
}

.filter-card {
  margin-bottom: 20px;
  border-radius: 8px;
}

.table-card {
  border-radius: 8px;
}

.form-layout {
  display: flex;
  gap: 24px;
}

.form-left,
.form-middle {
  width: 310px;
}

.form-right {
  flex: 1;

  padding: 18px;

  border: 1px dashed #dcdfe6;
  border-radius: 10px;

  background: #fafafa;
}

.section-title {
  font-size: 16px;
  font-weight: bold;

  margin-bottom: 12px;

  color: #303133;
}

.calc-box {
  margin: 8px 0 18px 110px;
  padding: 8px 12px;

  background: #f5f7fa;
  border-radius: 6px;

  color: #606266;
  font-size: 13px;
}

.summary-box {
  margin-top: 20px;
  padding: 16px;

  background: white;
  border-radius: 8px;
  border: 1px solid #ebeef5;

  color: #606266;
  line-height: 1.8;
}

.summary-box .total {
  margin-top: 8px;

  color: #409eff;
  font-size: 20px;
  font-weight: bold;
}

.utility-dialog :deep(.el-dialog__body) {
  padding-top: 10px;
  padding-bottom: 10px;
}

.utility-dialog :deep(.el-form-item) {
  margin-bottom: 14px;
}
</style>