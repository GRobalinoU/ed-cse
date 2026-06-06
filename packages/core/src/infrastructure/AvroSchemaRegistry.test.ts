/**
 * AvroSchemaRegistry — unit tests (no Docker required).
 *
 * Tests encode/decode logic and error handling using a mock HTTP server
 * built with native Node.js — zero external test dependencies.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer, type Server } from 'http';
import { AvroSchemaRegistry } from './AvroSchemaRegistry.js';

// ─── Minimal Schema Registry mock ────────────────────────────────────────────

const ORDER_SCHEMA = JSON.stringify({
  type: 'record',
  name: 'OrderEvent',
  fields: [
    { name: 'orderId', type: 'string' },
    { name: 'amount', type: 'double' },
    { name: 'status', type: 'string' },
  ],
});

const schemas: Record<number, { schema: string; subject: string; version: number }> = {};
const subjects: Record<string, number> = {};
let nextId = 1;

function mockRegistryServer(): Server {
  return createServer((req, res) => {
    res.setHeader('Content-Type', 'application/vnd.schemaregistry.v1+json');
    let body = '';
    req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
    req.on('end', () => {
      const url = req.url ?? '';

      // POST /subjects/:subject/versions — register schema
      const registerMatch = url.match(/^\/subjects\/(.+)\/versions$/);
      if (req.method === 'POST' && registerMatch) {
        const subject = decodeURIComponent(registerMatch[1]!);
        const { schema } = JSON.parse(body) as { schema: string };
        const id = nextId++;
        schemas[id] = { schema, subject, version: 1 };
        subjects[subject] = id;
        res.writeHead(200);
        res.end(JSON.stringify({ id }));
        return;
      }

      // GET /schemas/ids/:id
      const byIdMatch = url.match(/^\/schemas\/ids\/(\d+)$/);
      if (req.method === 'GET' && byIdMatch) {
        const id = parseInt(byIdMatch[1]!, 10);
        const entry = schemas[id];
        if (!entry) { res.writeHead(404); res.end(JSON.stringify({ error_code: 40403, message: 'Schema not found' })); return; }
        res.writeHead(200);
        res.end(JSON.stringify({ id, schema: entry.schema, subject: entry.subject, version: entry.version }));
        return;
      }

      // GET /subjects/:subject/versions/latest
      const latestMatch = url.match(/^\/subjects\/(.+)\/versions\/latest$/);
      if (req.method === 'GET' && latestMatch) {
        const subject = decodeURIComponent(latestMatch[1]!);
        const id = subjects[subject];
        if (!id) { res.writeHead(404); res.end(JSON.stringify({ error_code: 40401, message: 'Subject not found' })); return; }
        const entry = schemas[id]!;
        res.writeHead(200);
        res.end(JSON.stringify({ id, subject, version: entry.version, schema: entry.schema }));
        return;
      }

      res.writeHead(404);
      res.end(JSON.stringify({ error_code: 404, message: 'Not found' }));
    });
  });
}

// ─── Test setup ───────────────────────────────────────────────────────────────

let server: Server;
let registry: AvroSchemaRegistry;
const PORT = 18081;

beforeAll(async () => {
  // Reset state
  nextId = 1;
  Object.keys(schemas).forEach((k) => { delete schemas[k as unknown as number]; });
  Object.keys(subjects).forEach((k) => { delete subjects[k]; });

  server = mockRegistryServer();
  await new Promise<void>((resolve) => server.listen(PORT, resolve));
  registry = new AvroSchemaRegistry({ baseUrl: `http://localhost:${PORT}` });
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) =>
    server.close((err) => (err ? reject(err) : resolve())),
  );
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AvroSchemaRegistry', () => {
  describe('register', () => {
    it('registers a schema and returns a numeric ID', async () => {
      const id = await registry.register('order-event', ORDER_SCHEMA);
      expect(typeof id).toBe('number');
      expect(id).toBeGreaterThan(0);
    });

    it('throws when schema JSON is invalid', async () => {
      await expect(
        registry.register('bad-subject', '{ invalid json }'),
      ).rejects.toThrow();
    });
  });

  describe('getById', () => {
    it('retrieves schema metadata by ID', async () => {
      const id = await registry.register('order-v2', ORDER_SCHEMA);
      const metadata = await registry.getById(id);

      expect(metadata.id).toBe(id);
      expect(JSON.parse(metadata.schema)).toMatchObject({ name: 'OrderEvent' });
    });

    it('throws when schema ID does not exist', async () => {
      await expect(registry.getById(99999)).rejects.toThrow('404');
    });
  });

  describe('getLatest', () => {
    it('retrieves the latest schema for a subject', async () => {
      await registry.register('order-latest', ORDER_SCHEMA);
      const metadata = await registry.getLatest('order-latest');

      expect(metadata.subject).toBe('order-latest');
      expect(metadata.version).toBe(1);
    });

    it('throws when subject does not exist', async () => {
      await expect(registry.getLatest('nonexistent-subject')).rejects.toThrow('404');
    });
  });

  describe('encode / decode', () => {
    it('round-trips a valid payload', async () => {
      await registry.register('order-encode', ORDER_SCHEMA);

      const payload = { orderId: 'ord-123', amount: 99.99, status: 'confirmed' };
      const buffer = await registry.encode('order-encode', payload);

      expect(buffer[0]).toBe(0x00); // magic byte
      expect(buffer.length).toBeGreaterThan(5);

      const decoded = await registry.decode(buffer);
      expect(decoded).toMatchObject(payload);
    });

    it('throws when payload does not match schema', async () => {
      await registry.register('order-strict', ORDER_SCHEMA);

      await expect(
        registry.encode('order-strict', { orderId: 123, amount: 'not-a-number', status: 'x' }),
      ).rejects.toThrow('does not match Avro schema');
    });

    it('throws when buffer has invalid magic byte', async () => {
      const badBuffer = Buffer.from([0x01, 0x00, 0x00, 0x00, 0x01, 0xFF]);
      await expect(registry.decode(badBuffer)).rejects.toThrow('magic byte');
    });

    it('throws when buffer is too short', async () => {
      await expect(registry.decode(Buffer.from([0x00, 0x01]))).rejects.toThrow('too short');
    });

    it('uses cached type on repeated encode calls', async () => {
      await registry.register('order-cache', ORDER_SCHEMA);
      const payload = { orderId: 'ord-cache', amount: 1.0, status: 'pending' };

      // First call populates cache
      const buf1 = await registry.encode('order-cache', payload);
      // Second call uses cache — same result
      const buf2 = await registry.encode('order-cache', payload);

      expect(buf1.toString('hex')).toBe(buf2.toString('hex'));
    });
  });

  describe('timeout', () => {
    it('throws on request timeout', async () => {
      // Registry with 1ms timeout — will always time out
      const fastTimeoutRegistry = new AvroSchemaRegistry({
        baseUrl: `http://localhost:${PORT}`,
        timeoutMs: 1,
      });

      await expect(
        fastTimeoutRegistry.getLatest('any-subject'),
      ).rejects.toThrow(/timed out|abort/i);
    });
  });
});
