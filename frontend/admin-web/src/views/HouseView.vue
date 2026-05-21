<template>
  <div class="house-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <div>
        <h1>房屋管理</h1>
        <p>按楼栋管理房间信息、图片、租金、租期、状态和当前租客。</p>
      </div>

      <el-button type="primary" @click="openAddDialog">
        新增房间
      </el-button>
    </div>

    <!-- 楼栋切换 -->
    <el-card class="building-card">
      <div class="building-switch">
        <div
          v-for="building in buildingList"
          :key="building.id"
          class="building-tab"
          :class="{ active: currentBuilding === building.id }"
          @click="currentBuilding = building.id"
        >
          <div class="building-name">
            {{ building.name }}
          </div>

          <div class="building-count">
            共 {{ getRoomCount(building.id) }} 间房
          </div>
        </div>
      </div>
    </el-card>

    <!-- 房间列表 -->
    <el-card class="table-card">
      <el-table
        :data="filteredHouseList"
        border
        style="width: 100%"
      >
        <el-table-column prop="roomNumber" label="房间号" width="100" />

        <el-table-column label="封面图" width="120">
          <template #default="scope">
            <el-image
              v-if="scope.row.images && scope.row.images.length > 0"
              class="cover-image"
              :src="scope.row.images[0]"
              fit="cover"
              :preview-src-list="scope.row.images"
              preview-teleported
            />

            <span v-else class="empty-text">
              暂无图片
            </span>
          </template>
        </el-table-column>

        <el-table-column prop="floor" label="楼层" width="90">
          <template #default="scope">
            {{ scope.row.floor }}层
          </template>
        </el-table-column>

        <el-table-column prop="roomType" label="房型" width="130" />

        <el-table-column prop="area" label="面积" width="90">
          <template #default="scope">
            {{ scope.row.area }}㎡
          </template>
        </el-table-column>

        <el-table-column prop="rent" label="月租金" width="110">
          <template #default="scope">
            ¥{{ scope.row.rent }}
          </template>
        </el-table-column>

        <el-table-column prop="deposit" label="押金" width="110">
          <template #default="scope">
            ¥{{ scope.row.deposit }}
          </template>
        </el-table-column>

        <el-table-column prop="status" label="状态" width="110">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="租期" min-width="220">
          <template #default="scope">
            <span v-if="scope.row.leaseStart && scope.row.leaseEnd">
              {{ scope.row.leaseStart }} ～ {{ scope.row.leaseEnd }}
            </span>

            <span v-else class="empty-text">
              无
            </span>
          </template>
        </el-table-column>

        <el-table-column prop="tenant" label="当前租客" width="120" />

        <el-table-column label="操作" width="180">
          <template #default="scope">
            <el-button size="small" @click="openEditDialog(scope.row)">
              编辑
            </el-button>

            <el-button
              size="small"
              type="danger"
              @click="deleteHouse(scope.row.id)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增 / 编辑弹窗 -->
    <!-- 新增 / 编辑弹窗 -->
<el-dialog
  v-model="dialogVisible"
  :title="isEdit ? '编辑房间' : '新增房间'"
  width="980px"
  top="5vh"
  class="house-dialog"
>
  <el-form label-width="90px">
    <div class="form-layout">
      <!-- 左侧：房间基础信息 -->
      <div class="form-left">
        <el-form-item label="所属楼栋" required>
          <el-select v-model="form.buildingId" style="width: 100%">
            <el-option
              v-for="building in buildingList"
              :key="building.id"
              :label="building.name"
              :value="building.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="房间号" required>
          <el-input
            v-model="form.roomNumber"
            placeholder="例如：201，系统会自动判断为2层"
          />
        </el-form-item>

        <el-form-item label="房型" required>
          <el-select
            v-model="form.roomType"
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
          <el-input v-model="form.area" placeholder="例如：25" />
        </el-form-item>

        <el-form-item label="月租金" required>
          <el-input v-model="form.rent" placeholder="例如：6500" />
        </el-form-item>

        <el-form-item label="押金" required>
          <el-input v-model="form.deposit" placeholder="例如：6500" />
        </el-form-item>

        <el-form-item label="状态" required>
          <el-select
            v-model="form.status"
            placeholder="请选择状态"
            style="width: 100%"
          >
            <el-option label="空置" value="空置" />
            <el-option label="已出租" value="已出租" />
            <el-option label="维修中" value="维修中" />
          </el-select>
        </el-form-item>

        <el-form-item label="租期开始">
          <el-date-picker
            v-model="form.leaseStart"
            type="date"
            placeholder="选择开始日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="租期结束">
          <el-date-picker
            v-model="form.leaseEnd"
            type="date"
            placeholder="选择结束日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="当前租客">
          <el-input v-model="form.tenant" placeholder="没有租客可填写：无" />
        </el-form-item>
      </div>

      <!-- 右侧：房屋图片 -->
      <div class="form-right">
        <div class="image-title">
          房屋图片
        </div>

        <el-upload
          v-model:file-list="form.imageFileList"
          list-type="picture-card"
          :auto-upload="false"
          :limit="6"
          :on-change="handleImageChange"
          :on-remove="handleImageRemove"
          :on-preview="handlePicturePreview"
        >
          <div class="upload-plus">+</div>
        </el-upload>

        <div class="upload-tip">
          最多上传 6 张图片。第一张图片将作为游客端房源封面图。
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

    <!-- 图片预览弹窗 -->
    <el-dialog
      v-model="previewVisible"
      title="图片预览"
      width="600px"
    >
      <img :src="previewImageUrl" class="preview-image" />
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 楼栋列表
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

// 当前选中的楼栋
const currentBuilding = ref('building-1')

// 根据房间号自动判断楼层
// 例如：101 -> 1层，201 -> 2层，305 -> 3层
const getFloorByRoomNumber = (roomNumber) => {
  if (!roomNumber) {
    return ''
  }

  return String(roomNumber).charAt(0)
}

// 房间列表：现在先用前端假数据，后面再连接数据库
const houseList = ref([
  {
    id: 1,
    buildingId: 'building-1',
    roomNumber: '101',
    floor: getFloorByRoomNumber('101'),
    roomType: '一室一厅',
    area: 25,
    rent: 6500,
    deposit: 6500,
    status: '已出租',
    tenant: '张三',
    leaseStart: '2026-04-01',
    leaseEnd: '2027-03-31',
    images: [],
  },
  {
    id: 2,
    buildingId: 'building-1',
    roomNumber: '102',
    floor: getFloorByRoomNumber('102'),
    roomType: '单身公寓',
    area: 28,
    rent: 7000,
    deposit: 7000,
    status: '空置',
    tenant: '无',
    leaseStart: '',
    leaseEnd: '',
    images: [],
  },
  {
    id: 3,
    buildingId: 'building-2',
    roomNumber: '201',
    floor: getFloorByRoomNumber('201'),
    roomType: '两室一厅',
    area: 40,
    rent: 8500,
    deposit: 8500,
    status: '维修中',
    tenant: '无',
    leaseStart: '',
    leaseEnd: '',
    images: [],
  },
])

// 根据当前楼栋筛选房间
const filteredHouseList = computed(() => {
  return houseList.value.filter((item) => item.buildingId === currentBuilding.value)
})

// 统计每栋楼的房间数量
const getRoomCount = (buildingId) => {
  return houseList.value.filter((item) => item.buildingId === buildingId).length
}

// 弹窗状态
const dialogVisible = ref(false)
const isEdit = ref(false)

// 图片预览
const previewVisible = ref(false)
const previewImageUrl = ref('')

// 表单数据
const form = reactive({
  id: null,
  buildingId: '',
  roomNumber: '',
  roomType: '',
  area: '',
  rent: '',
  deposit: '',
  status: '',
  tenant: '',
  leaseStart: '',
  leaseEnd: '',
  imageFileList: [],
})

// 重置表单
const resetForm = () => {
  form.id = null
  form.buildingId = currentBuilding.value
  form.roomNumber = ''
  form.roomType = ''
  form.area = ''
  form.rent = ''
  form.deposit = ''
  form.status = ''
  form.tenant = ''
  form.leaseStart = ''
  form.leaseEnd = ''
  form.imageFileList = []
}

// 打开新增弹窗
const openAddDialog = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

// 打开编辑弹窗
const openEditDialog = (row) => {
  isEdit.value = true

  form.id = row.id
  form.buildingId = row.buildingId
  form.roomNumber = row.roomNumber
  form.roomType = row.roomType
  form.area = row.area
  form.rent = row.rent
  form.deposit = row.deposit
  form.status = row.status
  form.tenant = row.tenant
  form.leaseStart = row.leaseStart
  form.leaseEnd = row.leaseEnd

  form.imageFileList = (row.images || []).map((url, index) => {
    return {
      name: `房屋图片${index + 1}`,
      url,
    }
  })

  dialogVisible.value = true
}

// 图片选择变化
const handleImageChange = (uploadFile, uploadFiles) => {
  uploadFiles.forEach((file) => {
    if (file.raw && !file.url) {
      file.url = URL.createObjectURL(file.raw)
    }
  })

  form.imageFileList = uploadFiles
}

// 图片删除
const handleImageRemove = (uploadFile, uploadFiles) => {
  form.imageFileList = uploadFiles
}

// 图片预览
const handlePicturePreview = (file) => {
  previewImageUrl.value = file.url
  previewVisible.value = true
}

// 提交表单
const submitForm = () => {
  if (
  !form.buildingId ||
  !form.roomNumber ||
  !form.roomType ||
  !form.rent ||
  !form.deposit ||
  !form.status
) {
  ElMessage.warning('请填写必填项：所属楼栋、房间号、房型、月租金、押金和状态')
  return
}

  const imageUrls = form.imageFileList
    .map((file) => file.url)
    .filter((url) => !!url)

  if (isEdit.value) {
    const index = houseList.value.findIndex((item) => item.id === form.id)

    if (index !== -1) {
      houseList.value[index] = {
        id: form.id,
        buildingId: form.buildingId,
        roomNumber: form.roomNumber,
        floor: getFloorByRoomNumber(form.roomNumber),
        roomType: form.roomType,
        area: form.area,
        rent: form.rent,
        deposit: form.deposit,
        status: form.status,
        tenant: form.tenant || '无',
        leaseStart: form.leaseStart,
        leaseEnd: form.leaseEnd,
        images: imageUrls,
      }
    }

    ElMessage.success('房间信息修改成功')
  } else {
    houseList.value.push({
      id: Date.now(),
      buildingId: form.buildingId,
      roomNumber: form.roomNumber,
      floor: getFloorByRoomNumber(form.roomNumber),
      roomType: form.roomType,
      area: form.area,
      rent: form.rent,
      deposit: form.deposit,
      status: form.status,
      tenant: form.tenant || '无',
      leaseStart: form.leaseStart,
      leaseEnd: form.leaseEnd,
      images: imageUrls,
    })

    ElMessage.success('新增房间成功')
  }

  dialogVisible.value = false
}

// 删除房间
const deleteHouse = (id) => {
  ElMessageBox.confirm('确定要删除这个房间吗？', '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      houseList.value = houseList.value.filter((item) => item.id !== id)
      ElMessage.success('删除成功')
    })
    .catch(() => {
      ElMessage.info('已取消删除')
    })
}

// 状态标签颜色
const getStatusType = (status) => {
  if (status === '已出租') {
    return 'success'
  }

  if (status === '空置') {
    return 'info'
  }

  if (status === '维修中') {
    return 'warning'
  }

  return ''
}
</script>

<style scoped>
.house-page {
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

.building-card {
  margin-bottom: 20px;
  border-radius: 8px;
}

.building-switch {
  display: flex;
  gap: 16px;
}

.building-tab {
  width: 220px;
  padding: 18px 20px;

  border: 1px solid #dcdfe6;
  border-radius: 10px;

  background: #ffffff;

  cursor: pointer;

  transition: all 0.2s;
}

.building-tab:hover {
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
}

.building-tab.active {
  background: #ecf5ff;
  border-color: #409eff;
  box-shadow: 0 4px 14px rgba(64, 158, 255, 0.25);
}

.building-name {
  font-size: 18px;
  font-weight: bold;
  color: #303133;

  margin-bottom: 8px;
}

.building-tab.active .building-name {
  color: #409eff;
}

.building-count {
  font-size: 14px;
  color: #909399;
}

.table-card {
  border-radius: 8px;
}

.cover-image {
  width: 70px;
  height: 50px;
  border-radius: 6px;
  border: 1px solid #dcdfe6;
}

.empty-text {
  color: #999;
}

.upload-plus {
  font-size: 28px;
  color: #8c939d;
}

.upload-tip {
  margin-top: 8px;
  color: #909399;
  font-size: 13px;
}

.preview-image {
  width: 100%;
  border-radius: 8px;
}
.form-layout {
  display: flex;
  gap: 32px;
}

.form-left {
  width: 540px;
}

.form-right {
  flex: 1;

  padding: 18px;

  border: 1px dashed #dcdfe6;
  border-radius: 10px;

  background: #fafafa;
}

.image-title {
  font-size: 16px;
  font-weight: bold;

  margin-bottom: 16px;

  color: #303133;
}

.house-dialog :deep(.el-dialog__body) {
  padding-top: 10px;
  padding-bottom: 10px;
}

.house-dialog :deep(.el-form-item) {
  margin-bottom: 14px;
}

.house-dialog :deep(.el-upload--picture-card) {
  width: 120px;
  height: 120px;
}

.house-dialog :deep(.el-upload-list--picture-card .el-upload-list__item) {
  width: 120px;
  height: 120px;
}
</style>