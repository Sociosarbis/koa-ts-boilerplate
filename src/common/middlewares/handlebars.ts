import handlebars, { TemplateDelegate } from 'handlebars';
import { Context, Next } from 'koa';
import * as glob from 'globby';
import * as path from 'path';
import * as fs from 'fs';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);

type HandlebarsOptions = {
  extname?: string;
  layoutsDir?: string;
  partialsDir?: string;
};

function getTemplateName(filepath: string) {
  const extname = path.extname(filepath);
  return filepath.substring(0, filepath.length - extname.length);
}

async function getTemplates(dir: string, extname: string) {
  if (!path.isAbsolute(dir)) {
    dir = path.join(process.cwd(), dir);
  }
  const templates: Record<string, TemplateDelegate> = {};
  const pattern = `**/*${extname}`;
  const files = await glob(pattern, {
    cwd: dir,
  });
  for (let i = 0; i < files.length; i++) {
    templates[getTemplateName(files[i])] = handlebars.compile(
      await readFile(path.join(dir, files[i]), {
        encoding: 'utf-8',
      }),
    );
  }
  return templates;
}

export default function hbs({
  extname = '.hbs',
  layoutsDir = 'assets/views/layouts',
  partialsDir = 'assets/views/partials',
}: HandlebarsOptions) {
  const layouts = getTemplates(layoutsDir, extname);
  const partials = getTemplates(partialsDir, extname);
  return async (ctx: Context, next: Next) => {
    ctx.render = async (viewPath: string, locals: Record<string, any>) => {
      const l = await layouts;
      const p = await partials;
      if (viewPath in l)
        ctx.body = l[viewPath](locals, {
          partials: p,
        });
      else throw new Error(`can not find layout at ${viewPath}`);
    };
    next();
  };
}
