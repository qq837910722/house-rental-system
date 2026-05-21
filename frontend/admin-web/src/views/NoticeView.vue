<template>
  <div class="notice-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <div>
        <h1>通知管理</h1>
        <p>管理面向租客的公告、缴费提醒、维修通知和合同通知。</p>
      </div>

      <el-button type="primary" @click="openAddDialog">
        新增通知
      </el-button>
    </div>

    <!-- 搜索筛选区 -->
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
          <el-select
            v-model="typeFilter"
            placeholder="请选择类型"
            clearable
            style="width: 160px"
          >
            <el-option label="普通通知" value="普通通知" />
            <el-option label="缴费通知" value="缴费通知" />
            <el-option label="维修通知" value="维修通知" />
            <el-option label="合同通知" value="合同通知" />
            <el-option label="其他通知" value="其他通知" />
          </el-select>
        </el-form-item>

        <el-form-item label="状态">
          <el-select
            v-model="statusFilter"
            placeholder="请选择状态"
            clearable
            style="width: 140px"
          >
            <el-option label="草稿" value="草稿" />
            <el-option label="已发布" value="已发布" />
            <el-option label="已撤回" value="已撤回" />
          </el-select>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 通知列表 -->
    <el-card class="table-card">
      <el-table :data="filteredNoticeList" border style="width: 100%">
        <el-table-column prop="title" label="通知标题" min-width="180" />

        <el-table-column prop="type" label="通知类型" width="120">
          <template #default="scope">
            <el-tag :type="getTypeTag(scope.row.type)">
              {{ scope.row.type }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="发送对象" width="220">
          <template #default="scope">
            {{ getTargetText(scope.row) }}
          </template>
        </el-table-column>

        <el-table-column prop="publishTime" label="发布时间" width="180">
          <template #default="scope">
            <span v-if="scope.row.publishTime">
              {{ scope.row.publishTime }}
            </span>
            <span v-else class="empty-text">
              未发布
            </span>
          </template>
        </el-table-column>

        <el-table-column label="需要确认" width="100">
          <template #default="scope">
            <el-tag v-if="scope.row.needConfirm" type="warning">
              是
            </el-tag>
            <el-tag v-else type="info">
              否
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="确认情况" width="120">
          <template #default="scope">
            <span v-if="scope.row.needConfirm">
              {{ scope.row.confirmCount }} / {{ scope.row.totalCount }}
            </span>
            <span v-else class="empty-text">
              无需确认
            </span>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="280" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="openDetailDialog(scope.row)">
              查看
            </el-button>

            <el-button size="small" @click="openEditDialog(scope.row)">
              编辑
            </el-button>

            <el-button
              v-if="scope.row.status !== '已发布'"
              size="small"
              type="success"
              @click="publishNotice(scope.row.id)"
            >
              发布
            </el-button>

            <el-button
              v-if="scope.row.status === '已发布'"
              size="small"
              type="warning"
              @click="withdrawNotice(scope.row.id)"
            >
              撤回
            </el-button>

            <el-button
              size="small"
              type="danger"
              @click="deleteNotice(scope.row.id)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增 / 编辑通知弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑通知' : '新增通知'"
      width="820px"
      top="6vh"
      class="notice-dialog"
    >
      <el-form label-width="100px">
        <div class="form-layout">
          <!-- 左侧：通知基本信息 -->
          <div class="form-left">
            <el-form-item label="通知标题" required>
              <el-input
                v-model="form.title"
                placeholder="请输入通知标题"
              />
            </el-form-item>

            <el-form-item label="通知类型" required>
              <el-select
                v-model="form.type"
                placeholder="请选择通知类型"
                style="width: 100%"
              >
                <el-option label="普通通知" value="普通通知" />
                <el-option label="缴费通知" value="缴费通知" />
                <el-option label="维修通知" value="维修通知" />
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
                <el-option label="全部租客" value="全部租客" />
                <el-option label="指定楼栋" value="指定楼栋" />
                <el-option label="指定房间" value="指定房间" />
              </el-select>
            </el-form-item>

            <el-form-item
              v-if="form.targetType === '指定楼栋'"
              label="所属楼栋"
              required
            >
              <el-select
                v-model="form.buildingId"
                placeholder="请选择楼栋"
                style="width: 100%"
              >
                <el-option
                  v-for="building in buildingList"
                  :key="building.id"
                  :label="building.name"
                  :value="building.id"
                />
              </el-select>
            </el-form-item>

            <el-form-item
              v-if="form.targetType === '指定房间'"
              label="房间"
              required
            >
              <el-select
                v-model="form.roomKey"
                placeholder="请选择房间"
                style="width: 100%"
              >
                <el-option
                  v-for="room in roomList"
                  :key="room.roomKey"
                  :label="`${room.buildingName} - ${room.roomNumber}`"
                  :value="room.roomKey"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="需要确认">
              <el-switch
                v-model="form.needConfirm"
                active-text="需要"
                inactive-text="不需要"
              />
            </el-form-item>
          </div>

          <!-- 右侧：通知内容 -->
          <div class="form-right">
            <el-form-item label="通知内容" required>
              <el-input
                v-model="form.content"
                type="textarea"
                :rows="12"
                placeholder="请输入通知内容，例如：本月房租请于5月25日前缴纳。"
              />
            </el-form-item>

            <div class="notice-tip">
              <p><strong>说明：</strong></p>
              <p>保存后通知状态为「草稿」。</p>
              <p>点击列表中的「发布」按钮后，租客端才可以看到该通知。</p>
              <p>如果选择「需要确认」，后续租客端需要点击“已确认”。</p>
            </div>
          </div>
        </div>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">
          取消
        </el-button>

        <el-button type="primary" @click="submitForm">
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 查看通知详情弹窗 -->
    <el-dialog
      v-model="detailVisible"
      title="通知详情"
      width="680px"
    >
      <div class="detail-box">
        <h2>{{ detailData.title }}</h2>

        <div class="detail-meta">
          <span>类型：{{ detailData.type }}</span>
          <span>对象：{{ getTargetText(detailData) }}</span>
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
import { computed, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 楼栋数据：后面可以和房屋管理共用后端数据
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

// 房间数据：后面从房屋管理获取
const roomList = ref([
  {
    roomKey: 'building-1-101',
    buildingId: 'building-1',
    buildingName: '紫霞公寓1号楼',
    roomNumber: '101',
  },
  {
    roomKey: 'building-1-102',
    buildingId: 'building-1',
    buildingName: '紫霞公寓1号楼',
    roomNumber: '102',
  },
  {
    roomKey: 'building-2-201',
    buildingId: 'building-2',
    buildingName: '紫霞公寓2号楼',
    roomNumber: '201',
  },
])

// 通知列表：前端假数据
const noticeList = ref([
  {
    id: 1,
    title: '5月房租缴纳通知',
    type: '缴费通知',
    targetType: '全部租客',
    buildingId: '',
    roomKey: '',
    content: '请各位租客于5月25日前完成本月房租缴纳。如已缴纳，请忽略本通知。',
    publishTime: '2026-05-18 10:30',
    needConfirm: true,
    confirmCount: 1,
    totalCount: 3,
    status: '已发布',
  },
  {
    id: 2,
    title: '1号楼公共区域清扫通知',
    type: '普通通知',
    targetType: '指定楼栋',
    buildingId: 'building-1',
    roomKey: '',
    content: '1号楼公共区域将于本周六上午进行清扫，请大家提前整理门口物品。',
    publishTime: '',
    needConfirm: false,
    confirmCount: 0,
    totalCount: 2,
    status: '草稿',
  },
  {
    id: 3,
    title: '201房间维修进度通知',
    type: '维修通知',
    targetType: '指定房间',
    buildingId: '',
    roomKey: 'building-2-201',
    content: '201房间维修申请已收到，维修人员预计明天下午上门处理。',
    publishTime: '2026-05-17 16:00',
    needConfirm: true,
    confirmCount: 0,
    totalCount: 1,
    status: '已发布',
  },
])

const searchKeyword = ref('')
const typeFilter = ref('')
const statusFilter = ref('')

const dialogVisible = ref(false)
const detailVisible = ref(false)
const isEdit = ref(false)

const detailData = ref({})

const form = reactive({
  id: null,
  title: '',
  type: '',
  targetType: '',
  buildingId: '',
  roomKey: '',
  content: '',
  needConfirm: false,
})

// 搜索筛选
const filteredNoticeList = computed(() => {
  return noticeList.value.filter((notice) => {
    const keywordMatch =
      !searchKeyword.value ||
      notice.title.includes(searchKeyword.value) ||
      notice.content.includes(searchKeyword.value)

    const typeMatch =
      !typeFilter.value ||
      notice.type === typeFilter.value

    const statusMatch =
      !statusFilter.value ||
      notice.status === statusFilter.value

    return keywordMatch && typeMatch && statusMatch
  })
})

// 获取当前时间
const getNowTime = () => {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const h = String(now.getHours()).padStart(2, '0')
  const min = String(now.getMinutes()).padStart(2, '0')

  return `${y}-${m}-${d} ${h}:${min}`
}

// 获取楼栋名
const getBuildingName = (buildingId) => {
  const building = buildingList.value.find((item) => item.id === buildingId)
  return building ? building.name : ''
}

// 获取房间名
const getRoomName = (roomKey) => {
  const room = roomList.value.find((item) => item.roomKey === roomKey)

  if (!room) {
    return ''
  }

  return `${room.buildingName} ${room.roomNumber}`
}

// 显示发送对象
const getTargetText = (notice) => {
  if (!notice) {
    return ''
  }

  if (notice.targetType === '全部租客') {
    return '全部租客'
  }

  if (notice.targetType === '指定楼栋') {
    return getBuildingName(notice.buildingId)
  }

  if (notice.targetType === '指定房间') {
    return getRoomName(notice.roomKey)
  }

  return '-'
}

// 根据发送对象计算人数，后面可以换成真实租客数量
const getTotalCount = (targetType, buildingId, roomKey) => {
  if (targetType === '全部租客') {
    return 3
  }

  if (targetType === '指定楼栋') {
    if (buildingId === 'building-1') {
      return 2
    }

    if (buildingId === 'building-2') {
      return 1
    }
  }

  if (targetType === '指定房间' && roomKey) {
    return 1
  }

  return 0
}

const handleTargetTypeChange = () => {
  form.buildingId = ''
  form.roomKey = ''
}

const resetForm = () => {
  form.id = null
  form.title = ''
  form.type = ''
  form.targetType = ''
  form.buildingId = ''
  form.roomKey = ''
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
  form.buildingId = row.buildingId
  form.roomKey = row.roomKey
  form.content = row.content
  form.needConfirm = row.needConfirm

  dialogVisible.value = true
}

const openDetailDialog = (row) => {
  detailData.value = row
  detailVisible.value = true
}

const submitForm = () => {
  if (!form.title || !form.type || !form.targetType || !form.content) {
    ElMessage.warning('请填写必填项：通知标题、通知类型、发送对象和通知内容')
    return
  }

  if (form.targetType === '指定楼栋' && !form.buildingId) {
    ElMessage.warning('请选择楼栋')
    return
  }

  if (form.targetType === '指定房间' && !form.roomKey) {
    ElMessage.warning('请选择房间')
    return
  }

  const totalCount = getTotalCount(form.targetType, form.buildingId, form.roomKey)

  const noticeData = {
    id: isEdit.value ? form.id : Date.now(),
    title: form.title,
    type: form.type,
    targetType: form.targetType,
    buildingId: form.buildingId,
    roomKey: form.roomKey,
    content: form.content,
    publishTime: isEdit.value
      ? noticeList.value.find((item) => item.id === form.id)?.publishTime || ''
      : '',
    needConfirm: form.needConfirm,
    confirmCount: isEdit.value
      ? noticeList.value.find((item) => item.id === form.id)?.confirmCount || 0
      : 0,
    totalCount,
    status: isEdit.value
      ? noticeList.value.find((item) => item.id === form.id)?.status || '草稿'
      : '草稿',
  }

  if (isEdit.value) {
    const index = noticeList.value.findIndex((item) => item.id === form.id)

    if (index !== -1) {
      noticeList.value[index] = noticeData
    }

    ElMessage.success('通知修改成功')
  } else {
    noticeList.value.push(noticeData)
    ElMessage.success('通知已保存为草稿')
  }

  dialogVisible.value = false
}

const publishNotice = (id) => {
  const notice = noticeList.value.find((item) => item.id === id)

  if (notice) {
    notice.status = '已发布'
    notice.publishTime = getNowTime()
    ElMessage.success('通知发布成功')
  }
}

const withdrawNotice = (id) => {
  const notice = noticeList.value.find((item) => item.id === id)

  if (notice) {
    notice.status = '已撤回'
    ElMessage.warning('通知已撤回')
  }
}

const deleteNotice = (id) => {
  ElMessageBox.confirm('确定要删除这条通知吗？', '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      noticeList.value = noticeList.value.filter((item) => item.id !== id)
      ElMessage.success('删除成功')
    })
    .catch(() => {
      ElMessage.info('已取消删除')
    })
}

const getTypeTag = (type) => {
  if (type === '缴费通知') {
    return 'warning'
  }

  if (type === '维修通知') {
    return 'danger'
  }

  if (type === '合同通知') {
    return 'success'
  }

  if (type === '普通通知') {
    return 'info'
  }

  return ''
}

const getStatusType = (status) => {
  if (status === '已发布') {
    return 'success'
  }

  if (status === '草稿') {
    return 'info'
  }

  if (status === '已撤回') {
    return 'warning'
  }

  return ''
}
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