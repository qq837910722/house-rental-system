<template>
  <div class="work-order-page">
    <div class="page-header">
      <div>
        <h1>工单申请</h1>
        <p>提交维修、开门、退租等申请，并查看工单处理进度。</p>
      </div>

      <el-button type="primary" @click="openCreateDialog">
        新增工单
      </el-button>
    </div>

    <!-- 顶部统计 -->
    <div class="summary-grid">
      <el-card class="summary-card">
        <div class="summary-title">全部工单</div>
        <div class="summary-value">{{ workOrderList.length }}</div>
        <div class="summary-desc">您提交过的全部工单</div>
      </el-card>

      <el-card class="summary-card">
        <div class="summary-title">待受理</div>
        <div class="summary-value warning">{{ pendingCount }}</div>
        <div class="summary-desc">等待房东确认处理</div>
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

    <!-- 工单列表 -->
    <el-card class="content-card">
      <template #header>
        <div class="card-header">
          <span>工单列表</span>

          <el-radio-group v-model="activeFilter" size="small">
            <el-radio-button label="全部" />
            <el-radio-button label="待受理" />
            <el-radio-button label="处理中" />
            <el-radio-button label="已完成" />
            <el-radio-button label="已撤销" />
          </el-radio-group>
        </div>
      </template>

      <el-table
        :data="filteredWorkOrderList"
        border
        style="width: 100%"
      >
        <el-table-column
          prop="orderNo"
          label="工单编号"
          width="170"
        />

        <el-table-column
          label="工单类型"
          width="120"
        >
          <template #default="{ row }">
            <el-tag :type="getTypeTag(row.type)">
              {{ row.type }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column
          prop="title"
          label="工单标题"
          min-width="220"
        />

        <el-table-column
          prop="roomNumber"
          label="房间号"
          width="100"
        />

        <el-table-column
          prop="submitTime"
          label="提交时间"
          width="170"
        />

        <el-table-column
          label="状态"
          width="110"
        >
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status)">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column
          label="操作"
          width="230"
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
              v-if="row.status === '待受理'"
              size="small"
              type="danger"
              @click="cancelOrder(row)"
            >
              撤销
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增工单弹窗 -->
    <el-dialog
      v-model="createVisible"
      title="新增工单申请"
      width="680px"
    >
      <el-form
        :model="workOrderForm"
        label-width="100px"
      >
        <el-form-item label="工单类型" required>
          <el-select
            v-model="workOrderForm.type"
            placeholder="请选择工单类型"
            style="width: 100%"
          >
            <el-option label="维修申请" value="维修申请" />
            <el-option label="开门申请" value="开门申请" />
            <el-option label="退租申请" value="退租申请" />
            <el-option label="其他申请" value="其他申请" />
          </el-select>
        </el-form-item>

        <el-form-item label="房间号" required>
          <el-input
            v-model="workOrderForm.roomNumber"
            placeholder="请输入房间号，例如：101"
          />
        </el-form-item>

        <el-form-item label="工单标题" required>
          <el-input
            v-model="workOrderForm.title"
            placeholder="请输入工单标题"
          />
        </el-form-item>

        <el-form-item label="问题描述" required>
          <el-input
            v-model="workOrderForm.description"
            type="textarea"
            :rows="5"
            placeholder="请详细描述您的问题或申请内容"
          />
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
          <el-input
            v-model="workOrderForm.phone"
            placeholder="请输入联系电话"
          />
        </el-form-item>

        <el-form-item label="图片说明">
          <el-upload
            action="#"
            list-type="picture-card"
            :auto-upload="false"
            :limit="3"
            :on-change="handleImageChange"
            :on-remove="handleImageRemove"
          >
            <span class="upload-plus">+</span>
          </el-upload>

          <div class="upload-tip">
            最多上传 3 张图片，用于说明维修或申请情况。
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="createVisible = false">
          取消
        </el-button>

        <el-button type="primary" @click="submitWorkOrder">
          提交工单
        </el-button>
      </template>
    </el-dialog>

    <!-- 工单详情弹窗 -->
    <el-dialog
      v-model="detailVisible"
      title="工单详情"
      width="760px"
    >
      <div
        v-if="currentOrder"
        class="order-detail"
      >
        <el-descriptions
          border
          :column="2"
        >
          <el-descriptions-item label="工单编号">
            {{ currentOrder.orderNo }}
          </el-descriptions-item>

          <el-descriptions-item label="工单类型">
            <el-tag :type="getTypeTag(currentOrder.type)">
              {{ currentOrder.type }}
            </el-tag>
          </el-descriptions-item>

          <el-descriptions-item label="房间号">
            {{ currentOrder.roomNumber }}
          </el-descriptions-item>

          <el-descriptions-item label="提交时间">
            {{ currentOrder.submitTime }}
          </el-descriptions-item>

          <el-descriptions-item label="期望时间">
            {{ currentOrder.expectedTime || '未填写' }}
          </el-descriptions-item>

          <el-descriptions-item label="联系电话">
            {{ currentOrder.phone }}
          </el-descriptions-item>

          <el-descriptions-item label="当前状态">
            <el-tag :type="getStatusTag(currentOrder.status)">
              {{ currentOrder.status }}
            </el-tag>
          </el-descriptions-item>

          <el-descriptions-item label="处理人">
            {{ currentOrder.handler || '暂无' }}
          </el-descriptions-item>
        </el-descriptions>

        <div class="detail-block">
          <h3>工单标题</h3>
          <p>{{ currentOrder.title }}</p>
        </div>

        <div class="detail-block">
          <h3>问题描述</h3>
          <p>{{ currentOrder.description }}</p>
        </div>

        <div
          v-if="currentOrder.images && currentOrder.images.length > 0"
          class="detail-block"
        >
          <h3>图片说明</h3>

          <div class="image-list">
            <img
              v-for="(image, index) in currentOrder.images"
              :key="index"
              :src="image"
              alt="工单图片"
            />
          </div>
        </div>

        <div
          v-if="currentOrder.result"
          class="detail-block result-block"
        >
          <h3>处理结果</h3>
          <p>{{ currentOrder.result }}</p>
        </div>

        <div class="detail-block">
          <h3>处理进度</h3>

          <el-timeline>
            <el-timeline-item
              v-for="step in currentOrder.steps"
              :key="step.id"
              :timestamp="step.time"
              :type="step.type"
            >
              {{ step.content }}
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>

      <template #footer>
        <el-button @click="detailVisible = false">
          关闭
        </el-button>

        <el-button
          v-if="currentOrder && currentOrder.status === '待受理'"
          type="danger"
          @click="cancelOrder(currentOrder)"
        >
          撤销工单
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const activeFilter = ref('全部')
const createVisible = ref(false)
const detailVisible = ref(false)
const currentOrder = ref(null)

const workOrderForm = reactive({
  type: '',
  roomNumber: '101',
  title: '',
  description: '',
  expectedTime: '',
  phone: '13800000001',
  images: [],
})

const workOrderList = ref([
  {
    id: 1,
    orderNo: 'GD20260518001',
    type: '维修申请',
    title: '101房间空调漏水',
    roomNumber: '101',
    description: '房间空调运行一段时间后会漏水，地面已经有明显积水，希望安排维修。',
    submitTime: '2026-05-18 09:20',
    expectedTime: '2026-05-18 18:00',
    phone: '13800000001',
    status: '处理中',
    handler: '房东',
    images: [],
    result: '',
    steps: [
      {
        id: 1,
        content: '租客提交维修申请',
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
    orderNo: 'GD20260516001',
    type: '开门申请',
    title: '忘带钥匙，需要协助开门',
    roomNumber: '101',
    description: '晚上回家发现忘记带钥匙，希望房东协助开门。',
    submitTime: '2026-05-16 20:30',
    expectedTime: '2026-05-16 21:00',
    phone: '13800000001',
    status: '已完成',
    handler: '房东',
    images: [],
    result: '已协助租客开门，工单处理完成。',
    steps: [
      {
        id: 1,
        content: '租客提交开门申请',
        time: '2026-05-16 20:30',
        type: 'warning',
      },
      {
        id: 2,
        content: '房东已处理完成',
        time: '2026-05-16 20:50',
        type: 'success',
      },
    ],
  },
  {
    id: 3,
    orderNo: 'GD20260510001',
    type: '退租申请',
    title: '咨询退租流程和押金结算方式',
    roomNumber: '101',
    description: '想了解退租需要提前多久申请，以及押金结算方式。',
    submitTime: '2026-05-10 14:20',
    expectedTime: '',
    phone: '13800000001',
    status: '待受理',
    handler: '',
    images: [],
    result: '',
    steps: [
      {
        id: 1,
        content: '租客提交退租咨询申请',
        time: '2026-05-10 14:20',
        type: 'info',
      },
    ],
  },
])

const pendingCount = computed(() => {
  return workOrderList.value.filter((item) => item.status === '待受理').length
})

const processingCount = computed(() => {
  return workOrderList.value.filter((item) => item.status === '处理中').length
})

const completedCount = computed(() => {
  return workOrderList.value.filter((item) => item.status === '已完成').length
})

const filteredWorkOrderList = computed(() => {
  let list = [...workOrderList.value]

  if (activeFilter.value !== '全部') {
    list = list.filter((item) => item.status === activeFilter.value)
  }

  return list.sort((a, b) => {
    return b.submitTime.localeCompare(a.submitTime)
  })
})

const getTypeTag = (type) => {
  if (type === '维修申请') {
    return 'danger'
  }

  if (type === '开门申请') {
    return 'warning'
  }

  if (type === '退租申请') {
    return 'success'
  }

  return 'info'
}

const getStatusTag = (status) => {
  if (status === '待受理') {
    return 'warning'
  }

  if (status === '处理中') {
    return 'primary'
  }

  if (status === '已完成') {
    return 'success'
  }

  if (status === '已撤销') {
    return 'info'
  }

  return ''
}

const openCreateDialog = () => {
  resetForm()
  createVisible.value = true
}

const resetForm = () => {
  workOrderForm.type = ''
  workOrderForm.roomNumber = '101'
  workOrderForm.title = ''
  workOrderForm.description = ''
  workOrderForm.expectedTime = ''
  workOrderForm.phone = '13800000001'
  workOrderForm.images = []
}

const handleImageChange = (file) => {
  const rawFile = file.raw

  if (!rawFile) {
    return
  }

  const imageUrl = URL.createObjectURL(rawFile)
  workOrderForm.images.push(imageUrl)
}

const handleImageRemove = (file) => {
  if (!file.url) {
    return
  }

  workOrderForm.images = workOrderForm.images.filter((image) => {
    return image !== file.url
  })
}

const submitWorkOrder = () => {
  if (!workOrderForm.type) {
    ElMessage.warning('请选择工单类型')
    return
  }

  if (!workOrderForm.roomNumber) {
    ElMessage.warning('请输入房间号')
    return
  }

  if (!workOrderForm.title) {
    ElMessage.warning('请输入工单标题')
    return
  }

  if (!workOrderForm.description) {
    ElMessage.warning('请输入问题描述')
    return
  }

  const now = getNowTime()

  const newOrder = {
    id: Date.now(),
    orderNo: createOrderNo(),
    type: workOrderForm.type,
    title: workOrderForm.title,
    roomNumber: workOrderForm.roomNumber,
    description: workOrderForm.description,
    submitTime: now,
    expectedTime: workOrderForm.expectedTime,
    phone: workOrderForm.phone,
    status: '待受理',
    handler: '',
    images: [...workOrderForm.images],
    result: '',
    steps: [
      {
        id: 1,
        content: `租客提交${workOrderForm.type}`,
        time: now,
        type: 'primary',
      },
    ],
  }

  workOrderList.value.unshift(newOrder)

  ElMessage.success('工单提交成功，请等待房东处理')
  createVisible.value = false
}

const openDetail = (order) => {
  currentOrder.value = order
  detailVisible.value = true
}

const cancelOrder = async (order) => {
  try {
    await ElMessageBox.confirm(
      `确定要撤销工单「${order.title}」吗？撤销后房东将不再处理该工单。`,
      '撤销确认',
      {
        confirmButtonText: '确定撤销',
        cancelButtonText: '取消',
        type: 'warning',
      },
    )

    order.status = '已撤销'
    order.steps.push({
      id: Date.now(),
      content: '租客撤销工单',
      time: getNowTime(),
      type: 'info',
    })

    ElMessage.success('工单已撤销')
  } catch {
    ElMessage.info('已取消撤销')
  }
}

const createOrderNo = () => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const random = String(Date.now()).slice(-5)

  return `GD${year}${month}${day}${random}`
}

const getNowTime = () => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day} ${hour}:${minute}`
}
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

.upload-plus {
  font-size: 26px;
  color: #909399;
}

.upload-tip {
  margin-top: 8px;
  color: #909399;
  font-size: 13px;
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
}

.result-block {
  background: #f0f9eb;
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