<template>
  <div class="tenant-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <div>
        <h1>租客管理</h1>
        <p>管理租客基本信息、入住房间、联系方式和租期状态。</p>
      </div>

      <el-button type="primary" @click="openAddDialog">
        新增租客
      </el-button>
    </div>

    <!-- 搜索筛选区 -->
    <el-card class="filter-card">
      <el-form inline>
        <el-form-item label="关键词">
          <el-input
            v-model="searchKeyword"
            placeholder="请输入姓名或手机号"
            clearable
            style="width: 220px"
          />
        </el-form-item>

        <el-form-item label="楼栋">
          <el-select
            v-model="buildingFilter"
            placeholder="请选择楼栋"
            clearable
            style="width: 180px"
          >
            <el-option
              v-for="building in buildingList"
              :key="building.id"
              :label="building.name"
              :value="building.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="状态">
          <el-select
            v-model="statusFilter"
            placeholder="请选择状态"
            clearable
            style="width: 160px"
          >
            <el-option label="在租" value="在租" />
            <el-option label="即将到期" value="即将到期" />
            <el-option label="已退租" value="已退租" />
          </el-select>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 租客列表 -->
    <el-card class="table-card">
      <el-table :data="filteredTenantList" border style="width: 100%">
        <el-table-column prop="name" label="姓名" width="120" />

        <el-table-column prop="phone" label="手机号" width="150" />

        <el-table-column prop="buildingName" label="所属楼栋" width="160" />

        <el-table-column prop="roomNumber" label="房间号" width="100" />

        <el-table-column label="租期" min-width="220">
          <template #default="scope">
            {{ scope.row.leaseStart }} ～ {{ scope.row.leaseEnd }}
          </template>
        </el-table-column>

        <el-table-column prop="emergencyContact" label="紧急联系人" width="140" />

        <el-table-column prop="emergencyPhone" label="紧急联系电话" width="160" />

        <el-table-column prop="status" label="状态" width="120">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="180">
          <template #default="scope">
            <el-button size="small" @click="openEditDialog(scope.row)">
              编辑
            </el-button>

            <el-button
              size="small"
              type="danger"
              @click="deleteTenant(scope.row.id)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增 / 编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑租客' : '新增租客'"
      width="760px"
      top="8vh"
    >
      <el-form label-width="110px">
        <div class="form-layout">
          <!-- 左侧：租客基本信息 -->
          <div class="form-column">
            <el-form-item label="姓名" required>
              <el-input v-model="form.name" placeholder="请输入租客姓名" />
            </el-form-item>

            <el-form-item label="手机号" required>
              <el-input v-model="form.phone" placeholder="请输入手机号" />
            </el-form-item>

            <el-form-item label="证件号"required>
              <el-input v-model="form.idCard" placeholder="请输入身份证/证件号" />
            </el-form-item>

            <el-form-item label="紧急联系人">
              <el-input v-model="form.emergencyContact" placeholder="请输入紧急联系人" />
            </el-form-item>

            <el-form-item label="紧急电话">
              <el-input v-model="form.emergencyPhone" placeholder="请输入紧急联系电话" />
            </el-form-item>
          </div>

          <!-- 右侧：入住信息 -->
          <div class="form-column">
            <el-form-item label="所属楼栋" required>
              <el-select
                v-model="form.buildingId"
                placeholder="请选择楼栋"
                style="width: 100%"
                @change="handleBuildingChange"
              >
                <el-option
                  v-for="building in buildingList"
                  :key="building.id"
                  :label="building.name"
                  :value="building.id"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="房间号" required>
              <el-select
                v-model="form.roomNumber"
                placeholder="请选择房间"
                style="width: 100%"
              >
                <el-option
                  v-for="room in availableRoomList"
                  :key="room.roomNumber"
                  :label="room.roomNumber"
                  :value="room.roomNumber"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="租期开始" required>
              <el-date-picker
                v-model="form.leaseStart"
                type="date"
                placeholder="选择开始日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>

            <el-form-item label="租期结束" required>
              <el-date-picker
                v-model="form.leaseEnd"
                type="date"
                placeholder="选择结束日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>

            <el-form-item label="状态" required>
              <el-select
                v-model="form.status"
                placeholder="请选择状态"
                style="width: 100%"
              >
                <el-option label="在租" value="在租" />
                <el-option label="即将到期" value="即将到期" />
                <el-option label="已退租" value="已退租" />
              </el-select>
            </el-form-item>
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
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 楼栋数据：后面可以和房屋管理共用数据库
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

// 房间数据：现在先写死，后面从房屋管理/后端获取
const roomList = ref([
  {
    buildingId: 'building-1',
    roomNumber: '101',
  },
  {
    buildingId: 'building-1',
    roomNumber: '102',
  },
  {
    buildingId: 'building-2',
    roomNumber: '201',
  },
])

// 租客列表：前端假数据
const tenantList = ref([
  {
    id: 1,
    name: '张三',
    phone: '13800000001',
    idCard: '110101199901010011',
    buildingId: 'building-1',
    buildingName: '紫霞公寓1号楼',
    roomNumber: '101',
    leaseStart: '2026-04-01',
    leaseEnd: '2027-03-31',
    emergencyContact: '李四',
    emergencyPhone: '13900000001',
    status: '在租',
  },
  {
    id: 2,
    name: '王五',
    phone: '13800000002',
    idCard: '110101199902020022',
    buildingId: 'building-2',
    buildingName: '紫霞公寓2号楼',
    roomNumber: '201',
    leaseStart: '2026-05-01',
    leaseEnd: '2027-04-30',
    emergencyContact: '赵六',
    emergencyPhone: '13900000002',
    status: '即将到期',
  },
])

const searchKeyword = ref('')
const buildingFilter = ref('')
const statusFilter = ref('')

const dialogVisible = ref(false)
const isEdit = ref(false)

const form = reactive({
  id: null,
  name: '',
  phone: '',
  idCard: '',
  buildingId: '',
  roomNumber: '',
  leaseStart: '',
  leaseEnd: '',
  emergencyContact: '',
  emergencyPhone: '',
  status: '',
})

// 当前楼栋下的房间
const availableRoomList = computed(() => {
  if (!form.buildingId) {
    return []
  }

  return roomList.value.filter((room) => room.buildingId === form.buildingId)
})

// 搜索筛选后的租客列表
const filteredTenantList = computed(() => {
  return tenantList.value.filter((tenant) => {
    const keywordMatch =
      !searchKeyword.value ||
      tenant.name.includes(searchKeyword.value) ||
      tenant.phone.includes(searchKeyword.value)

    const buildingMatch =
      !buildingFilter.value ||
      tenant.buildingId === buildingFilter.value

    const statusMatch =
      !statusFilter.value ||
      tenant.status === statusFilter.value

    return keywordMatch && buildingMatch && statusMatch
  })
})

const getBuildingName = (buildingId) => {
  const building = buildingList.value.find((item) => item.id === buildingId)
  return building ? building.name : ''
}

const handleBuildingChange = () => {
  form.roomNumber = ''
}

const resetForm = () => {
  form.id = null
  form.name = ''
  form.phone = ''
  form.idCard = ''
  form.buildingId = ''
  form.roomNumber = ''
  form.leaseStart = ''
  form.leaseEnd = ''
  form.emergencyContact = ''
  form.emergencyPhone = ''
  form.status = ''
}

const openAddDialog = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

const openEditDialog = (row) => {
  isEdit.value = true

  form.id = row.id
  form.name = row.name
  form.phone = row.phone
  form.idCard = row.idCard
  form.buildingId = row.buildingId
  form.roomNumber = row.roomNumber
  form.leaseStart = row.leaseStart
  form.leaseEnd = row.leaseEnd
  form.emergencyContact = row.emergencyContact
  form.emergencyPhone = row.emergencyPhone
  form.status = row.status

  dialogVisible.value = true
}

const submitForm = () => {
  if (
    !form.name ||
    !form.phone ||
    !form.buildingId ||
    !form.roomNumber ||
    !form.leaseStart ||
    !form.leaseEnd ||
    !form.status
  ) {
    ElMessage.warning('请填写必填项：姓名、手机号、楼栋、房间、租期和状态')
    return
  }

  if (isEdit.value) {
    const index = tenantList.value.findIndex((item) => item.id === form.id)

    if (index !== -1) {
      tenantList.value[index] = {
        id: form.id,
        name: form.name,
        phone: form.phone,
        idCard: form.idCard,
        buildingId: form.buildingId,
        buildingName: getBuildingName(form.buildingId),
        roomNumber: form.roomNumber,
        leaseStart: form.leaseStart,
        leaseEnd: form.leaseEnd,
        emergencyContact: form.emergencyContact,
        emergencyPhone: form.emergencyPhone,
        status: form.status,
      }
    }

    ElMessage.success('租客信息修改成功')
  } else {
    tenantList.value.push({
      id: Date.now(),
      name: form.name,
      phone: form.phone,
      idCard: form.idCard,
      buildingId: form.buildingId,
      buildingName: getBuildingName(form.buildingId),
      roomNumber: form.roomNumber,
      leaseStart: form.leaseStart,
      leaseEnd: form.leaseEnd,
      emergencyContact: form.emergencyContact,
      emergencyPhone: form.emergencyPhone,
      status: form.status,
    })

    ElMessage.success('新增租客成功')
  }

  dialogVisible.value = false
}

const deleteTenant = (id) => {
  ElMessageBox.confirm('确定要删除这个租客吗？', '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      tenantList.value = tenantList.value.filter((item) => item.id !== id)
      ElMessage.success('删除成功')
    })
    .catch(() => {
      ElMessage.info('已取消删除')
    })
}

const getStatusType = (status) => {
  if (status === '在租') {
    return 'success'
  }

  if (status === '即将到期') {
    return 'warning'
  }

  if (status === '已退租') {
    return 'info'
  }

  return ''
}
</script>

<style scoped>
.tenant-page {
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

.form-column {
  flex: 1;
}
</style>