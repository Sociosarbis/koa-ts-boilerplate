import 'reflect-metadata';
import { AppModule } from './app.module';

import { FileController } from '@/modules/file/file.controller';

declare global {
  interface NodeModule {
    hot?: {
      accept: (...args: any[]) => any;
      dispose: (callback: (...args: any[]) => any) => any;
    };
  }
}
function bootstrap() {
  const app = new AppModule().asApp();
  const server = app.listen(process.env.PORT || 3000);
  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => server.close());
  }
}

bootstrap();
