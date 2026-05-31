<template>
  <div class="notice-page">
    <div class="page-header">
      <div>
        <h1>通知管理</h1>
        <p>管理房东发布和系统自动生成的租客通知。</p>
      </div>

      <el-button type="primary" @click="openAddDialog">
        新增通知
      </el-button>
    </div>

    <el-card class="filter-card">
      <el-form inline>
        <el-form-item label="关键词">
          <el-input
            v-model="searchKeyword"
            placeholder="请输入通知标题或内容"
            clearable
            style="width: 260px"
          />
        </el-form-item>

        <el-form-item label="通知类型">
          <el-select v-model="typeFilter" placeholder="请选择类型" clearable style="width: 160px">
            <el-option label="公共通知" value="公共通知" />
            <el-option label="账单通知" value="账单通知" />
            <el-option label="生活提醒" value="生活提醒" />
            <el-option label="合同通知" value="合同通知" />
            <el-option label="其他通知" value="其他通知" />
          </el-select>
        </el-form-item>

        <el-form-item label="状态">
          <el-select v-model="statusFilter" placeholder="请选择状态" clearable style="width: 140px">
            <el-option label="草稿" value="草稿" />
            <el-option label="已发布" value="已发布" />
            <el-option label="已撤回" value="已撤回" />
          </el-select>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <el-table v-loading="tableLoading" :data="filteredNoticeList" border style="width: 100%">
        <el-table-column prop="title" label="通知标题" min-width="190" />

        <el-table-column prop="type" label="类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getTypeTag(row.type)">
              {{ row.type }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="发送对象" min-width="170">
          <template #default="{ row }">
            {{ getTargetText(row) }}
          </template>
        </el-table-column>

        <el-table-column prop="source" label="来源" width="110" />

        <el-table-column prop="publishTime" label="发布时间" width="170">
          <template #default="{ row }">
            <span v-if="row.publishTime">{{ row.publishTime }}</span>
            <span v-else class="empty-text">未发布</span>
          </template>
        </el-table-column>

        <el-table-column label="需确认" width="90">
          <template #default="{ row }">
            <el-tag v-if="row.needConfirm" type="warning">是</el-tag>
            <el-tag v-else type="info">否</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="确认情况" width="120">
          <template #default="{ row }">
            <span v-if="row.needConfirm">{{ row.confirmCount }} / {{ row.totalCount }}</span>
            <span v-else class="empty-text">无需确认</span>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openDetailDialog(row)">查看</el-button>
            <el-button size="small" @click="openEditDialog(row)">编辑</el-button>
            <el-button
              v-if="row.status !== '已发布'"
              size="small"
              type="success"
              @click="publishNotice(row.id)"
            >
              发布
            </el-button>
            <el-button
              v-if="row.status === '已发布'"
              size="small"
              type="warning"
              @click="withdrawNotice(row.id)"
            >
              撤回
            </el-button>
            <el-button size="small" type="danger" @click="deleteNotice(row.id)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑通知' : '新增通知'"
      width="820px"
      top="6vh"
      class="notice-dialog"
    >
      <el-form label-width="100px">
        <div class="form-layout">
          <div class="form-left">
            <el-form-item label="通知标题" required>
              <el-input v-model="form.title" placeholder="请输入通知标题" />
            </el-form-item>

            <el-form-item label="通知类型" required>
              <el-select v-model="form.type" placeholder="请选择通知类型" style="width: 100%">
                <el-option label="公共通知" value="公共通知" />
                <el-option label="账单通知" value="账单通知" />
                <el-option label="生活提醒" value="生活提醒" />
                <el-option label="合同通知" value="合同通知" />
                <el-option label="其他通知" value="其他通知" />
              </el-select>
            </el-form-item>

            <el-form-item label="发送对象" required>
              <el-select
                v-model="form.targetType"
                placeholder="请选择发送对象"
                style="width: 100%"
                @change="handleTargetTypeChange"
              >
                <el-option label="全部在租租客" value="all" />
                <el-option label="指定租客" value="tenant" />
                <el-option label="指定房间" value="room" />
              </el-select>
            </el-form-item>

            <el-form-item v-if="form.targetType === 'tenant'" label="租客" required>
              <el-select v-model="form.targetId" placeholder="请选择租客" style="width: 100%">
                <el-option
                  v-for="tenant in tenantList"
                  :key="tenant.id"
                  :label="`${tenant.name} - ${tenant.roomNumber || '未绑定房间'}`"
                  :value="tenant.id"
                />
              </el-select>
            </el-form-item>

            <el-form-item v-if="form.targetType === 'room'" label="房间" required>
              <el-select v-model="form.targetId" placeholder="请选择房间" style="width: 100%">
                <el-option
                  v-for="room in roomList"
                  :key="room.id"
                  :label="`${room.buildingName} - ${room.roomNumber}`"
                  :value="room.id"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="需要确认">
              <el-switch v-model="form.needConfirm" active-text="需要" inactive-text="不需要" />
            </el-form-item>
          </div>

          <div class="form-right">
            <el-form-item label="通知内容" required>
              <el-input
                v-model="form.content"
                type="textarea"
                :rows="12"
                placeholder="请输入通知内容"
              />
            </el-form-item>

            <div class="notice-tip">
              <p><strong>说明：</strong></p>
              <p>保存后默认是草稿，发布后租客端才可以看到。</p>
              <p>需要确认的通知，会在租客登录后弹窗提醒确认。</p>
              <p>系统自动通知会标记为“系统自动”，也会进入同一套确认流程。</p>
            </div>
          </div>
        </div>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="通知详情" width="680px">
      <div class="detail-box">
        <h2>{{ detailData.title }}</h2>
        <div class="detail-meta">
          <span>类型：{{ detailData.type }}</span>
          <span>对象：{{ getTargetText(detailData) }}</span>
          <span>来源：{{ detailData.source }}</span>
          <span>状态：{{ detailData.status }}</span>
        </div>
        <div class="detail-content">
          {{ detailData.content }}
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'

const tenantList = ref([])
const roomList = ref([])
const noticeList = ref([])

const searchKeyword = ref('')
const typeFilter = ref('')
const statusFilter = ref('')

const dialogVisible = ref(false)
const detailVisible = ref(false)
const isEdit = ref(false)
const tableLoading = ref(false)
const submitLoading = ref(false)

const detailData = ref({})

const form = reactive({
  id: null,
  title: '',
  type: '',
  targetType: 'all',
  targetId: '',
  content: '',
  needConfirm: false,
})

const filteredNoticeList = computed(() => {
  return noticeList.value.filter((notice) => {
    const keyword = searchKeyword.value.trim()
    const keywordMatch =
      !keyword ||
      notice.title.includes(keyword) ||
      notice.content.includes(keyword)
    const typeMatch = !typeFilter.value || notice.type === typeFilter.value
    const statusMatch = !statusFilter.value || notice.status === statusFilter.value

    return keywordMatch && typeMatch && statusMatch
  })
})

const formatDateTime = (date) => {
  if (!date) return ''
  return String(date).replace('T', ' ').slice(0, 16)
}

const mapTenant = (tenant) => ({
  id: tenant.id,
  name: tenant.name,
  roomNumber: tenant.room_number,
})

const mapRoom = (room) => ({
  id: room.id,
  buildingName: room.building_name,
  roomNumber: room.room_number,
})

const mapNotice = (notice) => ({
  id: notice.id,
  title: notice.title,
  type: notice.type,
  targetType: notice.target_type,
  targetId: notice.target_id,
  content: notice.content,
  publishTime: formatDateTime(notice.publish_time),
  needConfirm: Number(notice.need_confirm) === 1,
  confirmCount: Number(notice.confirm_count || 0),
  totalCount: Number(notice.total_count || 0),
  status: notice.status || '已发布',
  source: notice.source || '房东发布',
})

const getTargetText = (notice) => {
  if (!notice) return ''

  if (notice.targetType === 'all') {
    return '全部在租租客'
  }

  if (notice.targetType === 'tenant') {
    const tenant = tenantList.value.find((item) => Number(item.id) === Number(notice.targetId))
    return tenant ? `${tenant.name} ${tenant.roomNumber || ''}` : '指定租客'
  }

  if (notice.targetType === 'room') {
    const room = roomList.value.find((item) => Number(item.id) === Number(notice.targetId))
    return room ? `${room.buildingName} ${room.roomNumber}` : '指定房间'
  }

  return '-'
}

const getTenantList = async () => {
  const res = await request.get('/tenants')
  if (res.code === 200) {
    tenantList.value = (res.data || []).filter((tenant) => tenant.status === '在租').map(mapTenant)
  }
}

const getRoomList = async () => {
  const res = await request.get('/rooms')
  if (res.code === 200) {
    roomList.value = (res.data || []).filter((room) => room.tenant_name).map(mapRoom)
  }
}

const getNoticeList = async () => {
  tableLoading.value = true
  try {
    const res = await request.get('/notices')
    if (res.code === 200) {
      noticeList.value = (res.data || []).map(mapNotice)
    }
  } catch (error) {
    console.error('获取通知列表失败：', error)
    ElMessage.error('获取通知列表失败')
  } finally {
    tableLoading.value = false
  }
}

const handleTargetTypeChange = () => {
  form.targetId = ''
}

const resetForm = () => {
  form.id = null
  form.title = ''
  form.type = '公共通知'
  form.targetType = 'all'
  form.targetId = ''
  form.content = ''
  form.needConfirm = false
}

const openAddDialog = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

const openEditDialog = (row) => {
  isEdit.value = true
  form.id = row.id
  form.title = row.title
  form.type = row.type
  form.targetType = row.targetType
  form.targetId = row.targetId || ''
  form.content = row.content
  form.needConfirm = row.needConfirm
  dialogVisible.value = true
}

const openDetailDialog = (row) => {
  detailData.value = row
  detailVisible.value = true
}

const buildNoticeData = () => {
  return {
    title: form.title,
    type: form.type,
    target_type: form.targetType,
    target_id: form.targetId || null,
    content: form.content,
    need_confirm: form.needConfirm,
    status: isEdit.value
      ? noticeList.value.find((item) => item.id === form.id)?.status || '草稿'
      : '草稿',
    source: '房东发布',
  }
}

const submitForm = async () => {
  if (!form.title || !form.type || !form.targetType || !form.content) {
    ElMessage.warning('请填写通知标题、类型、发送对象和内容')
    return
  }

  if (form.targetType !== 'all' && !form.targetId) {
    ElMessage.warning('请选择具体发送对象')
    return
  }

  try {
    submitLoading.value = true
    const noticeData = buildNoticeData()

    if (isEdit.value) {
      const res = await request.put(`/notices/${form.id}`, noticeData)
      if (res.code === 200) ElMessage.success('通知修改成功')
    } else {
      const res = await request.post('/notices', noticeData)
      if (res.code === 200) ElMessage.success('通知已保存为草稿')
    }

    dialogVisible.value = false
    await getNoticeList()
  } catch (error) {
    console.error('保存通知失败：', error)
    ElMessage.error(error.response?.data?.message || '保存通知失败')
  } finally {
    submitLoading.value = false
  }
}

const updateNoticeStatus = async (id, status) => {
  const res = await request.put(`/notices/${id}/status`, { status })
  if (res.code === 200) {
    ElMessage.success(status === '已发布' ? '通知发布成功' : '通知已撤回')
    await getNoticeList()
  }
}

const publishNotice = (id) => updateNoticeStatus(id, '已发布')
const withdrawNotice = (id) => updateNoticeStatus(id, '已撤回')

const deleteNotice = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除这条通知吗？', '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    const res = await request.delete(`/notices/${id}`)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      await getNoticeList()
    }
  } catch (error) {
    if (error === 'cancel') return
    ElMessage.error(error.response?.data?.message || '删除失败')
  }
}

const getTypeTag = (type) => {
  if (type === '账单通知') return 'warning'
  if (type === '合同通知') return 'success'
  if (type === '公共通知') return 'primary'
  if (type === '生活提醒') return 'info'
  return ''
}

const getStatusType = (status) => {
  if (status === '已发布') return 'success'
  if (status === '草稿') return 'info'
  if (status === '已撤回') return 'warning'
  return ''
}

onMounted(async () => {
  await Promise.all([getTenantList(), getRoomList(), getNoticeList()])
})
</script>

<style scoped>
.notice-page {
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
  gap: 28px;
}

.form-left {
  width: 330px;
}

.form-right {
  flex: 1;
}

.notice-tip {
  margin-left: 100px;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 8px;
  color: #606266;
  font-size: 13px;
  line-height: 1.7;
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
  padding: 18px;
  background: #f5f7fa;
  border-radius: 8px;
  line-height: 1.8;
  white-space: pre-wrap;
}

.notice-dialog :deep(.el-dialog__body) {
  padding-top: 10px;
  padding-bottom: 10px;
}

.notice-dialog :deep(.el-form-item) {
  margin-bottom: 16px;
}
</style>
