<template>
  <div class="visitor-page">
    <!-- 顶部导航 -->
    <header class="header">
      <div class="logo">
        紫霞公寓
      </div>

      <nav class="nav">
        <a href="#rooms">房源展示</a>
        <a href="#why">公寓优势</a>
        <a href="#facilities">公寓设施</a>
        <a href="#faq">常见问题</a>
        <a href="#contact">联系房东</a>

        <el-button size="small" @click="goTenantLogin">
          租客登录
        </el-button>
      </nav>
    </header>

    <!-- banner -->
    <section class="banner">
      <div class="banner-mask"></div>

      <div class="banner-content">
        <h1>欢迎来到紫霞公寓</h1>
        <p>舒适居住环境，便捷租房服务，适合学习、工作与生活。</p>

        <div class="banner-actions">
          <el-button type="primary" size="large" @click="scrollToRooms">
            查看房源
          </el-button>

          <el-button size="large" @click="scrollToContact">
            联系房东
          </el-button>
        </div>
      </div>
    </section>

    <!-- 简介 -->
    <section class="intro-section">
      <div class="intro-card">
        <h3>两栋公寓统一管理</h3>
        <p>房间信息、租金、状态清晰展示。</p>
      </div>

      <div class="intro-card">
        <h3>适合长期居住</h3>
        <p>提供单身公寓、一室一厅、两室一厅等房型。</p>
      </div>

      <div class="intro-card">
        <h3>联系方便</h3>
        <p>游客可先查看房源，再联系房东预约看房。</p>
      </div>
    </section>

    <!-- 为什么选择紫霞公寓 -->
    <section id="why" class="why-section">
      <div class="section-title">
        <h2>为什么选择紫霞公寓？</h2>
        <p>不只是居住，更是舒适、便利、有温度的生活空间。</p>
      </div>

      <div class="why-grid">
        <div class="why-card">
          <div class="why-icon">🎱</div>
          <h3>24小时活动室</h3>
          <p>
            活动室24h开放，内置空调、台球桌等娱乐设施，
            休息、娱乐、朋友聚会都很方便。
          </p>
        </div>

        <div class="why-card">
          <div class="why-icon">🌇</div>
          <h3>顶楼超大晒场</h3>
          <p>
            顶楼拥有宽敞晒场和活动空间。
            偷偷告诉你，房东姐姐还会不定时举办烧烤活动哦。
          </p>
        </div>

        <div class="why-card">
          <div class="why-icon">🔐</div>
          <h3>智能门锁与电梯</h3>
          <p>
            配备智能门锁与电梯，
            为您的日常出行提供更安全、更便利的居住体验。
          </p>
        </div>

        <div class="why-card">
          <div class="why-icon">🚶</div>
          <h3>交通便利</h3>
          <p>
            公寓周边交通便利，
            到利桥古街只要5分钟，生活、购物、出行都很方便。
          </p>
        </div>
      </div>
    </section>

    <!-- 公寓设施介绍 -->
    <section id="facilities" class="facility-section">
      <div class="section-title">
        <h2>公寓设施介绍</h2>
        <p>为租客提供更加舒适、安全、便利的居住环境。</p>
      </div>

      <div class="facility-grid">
        <div
          v-for="facility in facilityList"
          :key="facility.id"
          class="facility-card"
        >
          <div class="facility-image">
            <img
              v-if="facility.image"
              :src="facility.image"
              :alt="facility.title"
            />

            <div v-else class="facility-icon">
              {{ facility.icon }}
            </div>
          </div>

          <div class="facility-info">
            <h3>{{ facility.title }}</h3>
            <p>{{ facility.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 房源展示 -->
    <section id="rooms" class="room-section">
      <div class="section-title">
        <h2>房源展示</h2>
        <p>可以切换楼栋查看当前可出租房间。</p>
      </div>

      <!-- 楼栋切换 -->
      <div class="building-tabs">
        <div
          v-for="building in buildingList"
          :key="building.id"
          class="building-card"
          :class="{ active: currentBuildingId === building.id }"
          @click="currentBuildingId = building.id"
        >
          <h3>{{ building.name }}</h3>
          <p>可出租 {{ getAvailableRooms(building.id).length }} 间</p>
        </div>
      </div>

      <!-- 房间卡片 -->
      <div class="room-grid">
        <el-card
          v-for="room in currentRoomList"
          :key="room.id"
          class="room-card"
        >
          <div class="room-image">
            <el-carousel
              v-if="room.images && room.images.length > 0"
              height="190px"
              indicator-position="none"
              arrow="hover"
            >
              <el-carousel-item
                v-for="(image, index) in room.images"
                :key="index"
              >
                <img
                  :src="image"
                  alt="房间图片"
                />
              </el-carousel-item>
            </el-carousel>

            <div v-else class="no-image">
              暂无图片
            </div>

            <span class="status-tag">
              {{ room.status }}
            </span>
          </div>

          <div class="room-info">
            <h3>{{ room.roomNumber }} 房间</h3>

            <p class="room-type">
              {{ room.type }} ｜ {{ room.area }}㎡
            </p>

            <p class="room-price">
              ¥{{ room.rent }} / 月
            </p>

            <p class="room-desc">
              {{ room.description }}
            </p>

            <div class="room-actions">
              <el-button
                type="primary"
                size="small"
                @click="openRoomDetail(room)"
              >
                查看详情
              </el-button>

              <el-button
                size="small"
                @click="openContactDialog(room)"
              >
                预约看房
              </el-button>
            </div>
          </div>
        </el-card>
      </div>
    </section>

    <!-- 常见问题 FAQ -->
    <section id="faq" class="faq-section">
      <div class="section-title">
        <h2>常见问题 FAQ</h2>
        <p>入住前您可能关心的问题，可以先在这里了解。</p>
      </div>

      <el-collapse v-model="activeFaq" class="faq-collapse">
        <el-collapse-item
          v-for="item in faqList"
          :key="item.id"
          :name="item.id"
        >
          <template #title>
            <div class="faq-title">
              <span class="faq-q">Q</span>
              <span>{{ item.question }}</span>
            </div>
          </template>

          <div class="faq-answer">
            {{ item.answer }}
          </div>
        </el-collapse-item>
      </el-collapse>
    </section>

    <!-- 联系房东 -->
    <section id="contact" class="contact-section">
      <div>
        <h2>联系房东</h2>
        <p>如果您对房间感兴趣，可以通过以下方式联系房东。</p>
      </div>

      <div class="contact-card">
        <p>联系电话：18988287793</p>
        <p>微信：请添加房东微信咨询</p>
        <p>地址：紫霞公寓 1号楼 / 2号楼</p>
      </div>
    </section>

    <!-- 页脚 -->
    <footer class="footer">
      © 2026 紫霞公寓房屋管理系统 版权所有
    </footer>

    <!-- 房间详情弹窗 -->
    <el-dialog
      v-model="detailVisible"
      title="房间详情"
      width="680px"
    >
      <div class="detail-box">
        <el-carousel
          v-if="detailRoom.images && detailRoom.images.length > 0"
          height="300px"
          class="detail-carousel"
          indicator-position="outside"
          arrow="always"
        >
          <el-carousel-item
            v-for="(image, index) in detailRoom.images"
            :key="index"
          >
            <img
              :src="image"
              class="detail-image"
              alt="房间图片"
            />
          </el-carousel-item>
        </el-carousel>

        <el-descriptions border :column="2">
          <el-descriptions-item label="房间号">
            {{ detailRoom.roomNumber }}
          </el-descriptions-item>

          <el-descriptions-item label="房型">
            {{ detailRoom.type }}
          </el-descriptions-item>

          <el-descriptions-item label="面积">
            {{ detailRoom.area }}㎡
          </el-descriptions-item>

          <el-descriptions-item label="月租金">
            ¥{{ detailRoom.rent }}
          </el-descriptions-item>

          <el-descriptions-item label="押金">
            ¥{{ detailRoom.deposit }}
          </el-descriptions-item>

          <el-descriptions-item label="状态">
            {{ detailRoom.status }}
          </el-descriptions-item>
        </el-descriptions>

        <div class="detail-desc">
          <h3>房间介绍</h3>
          <p>{{ detailRoom.description }}</p>
        </div>
      </div>
    </el-dialog>

    <!-- 预约看房弹窗 -->
    <el-dialog
      v-model="contactVisible"
      title="预约看房"
      width="560px"
    >
      <el-form label-width="90px">
        <el-form-item label="意向房间">
          <el-input
            :model-value="`${contactRoom.roomNumber || ''} 房间`"
            disabled
          />
        </el-form-item>

        <el-form-item label="您的姓名" required>
          <el-input
            v-model="contactForm.name"
            placeholder="请输入姓名"
          />
        </el-form-item>

        <el-form-item label="手机号" required>
          <el-input
            v-model="contactForm.phone"
            placeholder="请输入手机号"
          />
        </el-form-item>

        <el-form-item label="预约时间" required>
          <el-date-picker
            v-model="contactForm.appointmentTime"
            type="datetime"
            placeholder="请选择预约看房时间"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="备注">
          <el-input
            v-model="contactForm.remark"
            type="textarea"
            :rows="4"
            placeholder="例如：想周末下午看房"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="contactVisible = false">
          取消
        </el-button>

        <el-button type="primary" @click="submitContact">
          提交预约
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'

const currentBuildingId = ref('building-1')

const buildingList = [
  {
    id: 'building-1',
    name: '紫霞公寓1号楼',
  },
  {
    id: 'building-2',
    name: '紫霞公寓2号楼',
  },
]

const facilityList = [
  {
    id: 1,
    title: '24小时活动室',
    icon: '🎱',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop',
    description: '活动室全天开放，内置空调、台球桌等娱乐设施，适合休息、学习和朋友聚会。',
  },
  {
    id: 2,
    title: '顶楼超大晒场',
    icon: '🌇',
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop',
    description: '顶楼空间宽敞，可以晾晒衣物，也可以作为日常休闲活动空间。',
  },
  {
    id: 3,
    title: '智能门锁',
    icon: '🔐',
    image: 'https://images.unsplash.com/photo-1558002038-1055907df827?q=80&w=1200&auto=format&fit=crop',
    description: '公寓配备智能门锁，提高日常出入安全性，也让租客生活更加便利。',
  },
  {
    id: 4,
    title: '电梯出行',
    icon: '🛗',
    image: 'https://images.unsplash.com/photo-1604014237800-1c9102c219da?q=80&w=1200&auto=format&fit=crop',
    description: '楼栋内设有电梯，搬运行李和日常上下楼更加轻松。',
  },
  {
    id: 5,
    title: '公共空调区域',
    icon: '❄️',
    image: 'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?q=80&w=1200&auto=format&fit=crop',
    description: '公共活动空间内设置空调，夏天和冬天都能保持舒适环境。',
  },
  {
    id: 6,
    title: '便利生活圈',
    icon: '🚶',
    image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?q=80&w=1200&auto=format&fit=crop',
    description: '公寓周边交通便利，到利桥古街约5分钟，生活购物都很方便。',
  },
]

const activeFaq = ref(['1'])

const faqList = [
  {
    id: '1',
    question: '可以预约看房吗？',
    answer: '可以。您可以在房源卡片中点击“预约看房”，填写姓名、手机号和预约时间，提交后房东会尽快联系您。',
  },
  {
    id: '2',
    question: '押金是多少？',
    answer: '一般情况下押金与一个月租金相同，具体金额会根据房间类型和合同内容确认。',
  },
  {
    id: '3',
    question: '水电费怎么算？',
    answer: '水电费通常按照实际使用量计算。入住后，租客可以在租客前台查看自己的水电账单。',
  },
  {
    id: '4',
    question: '可以短租吗？',
    answer: '目前主要以长期租住为主。具体能否短租，需要与房东进一步确认。',
  },
  {
    id: '5',
    question: '可以几个人入住？',
    answer: '不同房型适合的人数不同。单身公寓适合一人居住，一室一厅适合一到两人，两室一厅适合两人合租或小家庭。',
  },
  {
    id: '6',
    question: '退租需要提前多久通知？',
    answer: '建议至少提前一个月通知房东，方便进行房间检查、押金结算和后续房源安排。',
  },
  {
    id: '7',
    question: '公共设施可以随时使用吗？',
    answer: '活动室24小时开放，但使用时请注意保持安静和卫生，不影响其他租客休息。',
  },
  {
    id: '8',
    question: '房间图片是真实的吗？',
    answer: '游客页面展示的图片后续会与后台房屋管理中上传的房间图片对应，用于帮助您了解房间情况。',
  },
]

const roomList = ref([
  {
    id: 1,
    buildingId: 'building-1',
    roomNumber: '101',
    type: '一室一厅',
    area: 25,
    rent: 6500,
    deposit: 6500,
    status: '可出租',
    images: [
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?q=80&w=1200&auto=format&fit=crop',
    ],
    description: '采光较好，适合单人或情侣居住，生活交通便利。',
  },
  {
    id: 2,
    buildingId: 'building-1',
    roomNumber: '102',
    type: '单身公寓',
    area: 22,
    rent: 6000,
    deposit: 6000,
    status: '可出租',
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=1200&auto=format&fit=crop',
    ],
    description: '房间简洁实用，适合学生或上班族长期居住。',
  },
  {
    id: 3,
    buildingId: 'building-2',
    roomNumber: '201',
    type: '两室一厅',
    area: 40,
    rent: 8500,
    deposit: 8500,
    status: '可出租',
    images: [
      'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?q=80&w=1200&auto=format&fit=crop',
    ],
    description: '空间较大，适合两人合租或小家庭居住。',
  },
])

const currentRoomList = computed(() => {
  return roomList.value.filter((room) => {
    return room.buildingId === currentBuildingId.value && room.status === '可出租'
  })
})

const getAvailableRooms = (buildingId) => {
  return roomList.value.filter((room) => {
    return room.buildingId === buildingId && room.status === '可出租'
  })
}

const detailVisible = ref(false)
const detailRoom = ref({})

const contactVisible = ref(false)
const contactRoom = ref({})

const contactForm = reactive({
  name: '',
  phone: '',
  appointmentTime: '',
  remark: '',
})

const goTenantLogin = () => {
  window.location.href = 'http://localhost:5174/login'
}

const scrollToRooms = () => {
  document.querySelector('#rooms')?.scrollIntoView({
    behavior: 'smooth',
  })
}

const scrollToContact = () => {
  document.querySelector('#contact')?.scrollIntoView({
    behavior: 'smooth',
  })
}

const openRoomDetail = (room) => {
  detailRoom.value = room
  detailVisible.value = true
}

const openContactDialog = (room) => {
  contactRoom.value = room
  contactForm.name = ''
  contactForm.phone = ''
  contactForm.appointmentTime = ''
  contactForm.remark = ''
  contactVisible.value = true
}

const submitContact = () => {
  if (!contactForm.name) {
    ElMessage.warning('请输入姓名')
    return
  }

  if (!contactForm.phone) {
    ElMessage.warning('请输入手机号')
    return
  }

  if (!contactForm.appointmentTime) {
    ElMessage.warning('请选择预约看房时间')
    return
  }

  ElMessage.success('预约提交成功，房东会尽快联系您')
  contactVisible.value = false
}
</script>

<style scoped>
.visitor-page {
  min-height: 100vh;
  background: #f5f7fa;
  color: #303133;
}

.header {
  height: 68px;
  padding: 0 9%;

  display: flex;
  align-items: center;
  justify-content: space-between;

  background: #ffffff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);

  position: sticky;
  top: 0;
  z-index: 10;
}

.logo {
  font-size: 22px;
  font-weight: bold;
  color: #001529;
}

.nav {
  display: flex;
  align-items: center;
  gap: 26px;
}

.nav a {
  color: #606266;
  text-decoration: none;
  font-size: 15px;
}

.nav a:hover {
  color: #409eff;
}

.banner {
  height: 420px;
  position: relative;

  background-image: url('https://images.unsplash.com/photo-1514565131-fce0801e5785?q=80&w=2070&auto=format&fit=crop');
  background-size: cover;
  background-position: center;
}

.banner-mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 21, 41, 0.58);
}

.banner-content {
  position: relative;
  z-index: 2;

  height: 100%;
  padding: 0 9%;

  display: flex;
  flex-direction: column;
  justify-content: center;

  color: #ffffff;
}

.banner-content h1 {
  font-size: 52px;
  margin: 0 0 18px;
}

.banner-content p {
  font-size: 20px;
  color: #e6f4ff;
  margin: 0 0 30px;
}

.banner-actions {
  display: flex;
  gap: 14px;
}

/* 简介 */
.intro-section {
  width: 82%;
  margin: -50px auto 40px;

  position: relative;
  z-index: 3;

  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}

.intro-card {
  padding: 24px;

  background: #ffffff;
  border-radius: 14px;

  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.intro-card h3 {
  font-size: 20px;
  margin: 0 0 10px;
}

.intro-card p {
  color: #606266;
  line-height: 1.7;
  margin: 0;
}

/* 公共标题 */
.section-title {
  margin-bottom: 20px;
}

.section-title h2 {
  font-size: 30px;
  margin: 0 0 8px;
}

.section-title p {
  color: #909399;
  margin: 0;
}

/* 为什么选择紫霞公寓 */
.why-section {
  width: 82%;
  margin: 0 auto 50px;
}

.why-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.why-card {
  padding: 26px 22px;

  background: #ffffff;
  border-radius: 16px;

  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);

  transition: all 0.25s ease;
}

.why-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 14px 30px rgba(64, 158, 255, 0.16);
}

.why-icon {
  width: 48px;
  height: 48px;

  margin-bottom: 16px;

  border-radius: 14px;

  background: #ecf5ff;

  display: flex;
  align-items: center;
  justify-content: center;

  font-size: 24px;
}

.why-card h3 {
  font-size: 20px;
  margin: 0 0 12px;
  color: #303133;
}

.why-card p {
  margin: 0;

  color: #606266;
  line-height: 1.8;
  font-size: 14px;
}

/* 公寓设施介绍 */
.facility-section {
  width: 82%;
  margin: 0 auto 50px;
}

.facility-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 22px;
}

.facility-card {
  overflow: hidden;

  background: #ffffff;
  border-radius: 16px;

  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);

  transition: all 0.25s ease;
}

.facility-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 14px 30px rgba(64, 158, 255, 0.16);
}

.facility-image {
  height: 180px;

  background: #ebeef5;

  display: flex;
  align-items: center;
  justify-content: center;
}

.facility-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.facility-icon {
  width: 70px;
  height: 70px;

  border-radius: 20px;

  background: #ecf5ff;

  display: flex;
  align-items: center;
  justify-content: center;

  font-size: 36px;
}

.facility-info {
  padding: 20px 22px;
}

.facility-info h3 {
  margin: 0 0 10px;

  font-size: 20px;
  color: #303133;
}

.facility-info p {
  margin: 0;

  color: #606266;
  line-height: 1.8;
  font-size: 14px;
}

/* 房源 */
.room-section {
  width: 82%;
  margin: 0 auto 50px;
}

.building-tabs {
  display: flex;
  gap: 18px;

  margin-bottom: 24px;
}

.building-card {
  width: 230px;

  padding: 20px 22px;

  background: #ffffff;
  border: 1px solid #e4e7ed;
  border-radius: 12px;

  cursor: pointer;
}

.building-card.active {
  border-color: #409eff;
  background: #ecf5ff;
  box-shadow: 0 8px 20px rgba(64, 158, 255, 0.16);
}

.building-card h3 {
  margin: 0 0 8px;
}

.building-card p {
  color: #909399;
  margin: 0;
}

.room-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 22px;
}

.room-card {
  border-radius: 14px;
  overflow: hidden;
}

.room-card :deep(.el-card__body) {
  padding: 0;
}

.room-image {
  height: 190px;

  position: relative;

  background: #ebeef5;
}

.room-image :deep(.el-carousel) {
  width: 100%;
  height: 100%;
}

.room-image :deep(.el-carousel__container) {
  height: 190px;
}

.room-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-image {
  width: 100%;
  height: 100%;

  display: flex;
  align-items: center;
  justify-content: center;

  color: #909399;
}

.status-tag {
  position: absolute;
  top: 12px;
  right: 12px;

  padding: 5px 10px;

  border-radius: 999px;

  background: #67c23a;
  color: #ffffff;
  font-size: 13px;
  z-index: 2;
}

.room-info {
  padding: 18px;
}

.room-info h3 {
  font-size: 22px;
  margin: 0 0 8px;
}

.room-type {
  color: #606266;
  margin: 0 0 8px;
}

.room-price {
  color: #f56c6c;
  font-size: 22px;
  font-weight: bold;
  margin: 0 0 10px;
}

.room-desc {
  color: #909399;
  line-height: 1.7;
  min-height: 48px;
  margin: 0;
}

.room-actions {
  margin-top: 16px;
  display: flex;
  gap: 10px;
}

/* 常见问题 FAQ */
.faq-section {
  width: 82%;
  margin: 0 auto 50px;
}

.faq-collapse {
  background: #ffffff;
  border-radius: 16px;
  overflow: hidden;

  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
}

.faq-collapse :deep(.el-collapse-item__header) {
  height: auto;
  min-height: 58px;

  padding: 0 24px;

  font-size: 16px;
  font-weight: 600;
}

.faq-collapse :deep(.el-collapse-item__content) {
  padding: 0 24px 22px;
}

.faq-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.faq-q {
  width: 28px;
  height: 28px;

  border-radius: 50%;

  background: #409eff;
  color: #ffffff;

  display: flex;
  align-items: center;
  justify-content: center;

  font-size: 14px;
  font-weight: bold;
}

.faq-answer {
  padding-left: 40px;

  color: #606266;
  line-height: 1.8;
  font-size: 14px;
}

/* 联系 */
.contact-section {
  width: 82%;
  margin: 0 auto 50px;

  padding: 32px;

  display: flex;
  justify-content: space-between;
  align-items: center;

  background: #ffffff;
  border-radius: 14px;

  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
}

.contact-section h2 {
  font-size: 28px;
  margin: 0 0 10px;
}

.contact-section p {
  color: #606266;
}

.contact-card {
  min-width: 320px;
  padding: 18px 24px;

  background: #f5f7fa;
  border-radius: 12px;
}

.contact-card p {
  margin: 0 0 8px;
}

.footer {
  padding: 24px;
  text-align: center;

  color: #909399;
  background: #ffffff;
}

/* 详情弹窗 */
.detail-box {
  line-height: 1.8;
}

.detail-carousel {
  margin-bottom: 24px;
}

.detail-image {
  width: 100%;
  height: 300px;

  object-fit: cover;
  border-radius: 10px;
}

.detail-desc {
  margin-top: 20px;
  padding: 16px;

  background: #f5f7fa;
  border-radius: 8px;
}

.detail-desc h3 {
  margin: 0 0 8px;
}

.detail-desc p {
  margin: 0;
}

/* 移动端适配 */
@media (max-width: 900px) {
  .header {
    padding: 0 20px;
  }

  .nav {
    gap: 12px;
  }

  .nav a {
    display: none;
  }

  .intro-section,
  .why-section,
  .facility-section,
  .room-section,
  .faq-section,
  .contact-section {
    width: calc(100% - 40px);
  }

  .intro-section,
  .why-grid,
  .facility-grid,
  .room-grid {
    grid-template-columns: 1fr;
  }

  .building-tabs {
    flex-direction: column;
  }

  .building-card {
    width: 100%;
  }

  .contact-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
  }

  .banner-content h1 {
    font-size: 38px;
  }

  .banner-content p {
    font-size: 16px;
  }
}
</style>