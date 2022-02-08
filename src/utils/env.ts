import { isAbsolute, joinSafe as join } from 'upath'
import * as dotEnv from 'dotenv'

const resolveRelative = (p: string) => {
  return isAbsolute(p) ? p : join(__dirname, p)
}

dotEnv.config({ path: resolveRelative('env') })

const port = Number(process.env.PORT || 3000)
const isProd = process.env.NODE_ENV === 'production'

const downloadsRoot = resolveRelative(process.env.DOWNLOADS_ROOT)

const uploadResourceRoot = resolveRelative(process.env.UPLOAD_RESOURCE_ROOT)

const serverRoot = resolveRelative('.')

export { port, isProd, downloadsRoot, serverRoot, uploadResourceRoot }
