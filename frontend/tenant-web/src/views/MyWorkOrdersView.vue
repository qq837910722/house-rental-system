<template>
  <div class="work-order-page">
    <div class="page-header">
      <div>
        <h1>工单申请</h1>
        <p>提交维修、开门、退租等申请，并查看房东审核进度。</p>
      </div>

      <el-button type="primary" @click="openCreateDialog">新增工单</el-button>
    </div>

    <div class="summary-grid">
      <el-card class="summary-card">
        <div class="summary-title">全部工单</div>
        <div class="summary-value">{{ workOrderList.length }}</div>
        <div class="summary-desc">您提交过的全部工单</div>
      </el-card>
      <el-card class="summary-card">
        <div class="summary-title">待受理</div>
        <div class="summary-value warning">{{ pendingCount }}</div>
        <div class="summary-desc">等待房东审核</div>
      </el-card>
      <el-card class="summary-card">
        <div class="summary-title">处理中</div>
        <div class="summary-value primary">{{ processingCount }}</div>
        <div class="summary-desc">正在处理中的工单</div>
      </el-card>
      <el-card class="summary-card">
        <div class="summary-title">已完成</div>
        <div class="summary-value success">{{ completedCount }}</div>
        <div class="summary-desc">已经处理完成</div>
      </el-card>
    </div>

    <el-card class="content-card">
      <template #header>
        <div class="card-header">
          <span>工单列表</span>
          <el-radio-group v-model="activeFilter" size="small">
            <el-radio-button label="全部" />
            <el-radio-button label="待受理" />
            <el-radio-button label="处理中" />
            <el-radio-button label="已完成" />
            <el-radio-button label="已驳回" />
            <el-radio-button label="已撤销" />
          </el-radio-group>
        </div>
      </template>

      <el-table v-loading="tableLoading" :data="filteredWorkOrderList" border style="width: 100%">
        <el-table-column prop="orderNo" label="工单编号" width="170" />
        <el-table-column label="工单类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getTypeTag(row.type)">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="工单标题" min-width="220" />
        <el-table-column prop="roomNumber" label="房间号" width="100" />
        <el-table-column prop="submitTime" label="提交时间" width="170" />
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status)">{{ displayStatus(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="230" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openDetail(row)">查看</el-button>
            <el-button v-if="row.status === '待处理'" size="small" type="danger" @click="cancelOrder(row)">
              撤销
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="createVisible" title="新增工单申请" width="680px">
      <el-form :model="workOrderForm" label-width="100px">
        <el-form-item label="工单类型" required>
          <el-select v-model="workOrderForm.type" placeholder="请选择工单类型" style="width: 100%">
            <el-option label="维修申请" value="维修申请" />
            <el-option label="开门申请" value="开门申请" />
            <el-option label="打扫申请" value="打扫申请" />
            <el-option label="退租申请" value="退租申请" />
            <el-option label="其他申请" value="其他申请" />
          </el-select>
        </el-form-item>
        <el-form-item label="房间号">
          <el-input v-model="workOrderForm.roomNumber" disabled />
        </el-form-item>
        <el-form-item label="工单标题" required>
          <el-input v-model="workOrderForm.title" placeholder="请输入工单标题" />
        </el-form-item>
        <el-form-item label="问题描述" required>
          <el-input v-model="workOrderForm.description" type="textarea" :rows="5" placeholder="请详细描述您的问题或申请内容" />
        </el-form-item>
        <el-form-item label="期望时间">
          <el-date-picker
            v-model="workOrderForm.expectedTime"
            type="datetime"
            placeholder="请选择期望处理时间"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="workOrderForm.phone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="workOrderForm.priority" style="width: 100%">
            <el-option label="普通" value="普通" />
            <el-option label="紧急" value="紧急" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitWorkOrder">提交工单</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="工单详情" width="760px">
      <div v-if="currentOrder" class="order-detail">
        <el-descriptions border :column="2">
          <el-descriptions-item label="工单编号">{{ currentOrder.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="工单类型">
            <el-tag :type="getTypeTag(currentOrder.type)">{{ currentOrder.type }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="房间号">{{ currentOrder.roomNumber }}</el-descriptions-item>
          <el-descriptions-item label="提交时间">{{ currentOrder.submitTime }}</el-descriptions-item>
          <el-descriptions-item label="期望时间">{{ currentOrder.expectedTime || '未填写' }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ currentOrder.phone }}</el-descriptions-item>
          <el-descriptions-item label="当前状态">
            <el-tag :type="getStatusTag(currentOrder.status)">{{ displayStatus(currentOrder.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="处理人">{{ currentOrder.handler || '暂无' }}</el-descriptions-item>
        </el-descriptions>

        <div class="detail-block">
          <h3>工单标题</h3>
          <p>{{ currentOrder.title }}</p>
        </div>
        <div class="detail-block">
          <h3>问题描述</h3>
          <p>{{ currentOrder.description }}</p>
        </div>
        <div v-if="currentOrder.result" class="detail-block result-block">
          <h3>处理结果</h3>
          <p>{{ currentOrder.result }}</p>
        </div>
      </div>

      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button v-if="currentOrder && currentOrder.status === '待处理'" type="danger" @click="cancelOrder(currentOrder)">
          撤销工单
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'

const activeFilter = ref('全部')
const createVisible = ref(false)
const detailVisible = ref(false)
const tableLoading = ref(false)
const submitLoading = ref(false)
const currentOrder = ref(null)
const workOrderList = ref([])

const tenantUser = computed(() => {
  try {
    return JSON.parse(localStorage.getItem('tenant_user') || '{}')
  } catch {
    return {}
  }
})

const tenantId = computed(() => tenantUser.value.tenant_id || tenantUser.value.id)

const workOrderForm = reactive({
  type: '',
  roomNumber: '',
  title: '',
  description: '',
  expectedTime: '',
  phone: '',
  priority: '普通',
})

const pendingCount = computed(() => workOrderList.value.filter((item) => item.status === '待处理').length)
const processingCount = computed(() => workOrderList.value.filter((item) => item.status === '处理中').length)
const completedCount = computed(() => workOrderList.value.filter((item) => item.status === '已完成').length)

const filteredWorkOrderList = computed(() => {
  let list = [...workOrderList.value]
  if (activeFilter.value !== '全部') {
    const status = activeFilter.value === '待受理' ? '待处理' : activeFilter.value
    list = list.filter((item) => item.status === status)
  }
  return list
})

const formatDateTime = (date) => {
  if (!date) return ''
  return String(date).replace('T', ' ').slice(0, 16)
}

const mapOrder = (order) => ({
  id: order.id,
  orderNo: order.order_no,
  type: order.type,
  title: order.title,
  roomNumber: order.room_number || tenantUser.value.room_number || '',
  description: order.content,
  submitTime: formatDateTime(order.created_at),
  expectedTime: formatDateTime(order.expected_time),
  phone: order.contact_phone || tenantUser.value.phone || '',
  status: order.status,
  handler: order.handler || '',
  result: order.handle_result || '',
})

const getWorkOrderList = async () => {
  if (!tenantId.value) return
  tableLoading.value = true
  try {
    const res = await request.get('/tenant/work-orders', {
      params: { tenant_id: tenantId.value },
    })
    if (res.code === 200) {
      workOrderList.value = (res.data || []).map(mapOrder)
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '获取工单失败')
  } finally {
    tableLoading.value = false
  }
}

const displayStatus = (status) => {
  return status === '待处理' ? '待受理' : status
}

const getTypeTag = (type) => {
  if (type === '维修申请') return 'danger'
  if (type === '开门申请') return 'warning'
  if (type === '退租申请') return 'success'
  return 'info'
}

const getStatusTag = (status) => {
  if (status === '待处理') return 'warning'
  if (status === '处理中') return 'primary'
  if (status === '已完成') return 'success'
  if (status === '已驳回') return 'danger'
  if (status === '已撤销') return 'info'
  return ''
}

const openCreateDialog = () => {
  resetForm()
  createVisible.value = true
}

const resetForm = () => {
  workOrderForm.type = ''
  workOrderForm.roomNumber = tenantUser.value.room_number || ''
  workOrderForm.title = ''
  workOrderForm.description = ''
  workOrderForm.expectedTime = ''
  workOrderForm.phone = tenantUser.value.phone || ''
  workOrderForm.priority = '普通'
}

const createOrderNo = () => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const random = String(Date.now()).slice(-5)
  return `GD${year}${month}${day}${random}`
}

const submitWorkOrder = async () => {
  if (!workOrderForm.type || !workOrderForm.title || !workOrderForm.description) {
    ElMessage.warning('请填写工单类型、标题和问题描述')
    return
  }

  submitLoading.value = true
  try {
    const res = await request.post('/tenant/work-orders', {
      order_no: createOrderNo(),
      tenant_id: tenantId.value,
      type: workOrderForm.type,
      title: workOrderForm.title,
      content: workOrderForm.description,
      expected_time: workOrderForm.expectedTime,
      contact_phone: workOrderForm.phone,
      priority: workOrderForm.priority,
      images: [],
    })

    if (res.code === 200) {
      ElMessage.success('工单提交成功，请等待房东处理')
      createVisible.value = false
      await getWorkOrderList()
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '提交工单失败')
  } finally {
    submitLoading.value = false
  }
}

const openDetail = (order) => {
  currentOrder.value = order
  detailVisible.value = true
}

const cancelOrder = async (order) => {
  try {
    await ElMessageBox.confirm(`确定要撤销工单「${order.title}」吗？`, '撤销确认', {
      confirmButtonText: '确定撤销',
      cancelButtonText: '取消',
      type: 'warning',
    })

    const res = await request.put(`/tenant/work-orders/${order.id}/cancel`, {
      tenant_id: tenantId.value,
    })

    if (res.code === 200) {
      ElMessage.success('工单已撤销')
      detailVisible.value = false
      await getWorkOrderList()
    }
  } catch (error) {
    if (error === 'cancel') return
    ElMessage.error(error.response?.data?.message || '撤销工单失败')
  }
}

onMounted(getWorkOrderList)
</script>

<style scoped>
.work-order-page {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.summary-value.warning {
  color: #e6a23c;
}

.summary-value.primary {
  color: #409eff;
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

.order-detail {
  line-height: 1.8;
}

.detail-block {
  margin-top: 22px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 10px;
}

.detail-block h3 {
  margin: 0 0 10px;
}

.detail-block p {
  margin: 0;
  color: #606266;
  white-space: pre-wrap;
}

.result-block {
  background: #f0f9eb;
}

@media (max-width: 1000px) {
  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .card-header,
  .page-header {
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
