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

async function getTemplates(
  dir: string,
  extname: string,
  opts: { stripExt?: boolean } = {},
) {
  if (!path.isAbsolute(dir)) {
    dir = path.join(process.cwd(), dir);
  }
  const templates: Record<string, TemplateDelegate> = {};
  const pattern = `**/*${extname}`;
  const files = await glob(pattern, {
    cwd: dir,
  });
  for (let i = 0; i < files.length; i++) {
    templates[
      opts.stripExt ? getTemplateName(files[i]) : files[i]
    ] = handlebars.compile(
      await readFile(path.join(dir, files[i]), {
        encoding: 'utf-8',
      }),
    );
  }
  return templates;
}

function readTemplate(baseDir: string, templatePath: string, extname: string) {
  let file = path.join(baseDir, templatePath);
  if (!file.endsWith(extname)) {
    file += extname;
  }
  if (fs.existsSync(file)) {
    return fs.readFileSync(file, { encoding: 'utf-8' });
  } else throw new Error(`template not found at ${file}`);
}

export default function hbs({
  extname = '.hbs',
  layoutsDir = 'assets/views/layouts',
  partialsDir = 'assets/views/partials',
}: HandlebarsOptions) {
  function partialHelper(templatePath: string) {
    if (process.env.NODE_ENV !== 'production') {
      handlebars.registerPartial(
        templatePath,
        handlebars.compile(readTemplate(partialsDir, templatePath, extname)),
      );
    }
    return templatePath;
  }

  if (process.env.NODE_ENV === 'production') {
    const layouts = getTemplates(layoutsDir, extname, { stripExt: true });
    const partials = getTemplates(partialsDir, extname);
    return async (ctx: Context, next: Next) => {
      ctx.render = async (viewPath: string, locals: Record<string, any>) => {
        const l = await layouts;
        const p = await partials;
        if (viewPath in l)
          ctx.body = l[viewPath](locals, {
            partials: p,
            helpers: {
              partial: partialHelper,
            },
          });
        else throw new Error(`can not find layout at ${viewPath}`);
      };
      next();
    };
  } else {
    return async (ctx: Context, next: Next) => {
      ctx.render = async (viewPath: string, locals: Record<string, any>) => {
        const renderFn = handlebars.compile(
          readTemplate(layoutsDir, viewPath, extname),
        );
        ctx.body = renderFn(locals, {
          helpers: {
            partial: partialHelper,
          },
        });
      };
      // 必须await next，不然会不等待next，直接就返回了
      await next();
    };
  }
}
