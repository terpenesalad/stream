export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Expose-Headers', '*');

  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  const target = req.query.url;
  if (!target) { res.status(200).send('Stream proxy running on Vercel.'); return; }

  const referer = req.query.referer || '';

  try {
    const targetUrl = new URL(target);
    const headers = {
      'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Connection': 'keep-alive',
    };

    if (referer) {
      headers['Referer'] = referer;
      try { headers['Origin'] = new URL(referer).origin; } catch {}
    } else {
      headers['Referer'] = targetUrl.origin + '/';
      headers['Origin'] = targetUrl.origin;
    }

    const response = await fetch(target, { headers, redirect: 'follow' });

    // Forward content-type
    const ct = response.headers.get('content-type');
    if (ct) res.setHeader('Content-Type', ct);

    const buffer = Buffer.from(await response.arrayBuffer());
    res.status(response.status).send(buffer);
  } catch (err) {
    res.status(502).send('Proxy error: ' + err.message);
  }
}
