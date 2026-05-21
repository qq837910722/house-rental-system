<template>
  <div class="work-order-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <div>
        <h1>工单管理</h1>
        <p>处理合同审批、维修申请、开门申请、打扫申请和退租申请。</p>
      </div>

      <el-button type="primary" @click="openAddDialog">
        新增工单
      </el-button>
    </div>

    <!-- 搜索筛选区 -->
    <el-card class="filter-card">
      <el-form inline>
        <el-form-item label="关键词">
          <el-input
            v-model="searchKeyword"
            placeholder="工单编号 / 租客姓名 / 房间号"
            clearable
            style="width: 280px"
          />
        </el-form-item>

        <el-form-item label="工单类型">
          <el-select
            v-model="typeFilter"
            placeholder="请选择类型"
            clearable
            style="width: 160px"
          >
            <el-option label="合同审批" value="合同审批" />
            <el-option label="维修申请" value="维修申请" />
            <el-option label="开门申请" value="开门申请" />
            <el-option label="打扫申请" value="打扫申请" />
            <el-option label="退租申请" value="退租申请" />
          </el-select>
        </el-form-item>

        <el-form-item label="工单状态">
          <el-select
            v-model="statusFilter"
            placeholder="请选择状态"
            clearable
            style="width: 160px"
          >
            <el-option label="待处理" value="待处理" />
            <el-option label="处理中" value="处理中" />
            <el-option label="已通过" value="已通过" />
            <el-option label="已驳回" value="已驳回" />
            <el-option label="已完成" value="已完成" />
          </el-select>
        </el-form-item>

        <el-form-item label="优先级">
          <el-select
            v-model="priorityFilter"
            placeholder="请选择优先级"
            clearable
            style="width: 140px"
          >
            <el-option label="普通" value="普通" />
            <el-option label="紧急" value="紧急" />
          </el-select>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 工单列表 -->
    <el-card class="table-card">
      <el-table :data="filteredWorkOrderList" border style="width: 100%">
        <el-table-column prop="orderNo" label="工单编号" width="170" />

        <el-table-column prop="type" label="工单类型" width="120">
          <template #default="scope">
            <el-tag :type="getTypeTag(scope.row.type)">
              {{ scope.row.type }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="tenantName" label="租客姓名" width="120" />

        <el-table-column prop="phone" label="手机号" width="150" />

        <el-table-column prop="buildingName" label="所属楼栋" width="160" />

        <el-table-column prop="roomNumber" label="房间号" width="100" />

        <el-table-column prop="title" label="工单标题" min-width="180" />

        <el-table-column prop="relatedContractNo" label="关联合同" width="160">
          <template #default="scope">
            <span v-if="scope.row.relatedContractNo">
              {{ scope.row.relatedContractNo }}
            </span>
            <span v-else class="empty-text">
              无
            </span>
          </template>
        </el-table-column>

        <el-table-column prop="priority" label="优先级" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.priority === '紧急' ? 'danger' : 'info'">
              {{ scope.row.priority }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="状态" width="110">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="submitTime" label="提交时间" width="170" />

        <el-table-column label="操作" width="360" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="openDetailDialog(scope.row)">
              查看
            </el-button>

            <el-button size="small" @click="openEditDialog(scope.row)">
              编辑
            </el-button>

            <el-button
              v-if="scope.row.status === '待处理' && scope.row.type !== '合同审批'"
              size="small"
              type="primary"
              @click="startProcess(scope.row.id)"
            >
              受理
            </el-button>

            <el-button
              v-if="scope.row.status === '待处理' && scope.row.type === '合同审批'"
              size="small"
              type="success"
              @click="approveOrder(scope.row.id)"
            >
              通过
            </el-button>

            <el-button
              v-if="scope.row.status === '待处理' && scope.row.type === '合同审批'"
              size="small"
              type="warning"
              @click="openRejectDialog(scope.row)"
            >
              驳回
            </el-button>

            <el-button
              v-if="scope.row.status === '处理中'"
              size="small"
              type="success"
              @click="completeOrder(scope.row.id)"
            >
              完成
            </el-button>

            <el-button
              size="small"
              type="danger"
              @click="deleteOrder(scope.row.id)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增 / 编辑工单弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑工单' : '新增工单'"
      width="980px"
      top="6vh"
      class="work-order-dialog"
    >
      <el-form label-width="100px">
        <div class="form-layout">
          <!-- 左侧：基础信息 -->
          <div class="form-left">
            <el-form-item label="工单类型" required>
              <el-select
                v-model="form.type"
                placeholder="请选择工单类型"
                style="width: 100%"
                @change="handleTypeChange"
              >
                <el-option label="合同审批" value="合同审批" />
                <el-option label="维修申请" value="维修申请" />
                <el-option label="开门申请" value="开门申请" />
                <el-option label="打扫申请" value="打扫申请" />
                <el-option label="退租申请" value="退租申请" />
              </el-select>
            </el-form-item>

            <el-form-item label="工单编号" required>
              <el-input v-model="form.orderNo" placeholder="系统自动生成" />
            </el-form-item>

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
          </div>

          <!-- 中间：工单内容 -->
          <div class="form-middle">
            <el-form-item
              v-if="form.type === '合同审批'"
              label="关联合同"
              required
            >
              <el-select
                v-model="form.relatedContractNo"
                placeholder="请选择需要审批的合同"
                style="width: 100%"
              >
                <el-option
                  v-for="contract in contractList"
                  :key="contract.contractNo"
                  :label="`${contract.contractNo} - ${contract.tenantName}`"
                  :value="contract.contractNo"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="工单标题" required>
              <el-input v-model="form.title" placeholder="请输入工单标题" />
            </el-form-item>

            <el-form-item label="工单内容" required>
              <el-input
                v-model="form.content"
                type="textarea"
                :rows="8"
                placeholder="请输入工单内容"
              />
            </el-form-item>

            <el-form-item label="优先级" required>
              <el-select
                v-model="form.priority"
                placeholder="请选择优先级"
                style="width: 100%"
              >
                <el-option label="普通" value="普通" />
                <el-option label="紧急" value="紧急" />
              </el-select>
            </el-form-item>

            <el-form-item label="工单状态" required>
              <el-select
                v-model="form.status"
                placeholder="请选择状态"
                style="width: 100%"
              >
                <el-option label="待处理" value="待处理" />
                <el-option label="处理中" value="处理中" />
                <el-option label="已通过" value="已通过" />
                <el-option label="已驳回" value="已驳回" />
                <el-option label="已完成" value="已完成" />
              </el-select>
            </el-form-item>
          </div>

          <!-- 右侧：处理记录 -->
          <div class="form-right">
            <div class="record-title">
              工单说明
            </div>

            <div class="record-box">
              <p><strong>合同审批：</strong></p>
              <p>用于审批合同是否通过。通过后合同可以视为生效。</p>

              <p><strong>维修申请：</strong></p>
              <p>用于处理租客提交的房屋维修需求。</p>

              <p><strong>开门申请：</strong></p>
              <p>用于处理租客忘带钥匙、需要房东协助开门等情况。</p>

              <p><strong>打扫申请：</strong></p>
              <p>用于安排公共区域或房间清洁。</p>

              <p><strong>退租申请：</strong></p>
              <p>用于处理租客退租、押金结算、房间检查等流程。</p>
            </div>

            <el-divider />

            <div class="bind-info">
              <p><strong>当前绑定信息</strong></p>
              <p>租客：{{ form.tenantName || '未选择' }}</p>
              <p>房间：{{ form.buildingName || '未选择' }} {{ form.roomNumber }}</p>
              <p>合同：{{ form.relatedContractNo || '无' }}</p>
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

    <!-- 工单详情弹窗 -->
    <el-dialog
      v-model="detailVisible"
      title="工单详情"
      width="720px"
    >
      <div class="detail-box">
        <h2>{{ detailData.title }}</h2>

        <div class="detail-meta">
          <span>编号：{{ detailData.orderNo }}</span>
          <span>类型：{{ detailData.type }}</span>
          <span>状态：{{ detailData.status }}</span>
          <span>优先级：{{ detailData.priority }}</span>
        </div>

        <el-descriptions border :column="2">
          <el-descriptions-item label="租客">
            {{ detailData.tenantName }}
          </el-descriptions-item>

          <el-descriptions-item label="手机号">
            {{ detailData.phone }}
          </el-descriptions-item>

          <el-descriptions-item label="所属楼栋">
            {{ detailData.buildingName }}
          </el-descriptions-item>

          <el-descriptions-item label="房间号">
            {{ detailData.roomNumber }}
          </el-descriptions-item>

          <el-descriptions-item label="关联合同">
            {{ detailData.relatedContractNo || '无' }}
          </el-descriptions-item>

          <el-descriptions-item label="提交时间">
            {{ detailData.submitTime }}
          </el-descriptions-item>

          <el-descriptions-item label="处理时间">
            {{ detailData.handleTime || '未处理' }}
          </el-descriptions-item>

          <el-descriptions-item label="处理人">
            {{ detailData.handler || '未处理' }}
          </el-descriptions-item>
        </el-descriptions>

        <div class="detail-content">
          <h3>工单内容</h3>
          <p>{{ detailData.content }}</p>
        </div>

        <div class="detail-content" v-if="detailData.handleResult">
          <h3>处理结果</h3>
          <p>{{ detailData.handleResult }}</p>
        </div>
      </div>
    </el-dialog>

    <!-- 驳回理由弹窗 -->
    <el-dialog
      v-model="rejectDialogVisible"
      title="填写驳回理由"
      width="520px"
    >
      <el-form label-width="90px">
        <el-form-item label="驳回理由" required>
          <el-input
            v-model="rejectForm.reason"
            type="textarea"
            :rows="5"
            placeholder="请输入驳回理由，例如：合同信息不完整、租期填写错误、押金金额不一致等"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="rejectDialogVisible = false">
          取消
        </el-button>

        <el-button type="warning" @click="confirmRejectOrder">
          确认驳回
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 租客数据：后面从租客管理 / 后端获取
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

// 合同数据：后面从合同管理 / 后端获取
const contractList = ref([
  {
    contractNo: 'HT20260401001',
    tenantId: 1,
    tenantName: '张三',
    roomNumber: '101',
    status: '已生效',
  },
  {
    contractNo: 'HT20260501001',
    tenantId: 2,
    tenantName: '王五',
    roomNumber: '201',
    status: '未生效',
  },
])

// 工单列表：前端假数据
const workOrderList = ref([
  {
    id: 1,
    orderNo: 'GD20260518001',
    type: '合同审批',
    tenantId: 2,
    tenantName: '王五',
    phone: '13800000002',
    buildingId: 'building-2',
    buildingName: '紫霞公寓2号楼',
    roomNumber: '201',
    title: '王五 201 房间合同审批',
    content: '王五已提交 201 房间租赁合同，请房东确认合同内容是否通过。',
    relatedContractNo: 'HT20260501001',
    priority: '普通',
    status: '待处理',
    submitTime: '2026-05-18 10:30',
    handleTime: '',
    handler: '',
    handleResult: '',
  },
  {
    id: 2,
    orderNo: 'GD20260518002',
    type: '维修申请',
    tenantId: 1,
    tenantName: '张三',
    phone: '13800000001',
    buildingId: 'building-1',
    buildingName: '紫霞公寓1号楼',
    roomNumber: '101',
    title: '101 房间空调漏水',
    content: '租客反馈空调使用时有漏水现象，需要安排维修人员上门检查。',
    relatedContractNo: '',
    priority: '紧急',
    status: '处理中',
    submitTime: '2026-05-18 09:20',
    handleTime: '2026-05-18 09:40',
    handler: '管理员',
    handleResult: '已受理，准备联系维修人员。',
  },
  {
    id: 3,
    orderNo: 'GD20260517001',
    type: '退租申请',
    tenantId: 1,
    tenantName: '张三',
    phone: '13800000001',
    buildingId: 'building-1',
    buildingName: '紫霞公寓1号楼',
    roomNumber: '101',
    title: '101 房间退租申请',
    content: '租客申请月底退租，需要检查房间并结算押金。',
    relatedContractNo: 'HT20260401001',
    priority: '普通',
    status: '待处理',
    submitTime: '2026-05-17 16:00',
    handleTime: '',
    handler: '',
    handleResult: '',
  },
])

const searchKeyword = ref('')
const typeFilter = ref('')
const statusFilter = ref('')
const priorityFilter = ref('')

const dialogVisible = ref(false)
const detailVisible = ref(false)
const rejectDialogVisible = ref(false)
const isEdit = ref(false)

const detailData = ref({})

const rejectForm = reactive({
  orderId: null,
  reason: '',
})

const form = reactive({
  id: null,
  orderNo: '',
  type: '',
  tenantId: '',
  tenantName: '',
  phone: '',
  buildingId: '',
  buildingName: '',
  roomNumber: '',
  title: '',
  content: '',
  relatedContractNo: '',
  priority: '',
  status: '',
})

// 搜索筛选
const filteredWorkOrderList = computed(() => {
  return workOrderList.value.filter((order) => {
    const keywordMatch =
      !searchKeyword.value ||
      order.orderNo.includes(searchKeyword.value) ||
      order.tenantName.includes(searchKeyword.value) ||
      order.roomNumber.includes(searchKeyword.value)

    const typeMatch =
      !typeFilter.value ||
      order.type === typeFilter.value

    const statusMatch =
      !statusFilter.value ||
      order.status === statusFilter.value

    const priorityMatch =
      !priorityFilter.value ||
      order.priority === priorityFilter.value

    return keywordMatch && typeMatch && statusMatch && priorityMatch
  })
})

// 当前时间
const getNowTime = () => {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const h = String(now.getHours()).padStart(2, '0')
  const min = String(now.getMinutes()).padStart(2, '0')

  return `${y}-${m}-${d} ${h}:${min}`
}

// 自动生成工单编号
const generateOrderNo = () => {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const random = Math.floor(Math.random() * 900 + 100)

  return `GD${y}${m}${d}${random}`
}

const resetForm = () => {
  form.id = null
  form.orderNo = generateOrderNo()
  form.type = ''
  form.tenantId = ''
  form.tenantName = ''
  form.phone = ''
  form.buildingId = ''
  form.buildingName = ''
  form.roomNumber = ''
  form.title = ''
  form.content = ''
  form.relatedContractNo = ''
  form.priority = '普通'
  form.status = '待处理'
}

const openAddDialog = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

const openEditDialog = (row) => {
  isEdit.value = true

  form.id = row.id
  form.orderNo = row.orderNo
  form.type = row.type
  form.tenantId = row.tenantId
  form.tenantName = row.tenantName
  form.phone = row.phone
  form.buildingId = row.buildingId
  form.buildingName = row.buildingName
  form.roomNumber = row.roomNumber
  form.title = row.title
  form.content = row.content
  form.relatedContractNo = row.relatedContractNo
  form.priority = row.priority
  form.status = row.status

  dialogVisible.value = true
}

const openDetailDialog = (row) => {
  detailData.value = row
  detailVisible.value = true
}

// 选择工单类型
const handleTypeChange = () => {
  form.relatedContractNo = ''

  if (form.type === '合同审批') {
    form.title = '合同审批申请'
    form.content = '请房东确认该租赁合同内容是否通过。'
  }

  if (form.type === '维修申请') {
    form.title = '维修申请'
    form.content = ''
  }

  if (form.type === '开门申请') {
    form.title = '开门申请'
    form.content = '租客需要房东协助开门。'
  }

  if (form.type === '打扫申请') {
    form.title = '打扫申请'
    form.content = '租客申请安排打扫。'
  }

  if (form.type === '退租申请') {
    form.title = '退租申请'
    form.content = '租客申请退租，需要检查房间并处理押金。'
  }
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

// 提交工单
const submitForm = () => {
  if (
    !form.orderNo ||
    !form.type ||
    !form.tenantId ||
    !form.title ||
    !form.content ||
    !form.priority ||
    !form.status
  ) {
    ElMessage.warning('请填写必填项：工单编号、类型、租客、标题、内容、优先级和状态')
    return
  }

  if (form.type === '合同审批' && !form.relatedContractNo) {
    ElMessage.warning('合同审批工单必须选择关联合同')
    return
  }

  const orderData = {
    id: isEdit.value ? form.id : Date.now(),
    orderNo: form.orderNo,
    type: form.type,
    tenantId: form.tenantId,
    tenantName: form.tenantName,
    phone: form.phone,
    buildingId: form.buildingId,
    buildingName: form.buildingName,
    roomNumber: form.roomNumber,
    title: form.title,
    content: form.content,
    relatedContractNo: form.relatedContractNo,
    priority: form.priority,
    status: form.status,
    submitTime: isEdit.value
      ? workOrderList.value.find((item) => item.id === form.id)?.submitTime || getNowTime()
      : getNowTime(),
    handleTime: isEdit.value
      ? workOrderList.value.find((item) => item.id === form.id)?.handleTime || ''
      : '',
    handler: isEdit.value
      ? workOrderList.value.find((item) => item.id === form.id)?.handler || ''
      : '',
    handleResult: isEdit.value
      ? workOrderList.value.find((item) => item.id === form.id)?.handleResult || ''
      : '',
  }

  if (isEdit.value) {
    const index = workOrderList.value.findIndex((item) => item.id === form.id)

    if (index !== -1) {
      workOrderList.value[index] = orderData
    }

    ElMessage.success('工单修改成功')
  } else {
    workOrderList.value.push(orderData)
    ElMessage.success('新增工单成功')
  }

  dialogVisible.value = false
}

// 受理非审批工单
const startProcess = (id) => {
  const order = workOrderList.value.find((item) => item.id === id)

  if (order) {
    order.status = '处理中'
    order.handleTime = getNowTime()
    order.handler = '管理员'
    order.handleResult = '工单已受理，正在处理中。'

    ElMessage.success('工单已受理')
  }
}

// 合同审批通过
const approveOrder = (id) => {
  const order = workOrderList.value.find((item) => item.id === id)

  if (order) {
    order.status = '已通过'
    order.handleTime = getNowTime()
    order.handler = '管理员'
    order.handleResult = '审批通过。'

    const contract = contractList.value.find(
      (item) => item.contractNo === order.relatedContractNo,
    )

    if (contract) {
      contract.status = '已生效'
    }

    ElMessage.success('合同审批已通过')
  }
}

// 打开驳回弹窗
const openRejectDialog = (row) => {
  rejectForm.orderId = row.id
  rejectForm.reason = ''
  rejectDialogVisible.value = true
}

// 确认驳回
const confirmRejectOrder = () => {
  if (!rejectForm.reason.trim()) {
    ElMessage.warning('请填写驳回理由')
    return
  }

  const order = workOrderList.value.find((item) => item.id === rejectForm.orderId)

  if (!order) {
    ElMessage.error('未找到对应工单')
    return
  }

  order.status = '已驳回'
  order.handleTime = getNowTime()
  order.handler = '管理员'
  order.handleResult = `审批驳回：${rejectForm.reason}`

  const contract = contractList.value.find(
    (item) => item.contractNo === order.relatedContractNo,
  )

  if (contract) {
    contract.status = '未生效'
  }

  rejectDialogVisible.value = false
  ElMessage.warning('合同审批已驳回')
}

// 完成工单
const completeOrder = (id) => {
  const order = workOrderList.value.find((item) => item.id === id)

  if (order) {
    order.status = '已完成'
    order.handleTime = getNowTime()
    order.handler = '管理员'
    order.handleResult = '工单已处理完成。'

    ElMessage.success('工单已完成')
  }
}

// 删除工单
const deleteOrder = (id) => {
  ElMessageBox.confirm('确定要删除这个工单吗？', '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      workOrderList.value = workOrderList.value.filter((item) => item.id !== id)
      ElMessage.success('删除成功')
    })
    .catch(() => {
      ElMessage.info('已取消删除')
    })
}

const getTypeTag = (type) => {
  if (type === '合同审批') {
    return 'success'
  }

  if (type === '维修申请') {
    return 'danger'
  }

  if (type === '开门申请') {
    return 'warning'
  }

  if (type === '打扫申请') {
    return 'info'
  }

  if (type === '退租申请') {
    return 'primary'
  }

  return ''
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

.empty-text {
  color: #999;
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

.record-title {
  font-size: 16px;
  font-weight: bold;

  margin-bottom: 16px;

  color: #303133;
}

.record-box {
  color: #606266;
  font-size: 13px;
  line-height: 1.7;
}

.record-box p {
  margin-bottom: 6px;
}

.bind-info {
  color: #606266;
  font-size: 14px;
  line-height: 1.8;
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

.work-order-dialog :deep(.el-dialog__body) {
  padding-top: 10px;
  padding-bottom: 10px;
}

.work-order-dialog :deep(.el-form-item) {
  margin-bottom: 14px;
}
</style>