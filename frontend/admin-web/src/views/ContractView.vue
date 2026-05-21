<template>
  <div class="contract-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <div>
        <h1>合同管理</h1>
        <p>管理租客合同、房间绑定、合同文件、租期、租金和合同状态。</p>
      </div>

      <el-button type="primary" @click="openAddDialog">
        新增合同
      </el-button>
    </div>

    <!-- 搜索筛选区 -->
    <el-card class="filter-card">
      <el-form inline>
        <el-form-item label="关键词">
          <el-input
            v-model="searchKeyword"
            placeholder="租客姓名 / 房间号 / 合同编号"
            clearable
            style="width: 260px"
          />
        </el-form-item>

        <el-form-item label="合同状态">
          <el-select
            v-model="statusFilter"
            placeholder="请选择状态"
            clearable
            style="width: 160px"
          >
            <el-option label="未生效" value="未生效" />
            <el-option label="已生效" value="已生效" />
            <el-option label="已到期" value="已到期" />
            <el-option label="已终止" value="已终止" />
          </el-select>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 合同列表 -->
    <el-card class="table-card">
      <el-table :data="filteredContractList" border style="width: 100%">
        <el-table-column prop="contractNo" label="合同编号" width="160" />

        <el-table-column prop="tenantName" label="租客姓名" width="120" />

        <el-table-column prop="phone" label="手机号" width="150" />

        <el-table-column prop="buildingName" label="所属楼栋" width="160" />

        <el-table-column prop="roomNumber" label="房间号" width="100" />

        <el-table-column label="租期" min-width="220">
          <template #default="scope">
            {{ scope.row.leaseStart }} ～ {{ scope.row.leaseEnd }}
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

        <el-table-column prop="signMethod" label="签约方式" width="140" />

        <el-table-column prop="status" label="合同状态" width="120">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="合同文件" width="140">
          <template #default="scope">
            <el-button
              v-if="scope.row.contractFiles.length > 0"
              size="small"
              @click="previewContract(scope.row)"
            >
              查看文件
            </el-button>

            <span v-else class="empty-text">
              未上传
            </span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="220" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="openEditDialog(scope.row)">
              编辑
            </el-button>

            <el-button
              size="small"
              type="primary"
              @click="exportContract(scope.row)"
            >
              导出
            </el-button>

            <el-button
              size="small"
              type="danger"
              @click="deleteContract(scope.row.id)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增 / 编辑合同弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑合同' : '新增合同'"
      width="980px"
      top="5vh"
      class="contract-dialog"
    >
      <el-form label-width="100px">
        <div class="form-layout">
          <!-- 左侧：合同基础信息 -->
          <div class="form-left">
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

            <el-form-item label="合同编号" required>
              <el-input
                v-model="form.contractNo"
                placeholder="例如：HT20260518001"
              />
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

          <!-- 中间：租期和金额 -->
          <div class="form-middle">
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

            <el-form-item label="月租金" required>
              <el-input v-model="form.rent" placeholder="例如：6500" />
            </el-form-item>

            <el-form-item label="押金" required>
              <el-input v-model="form.deposit" placeholder="例如：6500" />
            </el-form-item>

            <el-form-item label="签约方式" required>
              <el-select
                v-model="form.signMethod"
                placeholder="请选择签约方式"
                style="width: 100%"
              >
                <el-option label="线下签约后上传" value="线下签约后上传" />
                <el-option label="在线签约" value="在线签约" />
              </el-select>
            </el-form-item>

            <el-form-item label="合同状态" required>
              <el-select
                v-model="form.status"
                placeholder="请选择合同状态"
                style="width: 100%"
              >
                <el-option label="未生效" value="未生效" />
                <el-option label="已生效" value="已生效" />
                <el-option label="已到期" value="已到期" />
                <el-option label="已终止" value="已终止" />
              </el-select>
            </el-form-item>
          </div>

          <!-- 右侧：合同文件 -->
          <div class="form-right">
            <div class="file-title">
              合同文件
            </div>

            <el-upload
              v-model:file-list="form.contractFileList"
              :auto-upload="false"
              :limit="3"
              :on-change="handleContractFileChange"
              :on-remove="handleContractFileRemove"
              :on-preview="handleContractFilePreview"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            >
              <el-button type="primary">
                上传合同文件
              </el-button>
            </el-upload>

            <div class="upload-tip">
              可上传 PDF、Word 或合同图片。后续正式版会上传到服务器并保存文件地址。
            </div>

            <el-divider />

            <div class="bind-info">
              <p><strong>绑定关系</strong></p>
              <p>租客：{{ form.tenantName || '未选择' }}</p>
              <p>电话：{{ form.phone || '-' }}</p>
              <p>房间：{{ form.buildingName || '未选择' }} {{ form.roomNumber }}</p>
              <p>租期：{{ form.leaseStart || '-' }} ～ {{ form.leaseEnd || '-' }}</p>
              <p>月租金：{{ form.rent ? `¥${form.rent}` : '-' }}</p>
              <p>押金：{{ form.deposit ? `¥${form.deposit}` : '-' }}</p>
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
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 租客数据：后面从租客管理 / 后端接口获取
const tenantList = ref([
  {
    id: 1,
    name: '张三',
    phone: '13800000001',
    buildingId: 'building-1',
    buildingName: '紫霞公寓1号楼',
    roomNumber: '101',
    leaseStart: '2026-04-01',
    leaseEnd: '2027-03-31',
    rent: 6500,
    deposit: 6500,
  },
  {
    id: 2,
    name: '王五',
    phone: '13800000002',
    buildingId: 'building-2',
    buildingName: '紫霞公寓2号楼',
    roomNumber: '201',
    leaseStart: '2026-05-01',
    leaseEnd: '2027-04-30',
    rent: 8500,
    deposit: 8500,
  },
])

// 合同列表：前端假数据
const contractList = ref([
  {
    id: 1,
    contractNo: 'HT20260401001',
    tenantId: 1,
    tenantName: '张三',
    phone: '13800000001',
    buildingName: '紫霞公寓1号楼',
    roomNumber: '101',
    leaseStart: '2026-04-01',
    leaseEnd: '2027-03-31',
    rent: 6500,
    deposit: 6500,
    signMethod: '线下签约后上传',
    status: '已生效',
    contractFiles: [],
  },
  {
    id: 2,
    contractNo: 'HT20260501001',
    tenantId: 2,
    tenantName: '王五',
    phone: '13800000002',
    buildingName: '紫霞公寓2号楼',
    roomNumber: '201',
    leaseStart: '2026-05-01',
    leaseEnd: '2027-04-30',
    rent: 8500,
    deposit: 8500,
    signMethod: '在线签约',
    status: '未生效',
    contractFiles: [],
  },
])

const searchKeyword = ref('')
const statusFilter = ref('')

const dialogVisible = ref(false)
const isEdit = ref(false)

const form = reactive({
  id: null,
  contractNo: '',
  tenantId: '',
  tenantName: '',
  phone: '',
  buildingName: '',
  roomNumber: '',
  leaseStart: '',
  leaseEnd: '',
  rent: '',
  deposit: '',
  signMethod: '',
  status: '',
  contractFileList: [],
})

// 搜索筛选
const filteredContractList = computed(() => {
  return contractList.value.filter((contract) => {
    const keywordMatch =
      !searchKeyword.value ||
      contract.tenantName.includes(searchKeyword.value) ||
      contract.roomNumber.includes(searchKeyword.value) ||
      contract.contractNo.includes(searchKeyword.value)

    const statusMatch =
      !statusFilter.value ||
      contract.status === statusFilter.value

    return keywordMatch && statusMatch
  })
})

// 自动生成合同编号
const generateContractNo = () => {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const random = Math.floor(Math.random() * 900 + 100)

  return `HT${y}${m}${d}${random}`
}

// 重置表单
const resetForm = () => {
  form.id = null
  form.contractNo = generateContractNo()
  form.tenantId = ''
  form.tenantName = ''
  form.phone = ''
  form.buildingName = ''
  form.roomNumber = ''
  form.leaseStart = ''
  form.leaseEnd = ''
  form.rent = ''
  form.deposit = ''
  form.signMethod = '线下签约后上传'
  form.status = '未生效'
  form.contractFileList = []
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
  form.contractNo = row.contractNo
  form.tenantId = row.tenantId
  form.tenantName = row.tenantName
  form.phone = row.phone
  form.buildingName = row.buildingName
  form.roomNumber = row.roomNumber
  form.leaseStart = row.leaseStart
  form.leaseEnd = row.leaseEnd
  form.rent = row.rent
  form.deposit = row.deposit
  form.signMethod = row.signMethod
  form.status = row.status

  form.contractFileList = (row.contractFiles || []).map((file, index) => {
    return {
      name: file.name || `合同文件${index + 1}`,
      url: file.url,
    }
  })

  dialogVisible.value = true
}

// 选择租客后，自动带出房间和租期信息
const handleTenantChange = (tenantId) => {
  const tenant = tenantList.value.find((item) => item.id === tenantId)

  if (!tenant) {
    return
  }

  form.tenantName = tenant.name
  form.phone = tenant.phone
  form.buildingName = tenant.buildingName
  form.roomNumber = tenant.roomNumber
  form.leaseStart = tenant.leaseStart
  form.leaseEnd = tenant.leaseEnd
  form.rent = tenant.rent
  form.deposit = tenant.deposit
}

// 合同文件选择变化
const handleContractFileChange = (uploadFile, uploadFiles) => {
  uploadFiles.forEach((file) => {
    if (file.raw && !file.url) {
      file.url = URL.createObjectURL(file.raw)
    }
  })

  form.contractFileList = uploadFiles
}

// 删除合同文件
const handleContractFileRemove = (uploadFile, uploadFiles) => {
  form.contractFileList = uploadFiles
}

// 预览合同文件
const handleContractFilePreview = (file) => {
  if (file.url) {
    window.open(file.url, '_blank')
  }
}

// 提交表单
const submitForm = () => {
  if (
    !form.contractNo ||
    !form.tenantId ||
    !form.leaseStart ||
    !form.leaseEnd ||
    !form.rent ||
    !form.deposit ||
    !form.signMethod ||
    !form.status
  ) {
    ElMessage.warning('请填写必填项：合同编号、租客、租期、租金、押金、签约方式和合同状态')
    return
  }

  const contractFiles = form.contractFileList.map((file) => {
    return {
      name: file.name,
      url: file.url,
    }
  })

  const contractData = {
    id: isEdit.value ? form.id : Date.now(),
    contractNo: form.contractNo,
    tenantId: form.tenantId,
    tenantName: form.tenantName,
    phone: form.phone,
    buildingName: form.buildingName,
    roomNumber: form.roomNumber,
    leaseStart: form.leaseStart,
    leaseEnd: form.leaseEnd,
    rent: form.rent,
    deposit: form.deposit,
    signMethod: form.signMethod,
    status: form.status,
    contractFiles,
  }

  if (isEdit.value) {
    const index = contractList.value.findIndex((item) => item.id === form.id)

    if (index !== -1) {
      contractList.value[index] = contractData
    }

    ElMessage.success('合同信息修改成功')
  } else {
    contractList.value.push(contractData)
    ElMessage.success('新增合同成功')
  }

  dialogVisible.value = false
}

// 模拟导出合同
const exportContract = (row) => {
  ElMessage.success(`模拟导出合同：${row.contractNo}`)
}

// 查看合同文件
const previewContract = (row) => {
  if (row.contractFiles.length === 0) {
    ElMessage.warning('暂无合同文件')
    return
  }

  const firstFile = row.contractFiles[0]

  if (firstFile.url) {
    window.open(firstFile.url, '_blank')
  }
}

// 删除合同
const deleteContract = (id) => {
  ElMessageBox.confirm('确定要删除这份合同吗？', '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      contractList.value = contractList.value.filter((item) => item.id !== id)
      ElMessage.success('删除成功')
    })
    .catch(() => {
      ElMessage.info('已取消删除')
    })
}

// 合同状态标签颜色
const getStatusType = (status) => {
  if (status === '已生效') {
    return 'success'
  }

  if (status === '未生效') {
    return 'warning'
  }

  if (status === '已到期') {
    return 'info'
  }

  if (status === '已终止') {
    return 'danger'
  }

  return ''
}
</script>

<style scoped>
.contract-page {
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
  width: 300px;
}

.form-right {
  flex: 1;

  padding: 18px;

  border: 1px dashed #dcdfe6;
  border-radius: 10px;

  background: #fafafa;
}

.file-title {
  font-size: 16px;
  font-weight: bold;

  margin-bottom: 16px;

  color: #303133;
}

.upload-tip {
  margin-top: 10px;

  color: #909399;

  font-size: 13px;
  line-height: 1.6;
}

.bind-info {
  color: #606266;

  font-size: 14px;
  line-height: 1.8;
}

.contract-dialog :deep(.el-dialog__body) {
  padding-top: 10px;
  padding-bottom: 10px;
}

.contract-dialog :deep(.el-form-item) {
  margin-bottom: 14px;
}
</style>