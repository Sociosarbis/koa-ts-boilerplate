import { DataSource } from 'typeorm'
import { Token } from '@/dao/token.entity'
import { User } from '@/dao/user.entity'
import { mysqlConfig } from '@/utils/env'
import { markClassFactory } from '@/common/makeClassFactory'
import { OnModuleDestroy } from './common/hooks'

class CustomDataSource extends DataSource implements OnModuleDestroy {
  onModuleDestroy() {
    this.destroy()
  }
}

const AppDataSource = markClassFactory(() => {
  const datasource = new CustomDataSource({
    type: 'mysql',
    host: mysqlConfig.host,
    port: mysqlConfig.port,
    username: mysqlConfig.username,
    password: mysqlConfig.password,
    database: mysqlConfig.database,
    entities: [Token, User],
    logging: false,
  })
  return datasource.initialize()
})

export * from 'typeorm'

export { CustomDataSource }

export default AppDataSource
