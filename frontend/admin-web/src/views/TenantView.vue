<template>
  <div class="tenant-page">
    <div class="page-header">
      <div>
        <h1>租客管理</h1>
        <p>管理租客基本信息、入住房间、合同状态和紧急联系人。</p>
      </div>

      <el-button type="primary" @click="openCreateDialog">
        新增租客
      </el-button>
    </div>

    <div class="summary-grid">
      <el-card class="summary-card">
        <div class="summary-title">全部租客</div>
        <div class="summary-value">{{ tenantList.length }}</div>
        <div class="summary-desc">系统中的租客总数</div>
      </el-card>

      <el-card class="summary-card">
        <div class="summary-title">在租租客</div>
        <div class="summary-value success">{{ activeTenantCount }}</div>
        <div class="summary-desc">当前正在租住的租客</div>
      </el-card>

      <el-card class="summary-card">
        <div class="summary-title">已退租</div>
        <div class="summary-value info">{{ retiredTenantCount }}</div>
        <div class="summary-desc">已经退租的租客</div>
      </el-card>
    </div>

    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>租客列表</span>

          <div class="header-actions">
            <el-input
              v-model="keyword"
              placeholder="搜索姓名 / 手机号 / 房间号"
              clearable
              style="width: 260px"
            />

            <el-select
              v-model="statusFilter"
              placeholder="租客状态"
              clearable
              style="width: 140px"
            >
              <el-option label="在租" value="在租" />
              <el-option label="已退租" value="已退租" />
            </el-select>
          </div>
        </div>
      </template>

      <el-table
        :data="filteredTenantList"
        border
        style="width: 100%"
      >
        <el-table-column prop="name" label="租客姓名" width="120" />
        <el-table-column prop="phone" label="手机号" width="140" />

        <el-table-column label="所属楼栋" min-width="160">
          <template #default="{ row }">
            {{ row.building_name || '未绑定' }}
          </template>
        </el-table-column>

        <el-table-column label="房间号" width="100">
          <template #default="{ row }">
            {{ row.room_number || '未绑定' }}
          </template>
        </el-table-column>

        <el-table-column label="房型" width="120">
          <template #default="{ row }">
            {{ row.room_type || '-' }}
          </template>
        </el-table-column>

        <el-table-column label="月租金" width="110">
          <template #default="{ row }">
            <span v-if="row.monthly_rent">¥{{ row.monthly_rent }}</span>
            <span v-else class="muted-text">-</span>
          </template>
        </el-table-column>

        <el-table-column label="租期" min-width="210">
          <template #default="{ row }">
            <span v-if="row.lease_start && row.lease_end">
              {{ formatDate(row.lease_start) }} ~ {{ formatDate(row.lease_end) }}
            </span>
            <span v-else class="muted-text">暂无租期</span>
          </template>
        </el-table-column>

        <el-table-column label="合同状态" width="110">
          <template #default="{ row }">
            <el-tag
              v-if="row.contract_status"
              :type="getContractStatusType(row.contract_status)"
            >
              {{ row.contract_status }}
            </el-tag>
            <span v-else class="muted-text">无合同</span>
          </template>
        </el-table-column>

        <el-table-column label="租客状态" width="110">
          <template #default="{ row }">
            <el-tag :type="getTenantStatusType(row.status)">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="紧急联系人" width="130">
          <template #default="{ row }">
            {{ row.emergency_contact || '-' }}
          </template>
        </el-table-column>

        <el-table-column
          label="操作"
          width="220"
          fixed="right"
        >
          <template #default="{ row }">
            <el-button size="small" @click="openDetail(row)">
              查看
            </el-button>

            <el-button size="small" @click="openEditDialog(row)">
              编辑
            </el-button>

            <el-button size="small" type="danger" @click="deleteTenant(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="detailVisible"
      title="租客详情"
      width="760px"
    >
      <div v-if="currentTenant">
        <el-descriptions
          border
          :column="2"
        >
          <el-descriptions-item label="租客姓名">
            {{ currentTenant.name }}
          </el-descriptions-item>

          <el-descriptions-item label="手机号">
            {{ currentTenant.phone }}
          </el-descriptions-item>

          <el-descriptions-item label="身份证号">
            {{ currentTenant.id_card || '-' }}
          </el-descriptions-item>

          <el-descriptions-item label="登录账号">
            {{ currentTenant.username || '-' }}
          </el-descriptions-item>

          <el-descriptions-item label="所属楼栋">
            {{ currentTenant.building_name || '-' }}
          </el-descriptions-item>

          <el-descriptions-item label="房间号">
            {{ currentTenant.room_number || '-' }}
          </el-descriptions-item>

          <el-descriptions-item label="房型">
            {{ currentTenant.room_type || '-' }}
          </el-descriptions-item>

          <el-descriptions-item label="月租金">
            <span v-if="currentTenant.monthly_rent">
              ¥{{ currentTenant.monthly_rent }}
            </span>
            <span v-else>-</span>
          </el-descriptions-item>

          <el-descriptions-item label="押金">
            <span v-if="currentTenant.deposit">
              ¥{{ currentTenant.deposit }}
            </span>
            <span v-else>-</span>
          </el-descriptions-item>

          <el-descriptions-item label="合同编号">
            {{ currentTenant.contract_no || '-' }}
          </el-descriptions-item>

          <el-descriptions-item label="合同状态">
            <el-tag
              v-if="currentTenant.contract_status"
              :type="getContractStatusType(currentTenant.contract_status)"
            >
              {{ currentTenant.contract_status }}
            </el-tag>
            <span v-else>-</span>
          </el-descriptions-item>

          <el-descriptions-item label="租期">
            <span v-if="currentTenant.contract_start_date && currentTenant.contract_end_date">
              {{ formatDate(currentTenant.contract_start_date) }}
              ~
              {{ formatDate(currentTenant.contract_end_date) }}
            </span>
            <span v-else>-</span>
          </el-descriptions-item>

          <el-descriptions-item label="紧急联系人">
            {{ currentTenant.emergency_contact || '-' }}
          </el-descriptions-item>

          <el-descriptions-item label="紧急联系电话">
            {{ currentTenant.emergency_phone || '-' }}
          </el-descriptions-item>

          <el-descriptions-item label="租客状态">
            <el-tag :type="getTenantStatusType(currentTenant.status)">
              {{ currentTenant.status }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <template #footer>
        <el-button @click="detailVisible = false">
          关闭
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '新增租客' : '编辑租客'"
      width="760px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="tenantForm"
        :rules="rules"
        label-width="110px"
      >
        <el-form-item label="租客姓名" prop="name">
          <el-input
            v-model="tenantForm.name"
            placeholder="请输入租客姓名"
          />
        </el-form-item>

        <el-form-item label="手机号" prop="phone">
          <el-input
            v-model="tenantForm.phone"
            placeholder="请输入手机号"
          />
        </el-form-item>

        <el-form-item label="身份证号">
          <el-input
            v-model="tenantForm.id_card"
            placeholder="请输入身份证号"
          />
        </el-form-item>

        <el-form-item label="所属楼栋">
          <el-select
            v-model="tenantForm.building_id"
            placeholder="请选择所属楼栋"
            style="width: 100%"
            clearable
          >
            <el-option
              v-for="building in buildingList"
              :key="building.id"
              :label="building.name"
              :value="building.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="房间号">
          <el-input
            v-model="tenantForm.room_number"
            placeholder="例如：102。为空则表示暂不绑定房间"
          />
        </el-form-item>

        <el-form-item label="紧急联系人">
          <el-input
            v-model="tenantForm.emergency_contact"
            placeholder="请输入紧急联系人"
          />
        </el-form-item>

        <el-form-item label="紧急联系电话">
          <el-input
            v-model="tenantForm.emergency_phone"
            placeholder="请输入紧急联系电话"
          />
        </el-form-item>

        <el-form-item label="租客状态" prop="status">
          <el-select
            v-model="tenantForm.status"
            style="width: 100%"
          >
            <el-option label="在租" value="在租" />
            <el-option label="已退租" value="已退租" />
          </el-select>
        </el-form-item>

        <div class="form-tip">
          新增租客时，系统会自动创建租客登录账号。默认账号为手机号，默认密码为 123456。
          如果填写房间号，则必须选择所属楼栋。系统会根据“楼栋 + 房间号”绑定房间。
        </div>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">
          取消
        </el-button>

        <el-button type="primary" @click="submitTenant">
          确认
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'

const tenantList = ref([])
const buildingList = ref([])

const keyword = ref('')
const statusFilter = ref('')

const detailVisible = ref(false)
const dialogVisible = ref(false)
const dialogMode = ref('create')
const currentTenant = ref(null)
const formRef = ref(null)

const tenantForm = reactive({
  id: null,
  name: '',
  phone: '',
  id_card: '',
  building_id: '',
  room_number: '',
  emergency_contact: '',
  emergency_phone: '',
  status: '在租',
})

const rules = {
  name: [
    { required: true, message: '请输入租客姓名', trigger: 'blur' },
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
  ],
  status: [
    { required: true, message: '请选择租客状态', trigger: 'change' },
  ],
}

const activeTenantCount = computed(() => {
  return tenantList.value.filter((item) => item.status === '在租').length
})

const retiredTenantCount = computed(() => {
  return tenantList.value.filter((item) => item.status === '已退租').length
})

const filteredTenantList = computed(() => {
  let list = [...tenantList.value]

  if (statusFilter.value) {
    list = list.filter((item) => item.status === statusFilter.value)
  }

  if (keyword.value) {
    const key = keyword.value.trim()

    list = list.filter((item) => {
      return (
        String(item.name || '').includes(key) ||
        String(item.phone || '').includes(key) ||
        String(item.room_number || '').includes(key) ||
        String(item.building_name || '').includes(key)
      )
    })
  }

  return list
})

const getTenantList = async () => {
  try {
    const res = await request.get('/tenants')

    if (res.code === 200) {
      tenantList.value = res.data
    }
  } catch (error) {
    console.error('获取租客列表失败：', error)
    ElMessage.error('获取租客列表失败，请确认后端是否启动')
  }
}

const getBuildingList = async () => {
  try {
    const res = await request.get('/buildings')

    if (res.code === 200) {
      buildingList.value = res.data
    }
  } catch (error) {
    console.error('获取楼栋列表失败：', error)
    ElMessage.error('获取楼栋列表失败，请确认后端是否启动')
  }
}

onMounted(() => {
  getTenantList()
  getBuildingList()
})

const openDetail = (row) => {
  currentTenant.value = row
  detailVisible.value = true
}

const openCreateDialog = () => {
  dialogMode.value = 'create'
  resetForm()
  dialogVisible.value = true
}

const openEditDialog = (row) => {
  dialogMode.value = 'edit'

  tenantForm.id = row.id
  tenantForm.name = row.name
  tenantForm.phone = row.phone
  tenantForm.id_card = row.id_card || ''
  tenantForm.building_id = row.building_id || ''
  tenantForm.room_number = row.room_number || ''
  tenantForm.emergency_contact = row.emergency_contact || ''
  tenantForm.emergency_phone = row.emergency_phone || ''
  tenantForm.status = row.status || '在租'

  dialogVisible.value = true
}

const resetForm = () => {
  tenantForm.id = null
  tenantForm.name = ''
  tenantForm.phone = ''
  tenantForm.id_card = ''
  tenantForm.building_id = ''
  tenantForm.room_number = ''
  tenantForm.emergency_contact = ''
  tenantForm.emergency_phone = ''
  tenantForm.status = '在租'

  if (formRef.value) {
    formRef.value.clearValidate()
  }
}

const submitTenant = async () => {
  if (!formRef.value) {
    return
  }

  await formRef.value.validate(async (valid) => {
    if (!valid) {
      return
    }

    if (tenantForm.room_number && !tenantForm.building_id) {
      ElMessage.warning('填写房间号时，请先选择所属楼栋')
      return
    }

    const tenantData = {
      name: tenantForm.name,
      phone: tenantForm.phone,
      id_card: tenantForm.id_card,
      building_id: tenantForm.building_id,
      room_number: tenantForm.room_number,
      emergency_contact: tenantForm.emergency_contact,
      emergency_phone: tenantForm.emergency_phone,
      status: tenantForm.status,
    }

    try {
      if (dialogMode.value === 'create') {
        const res = await request.post('/tenants', tenantData)

        if (res.code === 200) {
          ElMessage.success('新增租客成功')
        }
      } else {
        const res = await request.put(`/tenants/${tenantForm.id}`, tenantData)

        if (res.code === 200) {
          ElMessage.success('编辑租客成功')
        }
      }

      dialogVisible.value = false
      await getTenantList()
    } catch (error) {
      console.error('保存租客失败：', error)

      const message = error.response?.data?.message || '保存租客失败'
      ElMessage.error(message)
    }
  })
}

const deleteTenant = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除租客「${row.name}」吗？删除后相关合同、水电账单、通知确认和工单记录也会删除。`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
      },
    )

    const res = await request.delete(`/tenants/${row.id}`)

    if (res.code === 200) {
      ElMessage.success('删除成功')
      await getTenantList()
    }
  } catch (error) {
    if (error === 'cancel') {
      ElMessage.info('已取消删除')
      return
    }

    console.error('删除租客失败：', error)

    const message = error.response?.data?.message || '删除租客失败'
    ElMessage.error(message)
  }
}

const getTenantStatusType = (status) => {
  if (status === '在租') {
    return 'success'
  }

  if (status === '已退租') {
    return 'info'
  }

  return ''
}

const getContractStatusType = (status) => {
  if (status === '生效中') {
    return 'success'
  }

  if (status === '待确认') {
    return 'warning'
  }

  if (status === '已到期') {
    return 'info'
  }

  if (status === '已作废') {
    return 'danger'
  }

  return ''
}

const formatDate = (date) => {
  if (!date) {
    return ''
  }

  return String(date).slice(0, 10)
}
</script>

<style scoped>
.tenant-page {
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
  grid-template-columns: repeat(3, 1fr);
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

.summary-value.success {
  color: #67c23a;
}

.summary-value.info {
  color: #909399;
}

.summary-desc {
  color: #909399;
  font-size: 13px;
}

.table-card {
  border-radius: 12px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.muted-text {
  color: #909399;
  font-size: 13px;
}

.form-tip {
  margin-top: 8px;
  padding: 12px 14px;
  background: #f5f7fa;
  border-radius: 8px;
  color: #909399;
  font-size: 13px;
  line-height: 1.7;
}

@media (max-width: 1000px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }

  .card-header,
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .header-actions {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }
}
</style>