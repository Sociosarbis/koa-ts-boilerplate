import { ApolloServer } from 'apollo-server-koa'
import { BaseModule } from '@/base/module'
import { Module } from '@/common/decorators/module'
import { readFileSync } from 'fs'
import { OnModuleDestroy, OnModuleInit } from '@/common/hooks'

const books = [
  {
    title: 'The Awakening',
    author: 'Kate Chopin',
  },
  {
    title: 'City of Glass',
    author: 'Paul Auster',
  },
]

@Module({})
export class GraphqlModule
  extends BaseModule
  implements OnModuleInit, OnModuleDestroy {
  private _server: ApolloServer
  onModuleInit() {
    this._server = new ApolloServer({
      typeDefs: readFileSync('graphql/book.gql', {
        encoding: 'utf-8',
      }),
      resolvers: {
        Query: {
          books: () => books,
        },
      },
    })
  }

  onModuleDestroy() {
    this._server.stop()
  }

  async asMiddleware() {
    return this._server.getMiddleware()
  }
}
