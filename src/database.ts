import { DataSource, DataSourceOptions, QueryRunner } from 'typeorm'
import { Token } from '@/dao/token.entity'
import { User } from '@/dao/user.entity'
import { isTest, mysqlConfig } from '@/utils/env'
import { markClassFactory } from '@/common/makeClassFactory'
import { OnModuleDestroy } from './common/hooks'

class CustomDataSource extends DataSource implements OnModuleDestroy {
  queryRunner: QueryRunner
  constructor(options: DataSourceOptions) {
    super(options)
    this.queryRunner = this.createQueryRunner()
  }

  onModuleDestroy() {
    this.destroy()
    this.queryRunner.release()
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
  return datasource
    .initialize()
    .then((db) => (isTest ? db.queryRunner.connect().then(() => db) : db))
})

export * from 'typeorm'

export { CustomDataSource }

export default AppDataSource
