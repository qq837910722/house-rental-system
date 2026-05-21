const express = require('express')
const cors = require('cors')
require('dotenv').config()

const db = require('./db')

const app = express()

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.send('房屋管理系统后端启动成功')
})

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

    const [rows] = await db.query(sql)

    res.json({
      code: 200,
      message: '查询成功',
      data: rows,
    })
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '查询房间失败',
      error: error.message,
    })
  }
})

const port = process.env.PORT || 3000

app.listen(port, () => {
  console.log(`后端服务已启动：http://localhost:${port}`)
})