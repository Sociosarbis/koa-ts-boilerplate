import 'reflect-metadata'
import { AppModule } from './app.module'

declare global {
  interface NodeModule {
    hot?: {
      accept: (...args: any[]) => any
      dispose: (callback: (...args: any[]) => any) => any
    }
  }
}
async function bootstrap() {
  const app = await new AppModule().asApp()
  const server = app.listen(Number(process.env.PORT || 3000), 'localhost')
  if (module.hot) {
    module.hot.accept()
    module.hot.dispose(() => {
      app.destroy()
      server.close()
    })
  }
}

bootstrap()
