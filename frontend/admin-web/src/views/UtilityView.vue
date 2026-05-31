<template>
  <div class="utility-page">
    <div class="page-header">
      <div>
        <h1>水电管理</h1>
        <p>管理租客水费、电费、燃气费账单，并自动同步账单通知。</p>
      </div>

      <el-button type="primary" @click="openAddDialog">
        新增账单
      </el-button>
    </div>

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
          <el-select v-model="buildingFilter" placeholder="请选择楼栋" clearable style="width: 180px">
            <el-option
              v-for="building in buildingList"
              :key="building.id"
              :label="building.name"
              :value="building.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="缴费状态">
          <el-select v-model="statusFilter" placeholder="请选择状态" clearable style="width: 160px">
            <el-option label="待确认" value="待确认" />
            <el-option label="待缴费" value="待缴费" />
            <el-option label="未缴费" value="未缴费" />
            <el-option label="已缴费" value="已缴费" />
            <el-option label="已逾期" value="已逾期" />
          </el-select>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <el-table v-loading="tableLoading" :data="filteredBillList" border style="width: 100%">
        <el-table-column prop="billNo" label="账单编号" width="160" />
        <el-table-column prop="tenantName" label="租客姓名" width="120" />
        <el-table-column prop="buildingName" label="所属楼栋" width="160" />
        <el-table-column prop="roomNumber" label="房间号" width="100" />
        <el-table-column prop="billMonth" label="账单月份" width="120" />

        <el-table-column label="水费" width="110">
          <template #default="{ row }">¥{{ row.waterFee }}</template>
        </el-table-column>

        <el-table-column label="电费" width="110">
          <template #default="{ row }">¥{{ row.electricityFee }}</template>
        </el-table-column>

        <el-table-column label="燃气费" width="110">
          <template #default="{ row }">¥{{ row.gasFee }}</template>
        </el-table-column>

        <el-table-column label="其他费用" width="110">
          <template #default="{ row }">¥{{ row.otherFee }}</template>
        </el-table-column>

        <el-table-column label="合计金额" width="130">
          <template #default="{ row }">
            <strong>¥{{ row.totalAmount }}</strong>
          </template>
        </el-table-column>

        <el-table-column prop="dueDate" label="缴费截止日" width="140" />

        <el-table-column prop="status" label="缴费状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="300" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openEditDialog(row)">编辑</el-button>
            <el-button
              v-if="row.status !== '已缴费'"
              size="small"
              type="success"
              @click="markAsPaid(row.id)"
            >
              确认缴费
            </el-button>
            <el-button size="small" type="primary" @click="sendPaymentNotice(row)">
              发送通知
            </el-button>
            <el-button size="small" type="danger" @click="deleteBill(row.id)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑水电账单' : '新增水电账单'"
      width="1080px"
      top="5vh"
      class="utility-dialog"
    >
      <el-form label-width="110px">
        <div class="form-layout">
          <div class="form-left">
            <el-form-item label="租客" required>
              <el-select v-model="form.tenantId" placeholder="请选择租客" style="width: 100%" @change="handleTenantChange">
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
              <el-select v-model="form.status" placeholder="请选择状态" style="width: 100%">
                <el-option label="待确认" value="待确认" />
                <el-option label="待缴费" value="待缴费" />
                <el-option label="未缴费" value="未缴费" />
                <el-option label="已缴费" value="已缴费" />
                <el-option label="已逾期" value="已逾期" />
              </el-select>
            </el-form-item>
          </div>

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
            <div class="calc-box">用水量：{{ waterUsage }} 吨　水费：¥{{ waterFee }}</div>

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
            <div class="calc-box">用电量：{{ electricityUsage }} 度　电费：¥{{ electricityFee }}</div>
          </div>

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
            <div class="calc-box">燃气用量：{{ gasUsage }} m³　燃气费：¥{{ gasFee }}</div>

            <el-divider />

            <el-form-item label="其他费用">
              <el-input v-model="form.otherFee" placeholder="例如：0" />
            </el-form-item>

            <el-form-item label="备注">
              <el-input v-model="form.remark" type="textarea" :rows="4" placeholder="例如：包含公共区域费用等" />
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
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitForm">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'

const buildingList = ref([])
const tenantList = ref([])
const billList = ref([])

const searchKeyword = ref('')
const buildingFilter = ref('')
const statusFilter = ref('')

const dialogVisible = ref(false)
const isEdit = ref(false)
const tableLoading = ref(false)
const submitLoading = ref(false)

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
  status: '待确认',
  remark: '',
})

const numberValue = (value) => {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

const getUsage = (current, previous) => {
  return Number(Math.max(0, numberValue(current) - numberValue(previous)).toFixed(2))
}

const getFee = (usage, unitPrice) => {
  return Number((numberValue(usage) * numberValue(unitPrice)).toFixed(2))
}

const waterUsage = computed(() => getUsage(form.waterCurrent, form.waterPrevious))
const waterFee = computed(() => getFee(waterUsage.value, form.waterUnitPrice))
const electricityUsage = computed(() => getUsage(form.electricityCurrent, form.electricityPrevious))
const electricityFee = computed(() => getFee(electricityUsage.value, form.electricityUnitPrice))
const gasUsage = computed(() => getUsage(form.gasCurrent, form.gasPrevious))
const gasFee = computed(() => getFee(gasUsage.value, form.gasUnitPrice))

const totalAmount = computed(() => {
  return Number((waterFee.value + electricityFee.value + gasFee.value + numberValue(form.otherFee)).toFixed(2))
})

const filteredBillList = computed(() => {
  return billList.value.filter((bill) => {
    const keyword = searchKeyword.value.trim()
    const keywordMatch =
      !keyword ||
      bill.tenantName.includes(keyword) ||
      bill.roomNumber.includes(keyword) ||
      bill.billNo.includes(keyword)
    const buildingMatch = !buildingFilter.value || Number(bill.buildingId) === Number(buildingFilter.value)
    const statusMatch = !statusFilter.value || bill.status === statusFilter.value

    return keywordMatch && buildingMatch && statusMatch
  })
})

const formatDate = (date) => {
  if (!date) return ''
  return String(date).slice(0, 10)
}

const mapTenant = (tenant) => ({
  id: tenant.id,
  name: tenant.name,
  phone: tenant.phone,
  buildingId: tenant.building_id,
  buildingName: tenant.building_name,
  roomNumber: tenant.room_number,
})

const mapBill = (bill) => ({
  id: bill.id,
  billNo: bill.bill_no,
  tenantId: bill.tenant_id,
  tenantName: bill.tenant_name || '',
  phone: bill.tenant_phone || '',
  buildingId: bill.building_id,
  buildingName: bill.building_name || '',
  roomNumber: bill.room_number || '',
  billMonth: bill.bill_month,
  waterPrevious: Number(bill.water_previous || 0),
  waterCurrent: Number(bill.water_current || 0),
  waterUnitPrice: Number(bill.water_unit_price || 0),
  waterUsage: Number(bill.water_usage || 0),
  waterFee: Number(bill.water_fee || 0),
  electricityPrevious: Number(bill.electricity_previous || 0),
  electricityCurrent: Number(bill.electricity_current || 0),
  electricityUnitPrice: Number(bill.electricity_unit_price || 0),
  electricityUsage: Number(bill.electricity_usage || 0),
  electricityFee: Number(bill.electricity_fee || 0),
  gasPrevious: Number(bill.gas_previous || 0),
  gasCurrent: Number(bill.gas_current || 0),
  gasUnitPrice: Number(bill.gas_unit_price || 0),
  gasUsage: Number(bill.gas_usage || 0),
  gasFee: Number(bill.gas_fee || 0),
  otherFee: Number(bill.other_fee || 0),
  totalAmount: Number(bill.total_amount || 0),
  dueDate: formatDate(bill.due_date),
  status: bill.status,
  remark: bill.remark || '',
})

const getBuildingList = async () => {
  const res = await request.get('/buildings')
  if (res.code === 200) {
    buildingList.value = res.data || []
  }
}

const getTenantList = async () => {
  const res = await request.get('/tenants')
  if (res.code === 200) {
    tenantList.value = (res.data || [])
      .filter((tenant) => tenant.status === '在租' && tenant.room_number)
      .map(mapTenant)
  }
}

const getBillList = async () => {
  tableLoading.value = true
  try {
    const res = await request.get('/utility-bills')
    if (res.code === 200) {
      billList.value = (res.data || []).map(mapBill)
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '获取水电账单失败')
  } finally {
    tableLoading.value = false
  }
}

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
  form.status = '待确认'
  form.remark = ''
}

const openAddDialog = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

const openEditDialog = (row) => {
  isEdit.value = true

  Object.assign(form, {
    id: row.id,
    billNo: row.billNo,
    tenantId: row.tenantId,
    tenantName: row.tenantName,
    phone: row.phone,
    buildingId: row.buildingId,
    buildingName: row.buildingName,
    roomNumber: row.roomNumber,
    billMonth: row.billMonth,
    waterPrevious: row.waterPrevious,
    waterCurrent: row.waterCurrent,
    waterUnitPrice: row.waterUnitPrice,
    electricityPrevious: row.electricityPrevious,
    electricityCurrent: row.electricityCurrent,
    electricityUnitPrice: row.electricityUnitPrice,
    gasPrevious: row.gasPrevious,
    gasCurrent: row.gasCurrent,
    gasUnitPrice: row.gasUnitPrice,
    otherFee: row.otherFee,
    dueDate: row.dueDate,
    status: row.status,
    remark: row.remark,
  })

  dialogVisible.value = true
}

const handleTenantChange = (tenantId) => {
  const tenant = tenantList.value.find((item) => Number(item.id) === Number(tenantId))

  if (!tenant) return

  form.tenantName = tenant.name
  form.phone = tenant.phone
  form.buildingId = tenant.buildingId
  form.buildingName = tenant.buildingName
  form.roomNumber = tenant.roomNumber
}

const buildBillData = () => ({
  bill_no: form.billNo,
  tenant_id: form.tenantId,
  bill_month: form.billMonth,
  water_previous: numberValue(form.waterPrevious),
  water_current: numberValue(form.waterCurrent),
  water_unit_price: numberValue(form.waterUnitPrice),
  electricity_previous: numberValue(form.electricityPrevious),
  electricity_current: numberValue(form.electricityCurrent),
  electricity_unit_price: numberValue(form.electricityUnitPrice),
  gas_previous: numberValue(form.gasPrevious),
  gas_current: numberValue(form.gasCurrent),
  gas_unit_price: numberValue(form.gasUnitPrice),
  other_fee: numberValue(form.otherFee),
  due_date: form.dueDate,
  status: form.status,
  remark: form.remark,
})

const submitForm = async () => {
  if (!form.billNo || !form.tenantId || !form.billMonth || !form.dueDate || !form.status) {
    ElMessage.warning('请填写必填项：租客、账单编号、账单月份、缴费截止日和缴费状态')
    return
  }

  submitLoading.value = true
  try {
    const billData = buildBillData()

    if (isEdit.value) {
      const res = await request.put(`/utility-bills/${form.id}`, billData)
      if (res.code === 200) ElMessage.success('水电账单修改成功')
    } else {
      const res = await request.post('/utility-bills', billData)
      if (res.code === 200) ElMessage.success('新增水电账单成功，已自动发送账单通知')
    }

    dialogVisible.value = false
    await getBillList()
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '保存水电账单失败')
  } finally {
    submitLoading.value = false
  }
}

const markAsPaid = async (id) => {
  const res = await request.put(`/utility-bills/${id}/status`, { status: '已缴费' })
  if (res.code === 200) {
    ElMessage.success('已确认缴费')
    await getBillList()
  }
}

const sendPaymentNotice = async (row) => {
  const res = await request.post(`/utility-bills/${row.id}/notice`)
  if (res.code === 200) {
    ElMessage.success(`已向 ${row.tenantName} 发送 ${row.billMonth} 水电缴费通知`)
  }
}

const deleteBill = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除这条水电账单吗？', '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    const res = await request.delete(`/utility-bills/${id}`)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      await getBillList()
    }
  } catch (error) {
    if (error === 'cancel') return
    ElMessage.error(error.response?.data?.message || '删除失败')
  }
}

const getStatusType = (status) => {
  if (status === '已缴费') return 'success'
  if (status === '待确认' || status === '待缴费' || status === '未缴费') return 'warning'
  if (status === '已逾期') return 'danger'
  return ''
}

onMounted(async () => {
  await Promise.all([getBuildingList(), getTenantList(), getBillList()])
})
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
