import { onRequest as generate } from '../functions/api/generate.js';
import { onRequest as checkUz } from '../functions/api/check-uz/[name].js';
import { onRequest as checkTg } from '../functions/api/check-tg/[name].js';
import { onRequest as checkIg } from '../functions/api/check-ig/[name].js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === '/api/generate') {
      return generate({ request, env, ctx, params: {} });
    }

    let m;
    if ((m = path.match(/^\/api\/check-uz\/([^/]+)$/))) {
      return checkUz({ request, env, ctx, params: { name: m[1] } });
    }
    if ((m = path.match(/^\/api\/check-tg\/([^/]+)$/))) {
      return checkTg({ request, env, ctx, params: { name: m[1] } });
    }
    if ((m = path.match(/^\/api\/check-ig\/([^/]+)$/))) {
      return checkIg({ request, env, ctx, params: { name: m[1] } });
    }

    return env.ASSETS.fetch(request);
  },
};
