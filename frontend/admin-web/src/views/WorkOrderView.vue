<template>
  <div class="work-order-page">
    <div class="page-header">
      <div>
        <h1>工单管理</h1>
        <p>查看租客提交的工单，并进行受理、驳回和完成处理。</p>
      </div>
    </div>

    <el-card class="filter-card">
      <el-form inline>
        <el-form-item label="关键词">
          <el-input v-model="searchKeyword" placeholder="工单编号 / 租客姓名 / 房间号" clearable style="width: 280px" />
        </el-form-item>
        <el-form-item label="工单类型">
          <el-select v-model="typeFilter" placeholder="请选择类型" clearable style="width: 160px">
            <el-option label="维修申请" value="维修申请" />
            <el-option label="开门申请" value="开门申请" />
            <el-option label="打扫申请" value="打扫申请" />
            <el-option label="退租申请" value="退租申请" />
            <el-option label="其他申请" value="其他申请" />
          </el-select>
        </el-form-item>
        <el-form-item label="工单状态">
          <el-select v-model="statusFilter" placeholder="请选择状态" clearable style="width: 160px">
            <el-option label="待处理" value="待处理" />
            <el-option label="处理中" value="处理中" />
            <el-option label="已驳回" value="已驳回" />
            <el-option label="已完成" value="已完成" />
            <el-option label="已撤销" value="已撤销" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="priorityFilter" placeholder="请选择优先级" clearable style="width: 140px">
            <el-option label="普通" value="普通" />
            <el-option label="紧急" value="紧急" />
          </el-select>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <el-table v-loading="tableLoading" :data="filteredWorkOrderList" border style="width: 100%">
        <el-table-column prop="orderNo" label="工单编号" width="170" />
        <el-table-column prop="type" label="工单类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getTypeTag(row.type)">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="tenantName" label="租客姓名" width="120" />
        <el-table-column prop="phone" label="手机号" width="140" />
        <el-table-column prop="buildingName" label="所属楼栋" width="150" />
        <el-table-column prop="roomNumber" label="房间号" width="90" />
        <el-table-column prop="title" label="工单标题" min-width="180" />
        <el-table-column prop="priority" label="优先级" width="90">
          <template #default="{ row }">
            <el-tag :type="row.priority === '紧急' ? 'danger' : 'info'">{{ row.priority }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="submitTime" label="提交时间" width="170" />
        <el-table-column label="操作" width="300" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openDetailDialog(row)">查看</el-button>
            <el-button v-if="row.status === '待处理'" size="small" type="primary" @click="openHandleDialog(row, '处理中')">
              受理
            </el-button>
            <el-button v-if="row.status === '待处理'" size="small" type="warning" @click="openHandleDialog(row, '已驳回')">
              驳回
            </el-button>
            <el-button v-if="row.status === '处理中'" size="small" type="success" @click="openHandleDialog(row, '已完成')">
              完成
            </el-button>
            <el-button size="small" type="danger" @click="deleteOrder(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="detailVisible" title="工单详情" width="760px">
      <div class="detail-box">
        <h2>{{ detailData.title }}</h2>
        <div class="detail-meta">
          <span>编号：{{ detailData.orderNo }}</span>
          <span>类型：{{ detailData.type }}</span>
          <span>状态：{{ detailData.status }}</span>
          <span>优先级：{{ detailData.priority }}</span>
        </div>
        <el-descriptions border :column="2">
          <el-descriptions-item label="租客">{{ detailData.tenantName }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ detailData.phone }}</el-descriptions-item>
          <el-descriptions-item label="所属楼栋">{{ detailData.buildingName }}</el-descriptions-item>
          <el-descriptions-item label="房间号">{{ detailData.roomNumber }}</el-descriptions-item>
          <el-descriptions-item label="期望时间">{{ detailData.expectedTime || '未填写' }}</el-descriptions-item>
          <el-descriptions-item label="提交时间">{{ detailData.submitTime }}</el-descriptions-item>
          <el-descriptions-item label="处理时间">{{ detailData.handleTime || '未处理' }}</el-descriptions-item>
          <el-descriptions-item label="处理人">{{ detailData.handler || '未处理' }}</el-descriptions-item>
        </el-descriptions>
        <div class="detail-content">
          <h3>工单内容</h3>
          <p>{{ detailData.content }}</p>
        </div>
        <div v-if="detailData.images && detailData.images.length" class="detail-content">
          <h3>图片说明</h3>
          <div class="image-list">
            <img v-for="(image, index) in detailData.images" :key="index" :src="image" alt="工单图片" />
          </div>
        </div>
        <div v-if="detailData.handleResult" class="detail-content">
          <h3>处理结果</h3>
          <p>{{ detailData.handleResult }}</p>
        </div>
      </div>
    </el-dialog>

    <el-dialog v-model="handleDialogVisible" :title="handleDialogTitle" width="520px">
      <el-form label-width="90px">
        <el-form-item label="处理说明" required>
          <el-input
            v-model="handleForm.result"
            type="textarea"
            :rows="5"
            placeholder="请输入处理说明，租客会在通知中心看到进展"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="handleLoading" @click="submitHandle">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'

const workOrderList = ref([])
const searchKeyword = ref('')
const typeFilter = ref('')
const statusFilter = ref('')
const priorityFilter = ref('')
const tableLoading = ref(false)
const detailVisible = ref(false)
const handleDialogVisible = ref(false)
const handleLoading = ref(false)
const detailData = ref({})

const handleForm = reactive({
  orderId: null,
  status: '',
  result: '',
})

const filteredWorkOrderList = computed(() => {
  return workOrderList.value.filter((order) => {
    const keyword = searchKeyword.value.trim()
    const keywordMatch =
      !keyword ||
      order.orderNo.includes(keyword) ||
      order.tenantName.includes(keyword) ||
      order.roomNumber.includes(keyword)
    const typeMatch = !typeFilter.value || order.type === typeFilter.value
    const statusMatch = !statusFilter.value || order.status === statusFilter.value
    const priorityMatch = !priorityFilter.value || order.priority === priorityFilter.value
    return keywordMatch && typeMatch && statusMatch && priorityMatch
  })
})

const handleDialogTitle = computed(() => {
  if (handleForm.status === '处理中') return '受理工单'
  if (handleForm.status === '已驳回') return '驳回工单'
  if (handleForm.status === '已完成') return '完成工单'
  return '处理工单'
})

const formatDateTime = (date) => {
  if (!date) return ''
  return String(date).replace('T', ' ').slice(0, 16)
}

const parseImages = (value) => {
  if (!value) return []
  if (Array.isArray(value)) return value
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const mapOrder = (order) => ({
  id: order.id,
  orderNo: order.order_no,
  type: order.type,
  tenantId: order.tenant_id,
  tenantName: order.tenant_name || '',
  phone: order.contact_phone || order.tenant_phone || '',
  buildingId: order.building_id,
  buildingName: order.building_name || '',
  roomNumber: order.room_number || '',
  title: order.title,
  content: order.content,
  priority: order.priority || '普通',
  status: order.status,
  submitTime: formatDateTime(order.created_at),
  expectedTime: formatDateTime(order.expected_time),
  handleTime: formatDateTime(order.handle_time),
  handler: order.handler || '',
  handleResult: order.handle_result || '',
  images: parseImages(order.images),
})

const getWorkOrderList = async () => {
  tableLoading.value = true
  try {
    const res = await request.get('/work-orders')
    if (res.code === 200) {
      workOrderList.value = (res.data || []).map(mapOrder)
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '获取工单失败')
  } finally {
    tableLoading.value = false
  }
}

const openDetailDialog = (row) => {
  detailData.value = row
  detailVisible.value = true
}

const openHandleDialog = (row, status) => {
  handleForm.orderId = row.id
  handleForm.status = status
  handleForm.result =
    status === '处理中'
      ? '工单已受理，正在安排处理。'
      : status === '已完成'
        ? '工单已处理完成。'
        : ''
  handleDialogVisible.value = true
}

const submitHandle = async () => {
  if (!handleForm.result.trim()) {
    ElMessage.warning('请填写处理说明')
    return
  }

  handleLoading.value = true
  try {
    const res = await request.put(`/work-orders/${handleForm.orderId}/status`, {
      status: handleForm.status,
      handle_result: handleForm.result,
      handler: '房东',
    })

    if (res.code === 200) {
      ElMessage.success('工单状态已更新')
      handleDialogVisible.value = false
      await getWorkOrderList()
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '处理工单失败')
  } finally {
    handleLoading.value = false
  }
}

const deleteOrder = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除这个工单吗？', '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    const res = await request.delete(`/work-orders/${id}`)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      await getWorkOrderList()
    }
  } catch (error) {
    if (error === 'cancel') return
    ElMessage.error(error.response?.data?.message || '删除失败')
  }
}

const getTypeTag = (type) => {
  if (type === '维修申请') return 'danger'
  if (type === '开门申请') return 'warning'
  if (type === '退租申请') return 'success'
  if (type === '打扫申请') return 'info'
  return 'primary'
}

const getStatusType = (status) => {
  if (status === '待处理') return 'warning'
  if (status === '处理中') return 'primary'
  if (status === '已驳回') return 'danger'
  if (status === '已完成') return 'success'
  if (status === '已撤销') return 'info'
  return ''
}

onMounted(getWorkOrderList)
</script>

<style scoped>
.work-order-page {
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

.detail-box h2 {
  font-size: 22px;
  margin-bottom: 14px;
}

.detail-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
  color: #909399;
  font-size: 14px;
}

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

.detail-content p {
  margin: 0;
  white-space: pre-wrap;
}

.image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.image-list img {
  width: 140px;
  height: 100px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #ebeef5;
}
</style>
