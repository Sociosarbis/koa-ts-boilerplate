import { Context } from 'koa';
import { RouterContext } from 'koa-router';

type AppContext = Context & RouterContext;

export { AppContext };
