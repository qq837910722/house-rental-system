const express = require('express')
const cors = require('cors')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
require('dotenv').config()

const db = require('./db')

const app = express()
const tableColumnCache = new Map()
const uploadRoot = path.join(__dirname, '..', 'uploads')
const roomUploadDir = path.join(uploadRoot, 'rooms')

app.use(cors())
app.use(express.json({ limit: '20mb' }))
app.use('/api/uploads', express.static(uploadRoot))

fs.mkdirSync(roomUploadDir, { recursive: true })

// 测试后端
app.get('/', (req, res) => {
  res.send('房屋管理系统后端启动成功')
})

// 测试数据库连接
app.get('/api/test-db', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT 1 + 1 AS result')

    res.json({
      code: 200,
      message: '数据库连接成功',
      data: rows[0],
    })
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '数据库连接失败',
      error: error.message,
    })
  }
})

app.post('/api/uploads/room-images', async (req, res) => {
  try {
    const { fileName, dataUrl } = req.body || {}
    const match = String(dataUrl || '').match(/^data:(image\/(?:jpeg|jpg|png|webp|gif));base64,(.+)$/)

    if (!match) {
      return res.status(400).json({
        code: 400,
        message: '请上传 JPG、PNG、WebP 或 GIF 图片',
      })
    }

    const mimeType = match[1]
    const base64 = match[2]
    const buffer = Buffer.from(base64, 'base64')

    if (buffer.length > 8 * 1024 * 1024) {
      return res.status(400).json({
        code: 400,
        message: '单张图片不能超过 8MB',
      })
    }

    const extMap = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif',
    }
    const originalExt = path.extname(String(fileName || '')).toLowerCase()
    const ext = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(originalExt)
      ? (originalExt === '.jpeg' ? '.jpg' : originalExt)
      : extMap[mimeType]
    const savedName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`
    const savedPath = path.join(roomUploadDir, savedName)

    fs.writeFileSync(savedPath, buffer)

    res.json({
      code: 200,
      message: '上传成功',
      data: {
        url: `/api/uploads/rooms/${savedName}`,
        fileName: savedName,
      },
    })
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '上传图片失败',
      error: error.message,
    })
  }
})

// 查询楼栋列表
app.get('/api/buildings', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM buildings ORDER BY id ASC')

    res.json({
      code: 200,
      message: '查询成功',
      data: rows,
    })
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '查询楼栋失败',
      error: error.message,
    })
  }
})

// 查询房间列表
app.get('/api/rooms', async (req, res) => {
  try {
    const sql = `
      SELECT
        r.id,
        r.building_id,
        b.name AS building_name,
        r.room_number,
        r.floor,
        r.room_type,
        r.area,
        r.monthly_rent,
        r.deposit,
        r.status,
        r.lease_start,
        r.lease_end,
        r.description,
        t.name AS tenant_name
      FROM rooms r
      LEFT JOIN buildings b ON r.building_id = b.id
      LEFT JOIN tenants t ON r.current_tenant_id = t.id
      ORDER BY r.building_id ASC, r.room_number ASC
    `

    const [rooms] = await db.query(sql)
    const roomIds = rooms.map((room) => room.id)

    let imageMap = {}

    if (roomIds.length > 0) {
      const [images] = await db.query(
        `
          SELECT
            room_id,
            image_url
          FROM room_images
          WHERE room_id IN (?)
          ORDER BY room_id ASC, sort_order ASC, id ASC
        `,
        [roomIds],
      )

      imageMap = images.reduce((map, image) => {
        if (!map[image.room_id]) {
          map[image.room_id] = []
        }

        map[image.room_id].push(image.image_url)
        return map
      }, {})
    }

    const result = rooms.map((room) => {
      return {
        ...room,
        images: imageMap[room.id] || [],
        cover_image: imageMap[room.id]?.[0] || '',
      }
    })

    res.json({
      code: 200,
      message: '查询成功',
      data: result,
    })
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '查询房间失败',
      error: error.message,
    })
  }
})

const roomStatusList = ['可出租', '已出租', '维修中']
const roomTypeList = ['单身公寓', '一室一厅', '两室一厅', '活动室']

const toNullable = (value) => {
  if (value === undefined || value === null || value === '') {
    return null
  }

  return value
}

const getFloorByRoomNumber = (roomNumber) => {
  const firstNumber = String(roomNumber || '').match(/\d/)

  if (!firstNumber) {
    return null
  }

  return Number(firstNumber[0])
}

const normalizeRoomPayload = (body) => {
  const room = {
    building_id: Number(body.building_id),
    room_number: String(body.room_number || '').trim(),
    floor: body.floor === undefined || body.floor === '' ? null : Number(body.floor),
    room_type: String(body.room_type || '').trim(),
    area: body.area === undefined || body.area === '' ? null : Number(body.area),
    monthly_rent: Number(body.monthly_rent),
    deposit: Number(body.deposit),
    status: body.status || '可出租',
    lease_start: toNullable(body.lease_start),
    lease_end: toNullable(body.lease_end),
    description: toNullable(body.description),
    images: Array.isArray(body.images) ? body.images : [],
  }

  if (!room.floor) {
    room.floor = getFloorByRoomNumber(room.room_number)
  }

  room.images = room.images
    .map((image) => String(image || '').trim())
    .filter(Boolean)
    .slice(0, 6)

  return room
}

const validateRoomPayload = (room) => {
  if (!room.building_id) {
    return '请选择所属楼栋'
  }

  if (!room.room_number) {
    return '请输入房间号'
  }

  if (!roomTypeList.includes(room.room_type)) {
    return '请选择正确的房型'
  }

  if (!Number.isFinite(room.monthly_rent) || room.monthly_rent < 0) {
    return '请输入正确的月租金'
  }

  if (!Number.isFinite(room.deposit) || room.deposit < 0) {
    return '请输入正确的押金'
  }

  if (!roomStatusList.includes(room.status)) {
    return '请选择正确的房间状态'
  }

  if (room.area !== null && (!Number.isFinite(room.area) || room.area < 0)) {
    return '请输入正确的面积'
  }

  if (room.images.some((image) => image.length > 500)) {
    return '图片地址不能超过 500 个字符'
  }

  return ''
}

const saveRoomImages = async (connection, roomId, images) => {
  await connection.query('DELETE FROM room_images WHERE room_id = ?', [roomId])

  if (images.length === 0) {
    return
  }

  const roomImageColumns = await getTableColumns(connection, 'room_images')
  const hasCoverColumn = roomImageColumns.has('is_cover')
  const columns = hasCoverColumn
    ? ['room_id', 'image_url', 'is_cover', 'sort_order']
    : ['room_id', 'image_url', 'sort_order']

  const values = images.map((image, index) => {
    if (hasCoverColumn) {
      return [roomId, image, index === 0 ? 1 : 0, index + 1]
    }

    return [roomId, image, index + 1]
  })

  await connection.query(
    `
      INSERT INTO room_images (${columns.join(', ')})
      VALUES ?
    `,
    [values],
  )
}

const getTableColumns = async (connection, tableName) => {
  if (tableColumnCache.has(tableName)) {
    return tableColumnCache.get(tableName)
  }

  const [columns] = await connection.query(`SHOW COLUMNS FROM ${tableName}`)
  const columnSet = new Set(columns.map((column) => column.Field))

  tableColumnCache.set(tableName, columnSet)

  return columnSet
}

const ensureUserAuthColumns = async (connection) => {
  const userColumns = await getTableColumns(connection, 'users')

  if (!userColumns.has('status')) {
    await connection.query("ALTER TABLE users ADD COLUMN status VARCHAR(50) DEFAULT 'enabled'")
    tableColumnCache.delete('users')
    userColumns.add('status')
  }

  if (!userColumns.has('must_change_password')) {
    await connection.query('ALTER TABLE users ADD COLUMN must_change_password TINYINT(1) DEFAULT 1')
    tableColumnCache.delete('users')
    userColumns.add('must_change_password')
  }

  return userColumns
}

const tableExists = async (connection, tableName) => {
  const [rows] = await connection.query('SHOW TABLES LIKE ?', [tableName])

  return rows.length > 0
}

const insertRoom = async (connection, room, buildingName) => {
  const roomColumns = await getTableColumns(connection, 'rooms')
  const fieldValues = {
    building_id: room.building_id,
    room_number: room.room_number,
    floor: room.floor,
    room_type: room.room_type,
    area: room.area,
    monthly_rent: room.monthly_rent,
    deposit: room.deposit,
    status: room.status,
    lease_start: room.lease_start,
    lease_end: room.lease_end,
    description: room.description,
    building: buildingName,
    rent: room.monthly_rent,
  }
  const fields = Object.keys(fieldValues).filter((field) => roomColumns.has(field))
  const placeholders = fields.map(() => '?').join(', ')
  const values = fields.map((field) => fieldValues[field])

  const [result] = await connection.query(
    `
      INSERT INTO rooms (${fields.join(', ')})
      VALUES (${placeholders})
    `,
    values,
  )

  return result
}

const updateRoom = async (connection, roomId, room, buildingName) => {
  const roomColumns = await getTableColumns(connection, 'rooms')
  const fieldValues = {
    building_id: room.building_id,
    room_number: room.room_number,
    floor: room.floor,
    room_type: room.room_type,
    area: room.area,
    monthly_rent: room.monthly_rent,
    deposit: room.deposit,
    status: room.status,
    lease_start: room.lease_start,
    lease_end: room.lease_end,
    description: room.description,
    building: buildingName,
    rent: room.monthly_rent,
  }
  const fields = Object.keys(fieldValues).filter((field) => roomColumns.has(field))
  const setSql = fields.map((field) => `${field} = ?`).join(',\n          ')
  const values = fields.map((field) => fieldValues[field])

  values.push(roomId)

  await connection.query(
    `
      UPDATE rooms
      SET
          ${setSql}
      WHERE id = ?
    `,
    values,
  )
}

const insertUser = async (connection, user) => {
  const userColumns = await ensureUserAuthColumns(connection)
  const fieldValues = {
    username: user.username,
    password: user.password,
    role: user.role,
    real_name: user.real_name,
    name: user.real_name,
    phone: user.phone,
    status: user.status,
    must_change_password: user.must_change_password ?? 1,
  }
  const fields = Object.keys(fieldValues).filter((field) => userColumns.has(field))
  const placeholders = fields.map(() => '?').join(', ')
  const values = fields.map((field) => fieldValues[field])

  const [result] = await connection.query(
    `
      INSERT INTO users (${fields.join(', ')})
      VALUES (${placeholders})
    `,
    values,
  )

  return result
}

const updateUser = async (connection, userId, user) => {
  const userColumns = await getTableColumns(connection, 'users')
  const fieldValues = {
    username: user.username,
    real_name: user.real_name,
    name: user.real_name,
    phone: user.phone,
    role: user.role,
    status: user.status,
  }
  const fields = Object.keys(fieldValues).filter((field) => {
    return userColumns.has(field) && fieldValues[field] !== undefined
  })

  if (fields.length === 0) {
    return
  }

  const setSql = fields.map((field) => `${field} = ?`).join(',\n          ')
  const values = fields.map((field) => fieldValues[field])

  values.push(userId)

  await connection.query(
    `
      UPDATE users
      SET
          ${setSql}
      WHERE id = ?
    `,
    values,
  )
}

const setUserStatus = async (connection, userId, status) => {
  if (!userId) {
    return
  }

  const userColumns = await ensureUserAuthColumns(connection)

  if (!userColumns.has('status')) {
    return
  }

  await connection.query('UPDATE users SET status = ? WHERE id = ?', [status, userId])
}

const contractStatusList = ['待确认', '生效中', '已到期', '已作废']

const normalizeContractPayload = (body) => {
  return {
    contract_no: String(body.contract_no || body.contractNo || '').trim(),
    tenant_id: Number(body.tenant_id || body.tenantId),
    start_date: toNullable(body.start_date || body.leaseStart),
    end_date: toNullable(body.end_date || body.leaseEnd),
    monthly_rent: Number(body.monthly_rent || body.rent),
    deposit: Number(body.deposit),
    sign_date: toNullable(body.sign_date || body.signDate),
    status: body.status || '待确认',
    pdf_url: toNullable(body.pdf_url || body.pdfUrl),
  }
}

const validateContractPayload = (contract) => {
  if (!contract.contract_no) {
    return '请输入合同编号'
  }

  if (!contract.tenant_id) {
    return '请选择租客'
  }

  if (!contract.start_date || !contract.end_date) {
    return '请选择合同租期'
  }

  if (new Date(contract.start_date) > new Date(contract.end_date)) {
    return '租期开始日期不能晚于结束日期'
  }

  if (!Number.isFinite(contract.monthly_rent) || contract.monthly_rent < 0) {
    return '请输入正确的月租金'
  }

  if (!Number.isFinite(contract.deposit) || contract.deposit < 0) {
    return '请输入正确的押金'
  }

  if (!contractStatusList.includes(contract.status)) {
    return '请选择正确的合同状态'
  }

  if (contract.pdf_url && contract.pdf_url.length > 500) {
    return '合同文件地址不能超过 500 个字符'
  }

  return ''
}

const getTenantForContract = async (connection, tenantId) => {
  const roomColumns = await getTableColumns(connection, 'rooms')
  const roomRentSelect = roomColumns.has('rent') ? 'r.rent,' : ''

  const [tenantRows] = await connection.query(
    `
      SELECT
        t.id,
        t.name,
        t.phone,
        t.room_id,
        t.status,
        r.room_number,
        r.building_id,
        r.monthly_rent,
        ${roomRentSelect}
        r.deposit,
        b.name AS building_name
      FROM tenants t
      LEFT JOIN rooms r ON t.room_id = r.id
      LEFT JOIN buildings b ON r.building_id = b.id
      WHERE t.id = ?
      LIMIT 1
    `,
    [tenantId],
  )

  return tenantRows[0]
}

const insertContract = async (connection, contract, roomId) => {
  const contractColumns = await getTableColumns(connection, 'contracts')
  const fieldValues = {
    contract_no: contract.contract_no,
    tenant_id: contract.tenant_id,
    room_id: roomId,
    start_date: contract.start_date,
    end_date: contract.end_date,
    monthly_rent: contract.monthly_rent,
    rent: contract.monthly_rent,
    deposit: contract.deposit,
    sign_date: contract.sign_date,
    status: contract.status,
    pdf_url: contract.pdf_url,
  }
  const fields = Object.keys(fieldValues).filter((field) => contractColumns.has(field))
  const placeholders = fields.map(() => '?').join(', ')
  const values = fields.map((field) => fieldValues[field])

  const [result] = await connection.query(
    `
      INSERT INTO contracts (${fields.join(', ')})
      VALUES (${placeholders})
    `,
    values,
  )

  return result
}

const updateContract = async (connection, contractId, contract, roomId) => {
  const contractColumns = await getTableColumns(connection, 'contracts')
  const fieldValues = {
    contract_no: contract.contract_no,
    tenant_id: contract.tenant_id,
    room_id: roomId,
    start_date: contract.start_date,
    end_date: contract.end_date,
    monthly_rent: contract.monthly_rent,
    rent: contract.monthly_rent,
    deposit: contract.deposit,
    sign_date: contract.sign_date,
    status: contract.status,
    pdf_url: contract.pdf_url,
  }
  const fields = Object.keys(fieldValues).filter((field) => contractColumns.has(field))
  const setSql = fields.map((field) => `${field} = ?`).join(',\n          ')
  const values = fields.map((field) => fieldValues[field])

  values.push(contractId)

  await connection.query(
    `
      UPDATE contracts
      SET
          ${setSql}
      WHERE id = ?
    `,
    values,
  )
}

const ensureNoticeSchema = async (connection) => {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS notices (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      type ENUM('账单通知', '合同通知', '公共通知', '生活提醒', '其他通知') DEFAULT '公共通知',
      target_type ENUM('all', 'tenant', 'room') DEFAULT 'all',
      target_id INT NULL,
      need_confirm TINYINT(1) DEFAULT 0,
      publisher_id INT NULL,
      publish_time DATETIME NULL,
      status VARCHAR(50) DEFAULT '已发布',
      source VARCHAR(50) DEFAULT '房东发布',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await connection.query(`
    CREATE TABLE IF NOT EXISTS notice_confirmations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      notice_id INT NOT NULL,
      tenant_id INT NOT NULL,
      is_read TINYINT(1) DEFAULT 0,
      is_confirmed TINYINT(1) DEFAULT 0,
      read_time DATETIME NULL,
      confirm_time DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_notice_tenant (notice_id, tenant_id),
      KEY idx_notice_confirmations_tenant (tenant_id),
      KEY idx_notice_confirmations_notice (notice_id)
    )
  `)

  tableColumnCache.delete('notices')
  tableColumnCache.delete('notice_confirmations')

  const noticeColumns = await getTableColumns(connection, 'notices')

  if (!noticeColumns.has('status')) {
    await connection.query("ALTER TABLE notices ADD COLUMN status varchar(50) DEFAULT '已发布'")
    noticeColumns.add('status')
  }

  if (!noticeColumns.has('source')) {
    await connection.query("ALTER TABLE notices ADD COLUMN source varchar(50) DEFAULT '房东发布'")
    noticeColumns.add('source')
  }

  const confirmationColumns = await getTableColumns(connection, 'notice_confirmations')

  if (!confirmationColumns.has('is_read')) {
    await connection.query('ALTER TABLE notice_confirmations ADD COLUMN is_read TINYINT(1) DEFAULT 0')
    confirmationColumns.add('is_read')
  }

  if (!confirmationColumns.has('is_confirmed')) {
    await connection.query(
      'ALTER TABLE notice_confirmations ADD COLUMN is_confirmed TINYINT(1) DEFAULT 0',
    )
    confirmationColumns.add('is_confirmed')
  }

  if (!confirmationColumns.has('read_time')) {
    await connection.query('ALTER TABLE notice_confirmations ADD COLUMN read_time DATETIME NULL')
    confirmationColumns.add('read_time')
  }

  if (!confirmationColumns.has('confirm_time')) {
    await connection.query('ALTER TABLE notice_confirmations ADD COLUMN confirm_time DATETIME NULL')
    confirmationColumns.add('confirm_time')
  }
}

const normalizeNoticePayload = (body) => {
  return {
    title: String(body.title || '').trim(),
    content: String(body.content || '').trim(),
    type: body.type || '公共通知',
    target_type: body.target_type || body.targetType || 'all',
    target_id: toNullable(body.target_id || body.targetId),
    need_confirm: body.need_confirm === true || body.needConfirm === true ? 1 : 0,
    status: body.status || '草稿',
    source: body.source || '房东发布',
  }
}

const validateNoticePayload = (notice) => {
  const typeList = ['账单通知', '合同通知', '公共通知', '生活提醒', '其他通知']
  const targetTypeList = ['all', 'tenant', 'room']

  if (!notice.title) {
    return '请输入通知标题'
  }

  if (!notice.content) {
    return '请输入通知内容'
  }

  if (!typeList.includes(notice.type)) {
    return '请选择正确的通知类型'
  }

  if (!targetTypeList.includes(notice.target_type)) {
    return '请选择正确的发送对象'
  }

  if (notice.target_type !== 'all' && !notice.target_id) {
    return '请选择具体发送对象'
  }

  return ''
}

const getNoticeTargetTenantIds = async (connection, notice) => {
  if (notice.target_type === 'all') {
    const [rows] = await connection.query(
      "SELECT id FROM tenants WHERE status = '在租' AND room_id IS NOT NULL",
    )

    return rows.map((row) => row.id)
  }

  if (notice.target_type === 'tenant') {
    const [rows] = await connection.query(
      "SELECT id FROM tenants WHERE id = ? AND status = '在租'",
      [notice.target_id],
    )

    return rows.map((row) => row.id)
  }

  if (notice.target_type === 'room') {
    const [rows] = await connection.query(
      "SELECT id FROM tenants WHERE room_id = ? AND status = '在租'",
      [notice.target_id],
    )

    return rows.map((row) => row.id)
  }

  return []
}

const syncNoticeConfirmations = async (connection, noticeId, notice) => {
  await connection.query('DELETE FROM notice_confirmations WHERE notice_id = ?', [noticeId])

  if (notice.status !== '已发布') {
    return
  }

  const tenantIds = await getNoticeTargetTenantIds(connection, notice)

  if (tenantIds.length === 0) {
    return
  }

  const values = tenantIds.map((tenantId) => {
    return [noticeId, tenantId, 0, notice.need_confirm ? 0 : 1]
  })

  await connection.query(
    `
      INSERT INTO notice_confirmations (notice_id, tenant_id, is_read, is_confirmed)
      VALUES ?
    `,
    [values],
  )
}

const insertNotice = async (connection, notice) => {
  await ensureNoticeSchema(connection)

  const [result] = await connection.query(
    `
      INSERT INTO notices (
        title,
        content,
        type,
        target_type,
        target_id,
        need_confirm,
        publish_time,
        status,
        source
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      notice.title,
      notice.content,
      notice.type,
      notice.target_type,
      notice.target_id,
      notice.need_confirm,
      notice.status === '已发布' ? new Date() : null,
      notice.status,
      notice.source,
    ],
  )

  await syncNoticeConfirmations(connection, result.insertId, notice)

  return result
}

const updateNotice = async (connection, noticeId, notice) => {
  await ensureNoticeSchema(connection)

  await connection.query(
    `
      UPDATE notices
      SET
        title = ?,
        content = ?,
        type = ?,
        target_type = ?,
        target_id = ?,
        need_confirm = ?,
        publish_time = CASE
          WHEN ? = '已发布' AND publish_time IS NULL THEN NOW()
          WHEN ? <> '已发布' THEN NULL
          ELSE publish_time
        END,
        status = ?,
        source = ?
      WHERE id = ?
    `,
    [
      notice.title,
      notice.content,
      notice.type,
      notice.target_type,
      notice.target_id,
      notice.need_confirm,
      notice.status,
      notice.status,
      notice.status,
      notice.source,
      noticeId,
    ],
  )

  await syncNoticeConfirmations(connection, noticeId, notice)
}

const ensureUtilityBillSchema = async (connection) => {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS utility_bills (
      id INT AUTO_INCREMENT PRIMARY KEY,
      bill_no VARCHAR(100) NOT NULL,
      tenant_id INT NOT NULL,
      room_id INT NULL,
      bill_month VARCHAR(20) NOT NULL,
      water_previous DECIMAL(10, 2) DEFAULT 0,
      water_current DECIMAL(10, 2) DEFAULT 0,
      water_unit_price DECIMAL(10, 2) DEFAULT 0,
      water_usage DECIMAL(10, 2) DEFAULT 0,
      water_fee DECIMAL(10, 2) DEFAULT 0,
      electricity_previous DECIMAL(10, 2) DEFAULT 0,
      electricity_current DECIMAL(10, 2) DEFAULT 0,
      electricity_unit_price DECIMAL(10, 2) DEFAULT 0,
      electricity_usage DECIMAL(10, 2) DEFAULT 0,
      electricity_fee DECIMAL(10, 2) DEFAULT 0,
      gas_previous DECIMAL(10, 2) DEFAULT 0,
      gas_current DECIMAL(10, 2) DEFAULT 0,
      gas_unit_price DECIMAL(10, 2) DEFAULT 0,
      gas_usage DECIMAL(10, 2) DEFAULT 0,
      gas_fee DECIMAL(10, 2) DEFAULT 0,
      other_fee DECIMAL(10, 2) DEFAULT 0,
      total_amount DECIMAL(10, 2) DEFAULT 0,
      due_date DATE NULL,
      status VARCHAR(50) DEFAULT '待确认',
      remark TEXT NULL,
      confirm_time DATETIME NULL,
      pay_time DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_utility_bill_no (bill_no),
      KEY idx_utility_bills_tenant (tenant_id),
      KEY idx_utility_bills_room (room_id),
      KEY idx_utility_bills_month (bill_month)
    )
  `)

  tableColumnCache.delete('utility_bills')
}

const utilityBillStatusList = ['待确认', '待缴费', '未缴费', '已缴费', '已逾期']

const numberOrZero = (value) => {
  const number = Number(value)

  return Number.isFinite(number) ? number : 0
}

const calculateUsage = (current, previous) => {
  return Math.max(0, Number((numberOrZero(current) - numberOrZero(previous)).toFixed(2)))
}

const calculateFee = (usage, unitPrice) => {
  return Number((numberOrZero(usage) * numberOrZero(unitPrice)).toFixed(2))
}

const normalizeUtilityBillPayload = (body) => {
  const waterUsage = calculateUsage(body.water_current ?? body.waterCurrent, body.water_previous ?? body.waterPrevious)
  const electricityUsage = calculateUsage(
    body.electricity_current ?? body.electricityCurrent,
    body.electricity_previous ?? body.electricityPrevious,
  )
  const gasUsage = calculateUsage(body.gas_current ?? body.gasCurrent, body.gas_previous ?? body.gasPrevious)

  const waterFee = calculateFee(waterUsage, body.water_unit_price ?? body.waterUnitPrice)
  const electricityFee = calculateFee(electricityUsage, body.electricity_unit_price ?? body.electricityUnitPrice)
  const gasFee = calculateFee(gasUsage, body.gas_unit_price ?? body.gasUnitPrice)
  const otherFee = numberOrZero(body.other_fee ?? body.otherFee)

  return {
    bill_no: String(body.bill_no || body.billNo || '').trim(),
    tenant_id: Number(body.tenant_id || body.tenantId),
    bill_month: String(body.bill_month || body.billMonth || '').trim(),
    water_previous: numberOrZero(body.water_previous ?? body.waterPrevious),
    water_current: numberOrZero(body.water_current ?? body.waterCurrent),
    water_unit_price: numberOrZero(body.water_unit_price ?? body.waterUnitPrice),
    water_usage: waterUsage,
    water_fee: waterFee,
    electricity_previous: numberOrZero(body.electricity_previous ?? body.electricityPrevious),
    electricity_current: numberOrZero(body.electricity_current ?? body.electricityCurrent),
    electricity_unit_price: numberOrZero(body.electricity_unit_price ?? body.electricityUnitPrice),
    electricity_usage: electricityUsage,
    electricity_fee: electricityFee,
    gas_previous: numberOrZero(body.gas_previous ?? body.gasPrevious),
    gas_current: numberOrZero(body.gas_current ?? body.gasCurrent),
    gas_unit_price: numberOrZero(body.gas_unit_price ?? body.gasUnitPrice),
    gas_usage: gasUsage,
    gas_fee: gasFee,
    other_fee: otherFee,
    total_amount: Number((waterFee + electricityFee + gasFee + otherFee).toFixed(2)),
    due_date: toNullable(body.due_date || body.dueDate),
    status: body.status || '待确认',
    remark: toNullable(body.remark),
  }
}

const validateUtilityBillPayload = (bill) => {
  if (!bill.bill_no) {
    return '请输入账单编号'
  }

  if (!bill.tenant_id) {
    return '请选择租客'
  }

  if (!bill.bill_month) {
    return '请选择账单月份'
  }

  if (!bill.due_date) {
    return '请选择缴费截止日'
  }

  if (!utilityBillStatusList.includes(bill.status)) {
    return '请选择正确的账单状态'
  }

  return ''
}

const getTenantForUtilityBill = async (connection, tenantId) => {
  const [rows] = await connection.query(
    `
      SELECT
        t.id,
        t.name,
        t.phone,
        t.status,
        t.room_id,
        r.room_number,
        r.building_id,
        b.name AS building_name
      FROM tenants t
      LEFT JOIN rooms r ON t.room_id = r.id
      LEFT JOIN buildings b ON r.building_id = b.id
      WHERE t.id = ?
      LIMIT 1
    `,
    [tenantId],
  )

  return rows[0]
}

const createUtilityBillNotice = async (connection, bill, tenant, force = false) => {
  await ensureNoticeSchema(connection)

  const title = `${bill.bill_month} 水电账单通知`

  if (!force) {
    const [rows] = await connection.query(
      `
        SELECT id
        FROM notices
        WHERE source = '系统自动'
          AND type = '账单通知'
          AND target_type = 'tenant'
          AND target_id = ?
          AND title = ?
        LIMIT 1
      `,
      [bill.tenant_id, title],
    )

    if (rows.length > 0) {
      return null
    }
  }

  const content = [
    `您的 ${bill.bill_month} 水电账单已生成。`,
    `房间：${tenant?.building_name || ''} ${tenant?.room_number || ''}`,
    `本期合计：¥${bill.total_amount}`,
    `缴费截止日：${bill.due_date}`,
    '请登录租客端查看并确认账单。',
  ].join('\n')

  const result = await insertNotice(connection, {
    title,
    content,
    type: '账单通知',
    target_type: 'tenant',
    target_id: bill.tenant_id,
    need_confirm: 1,
    status: '已发布',
    source: '系统自动',
  })

  return result.insertId
}

const ensureWorkOrderSchema = async (connection) => {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS work_orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_no VARCHAR(100) NOT NULL,
      tenant_id INT NOT NULL,
      room_id INT NULL,
      type VARCHAR(50) NOT NULL,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      priority VARCHAR(50) DEFAULT '普通',
      status VARCHAR(50) DEFAULT '待处理',
      expected_time DATETIME NULL,
      contact_phone VARCHAR(50) NULL,
      images TEXT NULL,
      related_contract_no VARCHAR(100) NULL,
      handler VARCHAR(100) NULL,
      handle_result TEXT NULL,
      handle_time DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_work_order_no (order_no),
      KEY idx_work_orders_tenant (tenant_id),
      KEY idx_work_orders_room (room_id),
      KEY idx_work_orders_status (status)
    )
  `)

  tableColumnCache.delete('work_orders')
}

const workOrderTypeList = ['维修申请', '开门申请', '打扫申请', '退租申请', '其他申请', '合同审批']
const workOrderStatusList = ['待处理', '处理中', '已通过', '已驳回', '已完成', '已撤销']
const workOrderPriorityList = ['普通', '紧急']

const parseImages = (value) => {
  if (!value) {
    return []
  }

  if (Array.isArray(value)) {
    return value
  }

  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const normalizeWorkOrderPayload = (body) => {
  return {
    order_no: String(body.order_no || body.orderNo || '').trim(),
    tenant_id: Number(body.tenant_id || body.tenantId),
    type: String(body.type || '').trim(),
    title: String(body.title || '').trim(),
    content: String(body.content || body.description || '').trim(),
    priority: body.priority || '普通',
    status: body.status || '待处理',
    expected_time: toNullable(body.expected_time || body.expectedTime),
    contact_phone: toNullable(body.contact_phone || body.phone),
    images: parseImages(body.images).slice(0, 3),
    related_contract_no: toNullable(body.related_contract_no || body.relatedContractNo),
    handler: toNullable(body.handler),
    handle_result: toNullable(body.handle_result || body.handleResult),
  }
}

const validateWorkOrderPayload = (order) => {
  if (!order.order_no) return '请输入工单编号'
  if (!order.tenant_id) return '缺少租客信息'
  if (!workOrderTypeList.includes(order.type)) return '请选择正确的工单类型'
  if (!order.title) return '请输入工单标题'
  if (!order.content) return '请输入工单内容'
  if (!workOrderPriorityList.includes(order.priority)) return '请选择正确的优先级'
  if (!workOrderStatusList.includes(order.status)) return '请选择正确的工单状态'

  return ''
}

const getTenantForWorkOrder = async (connection, tenantId) => {
  const [rows] = await connection.query(
    `
      SELECT
        t.id,
        t.name,
        t.phone,
        t.status,
        t.room_id,
        r.room_number,
        r.building_id,
        b.name AS building_name
      FROM tenants t
      LEFT JOIN rooms r ON t.room_id = r.id
      LEFT JOIN buildings b ON r.building_id = b.id
      WHERE t.id = ?
      LIMIT 1
    `,
    [tenantId],
  )

  return rows[0]
}

const createWorkOrderNotice = async (connection, order, tenant, title, content) => {
  await insertNotice(connection, {
    title,
    content,
    type: '生活提醒',
    target_type: 'tenant',
    target_id: order.tenant_id,
    need_confirm: 0,
    status: '已发布',
    source: '系统自动',
  })
}

// 新增房间
app.post('/api/rooms', async (req, res) => {
  const connection = await db.getConnection()

  try {
    const room = normalizeRoomPayload(req.body)
    const validateMessage = validateRoomPayload(room)

    if (validateMessage) {
      return res.status(400).json({
        code: 400,
        message: validateMessage,
      })
    }

    await connection.beginTransaction()

    const [buildingRows] = await connection.query(
      'SELECT id, name FROM buildings WHERE id = ? LIMIT 1',
      [room.building_id],
    )

    if (buildingRows.length === 0) {
      await connection.rollback()

      return res.status(400).json({
        code: 400,
        message: '楼栋不存在',
      })
    }

    const [duplicateRows] = await connection.query(
      `
        SELECT id
        FROM rooms
        WHERE building_id = ? AND room_number = ?
        LIMIT 1
      `,
      [room.building_id, room.room_number],
    )

    if (duplicateRows.length > 0) {
      await connection.rollback()

      return res.status(400).json({
        code: 400,
        message: '该楼栋下已存在这个房间号',
      })
    }

    const [building] = buildingRows
    const roomResult = await insertRoom(connection, room, building.name)

    await saveRoomImages(connection, roomResult.insertId, room.images)

    await connection.commit()

    res.json({
      code: 200,
      message: '新增房间成功',
      data: {
        id: roomResult.insertId,
      },
    })
  } catch (error) {
    await connection.rollback()

    res.status(500).json({
      code: 500,
      message: '新增房间失败',
      error: error.message,
    })
  } finally {
    connection.release()
  }
})

// 编辑房间
app.put('/api/rooms/:id', async (req, res) => {
  const connection = await db.getConnection()

  try {
    const roomId = req.params.id
    const room = normalizeRoomPayload(req.body)
    const validateMessage = validateRoomPayload(room)

    if (validateMessage) {
      return res.status(400).json({
        code: 400,
        message: validateMessage,
      })
    }

    await connection.beginTransaction()

    const [roomRows] = await connection.query(
      'SELECT id, current_tenant_id FROM rooms WHERE id = ? LIMIT 1',
      [roomId],
    )

    if (roomRows.length === 0) {
      await connection.rollback()

      return res.status(404).json({
        code: 404,
        message: '房间不存在',
      })
    }

    if (roomRows[0].current_tenant_id && room.status !== '已出租') {
      await connection.rollback()

      return res.status(400).json({
        code: 400,
        message: '该房间已绑定租客，状态必须保持为已出租',
      })
    }

    const [buildingRows] = await connection.query(
      'SELECT id, name FROM buildings WHERE id = ? LIMIT 1',
      [room.building_id],
    )

    if (buildingRows.length === 0) {
      await connection.rollback()

      return res.status(400).json({
        code: 400,
        message: '楼栋不存在',
      })
    }

    const [duplicateRows] = await connection.query(
      `
        SELECT id
        FROM rooms
        WHERE building_id = ? AND room_number = ? AND id <> ?
        LIMIT 1
      `,
      [room.building_id, room.room_number, roomId],
    )

    if (duplicateRows.length > 0) {
      await connection.rollback()

      return res.status(400).json({
        code: 400,
        message: '该楼栋下已存在这个房间号',
      })
    }

    const [building] = buildingRows

    await updateRoom(connection, roomId, room, building.name)

    await saveRoomImages(connection, roomId, room.images)

    await connection.commit()

    res.json({
      code: 200,
      message: '编辑房间成功',
    })
  } catch (error) {
    await connection.rollback()

    res.status(500).json({
      code: 500,
      message: '编辑房间失败',
      error: error.message,
    })
  } finally {
    connection.release()
  }
})

// 删除房间
app.delete('/api/rooms/:id', async (req, res) => {
  const connection = await db.getConnection()

  try {
    const roomId = req.params.id

    await connection.beginTransaction()

    const [roomRows] = await connection.query(
      'SELECT id, current_tenant_id FROM rooms WHERE id = ? LIMIT 1',
      [roomId],
    )

    if (roomRows.length === 0) {
      await connection.rollback()

      return res.status(404).json({
        code: 404,
        message: '房间不存在',
      })
    }

    if (roomRows[0].current_tenant_id) {
      await connection.rollback()

      return res.status(400).json({
        code: 400,
        message: '该房间已绑定租客，不能直接删除',
      })
    }

    await connection.query('DELETE FROM room_images WHERE room_id = ?', [roomId])
    await connection.query('DELETE FROM rooms WHERE id = ?', [roomId])

    await connection.commit()

    res.json({
      code: 200,
      message: '删除房间成功',
    })
  } catch (error) {
    await connection.rollback()

    res.status(500).json({
      code: 500,
      message: '删除房间失败',
      error: error.message,
    })
  } finally {
    connection.release()
  }
})

// 查询合同列表
app.get('/api/contracts', async (req, res) => {
  try {
    const contractColumns = await getTableColumns(db, 'contracts')
    const signDateSelect = contractColumns.has('sign_date')
      ? 'c.sign_date,'
      : 'NULL AS sign_date,'
    const pdfUrlSelect = contractColumns.has('pdf_url')
      ? 'c.pdf_url,'
      : 'NULL AS pdf_url,'

    const sql = `
      SELECT
        c.id,
        c.contract_no,
        c.tenant_id,
        c.room_id,
        c.start_date,
        c.end_date,
        c.monthly_rent,
        c.deposit,
        ${signDateSelect}
        c.status,
        ${pdfUrlSelect}
        c.created_at,
        t.name AS tenant_name,
        t.phone AS tenant_phone,
        r.room_number,
        r.building_id,
        b.name AS building_name,
        DATEDIFF(c.end_date, CURDATE()) AS days_to_expire
      FROM contracts c
      LEFT JOIN tenants t ON c.tenant_id = t.id
      LEFT JOIN rooms r ON c.room_id = r.id
      LEFT JOIN buildings b ON r.building_id = b.id
      ORDER BY c.id DESC
    `

    const [rows] = await db.query(sql)

    res.json({
      code: 200,
      message: '查询成功',
      data: rows.map((contract) => {
        return {
          ...contract,
          is_expiring_soon:
            contract.status === '生效中' &&
            contract.days_to_expire !== null &&
            contract.days_to_expire >= 0 &&
            contract.days_to_expire <= 30,
        }
      }),
    })
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '查询合同失败',
      error: error.message,
    })
  }
})

// 查询未来 30 天内即将到期的生效中合同，后续通知管理可直接使用
app.get('/api/contracts/expiring-soon', async (req, res) => {
  try {
    const [rows] = await db.query(
      `
        SELECT
          c.id,
          c.contract_no,
          c.tenant_id,
          c.end_date,
          t.name AS tenant_name,
          t.phone AS tenant_phone,
          r.room_number,
          b.name AS building_name,
          DATEDIFF(c.end_date, CURDATE()) AS days_to_expire
        FROM contracts c
        LEFT JOIN tenants t ON c.tenant_id = t.id
        LEFT JOIN rooms r ON c.room_id = r.id
        LEFT JOIN buildings b ON r.building_id = b.id
        WHERE c.status = '生效中'
          AND c.end_date >= CURDATE()
          AND c.end_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
        ORDER BY c.end_date ASC
      `,
    )

    res.json({
      code: 200,
      message: '查询成功',
      data: rows,
    })
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '查询即将到期合同失败',
      error: error.message,
    })
  }
})

// 新增合同
app.post('/api/contracts', async (req, res) => {
  const connection = await db.getConnection()

  try {
    const contract = normalizeContractPayload(req.body)
    const validateMessage = validateContractPayload(contract)

    if (validateMessage) {
      return res.status(400).json({
        code: 400,
        message: validateMessage,
      })
    }

    await connection.beginTransaction()

    const tenant = await getTenantForContract(connection, contract.tenant_id)

    if (!tenant) {
      await connection.rollback()

      return res.status(400).json({
        code: 400,
        message: '租客不存在',
      })
    }

    if (tenant.status !== '在租' || !tenant.room_id) {
      await connection.rollback()

      return res.status(400).json({
        code: 400,
        message: '合同必须绑定在租且已入住房间的租客',
      })
    }

    const [duplicateRows] = await connection.query(
      'SELECT id FROM contracts WHERE contract_no = ? LIMIT 1',
      [contract.contract_no],
    )

    if (duplicateRows.length > 0) {
      await connection.rollback()

      return res.status(400).json({
        code: 400,
        message: '合同编号已存在',
      })
    }

    const result = await insertContract(connection, contract, tenant.room_id)

    if (contract.status === '生效中') {
      await connection.query(
        `
          UPDATE rooms
          SET lease_start = ?, lease_end = ?
          WHERE id = ?
        `,
        [contract.start_date, contract.end_date, tenant.room_id],
      )
    }

    await connection.commit()

    res.json({
      code: 200,
      message: '新增合同成功',
      data: {
        id: result.insertId,
      },
    })
  } catch (error) {
    await connection.rollback()

    res.status(500).json({
      code: 500,
      message: '新增合同失败',
      error: error.message,
    })
  } finally {
    connection.release()
  }
})

// 编辑合同
app.put('/api/contracts/:id', async (req, res) => {
  const connection = await db.getConnection()

  try {
    const contractId = req.params.id
    const contract = normalizeContractPayload(req.body)
    const validateMessage = validateContractPayload(contract)

    if (validateMessage) {
      return res.status(400).json({
        code: 400,
        message: validateMessage,
      })
    }

    await connection.beginTransaction()

    const [contractRows] = await connection.query(
      'SELECT id FROM contracts WHERE id = ? LIMIT 1',
      [contractId],
    )

    if (contractRows.length === 0) {
      await connection.rollback()

      return res.status(404).json({
        code: 404,
        message: '合同不存在',
      })
    }

    const tenant = await getTenantForContract(connection, contract.tenant_id)

    if (!tenant) {
      await connection.rollback()

      return res.status(400).json({
        code: 400,
        message: '租客不存在',
      })
    }

    if (tenant.status !== '在租' || !tenant.room_id) {
      await connection.rollback()

      return res.status(400).json({
        code: 400,
        message: '合同必须绑定在租且已入住房间的租客',
      })
    }

    const [duplicateRows] = await connection.query(
      'SELECT id FROM contracts WHERE contract_no = ? AND id <> ? LIMIT 1',
      [contract.contract_no, contractId],
    )

    if (duplicateRows.length > 0) {
      await connection.rollback()

      return res.status(400).json({
        code: 400,
        message: '合同编号已存在',
      })
    }

    await updateContract(connection, contractId, contract, tenant.room_id)

    if (contract.status === '生效中') {
      await connection.query(
        `
          UPDATE rooms
          SET lease_start = ?, lease_end = ?
          WHERE id = ?
        `,
        [contract.start_date, contract.end_date, tenant.room_id],
      )
    }

    await connection.commit()

    res.json({
      code: 200,
      message: '编辑合同成功',
    })
  } catch (error) {
    await connection.rollback()

    res.status(500).json({
      code: 500,
      message: '编辑合同失败',
      error: error.message,
    })
  } finally {
    connection.release()
  }
})

// 删除合同
app.delete('/api/contracts/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM contracts WHERE id = ?', [req.params.id])

    if (result.affectedRows === 0) {
      return res.status(404).json({
        code: 404,
        message: '合同不存在',
      })
    }

    res.json({
      code: 200,
      message: '删除合同成功',
    })
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '删除合同失败',
      error: error.message,
    })
  }
})

// 查询后台通知列表
app.get('/api/notices', async (req, res) => {
  const connection = await db.getConnection()

  try {
    await ensureNoticeSchema(connection)

    const [rows] = await connection.query(
      `
        SELECT
          n.id,
          n.title,
          n.content,
          n.type,
          n.target_type,
          n.target_id,
          n.need_confirm,
          n.publish_time,
          n.status,
          n.source,
          COUNT(nc.id) AS total_count,
          SUM(CASE WHEN nc.is_confirmed = 1 THEN 1 ELSE 0 END) AS confirm_count
        FROM notices n
        LEFT JOIN notice_confirmations nc ON n.id = nc.notice_id
        GROUP BY n.id
        ORDER BY n.id DESC
      `,
    )

    res.json({
      code: 200,
      message: '查询成功',
      data: rows,
    })
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '查询通知失败',
      error: error.message,
    })
  } finally {
    connection.release()
  }
})

// 新增通知
app.post('/api/notices', async (req, res) => {
  const connection = await db.getConnection()

  try {
    const notice = normalizeNoticePayload(req.body)
    const validateMessage = validateNoticePayload(notice)

    if (validateMessage) {
      return res.status(400).json({
        code: 400,
        message: validateMessage,
      })
    }

    await connection.beginTransaction()

    const result = await insertNotice(connection, notice)

    await connection.commit()

    res.json({
      code: 200,
      message: notice.status === '已发布' ? '通知发布成功' : '通知已保存为草稿',
      data: {
        id: result.insertId,
      },
    })
  } catch (error) {
    await connection.rollback()

    res.status(500).json({
      code: 500,
      message: '新增通知失败',
      error: error.message,
    })
  } finally {
    connection.release()
  }
})

// 编辑通知
app.put('/api/notices/:id', async (req, res) => {
  const connection = await db.getConnection()

  try {
    const notice = normalizeNoticePayload(req.body)
    const validateMessage = validateNoticePayload(notice)

    if (validateMessage) {
      return res.status(400).json({
        code: 400,
        message: validateMessage,
      })
    }

    await connection.beginTransaction()

    const [rows] = await connection.query('SELECT id FROM notices WHERE id = ? LIMIT 1', [
      req.params.id,
    ])

    if (rows.length === 0) {
      await connection.rollback()

      return res.status(404).json({
        code: 404,
        message: '通知不存在',
      })
    }

    await updateNotice(connection, req.params.id, notice)

    await connection.commit()

    res.json({
      code: 200,
      message: '通知修改成功',
    })
  } catch (error) {
    await connection.rollback()

    res.status(500).json({
      code: 500,
      message: '编辑通知失败',
      error: error.message,
    })
  } finally {
    connection.release()
  }
})

app.put('/api/notices/:id/status', async (req, res) => {
  const connection = await db.getConnection()

  try {
    const status = req.body.status

    if (!['草稿', '已发布', '已撤回'].includes(status)) {
      return res.status(400).json({
        code: 400,
        message: '通知状态不正确',
      })
    }

    await connection.beginTransaction()
    await ensureNoticeSchema(connection)

    const [rows] = await connection.query('SELECT * FROM notices WHERE id = ? LIMIT 1', [
      req.params.id,
    ])

    if (rows.length === 0) {
      await connection.rollback()

      return res.status(404).json({
        code: 404,
        message: '通知不存在',
      })
    }

    const notice = {
      ...rows[0],
      status,
      need_confirm: Number(rows[0].need_confirm) === 1 ? 1 : 0,
    }

    await connection.query(
      `
        UPDATE notices
        SET status = ?,
            publish_time = CASE
              WHEN ? = '已发布' THEN COALESCE(publish_time, NOW())
              ELSE NULL
            END
        WHERE id = ?
      `,
      [status, status, req.params.id],
    )

    await syncNoticeConfirmations(connection, req.params.id, notice)
    await connection.commit()

    res.json({
      code: 200,
      message: status === '已发布' ? '通知发布成功' : '通知状态已更新',
    })
  } catch (error) {
    await connection.rollback()

    res.status(500).json({
      code: 500,
      message: '更新通知状态失败',
      error: error.message,
    })
  } finally {
    connection.release()
  }
})

app.delete('/api/notices/:id', async (req, res) => {
  const connection = await db.getConnection()

  try {
    await connection.beginTransaction()
    await connection.query('DELETE FROM notice_confirmations WHERE notice_id = ?', [req.params.id])
    const [result] = await connection.query('DELETE FROM notices WHERE id = ?', [req.params.id])

    if (result.affectedRows === 0) {
      await connection.rollback()

      return res.status(404).json({
        code: 404,
        message: '通知不存在',
      })
    }

    await connection.commit()

    res.json({
      code: 200,
      message: '删除通知成功',
    })
  } catch (error) {
    await connection.rollback()

    res.status(500).json({
      code: 500,
      message: '删除通知失败',
      error: error.message,
    })
  } finally {
    connection.release()
  }
})

// 租客端通知列表
app.get('/api/tenant/notices', async (req, res) => {
  try {
    await ensureNoticeSchema(db)

    const tenantId = req.query.tenant_id

    if (!tenantId) {
      return res.status(400).json({
        code: 400,
        message: '缺少租客信息',
      })
    }

    const [rows] = await db.query(
      `
        SELECT
          n.id,
          n.title,
          n.content,
          n.type,
          n.target_type,
          n.need_confirm,
          n.publish_time,
          n.source,
          nc.is_read,
          nc.is_confirmed,
          nc.read_time,
          nc.confirm_time
        FROM notice_confirmations nc
        INNER JOIN notices n ON nc.notice_id = n.id
        WHERE nc.tenant_id = ?
          AND n.status = '已发布'
        ORDER BY n.publish_time DESC, n.id DESC
      `,
      [tenantId],
    )

    res.json({
      code: 200,
      message: '查询成功',
      data: rows,
    })
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '查询租客通知失败',
      error: error.message,
    })
  }
})

app.post('/api/tenant/notices/:id/read', async (req, res) => {
  try {
    await ensureNoticeSchema(db)

    await db.query(
      `
        UPDATE notice_confirmations
        SET is_read = 1,
            read_time = COALESCE(read_time, NOW())
        WHERE notice_id = ? AND tenant_id = ?
      `,
      [req.params.id, req.body.tenant_id],
    )

    res.json({
      code: 200,
      message: '已标记为已读',
    })
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '标记已读失败',
      error: error.message,
    })
  }
})

app.post('/api/tenant/notices/:id/confirm', async (req, res) => {
  try {
    await ensureNoticeSchema(db)

    await db.query(
      `
        UPDATE notice_confirmations
        SET is_read = 1,
            is_confirmed = 1,
            read_time = COALESCE(read_time, NOW()),
            confirm_time = COALESCE(confirm_time, NOW())
        WHERE notice_id = ? AND tenant_id = ?
      `,
      [req.params.id, req.body.tenant_id],
    )

    res.json({
      code: 200,
      message: '通知已确认',
    })
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '确认通知失败',
      error: error.message,
    })
  }
})

// 系统通知入口：合同到期、月底租金等后续任务可定时调用
app.post('/api/system/notices/generate', async (req, res) => {
  const connection = await db.getConnection()

  try {
    await connection.beginTransaction()

    let createdCount = 0
    const [contracts] = await connection.query(
      `
        SELECT c.id, c.contract_no, c.tenant_id, c.end_date, r.room_number
        FROM contracts c
        LEFT JOIN rooms r ON c.room_id = r.id
        WHERE c.status = '生效中'
          AND c.end_date >= CURDATE()
          AND c.end_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
          AND NOT EXISTS (
            SELECT 1 FROM notices n
            WHERE n.source = '系统自动'
              AND n.type = '合同通知'
              AND n.target_type = 'tenant'
              AND n.target_id = c.tenant_id
              AND n.title = CONCAT('合同即将到期提醒 - ', c.contract_no)
          )
      `,
    )

    for (const contract of contracts) {
      await insertNotice(connection, {
        title: `合同即将到期提醒 - ${contract.contract_no}`,
        content: `您的 ${contract.room_number || ''} 房间合同将于 ${String(contract.end_date).slice(0, 10)} 到期。如需续租，请及时联系房东。`,
        type: '合同通知',
        target_type: 'tenant',
        target_id: contract.tenant_id,
        need_confirm: 1,
        status: '已发布',
        source: '系统自动',
      })
      createdCount += 1
    }

    await connection.commit()

    res.json({
      code: 200,
      message: '系统通知生成完成',
      data: {
        createdCount,
      },
    })
  } catch (error) {
    await connection.rollback()

    res.status(500).json({
      code: 500,
      message: '系统通知生成失败',
      error: error.message,
    })
  } finally {
    connection.release()
  }
})

app.get('/api/utility-bills', async (req, res) => {
  const connection = await db.getConnection()

  try {
    await ensureUtilityBillSchema(connection)

    const [rows] = await connection.query(
      `
        SELECT
          ub.*,
          t.name AS tenant_name,
          t.phone AS tenant_phone,
          r.room_number,
          r.building_id,
          b.name AS building_name
        FROM utility_bills ub
        LEFT JOIN tenants t ON ub.tenant_id = t.id
        LEFT JOIN rooms r ON ub.room_id = r.id
        LEFT JOIN buildings b ON r.building_id = b.id
        ORDER BY ub.bill_month DESC, ub.id DESC
      `,
    )

    res.json({
      code: 200,
      message: '查询成功',
      data: rows,
    })
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '查询水电账单失败',
      error: error.message,
    })
  } finally {
    connection.release()
  }
})

app.post('/api/utility-bills', async (req, res) => {
  const connection = await db.getConnection()

  try {
    await ensureUtilityBillSchema(connection)

    const bill = normalizeUtilityBillPayload(req.body)
    const validateMessage = validateUtilityBillPayload(bill)

    if (validateMessage) {
      return res.status(400).json({
        code: 400,
        message: validateMessage,
      })
    }

    await connection.beginTransaction()

    const tenant = await getTenantForUtilityBill(connection, bill.tenant_id)

    if (!tenant || tenant.status !== '在租' || !tenant.room_id) {
      await connection.rollback()
      return res.status(400).json({
        code: 400,
        message: '只能给已绑定房间的在租租客创建账单',
      })
    }

    const [duplicateRows] = await connection.query(
      'SELECT id FROM utility_bills WHERE bill_no = ? LIMIT 1',
      [bill.bill_no],
    )

    if (duplicateRows.length > 0) {
      await connection.rollback()
      return res.status(400).json({
        code: 400,
        message: '账单编号已存在',
      })
    }

    const [result] = await connection.query(
      `
        INSERT INTO utility_bills (
          bill_no, tenant_id, room_id, bill_month,
          water_previous, water_current, water_unit_price, water_usage, water_fee,
          electricity_previous, electricity_current, electricity_unit_price, electricity_usage, electricity_fee,
          gas_previous, gas_current, gas_unit_price, gas_usage, gas_fee,
          other_fee, total_amount, due_date, status, remark
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        bill.bill_no,
        bill.tenant_id,
        tenant.room_id,
        bill.bill_month,
        bill.water_previous,
        bill.water_current,
        bill.water_unit_price,
        bill.water_usage,
        bill.water_fee,
        bill.electricity_previous,
        bill.electricity_current,
        bill.electricity_unit_price,
        bill.electricity_usage,
        bill.electricity_fee,
        bill.gas_previous,
        bill.gas_current,
        bill.gas_unit_price,
        bill.gas_usage,
        bill.gas_fee,
        bill.other_fee,
        bill.total_amount,
        bill.due_date,
        bill.status,
        bill.remark,
      ],
    )

    await createUtilityBillNotice(connection, bill, tenant)
    await connection.commit()

    res.json({
      code: 200,
      message: '新增水电账单成功',
      data: {
        id: result.insertId,
      },
    })
  } catch (error) {
    await connection.rollback()

    res.status(500).json({
      code: 500,
      message: '新增水电账单失败',
      error: error.message,
    })
  } finally {
    connection.release()
  }
})

app.put('/api/utility-bills/:id', async (req, res) => {
  const connection = await db.getConnection()

  try {
    await ensureUtilityBillSchema(connection)

    const bill = normalizeUtilityBillPayload(req.body)
    const validateMessage = validateUtilityBillPayload(bill)

    if (validateMessage) {
      return res.status(400).json({
        code: 400,
        message: validateMessage,
      })
    }

    await connection.beginTransaction()

    const tenant = await getTenantForUtilityBill(connection, bill.tenant_id)

    if (!tenant || tenant.status !== '在租' || !tenant.room_id) {
      await connection.rollback()
      return res.status(400).json({
        code: 400,
        message: '只能给已绑定房间的在租租客创建账单',
      })
    }

    const [duplicateRows] = await connection.query(
      'SELECT id FROM utility_bills WHERE bill_no = ? AND id <> ? LIMIT 1',
      [bill.bill_no, req.params.id],
    )

    if (duplicateRows.length > 0) {
      await connection.rollback()
      return res.status(400).json({
        code: 400,
        message: '账单编号已存在',
      })
    }

    const [result] = await connection.query(
      `
        UPDATE utility_bills
        SET
          bill_no = ?,
          tenant_id = ?,
          room_id = ?,
          bill_month = ?,
          water_previous = ?,
          water_current = ?,
          water_unit_price = ?,
          water_usage = ?,
          water_fee = ?,
          electricity_previous = ?,
          electricity_current = ?,
          electricity_unit_price = ?,
          electricity_usage = ?,
          electricity_fee = ?,
          gas_previous = ?,
          gas_current = ?,
          gas_unit_price = ?,
          gas_usage = ?,
          gas_fee = ?,
          other_fee = ?,
          total_amount = ?,
          due_date = ?,
          status = ?,
          remark = ?
        WHERE id = ?
      `,
      [
        bill.bill_no,
        bill.tenant_id,
        tenant.room_id,
        bill.bill_month,
        bill.water_previous,
        bill.water_current,
        bill.water_unit_price,
        bill.water_usage,
        bill.water_fee,
        bill.electricity_previous,
        bill.electricity_current,
        bill.electricity_unit_price,
        bill.electricity_usage,
        bill.electricity_fee,
        bill.gas_previous,
        bill.gas_current,
        bill.gas_unit_price,
        bill.gas_usage,
        bill.gas_fee,
        bill.other_fee,
        bill.total_amount,
        bill.due_date,
        bill.status,
        bill.remark,
        req.params.id,
      ],
    )

    if (result.affectedRows === 0) {
      await connection.rollback()
      return res.status(404).json({
        code: 404,
        message: '水电账单不存在',
      })
    }

    await connection.commit()

    res.json({
      code: 200,
      message: '水电账单修改成功',
    })
  } catch (error) {
    await connection.rollback()

    res.status(500).json({
      code: 500,
      message: '修改水电账单失败',
      error: error.message,
    })
  } finally {
    connection.release()
  }
})

app.put('/api/utility-bills/:id/status', async (req, res) => {
  try {
    const status = req.body.status

    if (!utilityBillStatusList.includes(status)) {
      return res.status(400).json({
        code: 400,
        message: '账单状态不正确',
      })
    }

    const [result] = await db.query(
      `
        UPDATE utility_bills
        SET status = ?,
            confirm_time = CASE WHEN ? IN ('待缴费', '已缴费') THEN COALESCE(confirm_time, NOW()) ELSE confirm_time END,
            pay_time = CASE WHEN ? = '已缴费' THEN COALESCE(pay_time, NOW()) ELSE pay_time END
        WHERE id = ?
      `,
      [status, status, status, req.params.id],
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({
        code: 404,
        message: '水电账单不存在',
      })
    }

    res.json({
      code: 200,
      message: '账单状态已更新',
    })
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '更新账单状态失败',
      error: error.message,
    })
  }
})

app.post('/api/utility-bills/:id/notice', async (req, res) => {
  const connection = await db.getConnection()

  try {
    await ensureUtilityBillSchema(connection)
    await connection.beginTransaction()

    const [rows] = await connection.query(
      `
        SELECT ub.*, t.name, t.room_id, r.room_number, b.name AS building_name
        FROM utility_bills ub
        LEFT JOIN tenants t ON ub.tenant_id = t.id
        LEFT JOIN rooms r ON ub.room_id = r.id
        LEFT JOIN buildings b ON r.building_id = b.id
        WHERE ub.id = ?
        LIMIT 1
      `,
      [req.params.id],
    )

    if (rows.length === 0) {
      await connection.rollback()
      return res.status(404).json({
        code: 404,
        message: '水电账单不存在',
      })
    }

    const bill = rows[0]
    const noticeId = await createUtilityBillNotice(connection, bill, bill, true)

    await connection.commit()

    res.json({
      code: 200,
      message: '账单通知已发送',
      data: { noticeId },
    })
  } catch (error) {
    await connection.rollback()

    res.status(500).json({
      code: 500,
      message: '发送账单通知失败',
      error: error.message,
    })
  } finally {
    connection.release()
  }
})

app.delete('/api/utility-bills/:id', async (req, res) => {
  try {
    await ensureUtilityBillSchema(db)

    const [result] = await db.query('DELETE FROM utility_bills WHERE id = ?', [req.params.id])

    if (result.affectedRows === 0) {
      return res.status(404).json({
        code: 404,
        message: '水电账单不存在',
      })
    }

    res.json({
      code: 200,
      message: '删除水电账单成功',
    })
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '删除水电账单失败',
      error: error.message,
    })
  }
})

app.get('/api/tenant/utility-bills', async (req, res) => {
  try {
    await ensureUtilityBillSchema(db)

    const tenantId = req.query.tenant_id

    if (!tenantId) {
      return res.status(400).json({
        code: 400,
        message: '缺少租客信息',
      })
    }

    const [rows] = await db.query(
      `
        SELECT
          ub.*,
          r.room_number,
          b.name AS building_name
        FROM utility_bills ub
        LEFT JOIN rooms r ON ub.room_id = r.id
        LEFT JOIN buildings b ON r.building_id = b.id
        WHERE ub.tenant_id = ?
        ORDER BY ub.bill_month DESC, ub.id DESC
      `,
      [tenantId],
    )

    res.json({
      code: 200,
      message: '查询成功',
      data: rows,
    })
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '查询租客水电账单失败',
      error: error.message,
    })
  }
})

app.post('/api/tenant/utility-bills/:id/confirm', async (req, res) => {
  try {
    await ensureUtilityBillSchema(db)

    const [result] = await db.query(
      `
        UPDATE utility_bills
        SET status = '待缴费',
            confirm_time = COALESCE(confirm_time, NOW())
        WHERE id = ? AND tenant_id = ? AND status IN ('待确认', '未缴费')
      `,
      [req.params.id, req.body.tenant_id],
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({
        code: 404,
        message: '没有找到可确认的账单',
      })
    }

    res.json({
      code: 200,
      message: '账单已确认',
    })
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '确认账单失败',
      error: error.message,
    })
  }
})

app.post('/api/tenant/utility-bills/:id/pay', async (req, res) => {
  try {
    await ensureUtilityBillSchema(db)

    const [result] = await db.query(
      `
        UPDATE utility_bills
        SET status = '已缴费',
            confirm_time = COALESCE(confirm_time, NOW()),
            pay_time = COALESCE(pay_time, NOW())
        WHERE id = ? AND tenant_id = ? AND status IN ('待确认', '待缴费', '未缴费', '已逾期')
      `,
      [req.params.id, req.body.tenant_id],
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({
        code: 404,
        message: '没有找到可缴费的账单',
      })
    }

    res.json({
      code: 200,
      message: '账单已标记为已缴费',
    })
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '确认缴费失败',
      error: error.message,
    })
  }
})

app.get('/api/work-orders', async (req, res) => {
  const connection = await db.getConnection()

  try {
    await ensureWorkOrderSchema(connection)

    const [rows] = await connection.query(
      `
        SELECT
          wo.*,
          t.name AS tenant_name,
          t.phone AS tenant_phone,
          r.room_number,
          r.building_id,
          b.name AS building_name
        FROM work_orders wo
        LEFT JOIN tenants t ON wo.tenant_id = t.id
        LEFT JOIN rooms r ON wo.room_id = r.id
        LEFT JOIN buildings b ON r.building_id = b.id
        ORDER BY wo.created_at DESC, wo.id DESC
      `,
    )

    res.json({
      code: 200,
      message: '查询成功',
      data: rows,
    })
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '查询工单失败',
      error: error.message,
    })
  } finally {
    connection.release()
  }
})

app.post('/api/work-orders', async (req, res) => {
  const connection = await db.getConnection()

  try {
    await ensureWorkOrderSchema(connection)
    const order = normalizeWorkOrderPayload(req.body)
    const validateMessage = validateWorkOrderPayload(order)

    if (validateMessage) {
      return res.status(400).json({ code: 400, message: validateMessage })
    }

    await connection.beginTransaction()

    const tenant = await getTenantForWorkOrder(connection, order.tenant_id)

    if (!tenant || tenant.status !== '在租' || !tenant.room_id) {
      await connection.rollback()
      return res.status(400).json({
        code: 400,
        message: '只能为已绑定房间的在租租客创建工单',
      })
    }

    const [duplicateRows] = await connection.query(
      'SELECT id FROM work_orders WHERE order_no = ? LIMIT 1',
      [order.order_no],
    )

    if (duplicateRows.length > 0) {
      await connection.rollback()
      return res.status(400).json({ code: 400, message: '工单编号已存在' })
    }

    const [result] = await connection.query(
      `
        INSERT INTO work_orders (
          order_no, tenant_id, room_id, type, title, content, priority, status,
          expected_time, contact_phone, images, related_contract_no, handler, handle_result,
          handle_time
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        order.order_no,
        order.tenant_id,
        tenant.room_id,
        order.type,
        order.title,
        order.content,
        order.priority,
        order.status,
        order.expected_time,
        order.contact_phone || tenant.phone,
        JSON.stringify(order.images),
        order.related_contract_no,
        order.handler,
        order.handle_result,
        order.status !== '待处理' ? new Date() : null,
      ],
    )

    await connection.commit()

    res.json({
      code: 200,
      message: '新增工单成功',
      data: { id: result.insertId },
    })
  } catch (error) {
    await connection.rollback()

    res.status(500).json({
      code: 500,
      message: '新增工单失败',
      error: error.message,
    })
  } finally {
    connection.release()
  }
})

app.put('/api/work-orders/:id', async (req, res) => {
  const connection = await db.getConnection()

  try {
    await ensureWorkOrderSchema(connection)
    const order = normalizeWorkOrderPayload(req.body)
    const validateMessage = validateWorkOrderPayload(order)

    if (validateMessage) {
      return res.status(400).json({ code: 400, message: validateMessage })
    }

    await connection.beginTransaction()

    const tenant = await getTenantForWorkOrder(connection, order.tenant_id)
    if (!tenant || tenant.status !== '在租' || !tenant.room_id) {
      await connection.rollback()
      return res.status(400).json({
        code: 400,
        message: '只能为已绑定房间的在租租客创建工单',
      })
    }

    const [duplicateRows] = await connection.query(
      'SELECT id FROM work_orders WHERE order_no = ? AND id <> ? LIMIT 1',
      [order.order_no, req.params.id],
    )

    if (duplicateRows.length > 0) {
      await connection.rollback()
      return res.status(400).json({ code: 400, message: '工单编号已存在' })
    }

    const [result] = await connection.query(
      `
        UPDATE work_orders
        SET
          order_no = ?,
          tenant_id = ?,
          room_id = ?,
          type = ?,
          title = ?,
          content = ?,
          priority = ?,
          status = ?,
          expected_time = ?,
          contact_phone = ?,
          images = ?,
          related_contract_no = ?,
          handler = ?,
          handle_result = ?,
          handle_time = CASE WHEN ? <> '待处理' THEN COALESCE(handle_time, NOW()) ELSE handle_time END
        WHERE id = ?
      `,
      [
        order.order_no,
        order.tenant_id,
        tenant.room_id,
        order.type,
        order.title,
        order.content,
        order.priority,
        order.status,
        order.expected_time,
        order.contact_phone || tenant.phone,
        JSON.stringify(order.images),
        order.related_contract_no,
        order.handler,
        order.handle_result,
        order.status,
        req.params.id,
      ],
    )

    if (result.affectedRows === 0) {
      await connection.rollback()
      return res.status(404).json({ code: 404, message: '工单不存在' })
    }

    await connection.commit()
    res.json({ code: 200, message: '工单修改成功' })
  } catch (error) {
    await connection.rollback()

    res.status(500).json({
      code: 500,
      message: '修改工单失败',
      error: error.message,
    })
  } finally {
    connection.release()
  }
})

app.put('/api/work-orders/:id/status', async (req, res) => {
  const connection = await db.getConnection()

  try {
    await ensureWorkOrderSchema(connection)
    const status = req.body.status
    const handleResult = toNullable(req.body.handle_result || req.body.handleResult)
    const handler = req.body.handler || '房东'

    if (!workOrderStatusList.includes(status)) {
      return res.status(400).json({ code: 400, message: '工单状态不正确' })
    }

    await connection.beginTransaction()

    const [rows] = await connection.query(
      `
        SELECT wo.*, t.name, t.phone, r.room_number, b.name AS building_name
        FROM work_orders wo
        LEFT JOIN tenants t ON wo.tenant_id = t.id
        LEFT JOIN rooms r ON wo.room_id = r.id
        LEFT JOIN buildings b ON r.building_id = b.id
        WHERE wo.id = ?
        LIMIT 1
      `,
      [req.params.id],
    )

    if (rows.length === 0) {
      await connection.rollback()
      return res.status(404).json({ code: 404, message: '工单不存在' })
    }

    const order = rows[0]

    await connection.query(
      `
        UPDATE work_orders
        SET status = ?,
            handler = ?,
            handle_result = ?,
            handle_time = NOW()
        WHERE id = ?
      `,
      [status, handler, handleResult || `工单状态已更新为${status}`, req.params.id],
    )

    const noticeTitle = `工单进展通知 - ${order.order_no}`
    const noticeContent = [
      `您的工单《${order.title}》状态已更新为：${status}。`,
      handleResult ? `处理说明：${handleResult}` : '',
    ].filter(Boolean).join('\n')

    await createWorkOrderNotice(connection, order, order, noticeTitle, noticeContent)
    await connection.commit()

    res.json({ code: 200, message: '工单状态已更新' })
  } catch (error) {
    await connection.rollback()

    res.status(500).json({
      code: 500,
      message: '更新工单状态失败',
      error: error.message,
    })
  } finally {
    connection.release()
  }
})

app.delete('/api/work-orders/:id', async (req, res) => {
  try {
    await ensureWorkOrderSchema(db)
    const [result] = await db.query('DELETE FROM work_orders WHERE id = ?', [req.params.id])

    if (result.affectedRows === 0) {
      return res.status(404).json({ code: 404, message: '工单不存在' })
    }

    res.json({ code: 200, message: '删除工单成功' })
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '删除工单失败',
      error: error.message,
    })
  }
})

app.get('/api/tenant/work-orders', async (req, res) => {
  try {
    await ensureWorkOrderSchema(db)
    const tenantId = req.query.tenant_id

    if (!tenantId) {
      return res.status(400).json({ code: 400, message: '缺少租客信息' })
    }

    const [rows] = await db.query(
      `
        SELECT wo.*, r.room_number, b.name AS building_name
        FROM work_orders wo
        LEFT JOIN rooms r ON wo.room_id = r.id
        LEFT JOIN buildings b ON r.building_id = b.id
        WHERE wo.tenant_id = ?
        ORDER BY wo.created_at DESC, wo.id DESC
      `,
      [tenantId],
    )

    res.json({ code: 200, message: '查询成功', data: rows })
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '查询租客工单失败',
      error: error.message,
    })
  }
})

app.post('/api/tenant/work-orders', async (req, res) => {
  const connection = await db.getConnection()

  try {
    await ensureWorkOrderSchema(connection)
    const order = normalizeWorkOrderPayload({
      ...req.body,
      status: '待处理',
      priority: req.body.priority || '普通',
    })
    const validateMessage = validateWorkOrderPayload(order)

    if (validateMessage) {
      return res.status(400).json({ code: 400, message: validateMessage })
    }

    await connection.beginTransaction()

    const tenant = await getTenantForWorkOrder(connection, order.tenant_id)
    if (!tenant || tenant.status !== '在租' || !tenant.room_id) {
      await connection.rollback()
      return res.status(400).json({
        code: 400,
        message: '租客未绑定有效房间，无法提交工单',
      })
    }

    const [result] = await connection.query(
      `
        INSERT INTO work_orders (
          order_no, tenant_id, room_id, type, title, content, priority, status,
          expected_time, contact_phone, images
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, '待处理', ?, ?, ?)
      `,
      [
        order.order_no,
        order.tenant_id,
        tenant.room_id,
        order.type,
        order.title,
        order.content,
        order.priority,
        order.expected_time,
        order.contact_phone || tenant.phone,
        JSON.stringify(order.images),
      ],
    )

    await connection.commit()
    res.json({ code: 200, message: '工单提交成功', data: { id: result.insertId } })
  } catch (error) {
    await connection.rollback()
    res.status(500).json({
      code: 500,
      message: '提交工单失败',
      error: error.message,
    })
  } finally {
    connection.release()
  }
})

app.put('/api/tenant/work-orders/:id/cancel', async (req, res) => {
  try {
    await ensureWorkOrderSchema(db)
    const [result] = await db.query(
      `
        UPDATE work_orders
        SET status = '已撤销',
            handle_result = '租客已撤销工单',
            handle_time = NOW()
        WHERE id = ? AND tenant_id = ? AND status = '待处理'
      `,
      [req.params.id, req.body.tenant_id],
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ code: 404, message: '没有找到可撤销的工单' })
    }

    res.json({ code: 200, message: '工单已撤销' })
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '撤销工单失败',
      error: error.message,
    })
  }
})

app.get('/api/dashboard', async (req, res) => {
  const connection = await db.getConnection()

  try {
    await ensureUtilityBillSchema(connection)
    await ensureWorkOrderSchema(connection)
    await ensureNoticeSchema(connection)

    const [roomStatsRows] = await connection.query(`
      SELECT
        total,
        rented,
        GREATEST(total - rented - repair, 0) AS vacant,
        repair
      FROM (
        SELECT
          COUNT(*) AS total,
          SUM(CASE WHEN status = '已出租' OR current_tenant_id IS NOT NULL THEN 1 ELSE 0 END) AS rented,
          SUM(CASE WHEN status = '维修中' THEN 1 ELSE 0 END) AS repair
        FROM rooms
      ) stats
    `)

    const [tenantStatsRows] = await connection.query(`
      SELECT
        COUNT(*) AS total,
        COALESCE(SUM(CASE WHEN status = '在租' THEN 1 ELSE 0 END), 0) AS active
      FROM tenants
    `)

    const [contractStatsRows] = await connection.query(`
      SELECT
        COALESCE(SUM(CASE WHEN status = '待确认' THEN 1 ELSE 0 END), 0) AS pending,
        COALESCE(SUM(CASE
          WHEN status = '生效中'
            AND end_date >= CURDATE()
            AND end_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
          THEN 1 ELSE 0 END
        ), 0) AS expiring
      FROM contracts
    `)

    const [billStatsRows] = await connection.query(`
      SELECT
        COALESCE(SUM(CASE WHEN status <> '已缴费' THEN 1 ELSE 0 END), 0) AS unpaid,
        COALESCE(SUM(CASE WHEN status <> '已缴费' THEN total_amount ELSE 0 END), 0) AS unpaid_amount
      FROM utility_bills
    `)

    const [workOrderStatsRows] = await connection.query(`
      SELECT
        COALESCE(SUM(CASE WHEN status = '待处理' THEN 1 ELSE 0 END), 0) AS pending,
        COALESCE(SUM(CASE WHEN status = '处理中' THEN 1 ELSE 0 END), 0) AS processing
      FROM work_orders
    `)

    const [pendingOrders] = await connection.query(`
      SELECT
        wo.id,
        wo.order_no,
        wo.type,
        wo.title,
        wo.content,
        wo.priority,
        wo.status,
        wo.created_at,
        wo.handle_result,
        t.name AS tenant_name,
        r.room_number
      FROM work_orders wo
      LEFT JOIN tenants t ON wo.tenant_id = t.id
      LEFT JOIN rooms r ON wo.room_id = r.id
      WHERE wo.status IN ('待处理', '处理中')
      ORDER BY FIELD(wo.status, '待处理', '处理中'), wo.created_at DESC
      LIMIT 8
    `)

    const [monthlyWorkOrders] = await connection.query(`
      SELECT
        DATE_FORMAT(created_at, '%Y-%m') AS month,
        SUM(CASE WHEN type = '合同审批' THEN 1 ELSE 0 END) AS contract,
        SUM(CASE WHEN type = '维修申请' THEN 1 ELSE 0 END) AS repair,
        SUM(CASE WHEN type = '退租申请' THEN 1 ELSE 0 END) AS checkout,
        SUM(CASE WHEN type NOT IN ('合同审批', '维修申请', '退租申请') THEN 1 ELSE 0 END) AS other
      FROM work_orders
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 5 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month ASC
    `)

    const [utilityStats] = await connection.query(`
      SELECT
        bill_month AS month,
        SUM(water_usage) AS water,
        SUM(electricity_usage) AS electricity
      FROM utility_bills
      GROUP BY bill_month
      ORDER BY bill_month DESC
      LIMIT 5
    `)

    res.json({
      code: 200,
      message: '查询成功',
      data: {
        rooms: roomStatsRows[0] || {},
        tenants: tenantStatsRows[0] || {},
        contracts: contractStatsRows[0] || {},
        bills: billStatsRows[0] || {},
        workOrders: workOrderStatsRows[0] || {},
        pendingOrders,
        monthlyWorkOrders,
        utilityStats: utilityStats.reverse(),
      },
    })
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '查询看板数据失败',
      error: error.message,
    })
  } finally {
    connection.release()
  }
})

app.get('/api/tenant/dashboard', async (req, res) => {
  const connection = await db.getConnection()

  try {
    await ensureUtilityBillSchema(connection)
    await ensureWorkOrderSchema(connection)
    await ensureNoticeSchema(connection)

    const tenantId = req.query.tenant_id

    if (!tenantId) {
      return res.status(400).json({
        code: 400,
        message: '缺少租客信息',
      })
    }

    const roomColumns = await getTableColumns(connection, 'rooms')
    const roomRentSelect = roomColumns.has('rent') ? 'r.rent,' : ''

    const [tenantRows] = await connection.query(
      `
        SELECT
          t.id,
          t.name,
          t.phone,
          t.status,
          t.room_id,
          r.room_number,
          r.monthly_rent,
          ${roomRentSelect}
          b.name AS building_name
        FROM tenants t
        LEFT JOIN rooms r ON t.room_id = r.id
        LEFT JOIN buildings b ON r.building_id = b.id
        WHERE t.id = ?
        LIMIT 1
      `,
      [tenantId],
    )

    if (tenantRows.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '租客不存在',
      })
    }

    const tenant = tenantRows[0]

    const [billRows] = await connection.query(
      `
        SELECT *
        FROM utility_bills
        WHERE tenant_id = ?
        ORDER BY bill_month DESC, id DESC
        LIMIT 1
      `,
      [tenantId],
    )

    const [utilityStats] = await connection.query(
      `
        SELECT
          bill_month AS month,
          water_usage,
          electricity_usage,
          water_fee,
          electricity_fee,
          total_amount,
          status
        FROM utility_bills
        WHERE tenant_id = ?
        ORDER BY bill_month DESC, id DESC
        LIMIT 6
      `,
      [tenantId],
    )

    const [notices] = await connection.query(
      `
        SELECT
          n.id,
          n.title,
          n.content,
          n.type,
          n.need_confirm,
          n.publish_time,
          nc.is_read,
          nc.is_confirmed
        FROM notice_confirmations nc
        INNER JOIN notices n ON nc.notice_id = n.id
        WHERE nc.tenant_id = ?
          AND n.status = '已发布'
        ORDER BY n.publish_time DESC, n.id DESC
        LIMIT 3
      `,
      [tenantId],
    )

    const [workOrders] = await connection.query(
      `
        SELECT *
        FROM work_orders
        WHERE tenant_id = ?
        ORDER BY created_at DESC, id DESC
        LIMIT 6
      `,
      [tenantId],
    )

    const [workOrderStatsRows] = await connection.query(
      `
        SELECT
          COALESCE(SUM(CASE WHEN status IN ('待处理', '处理中') THEN 1 ELSE 0 END), 0) AS incomplete,
          COALESCE(SUM(CASE WHEN status = '待处理' THEN 1 ELSE 0 END), 0) AS pending,
          COALESCE(SUM(CASE WHEN status = '处理中' THEN 1 ELSE 0 END), 0) AS processing
        FROM work_orders
        WHERE tenant_id = ?
      `,
      [tenantId],
    )

    const latestBill = billRows[0] || null
    const monthlyRent = Number(tenant.monthly_rent || tenant.rent || 0)

    res.json({
      code: 200,
      message: '查询成功',
      data: {
        tenant: {
          id: tenant.id,
          name: tenant.name,
          phone: tenant.phone,
          room_id: tenant.room_id,
          room_number: tenant.room_number,
          building_name: tenant.building_name,
          monthly_rent: monthlyRent,
        },
        latestBill,
        summary: {
          monthlyRent,
          utilityAmount: Number(latestBill?.total_amount || 0),
          totalDue: monthlyRent + Number(latestBill?.total_amount || 0),
          incompleteWorkOrders: Number(workOrderStatsRows[0]?.incomplete || 0),
          pendingWorkOrders: Number(workOrderStatsRows[0]?.pending || 0),
          processingWorkOrders: Number(workOrderStatsRows[0]?.processing || 0),
        },
        utilityStats: utilityStats.reverse(),
        notices,
        workOrders,
      },
    })
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '查询租客首页数据失败',
      error: error.message,
    })
  } finally {
    connection.release()
  }
})

// 查询租客列表
app.get('/api/tenants', async (req, res) => {
  try {
    const sql = `
      SELECT
        t.id,
        t.user_id,
        t.name,
        t.phone,
        t.id_card,
        t.emergency_contact,
        t.emergency_phone,
        t.status,
        t.created_at,

        u.username,
        u.role,

        r.building_id,
        r.room_number,
        r.room_type,
        r.area,
        r.monthly_rent,
        r.deposit,
        r.lease_start,
        r.lease_end,

        b.name AS building_name,

        c.contract_no,
        c.start_date AS contract_start_date,
        c.end_date AS contract_end_date,
        c.status AS contract_status
      FROM tenants t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN rooms r ON t.room_id = r.id
      LEFT JOIN buildings b ON r.building_id = b.id
      LEFT JOIN contracts c ON c.id = (
        SELECT c2.id
        FROM contracts c2
        WHERE c2.tenant_id = t.id
        ORDER BY c2.start_date DESC
        LIMIT 1
      )
      ORDER BY t.id DESC
    `

    const [rows] = await db.query(sql)

    res.json({
      code: 200,
      message: '查询成功',
      data: rows,
    })
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '查询租客失败',
      error: error.message,
    })
  }
})

// 租客登录
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({
        code: 400,
        message: '用户名和密码不能为空',
      })
    }

    const userColumns = await ensureUserAuthColumns(db)
    const nameSelect = userColumns.has('real_name') ? 'real_name,' : 'name,'

    const [rows] = await db.query(
      `
        SELECT
          id,
          username,
          ${nameSelect}
          phone,
          role,
          must_change_password
        FROM users
        WHERE username = ?
          AND password = ?
          AND role = 'admin'
          AND (status IS NULL OR status = 'enabled')
        LIMIT 1
      `,
      [username, password],
    )

    if (rows.length === 0) {
      return res.status(401).json({
        code: 401,
        message: '用户名或密码错误，或账号已停用',
      })
    }

    const user = rows[0]

    res.json({
      code: 200,
      message: '登录成功',
      data: {
        user_id: user.id,
        username: user.username,
        name: user.real_name || user.name || user.username,
        phone: user.phone,
        role: user.role,
        must_change_password: Number(user.must_change_password) === 1,
      },
    })
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '管理员登录失败',
      error: error.message,
    })
  }
})

app.post('/api/users/change-password', async (req, res) => {
  try {
    const { user_id, old_password, new_password, role } = req.body

    if (!user_id || !old_password || !new_password) {
      return res.status(400).json({
        code: 400,
        message: '缺少改密参数',
      })
    }

    if (String(new_password).length < 6) {
      return res.status(400).json({
        code: 400,
        message: '新密码至少 6 位',
      })
    }

    if (new_password === '123456') {
      return res.status(400).json({
        code: 400,
        message: '新密码不能继续使用初始密码 123456',
      })
    }

    await ensureUserAuthColumns(db)

    const roleWhere = role ? 'AND role = ?' : ''
    const params = role ? [user_id, old_password, role] : [user_id, old_password]
    const [rows] = await db.query(
      `
        SELECT id
        FROM users
        WHERE id = ?
          AND password = ?
          ${roleWhere}
        LIMIT 1
      `,
      params,
    )

    if (rows.length === 0) {
      return res.status(401).json({
        code: 401,
        message: '原密码不正确',
      })
    }

    await db.query(
      `
        UPDATE users
        SET password = ?,
            must_change_password = 0,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [new_password, user_id],
    )

    res.json({
      code: 200,
      message: '密码修改成功',
    })
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '修改密码失败',
      error: error.message,
    })
  }
})

app.post('/api/tenant/login', async (req, res) => {
  try {
    const { phone, password } = req.body

    if (!phone || !password) {
      return res.status(400).json({
        code: 400,
        message: '手机号和密码不能为空',
      })
    }

    const userColumns = await ensureUserAuthColumns(db)
    const userStatusSelect = userColumns.has('status') ? 'u.status AS user_status,' : ''
    const mustChangePasswordSelect = userColumns.has('must_change_password') ? 'u.must_change_password,' : ''
    const userNameSelect = userColumns.has('real_name')
      ? 'u.real_name,'
      : userColumns.has('name')
        ? 'u.name AS real_name,'
        : ''
    const roleWhere = userColumns.has('role') ? "AND u.role = 'tenant'" : ''
    const userStatusWhere = userColumns.has('status') ? "AND (u.status IS NULL OR u.status = 'enabled')" : ''

    const [rows] = await db.query(
      `
        SELECT
          u.id AS user_id,
          u.username,
          ${userNameSelect}
          u.phone AS user_phone,
          ${userStatusSelect}
          ${mustChangePasswordSelect}
          t.id AS tenant_id,
          t.name,
          t.phone,
          t.status AS tenant_status,
          t.room_id,
          r.room_number,
          r.building_id,
          b.name AS building_name
        FROM users u
        INNER JOIN tenants t ON t.user_id = u.id
        LEFT JOIN rooms r ON t.room_id = r.id
        LEFT JOIN buildings b ON r.building_id = b.id
        WHERE u.username = ?
          AND u.password = ?
          ${roleWhere}
          ${userStatusWhere}
        LIMIT 1
      `,
      [phone, password],
    )

    if (rows.length === 0) {
      return res.status(401).json({
        code: 401,
        message: '手机号或密码错误，或账号已停用',
      })
    }

    const tenant = rows[0]

    if (tenant.tenant_status !== '在租') {
      return res.status(403).json({
        code: 403,
        message: '该租客已退租，无法登录租客端',
      })
    }

    if (!tenant.room_id) {
      return res.status(403).json({
        code: 403,
        message: '该租客未绑定房间，无法登录租客端',
      })
    }

    res.json({
      code: 200,
      message: '登录成功',
      data: {
        user_id: tenant.user_id,
        tenant_id: tenant.tenant_id,
        name: tenant.name,
        phone: tenant.phone,
        room_id: tenant.room_id,
        room_number: tenant.room_number,
        building_id: tenant.building_id,
        building_name: tenant.building_name,
        must_change_password: Number(tenant.must_change_password) === 1,
      },
    })
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '租客登录失败',
      error: error.message,
    })
  }
})

// 新增租客
app.post('/api/tenants', async (req, res) => {
  const connection = await db.getConnection()

  try {
    const {
      name,
      phone,
      id_card,
      building_id,
      room_number,
      emergency_contact,
      emergency_phone,
      status,
    } = req.body

    if (!name || !phone) {
      return res.status(400).json({
        code: 400,
        message: '租客姓名和手机号不能为空',
      })
    }

    await connection.beginTransaction()

    const tenantStatus = status || '在租'
    let roomId = null

    if (tenantStatus === '在租' && (!building_id || !room_number)) {
      await connection.rollback()

      return res.status(400).json({
        code: 400,
        message: '在租租客必须绑定楼栋和房间',
      })
    }

    if (room_number) {
      if (!building_id) {
        await connection.rollback()

        return res.status(400).json({
          code: 400,
          message: '请选择所属楼栋',
        })
      }

      const [roomRows] = await connection.query(
        `
          SELECT id, current_tenant_id
          FROM rooms
          WHERE building_id = ? AND room_number = ?
          LIMIT 1
        `,
        [building_id, room_number],
      )

      if (roomRows.length === 0) {
        await connection.rollback()

        return res.status(400).json({
          code: 400,
          message: '该楼栋下不存在这个房间号',
        })
      }

      if (roomRows[0].current_tenant_id) {
        await connection.rollback()

        return res.status(400).json({
          code: 400,
          message: '该房间已经绑定租客，不能重复入住',
        })
      }

      roomId = roomRows[0].id
    }

    const [userRows] = await connection.query(
      'SELECT id FROM users WHERE username = ? LIMIT 1',
      [phone],
    )

    let userId

    if (userRows.length > 0) {
      userId = userRows[0].id

      await updateUser(connection, userId, {
        real_name: name,
        phone,
        role: 'tenant',
        status: tenantStatus === '在租' ? 'enabled' : 'disabled',
      })
    } else {
      const userResult = await insertUser(connection, {
        username: phone,
        password: '123456',
        role: 'tenant',
        real_name: name,
        phone,
        status: tenantStatus === '在租' ? 'enabled' : 'disabled',
        must_change_password: 1,
      })

      userId = userResult.insertId
    }

    const [tenantResult] = await connection.query(
      `
        INSERT INTO tenants (
          user_id,
          name,
          phone,
          id_card,
          room_id,
          emergency_contact,
          emergency_phone,
          status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        userId,
        name,
        phone,
        id_card || null,
        tenantStatus === '在租' ? roomId : null,
        emergency_contact || null,
        emergency_phone || null,
        tenantStatus,
      ],
    )

    const tenantId = tenantResult.insertId

    if (roomId && tenantStatus === '在租') {
      await connection.query(
        `
          UPDATE rooms
          SET current_tenant_id = ?, status = '已出租'
          WHERE id = ?
        `,
        [tenantId, roomId],
      )
    }

    await connection.commit()

    res.json({
      code: 200,
      message: '新增租客成功',
      data: {
        id: tenantId,
      },
    })
  } catch (error) {
    await connection.rollback()

    res.status(500).json({
      code: 500,
      message: '新增租客失败',
      error: error.message,
    })
  } finally {
    connection.release()
  }
})

// 编辑租客
app.put('/api/tenants/:id', async (req, res) => {
  const connection = await db.getConnection()

  try {
    const tenantId = req.params.id

    const {
      name,
      phone,
      id_card,
      building_id,
      room_number,
      emergency_contact,
      emergency_phone,
      status,
    } = req.body

    if (!name || !phone) {
      return res.status(400).json({
        code: 400,
        message: '租客姓名和手机号不能为空',
      })
    }

    await connection.beginTransaction()

    const [tenantRows] = await connection.query(
      'SELECT id, user_id, room_id FROM tenants WHERE id = ? LIMIT 1',
      [tenantId],
    )

    if (tenantRows.length === 0) {
      await connection.rollback()

      return res.status(404).json({
        code: 404,
        message: '租客不存在',
      })
    }

    const oldTenant = tenantRows[0]
    const tenantStatus = status || '在租'
    let newRoomId = null

    if (tenantStatus === '在租' && (!building_id || !room_number)) {
      await connection.rollback()

      return res.status(400).json({
        code: 400,
        message: '在租租客必须绑定楼栋和房间',
      })
    }

    if (room_number) {
      if (!building_id) {
        await connection.rollback()

        return res.status(400).json({
          code: 400,
          message: '请选择所属楼栋',
        })
      }

      const [roomRows] = await connection.query(
        `
          SELECT id, current_tenant_id
          FROM rooms
          WHERE building_id = ? AND room_number = ?
          LIMIT 1
        `,
        [building_id, room_number],
      )

      if (roomRows.length === 0) {
        await connection.rollback()

        return res.status(400).json({
          code: 400,
          message: '该楼栋下不存在这个房间号',
        })
      }

      const room = roomRows[0]

      if (room.current_tenant_id && Number(room.current_tenant_id) !== Number(tenantId)) {
        await connection.rollback()

        return res.status(400).json({
          code: 400,
          message: '该房间已经绑定其他租客',
        })
      }

      newRoomId = room.id
    }

    if (oldTenant.user_id) {
      await updateUser(connection, oldTenant.user_id, {
        username: phone,
        real_name: name,
        phone,
        role: 'tenant',
        status: tenantStatus === '在租' ? 'enabled' : 'disabled',
      })
    }

    if (
      oldTenant.room_id &&
      (
        Number(oldTenant.room_id) !== Number(newRoomId) ||
        tenantStatus === '已退租'
      )
    ) {
      await connection.query(
        `
          UPDATE rooms
          SET current_tenant_id = NULL,
              status = '可出租'
          WHERE id = ? AND current_tenant_id = ?
        `,
        [oldTenant.room_id, tenantId],
      )
    }

    await connection.query(
        `
          UPDATE tenants
          SET
          name = ?,
          phone = ?,
          id_card = ?,
          room_id = ?,
          emergency_contact = ?,
          emergency_phone = ?,
          status = ?
        WHERE id = ?
      `,
      [
        name,
        phone,
        id_card || null,
        tenantStatus === '在租' ? newRoomId : null,
        emergency_contact || null,
        emergency_phone || null,
        tenantStatus,
        tenantId,
      ],
    )

    if (newRoomId && tenantStatus === '在租') {
      await connection.query(
        `
          UPDATE rooms
          SET current_tenant_id = ?, status = '已出租'
          WHERE id = ?
        `,
        [tenantId, newRoomId],
      )
    }

    if (tenantStatus === '已退租') {
      await setUserStatus(connection, oldTenant.user_id, 'disabled')
    }

    await connection.commit()

    res.json({
      code: 200,
      message: '编辑租客成功',
    })
  } catch (error) {
    await connection.rollback()

    res.status(500).json({
      code: 500,
      message: '编辑租客失败',
      error: error.message,
    })
  } finally {
    connection.release()
  }
})

// 删除租客
app.delete('/api/tenants/:id', async (req, res) => {
  const connection = await db.getConnection()

  try {
    const tenantId = req.params.id

    await connection.beginTransaction()

    const [tenantRows] = await connection.query(
      'SELECT id, user_id, room_id FROM tenants WHERE id = ? LIMIT 1',
      [tenantId],
    )

    if (tenantRows.length === 0) {
      await connection.rollback()

      return res.status(404).json({
        code: 404,
        message: '租客不存在',
      })
    }

    const tenant = tenantRows[0]

    if (tenant.room_id) {
      await connection.query(
        `
          UPDATE rooms
          SET current_tenant_id = NULL,
              status = '可出租',
              lease_start = NULL,
              lease_end = NULL
          WHERE id = ? AND current_tenant_id = ?
        `,
        [tenant.room_id, tenantId],
      )
    }

    if (
      await tableExists(connection, 'work_order_images') &&
      await tableExists(connection, 'work_orders')
    ) {
      await connection.query(
        `
          DELETE FROM work_order_images
          WHERE work_order_id IN (
            SELECT id FROM work_orders WHERE tenant_id = ?
          )
        `,
        [tenantId],
      )
    }

    if (await tableExists(connection, 'work_orders')) {
      await connection.query('DELETE FROM work_orders WHERE tenant_id = ?', [tenantId])
    }

    if (await tableExists(connection, 'notice_confirmations')) {
      await connection.query('DELETE FROM notice_confirmations WHERE tenant_id = ?', [tenantId])
    }

    if (await tableExists(connection, 'utility_bills')) {
      await connection.query('DELETE FROM utility_bills WHERE tenant_id = ?', [tenantId])
    }

    if (await tableExists(connection, 'contracts')) {
      await connection.query('DELETE FROM contracts WHERE tenant_id = ?', [tenantId])
    }

    await connection.query('DELETE FROM tenants WHERE id = ?', [tenantId])

    if (tenant.user_id) {
      await connection.query('DELETE FROM users WHERE id = ?', [tenant.user_id])
    }

    await connection.commit()

    res.json({
      code: 200,
      message: '删除租客成功',
    })
  } catch (error) {
    await connection.rollback()

    res.status(500).json({
      code: 500,
      message: '删除租客失败',
      error: error.message,
    })
  } finally {
    connection.release()
  }
})

const port = process.env.PORT || 3000

app.listen(port, () => {
  console.log(`后端服务已启动：http://localhost:${port}`)
})
