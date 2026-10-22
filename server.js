const version = () => process.env.APP_VERSION || 'dev';

export function handle(req, res) {
  const send = (status, body) => {
    res.writeHead(status, { 'content-type': 'application/json', 'access-control-allow-origin': '*' });
    res.end(JSON.stringify(body));
  };
  if (req.url === '/health') return send(200, { ok: true });
  if (req.url === '/version') return send(200, { service: 'be', version: version() });
  return send(404, { error: 'not found' });
}
