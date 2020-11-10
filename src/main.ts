import 'reflect-metadata';
import { AppModule } from './app.module';

declare global {
  interface NodeModule {
    hot?: {
      accept: (...args: any[]) => any;
      dispose: (callback: (...args: any[]) => any) => any;
    };
  }
}
function bootstrap() {
  const app = new AppModule();
  const server = app.listen(process.env.PORT || 3000);

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => server.close());
  }
}

bootstrap();
