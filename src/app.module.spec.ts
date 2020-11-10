import 'reflect-metadata';
import * as request from 'supertest';
import { AppModule } from './app.module';

describe('App test', () => {
  const app = new AppModule();
  it('Get hello word', (done) => {
    request(app.callback()).get('/').expect(200).end(done);
  });
});
