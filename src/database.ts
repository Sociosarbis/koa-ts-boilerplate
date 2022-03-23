import { DataSource } from 'typeorm'
import { Token } from '@/dao/token.entity'
import { User } from '@/dao/user.entity'
import { mysqlConfig } from '@/utils/env'
import { markClassFactory } from '@/common/makeClassFactory'
import { OnModuleDestroy, OnModuleInit } from './common/hooks'

class CustomDataSource
  extends DataSource
  implements OnModuleInit, OnModuleDestroy {
  onModuleInit() {
    this.initialize()
  }

  onModuleDestroy() {
    this.destroy()
  }
}

const AppDataSource = markClassFactory(
  () =>
    new CustomDataSource({
      type: 'mysql',
      host: mysqlConfig.host,
      port: mysqlConfig.port,
      username: mysqlConfig.username,
      database: mysqlConfig.database,
      entities: [Token, User],
      logging: false,
    }),
)

export { CustomDataSource }

export default AppDataSource
