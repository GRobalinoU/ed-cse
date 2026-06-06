/**
 * AvroSchemaRegistry — integration tests (requires Docker).
 *
 * Run with: INTEGRATION=true pnpm --filter @ed-cse/core test:run
 * Requires: docker compose up -d schema-registry (from repo root)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { AvroSchemaRegistry } from './AvroSchemaRegistry.js';

const REGISTRY_URL = process.env['SCHEMA_REGISTRY_URL'] ?? 'http://localhost:8081';
const RUN = process.env['INTEGRATION'] === 'true';

const ORDER_SCHEMA = JSON.stringify({
  type: 'record',
  name: 'OrderEvent',
  namespace: 'io.edcse.v1',
  fields: [
    { name: 'orderId',   type: 'string' },
    { name: 'amount',    type: 'double' },
    { name: 'status',    type: 'string' },
    { name: 'createdAt', type: 'string' },
  ],
});

describe.skipIf(!RUN)('AvroSchemaRegistry [integration]', () => {
  let registry: AvroSchemaRegistry;

  beforeAll(() => {
    registry = new AvroSchemaRegistry({ baseUrl: REGISTRY_URL });
  });

  it('registers a schema against real Confluent Schema Registry', async () => {
    const id = await registry.register('order-event-integration-value', ORDER_SCHEMA);
    expect(id).toBeGreaterThan(0);
    console.log(`Registered schema ID: ${id}`);
  });

  it('retrieves the registered schema by ID', async () => {
    const id = await registry.register('order-event-getbyid-value', ORDER_SCHEMA);
    const metadata = await registry.getById(id);
    expect(metadata.id).toBe(id);
    expect(JSON.parse(metadata.schema)).toMatchObject({ name: 'OrderEvent' });
  });

  it('encodes and decodes a payload with Confluent wire format', async () => {
    await registry.register('order-event-roundtrip-value', ORDER_SCHEMA);

    const payload = {
      orderId: `ord-${Date.now()}`,
      amount: 150.75,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };

    const encoded = await registry.encode('order-event-roundtrip-value', payload);
    const decoded = await registry.decode(encoded);

    expect(decoded).toMatchObject(payload);
    console.log('Round-trip payload:', decoded);
  });

  it('returns same schema ID for duplicate registration (idempotent)', async () => {
    const subject = 'order-event-idempotent-value';
    const id1 = await registry.register(subject, ORDER_SCHEMA);
    const id2 = await registry.register(subject, ORDER_SCHEMA);
    expect(id1).toBe(id2);
  });
});
