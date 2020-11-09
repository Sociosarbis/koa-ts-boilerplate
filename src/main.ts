import { AppModule } from './app.module';

function bootstrap() {
  const app = new AppModule();
  app.listen(process.env.PORT || 3000);
}

bootstrap();
