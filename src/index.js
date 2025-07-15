// export default {
//   async fetch(request, env, ctx) {
//     const url = new URL(request.url);
//     const apiPath = url.pathname + url.search;
//     const target = `https://api.github.com${apiPath}`;

//     let accept = 'application/vnd.github+json';
//     if (url.searchParams.has('raw')) {
//       accept = 'application/vnd.github.v3.raw';
//     }

//     const resp = await fetch(target, {
//       method: request.method,
//       headers: {
//         Authorization: `token ${env.GITHUB_TOKEN}`,
//         Accept: accept,
//         'User-Agent': 'gh-proxy-worker',
//       },
//       body: request.method !== 'GET' && request.method !== 'HEAD' ? await request.text() : undefined,
//       redirect: 'follow',
//     });

//     const body = await resp.text();

//     // Add bot score info
//     const botScore = request.cf ? request.cf.bot_management.score : 'unknown';
//     const htmlBody = `<html><body><pre>Bot Score: ${botScore}\n\n${body}</pre></body></html>`;

//     return new Response(htmlBody, {
//       status: resp.status,
//       headers: {
//         'Content-Type': 'text/html',
//         'Access-Control-Allow-Origin': '*',
//       },
//     });
//   }
// }

export default {
  async fetch(request, env, ctx) {
    const htmlBody = `<html><body><h1>Test Page</h1><p>This is a simple HTML test from the worker.</p></body></html>`;
    return new Response(htmlBody, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}