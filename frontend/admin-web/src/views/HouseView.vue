<template>
  <div class="house-page">
    <div class="page-header">
      <div>
        <h1>房屋管理</h1>
        <p>按楼栋管理房间信息、图片、租金、租期、状态和当前租客。</p>
      </div>

      <el-button type="primary" @click="openCreateDialog">
        新增房间
      </el-button>
    </div>

    <!-- 楼栋切换 -->
    <el-card class="building-card">
      <div class="building-list">
        <div
          v-for="building in buildingStats"
          :key="building.id"
          class="building-item"
          :class="{ active: selectedBuildingId === building.id }"
          @click="selectedBuildingId = building.id"
        >
          <div class="building-name">
            {{ building.name }}
          </div>

          <div class="building-count">
            共 {{ building.roomCount }} 间房
          </div>
        </div>
      </div>
    </el-card>

    <!-- 房间列表 -->
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>房间列表</span>

          <el-tag type="info">
            当前楼栋共 {{ currentRoomList.length }} 间房
          </el-tag>
        </div>
      </template>

      <el-table
        :data="currentRoomList"
        v-loading="tableLoading"
        border
        style="width: 100%"
      >
        <el-table-column
          prop="room_number"
          label="房间号"
          width="100"
        />

        <el-table-column
          label="封面图"
          width="120"
        >
          <template #default="{ row }">
            <div class="cover-cell">
              <img
                v-if="getCoverImage(row)"
                :src="getCoverImage(row)"
                alt="房间图片"
              />

              <span v-else>
                暂无图片
              </span>
            </div>
          </template>
        </el-table-column>

        <el-table-column
          prop="floor"
          label="楼层"
          width="90"
        >
          <template #default="{ row }">
            {{ row.floor }}层
          </template>
        </el-table-column>

        <el-table-column
          prop="room_type"
          label="房型"
          width="120"
        />

        <el-table-column
          prop="area"
          label="面积"
          width="100"
        >
          <template #default="{ row }">
            {{ row.area }}㎡
          </template>
        </el-table-column>

        <el-table-column
          prop="monthly_rent"
          label="月租金"
          width="120"
        >
          <template #default="{ row }">
            ¥{{ row.monthly_rent }}
          </template>
        </el-table-column>

        <el-table-column
          prop="deposit"
          label="押金"
          width="120"
        >
          <template #default="{ row }">
            ¥{{ row.deposit }}
          </template>
        </el-table-column>

        <el-table-column
          label="状态"
          width="110"
        >
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column
          label="租期"
          min-width="210"
        >
          <template #default="{ row }">
            <span v-if="row.lease_start && row.lease_end">
              {{ row.lease_start }} ~ {{ row.lease_end }}
            </span>

            <span v-else class="muted-text">
              暂无租期
            </span>
          </template>
        </el-table-column>

        <el-table-column
          label="当前租客"
          width="120"
        >
          <template #default="{ row }">
            {{ row.tenant_name || '无' }}
          </template>
        </el-table-column>

        <el-table-column
          label="操作"
          width="170"
          fixed="right"
        >
          <template #default="{ row }">
            <el-button
              size="small"
              @click="openEditDialog(row)"
            >
              编辑
            </el-button>

            <el-button
              size="small"
              type="danger"
              @click="deleteRoom(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增 / 编辑房间弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      class="house-dialog"
      :title="dialogMode === 'create' ? '新增房间' : '编辑房间'"
      width="980px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="roomForm"
        :rules="rules"
        label-width="100px"
      >
        <div class="dialog-content">
          <!-- 左侧字段 -->
          <div class="form-left">
            <el-form-item label="所属楼栋" prop="building_id">
              <el-select
                v-model="roomForm.building_id"
                placeholder="请选择所属楼栋"
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

            <el-form-item label="房间号" prop="room_number">
              <el-input
                v-model="roomForm.room_number"
                placeholder="例如：201，系统会自动判断为2层"
                @input="handleRoomNumberInput"
              />
            </el-form-item>

            <el-form-item label="楼层">
              <el-input
                v-model="roomForm.floor"
                disabled
                placeholder="根据房间号自动生成"
              />
            </el-form-item>

            <el-form-item label="房型" prop="room_type">
              <el-select
                v-model="roomForm.room_type"
                placeholder="请选择房型"
                style="width: 100%"
              >
                <el-option label="单身公寓" value="单身公寓" />
                <el-option label="一室一厅" value="一室一厅" />
                <el-option label="两室一厅" value="两室一厅" />
                <el-option label="活动室" value="活动室" />
              </el-select>
            </el-form-item>

            <el-form-item label="面积">
              <el-input
                v-model="roomForm.area"
                placeholder="例如：25"
              >
                <template #append>
                  ㎡
                </template>
              </el-input>
            </el-form-item>

            <el-form-item label="月租金" prop="monthly_rent">
              <el-input
                v-model="roomForm.monthly_rent"
                placeholder="例如：6500"
              >
                <template #prepend>
                  ¥
                </template>
              </el-input>
            </el-form-item>

            <el-form-item label="押金" prop="deposit">
              <el-input
                v-model="roomForm.deposit"
                placeholder="例如：6500"
              >
                <template #prepend>
                  ¥
                </template>
              </el-input>
            </el-form-item>

            <el-form-item label="状态" prop="status">
              <el-select
                v-model="roomForm.status"
                placeholder="请选择状态"
                style="width: 100%"
              >
                <el-option label="可出租" value="可出租" />
                <el-option label="已出租" value="已出租" />
                <el-option label="维修中" value="维修中" />
              </el-select>
            </el-form-item>

            <el-form-item label="租期开始">
              <el-date-picker
                v-model="roomForm.lease_start"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="选择开始日期"
                style="width: 100%"
              />
            </el-form-item>

            <el-form-item label="租期结束">
              <el-date-picker
                v-model="roomForm.lease_end"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="选择结束日期"
                style="width: 100%"
              />
            </el-form-item>

            <el-form-item label="当前租客">
              <el-input
                v-model="roomForm.tenant_name"
                disabled
                placeholder="由租客管理自动关联"
              />
            </el-form-item>

            <el-form-item label="房间说明">
              <el-input
                v-model="roomForm.description"
                type="textarea"
                :rows="3"
                placeholder="请输入房间介绍，可用于游客端展示"
              />
            </el-form-item>
          </div>

          <!-- 右侧图片 -->
          <div class="form-right">
            <div class="image-title">
              房间图片
            </div>

            <el-upload
              class="room-image-uploader"
              drag
              multiple
              accept="image/*"
              :show-file-list="false"
              :disabled="uploadLoading || roomForm.images.length >= 6"
              :http-request="uploadRoomImage"
            >
              <div class="upload-icon">+</div>
              <div class="upload-text">
                点击选择图片，或拖拽到这里上传
              </div>
              <div class="upload-hint">
                支持 JPG / PNG / WebP / GIF，单张不超过 8MB
              </div>
            </el-upload>

            <div class="image-url-list">
              <div
                v-for="(image, index) in roomForm.images"
                :key="index"
                class="image-url-item"
              >
                <el-input
                  v-model="roomForm.images[index]"
                  placeholder="请输入图片 URL"
                  clearable
                />

                <el-button
                  type="danger"
                  plain
                  @click="removeImageUrl(index)"
                >
                  删除
                </el-button>
              </div>

              <el-button
                v-if="roomForm.images.length < 6"
                class="add-image-button"
                @click="addImageUrl"
              >
                添加图片地址
              </el-button>
            </div>

            <div class="image-tip">
              最多保存 6 张图片，第一张默认为游客端封面图。也可以继续手动添加图片地址。
            </div>

            <div
              v-if="roomForm.images.length > 0"
              class="preview-section"
            >
              <div class="preview-title">
                当前图片预览
              </div>

              <div class="preview-list">
                <div
                  v-for="(image, index) in roomForm.images"
                  :key="index"
                  class="preview-item"
                >
                  <img :src="image" alt="房间图片" />

                  <div
                    v-if="index === 0"
                    class="cover-label"
                  >
                    封面
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">
          取消
        </el-button>

        <el-button type="primary" :loading="submitLoading" @click="submitRoom">
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

const dialogVisible = ref(false)
const dialogMode = ref('create')
const formRef = ref(null)

const buildingList = ref([])
const roomList = ref([])
const selectedBuildingId = ref(null)
const tableLoading = ref(false)
const submitLoading = ref(false)
const uploadLoading = ref(false)

const roomForm = reactive({
  id: null,
  building_id: '',
  building_name: '',
  room_number: '',
  floor: '',
  room_type: '',
  area: '',
  monthly_rent: '',
  deposit: '',
  status: '',
  lease_start: '',
  lease_end: '',
  tenant_name: '',
  description: '',
  images: [],
})

const rules = {
  building_id: [
    { required: true, message: '请选择所属楼栋', trigger: 'change' },
  ],
  room_number: [
    { required: true, message: '请输入房间号', trigger: 'blur' },
  ],
  room_type: [
    { required: true, message: '请选择房型', trigger: 'change' },
  ],
  monthly_rent: [
    { required: true, message: '请输入月租金', trigger: 'blur' },
  ],
  deposit: [
    { required: true, message: '请输入押金', trigger: 'blur' },
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' },
  ],
}

const buildingStats = computed(() => {
  return buildingList.value.map((building) => {
    const roomCount = roomList.value.filter((room) => {
      return Number(room.building_id) === Number(building.id)
    }).length

    return {
      ...building,
      roomCount,
    }
  })
})

const currentRoomList = computed(() => {
  if (!selectedBuildingId.value) {
    return roomList.value
  }

  return roomList.value.filter((room) => {
    return Number(room.building_id) === Number(selectedBuildingId.value)
  })
})

const getBuildingList = async () => {
  try {
    const res = await request.get('/buildings')

    if (res.code === 200) {
      buildingList.value = res.data

      if (buildingList.value.length > 0 && !selectedBuildingId.value) {
        selectedBuildingId.value = buildingList.value[0].id
      }
    }
  } catch (error) {
    console.error('获取楼栋列表失败：', error)
    ElMessage.error('获取楼栋列表失败，请确认后端是否启动')
  }
}

const getRoomList = async () => {
  tableLoading.value = true

  try {
    const res = await request.get('/rooms')

    if (res.code === 200) {
      roomList.value = res.data.map((room) => {
        return {
          ...room,
          images: room.images || [],
        }
      })

      if (buildingList.value.length === 0) {
        createBuildingListFromRooms()
      }
    }
  } catch (error) {
    console.error('获取房间列表失败：', error)
    ElMessage.error('获取房间列表失败，请确认后端是否启动')
  } finally {
    tableLoading.value = false
  }
}

const createBuildingListFromRooms = () => {
  const map = new Map()

  roomList.value.forEach((room) => {
    if (!map.has(room.building_id)) {
      map.set(room.building_id, {
        id: room.building_id,
        name: room.building_name,
      })
    }
  })

  buildingList.value = Array.from(map.values())

  if (buildingList.value.length > 0 && !selectedBuildingId.value) {
    selectedBuildingId.value = buildingList.value[0].id
  }
}

onMounted(async () => {
  await getBuildingList()
  await getRoomList()
})

const resetForm = () => {
  roomForm.id = null
  roomForm.building_id = selectedBuildingId.value || ''
  roomForm.building_name = ''
  roomForm.room_number = ''
  roomForm.floor = ''
  roomForm.room_type = ''
  roomForm.area = ''
  roomForm.monthly_rent = ''
  roomForm.deposit = ''
  roomForm.status = '可出租'
  roomForm.lease_start = ''
  roomForm.lease_end = ''
  roomForm.tenant_name = ''
  roomForm.description = ''
  roomForm.images = []

  if (formRef.value) {
    formRef.value.clearValidate()
  }
}

const openCreateDialog = () => {
  dialogMode.value = 'create'
  resetForm()
  dialogVisible.value = true
}

const openEditDialog = (row) => {
  dialogMode.value = 'edit'

  roomForm.id = row.id
  roomForm.building_id = row.building_id
  roomForm.building_name = row.building_name
  roomForm.room_number = row.room_number
  roomForm.floor = row.floor
  roomForm.room_type = row.room_type
  roomForm.area = row.area
  roomForm.monthly_rent = row.monthly_rent
  roomForm.deposit = row.deposit
  roomForm.status = row.status
  roomForm.lease_start = formatDate(row.lease_start)
  roomForm.lease_end = formatDate(row.lease_end)
  roomForm.tenant_name = row.tenant_name || ''
  roomForm.description = row.description || ''
  roomForm.images = row.images ? [...row.images] : []

  dialogVisible.value = true
}

const submitRoom = async () => {
  if (!formRef.value) {
    return
  }

  await formRef.value.validate(async (valid) => {
    if (!valid) {
      return
    }

    const building = buildingList.value.find((item) => {
      return Number(item.id) === Number(roomForm.building_id)
    })

    const roomData = {
      id: roomForm.id || Date.now(),
      building_id: roomForm.building_id,
      building_name: building ? building.name : '',
      room_number: roomForm.room_number,
      floor: Number(roomForm.floor),
      room_type: roomForm.room_type,
      area: Number(roomForm.area || 0),
      monthly_rent: Number(roomForm.monthly_rent || 0),
      deposit: Number(roomForm.deposit || 0),
      status: roomForm.status,
      lease_start: roomForm.lease_start || null,
      lease_end: roomForm.lease_end || null,
      description: roomForm.description,
      images: roomForm.images.map((image) => image.trim()).filter(Boolean),
    }

    try {
      submitLoading.value = true

      if (dialogMode.value === 'create') {
        const res = await request.post('/rooms', roomData)

        if (res.code === 200) {
          ElMessage.success('新增房间成功')
        }
      } else {
        const res = await request.put(`/rooms/${roomForm.id}`, roomData)

        if (res.code === 200) {
          ElMessage.success('编辑房间成功')
        }
      }

      selectedBuildingId.value = roomData.building_id
      dialogVisible.value = false
      await getRoomList()
    } catch (error) {
      console.error('保存房间失败：', error)

      const message = error.response?.data?.message || '保存房间失败'
      ElMessage.error(message)
    } finally {
      submitLoading.value = false
    }
  })
}

const deleteRoom = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除 ${row.room_number} 房间吗？`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
      },
    )

    const res = await request.delete(`/rooms/${row.id}`)

    if (res.code === 200) {
      ElMessage.success('删除成功')
      await getRoomList()
    }
  } catch (error) {
    if (error === 'cancel') {
      ElMessage.info('已取消删除')
      return
    }

    console.error('删除房间失败：', error)

    const message = error.response?.data?.message || '删除房间失败'
    ElMessage.error(message)
  }
}

const handleRoomNumberInput = (value) => {
  roomForm.floor = getFloorByRoomNumber(value)
}

const getFloorByRoomNumber = (roomNumber) => {
  if (!roomNumber) {
    return ''
  }

  const firstNumber = String(roomNumber).match(/\d/)

  if (!firstNumber) {
    return ''
  }

  return Number(firstNumber[0])
}

const addImageUrl = () => {
  if (roomForm.images.length >= 6) {
    return
  }

  roomForm.images.push('')
}

const removeImageUrl = (index) => {
  roomForm.images.splice(index, 1)
}

const fileToDataUrl = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('读取图片失败'))
    reader.readAsDataURL(file)
  })
}

const uploadRoomImage = async (options) => {
  const { file, onSuccess, onError } = options

  if (roomForm.images.length >= 6) {
    ElMessage.warning('最多保存 6 张房间图片')
    onError?.(new Error('最多保存 6 张房间图片'))
    return
  }

  if (!file.type.startsWith('image/')) {
    ElMessage.warning('请选择图片文件')
    onError?.(new Error('请选择图片文件'))
    return
  }

  if (file.size > 8 * 1024 * 1024) {
    ElMessage.warning('单张图片不能超过 8MB')
    onError?.(new Error('单张图片不能超过 8MB'))
    return
  }

  uploadLoading.value = true

  try {
    const dataUrl = await fileToDataUrl(file)
    const res = await request.post('/uploads/room-images', {
      fileName: file.name,
      dataUrl,
    }, {
      timeout: 30000,
    })

    if (res.code === 200 && res.data?.url) {
      roomForm.images.push(res.data.url)
      ElMessage.success('图片上传成功')
      onSuccess?.(res)
    } else {
      throw new Error(res.message || '图片上传失败')
    }
  } catch (error) {
    ElMessage.error(error.message || '图片上传失败')
    onError?.(error)
  } finally {
    uploadLoading.value = false
  }
}

const getCoverImage = (row) => {
  if (row.images && row.images.length > 0) {
    return row.images[0]
  }

  if (row.cover_image) {
    return row.cover_image
  }

  return ''
}

const getStatusType = (status) => {
  if (status === '已出租') {
    return 'success'
  }

  if (status === '维修中') {
    return 'warning'
  }

  if (status === '可出租') {
    return 'info'
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
.house-page {
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

.building-card {
  border-radius: 12px;
}

.building-list {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.building-item {
  width: 220px;
  padding: 20px 22px;

  border: 1px solid #dcdfe6;
  border-radius: 10px;

  cursor: pointer;
  transition: all 0.2s;
  background: #ffffff;
}

.building-item:hover {
  border-color: #409eff;
  box-shadow: 0 8px 20px rgba(64, 158, 255, 0.12);
}

.building-item.active {
  border-color: #409eff;
  background: #ecf5ff;
  box-shadow: 0 8px 20px rgba(64, 158, 255, 0.18);
}

.building-name {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 12px;
}

.building-item.active .building-name {
  color: #409eff;
}

.building-count {
  color: #909399;
  font-size: 14px;
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

/* 表格图片 */
.cover-cell {
  width: 72px;
  height: 54px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 6px;
  overflow: hidden;

  background: #f5f7fa;
  color: #909399;
  font-size: 12px;
}

.cover-cell img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.muted-text {
  color: #909399;
}

/* 弹窗 */
.house-dialog :deep(.el-dialog) {
  border-radius: 12px;
}

.house-dialog :deep(.el-dialog__body) {
  max-height: none;
  overflow: visible;
}

.dialog-content {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 30px;
}

.form-left {
  min-width: 0;
}

.form-right {
  padding-left: 24px;
  border-left: 1px solid #ebeef5;
}

.image-title {
  margin-bottom: 14px;

  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

.room-image-uploader {
  margin-bottom: 14px;
}

.room-image-uploader :deep(.el-upload) {
  width: 100%;
}

.room-image-uploader :deep(.el-upload-dragger) {
  width: 100%;
  padding: 20px 12px;
  border-radius: 12px;
  background: #fff8ec;
  border-color: #ffc61a;
}

.room-image-uploader :deep(.el-upload-dragger:hover) {
  border-color: #ff7b5f;
}

.upload-icon {
  width: 34px;
  height: 34px;
  margin: 0 auto 8px;
  border-radius: 50%;
  background: #ff7b5f;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: bold;
}

.upload-text {
  color: #303133;
  font-weight: 700;
}

.upload-hint {
  margin-top: 6px;
  color: #909399;
  font-size: 12px;
}

.image-url-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.image-url-item {
  display: grid;
  grid-template-columns: 1fr 72px;
  gap: 8px;
}

.add-image-button {
  align-self: flex-start;
}

.image-tip {
  margin-top: 12px;
  color: #909399;
  font-size: 13px;
  line-height: 1.6;
}

.preview-section {
  margin-top: 20px;
}

.preview-title {
  margin-bottom: 12px;
  color: #606266;
  font-weight: bold;
}

.preview-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.preview-item {
  position: relative;

  width: 96px;
  height: 72px;

  border-radius: 8px;
  overflow: hidden;

  border: 1px solid #ebeef5;
}

.preview-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-label {
  position: absolute;
  top: 4px;
  left: 4px;

  padding: 2px 6px;
  border-radius: 4px;

  background: rgba(64, 158, 255, 0.9);
  color: #ffffff;

  font-size: 12px;
}

@media (max-width: 1100px) {
  .dialog-content {
    grid-template-columns: 1fr;
  }

  .form-right {
    padding-left: 0;
    border-left: none;
  }
}
</style>
