<template>
  <div class="visitor-page">
    <!-- 顶部导航 -->
    <header class="header">
      <div class="logo">
        <img src="/favicon.svg" alt="紫霞公寓" />
        <span>紫霞公寓</span>
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
      <el-carousel
        class="banner-carousel"
        height="420px"
        arrow="never"
        indicator-position="outside"
        :interval="4200"
      >
        <el-carousel-item
          v-for="image in bannerImages"
          :key="image"
        >
          <img :src="image" alt="紫霞公寓环境展示" />
        </el-carousel-item>
      </el-carousel>

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
          <div class="facility-gallery">
            <div class="facility-image">
              <img
                v-if="facility.images?.length"
                :src="facility.images[0]"
                :alt="facility.title"
              />

              <div v-else class="facility-icon">
                {{ facility.icon }}
              </div>
            </div>

            <div v-if="facility.images?.length > 1" class="facility-thumbs">
              <img
                v-for="(image, index) in facility.images.slice(1)"
                :key="image"
                :src="image"
                :alt="`${facility.title}展示图${index + 2}`"
              />
            </div>

            <div v-if="facility.images?.length" class="facility-count">
              {{ facility.images.length }} 张图
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
      <div v-loading="roomLoading" class="building-tabs">
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
      <div v-if="currentRoomList.length > 0" class="room-grid">
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

      <el-empty
        v-else
        class="room-empty"
        description="当前楼栋暂无可出租房间"
      />
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
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../utils/request'

const currentBuildingId = ref(null)
const roomLoading = ref(false)

const buildingList = ref([])

const bannerImages = [
  '/images/banner/banner-01-building.png',
  '/images/banner/banner-02-rooftop.jpg',
  '/images/banner/banner-03-table.jpg',
  '/images/banner/banner-04-doll.jpg',
  '/images/banner/banner-05-corner.jpg',
  '/images/banner/banner-06-swing.jpg',
  '/images/banner/banner-07-tea.jpg',
  '/images/banner/banner-08-plants.jpg',
  '/images/banner/banner-09-night.jpg',
  '/images/banner/banner-10-garden.jpg',
  '/images/banner/banner-11-sunset.jpg',
  '/images/banner/banner-12-turtle.jpg',
  '/images/banner/banner-13-water.jpg',
]

const facilityList = [
  {
    id: 1,
    title: '24小时活动室',
    icon: '🎱',
    images: [
      '/images/facilities/activity-room-1.png',
      '/images/facilities/activity-room-2.png',
    ],
    description: '活动室24小时开放，配有沙发、电视、跑步机等休闲设施，适合休息、娱乐和朋友小聚。',
  },
  {
    id: 2,
    title: '顶楼超大晒场',
    icon: '🌇',
    images: [
      '/images/facilities/rooftop-1.jpg',
      '/images/facilities/rooftop-2.jpg',
      '/images/facilities/rooftop-3.jpg',
    ],
    description: '顶楼晒场宽敞通透，日常晾晒方便，也能作为休闲活动空间，白天夜晚都有不同氛围。',
  },
  {
    id: 3,
    title: '智能门锁',
    icon: '🔐',
    images: [
      '/images/facilities/smart-lock-1.jpg',
      '/images/facilities/smart-lock-2.jpg',
    ],
    description: '房间配备智能门锁，进出更方便，也提升日常居住安全感。',
  },
  {
    id: 4,
    title: '电梯出行',
    icon: '🛗',
    images: [
      '/images/facilities/elevator-1.png',
      '/images/facilities/elevator-2.png',
    ],
    description: '楼栋内设有电梯，搬运行李和日常上下楼更轻松，出入体验更省心。',
  },
  {
    id: 5,
    title: '消防安全',
    icon: '🧯',
    images: [
      '/images/facilities/fire-safety-1.jpg',
      '/images/facilities/fire-safety-2.jpg',
    ],
    description: '楼道配备消防栓、灭火器等消防设施，公共区域保持清晰指引，让居住更安心。',
  },
  {
    id: 6,
    title: '交通便利',
    icon: '🚶',
    images: [
      '/images/facilities/traffic-1.jpg',
      '/images/facilities/traffic-2.jpg',
      '/images/facilities/traffic-3.jpg',
    ],
    description: '公寓到利桥古街徒步约5分钟，周边吃喝、购物、散步都方便，日常生活半径很轻松。',
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

const roomList = ref([])

const currentRoomList = computed(() => {
  return roomList.value.filter((room) => {
    return Number(room.buildingId) === Number(currentBuildingId.value) && room.status === '可出租'
  })
})

const getAvailableRooms = (buildingId) => {
  return roomList.value.filter((room) => {
    return Number(room.buildingId) === Number(buildingId) && room.status === '可出租'
  })
}

const getBuildingList = async () => {
  const res = await request.get('/buildings')

  if (res.code === 200) {
    buildingList.value = res.data || []

    if (!currentBuildingId.value && buildingList.value.length > 0) {
      currentBuildingId.value = buildingList.value[0].id
    }
  }
}

const getRoomList = async () => {
  const res = await request.get('/rooms')

  if (res.code === 200) {
    roomList.value = (res.data || [])
      .filter((room) => room.status === '可出租')
      .map((room) => {
        return {
          id: room.id,
          buildingId: room.building_id,
          buildingName: room.building_name,
          roomNumber: room.room_number,
          type: room.room_type,
          area: Number(room.area || 0),
          rent: Number(room.monthly_rent || room.rent || 0),
          deposit: Number(room.deposit || 0),
          status: room.status,
          images: room.images || [],
          description: room.description || '房间信息已同步后台，可联系房东了解更多详情。',
        }
      })
  }
}

const withRetry = async (task, retries = 2) => {
  try {
    return await task()
  } catch (error) {
    if (retries <= 0) {
      throw error
    }

    await new Promise((resolve) => setTimeout(resolve, 500))
    return withRetry(task, retries - 1)
  }
}

const loadRooms = async () => {
  roomLoading.value = true

  try {
    await withRetry(getBuildingList)
    await withRetry(getRoomList)

    if (
      currentBuildingId.value &&
      getAvailableRooms(currentBuildingId.value).length === 0
    ) {
      const firstAvailableBuilding = buildingList.value.find((building) => {
        return getAvailableRooms(building.id).length > 0
      })

      if (firstAvailableBuilding) {
        currentBuildingId.value = firstAvailableBuilding.id
      }
    }
  } catch (error) {
    console.error('获取房源失败：', error)
    ElMessage.error('获取房源失败，请稍后刷新重试')
  } finally {
    roomLoading.value = false
  }
}

onMounted(() => {
  loadRooms()
})

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
  window.location.href = 'https://tenant.fqzxgy.com/login'
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
  display: flex;
  align-items: center;
  gap: 10px;

  font-size: 22px;
  font-weight: bold;
  color: #001529;
}

.logo img {
  width: 34px;
  height: 34px;
  object-fit: contain;
}

.logo span {
  line-height: 1;
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
  overflow: hidden;
  background: #1f1f1d;
}

.banner-carousel {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.banner-carousel :deep(.el-carousel__container) {
  height: 420px;
}

.banner-carousel :deep(.el-carousel__item) {
  height: 420px;
}

.banner-carousel img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.banner-carousel :deep(.el-carousel__indicators) {
  z-index: 4;
  bottom: 18px;
}

.banner-carousel :deep(.el-carousel__button) {
  width: 26px;
  height: 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.85);
}

.banner-mask {
  position: absolute;
  inset: 0;
  z-index: 1;
  background:
    linear-gradient(90deg, rgba(0, 21, 41, 0.72), rgba(0, 21, 41, 0.28)),
    linear-gradient(180deg, rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.28));
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
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}

.facility-card {
  overflow: hidden;

  background: #ffffff;
  border-radius: 16px;

  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);

  transition: all 0.25s ease;
}

.facility-gallery {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 116px;
  gap: 8px;
  padding: 8px;
  background: #f4efe8;
}

.facility-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 14px 30px rgba(64, 158, 255, 0.16);
}

.facility-image {
  height: 260px;

  background: #ebeef5;
  border-radius: 12px;
  overflow: hidden;

  display: flex;
  align-items: center;
  justify-content: center;
}

.facility-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.facility-thumbs {
  display: grid;
  grid-template-rows: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.facility-thumbs img {
  width: 100%;
  height: 100%;
  min-height: 0;
  object-fit: cover;
  border-radius: 10px;
}

.facility-thumbs img:only-child {
  grid-row: 1 / -1;
}

.facility-count {
  position: absolute;
  right: 18px;
  bottom: 18px;
  padding: 5px 10px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.58);
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
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

.room-empty {
  padding: 36px 0;
  background: #ffffff;
  border-radius: 14px;
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

  .facility-gallery {
    grid-template-columns: 1fr;
  }

  .facility-thumbs {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-rows: none;
  }

  .facility-thumbs img {
    height: 110px;
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
