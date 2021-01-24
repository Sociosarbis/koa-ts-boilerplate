import { ApolloServer } from 'apollo-server-koa';
import { BaseModule } from '@/base/module';
import { Module } from '@/common/decorators/module';
import { readFileSync } from 'fs';
import { join } from 'path';

const books = [
  {
    title: 'The Awakening',
    author: 'Kate Chopin',
  },
  {
    title: 'City of Glass',
    author: 'Paul Auster',
  },
];

@Module({})
export class GraphqlModule extends BaseModule {
  private _server: ApolloServer;
  constructor() {
    super();
    this._server = new ApolloServer({
      typeDefs: readFileSync('graphql/book.gql', {
        encoding: 'utf-8',
      }),
      resolvers: {
        Query: {
          books: () => books,
        },
      },
    });
  }

  asMiddleware() {
    return this._server.getMiddleware();
  }
}
