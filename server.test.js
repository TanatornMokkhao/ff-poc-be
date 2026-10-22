import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { handle } from './server.js';

function get(server, path) {
  return new Promise((resolve, reject) => {
    const { port } = server.address();
    http.get({ port, path }, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(body) }));
    }).on('error', reject);
  });
}

test('health and version answer', async () => {
  const server = http.createServer(handle).listen(0);
  try {
    assert.deepEqual((await get(server, '/health')).body, { ok: true });
    assert.equal((await get(server, '/version')).body.service, 'be');
    assert.equal((await get(server, '/nope')).status, 404);
  } finally {
    server.close();
  }
});
