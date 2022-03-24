import { isAbsolute, joinSafe as join } from 'upath'
import * as dotEnv from 'dotenv'

type MySQLConfig = {
  username: string
  password: string
  host: string
  port: number
  database: string
}

const resolveRelative = (p: string) => {
  return isAbsolute(p) ? p : join(__dirname, p)
}

function resolveMySQLConfigFromEnv(): MySQLConfig {
  return {
    username: process.env.MYSQL_HOST ?? 'user',
    password: process.env.MYSQL_PASS ?? 'password',
    host: process.env.MYSQL_HOST ?? 'localhost',
    port: Number(process.env.MYSQL_PORT ?? '3306'),
    database: process.env.MYSQL_DB ?? 'database',
  }
}

dotEnv.config({ path: resolveRelative('env') })

const port = Number(process.env.PORT || 3000)
const isProd = process.env.NODE_ENV === 'production'

const downloadsRoot = resolveRelative(process.env.DOWNLOADS_ROOT)

const uploadResourceRoot = resolveRelative(process.env.UPLOAD_RESOURCE_ROOT)

const serverRoot = resolveRelative('.')

const mysqlConfig = resolveMySQLConfigFromEnv()

const authSecretKey = process.env.AUTH_SECRET_KEY || 'auth-secret-key'

export {
  port,
  isProd,
  downloadsRoot,
  serverRoot,
  uploadResourceRoot,
  mysqlConfig,
  authSecretKey,
}
