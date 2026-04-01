const { PrismaClient } = require('./src/generated/prisma')
const bcrypt = require('bcryptjs')

;(async () => {
  const prisma = new PrismaClient()
  try {
    const email = 'admin@yujiangshiptech.com'
    const existing = await prisma.adminUser.findUnique({ where: { email } })
    if (existing) {
      console.log('admin exists')
      return
    }
    const hashed = await bcrypt.hash('admin123', 12)
    await prisma.adminUser.create({
      data: {
        id: 'a0000000-0000-4000-8000-000000000001',
        email,
        password: hashed,
        name: 'System Admin',
        role: 'super_admin'
      }
    })
    console.log('admin created')
  } catch (e) {
    console.error('failed:', e)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
})()
