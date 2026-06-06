/**
 * AvroSchemaRegistry — ISchemaRegistry adapter using Apache Avro + Confluent Schema Registry.
 *
 * Handles schema registration, versioning, and Avro encode/decode.
 * The wire format uses the Confluent framing: [0x00][4-byte schema ID][avro bytes]
 * This ensures any consumer can look up the schema by ID to decode the payload.
 */

import avro from 'avsc';
import type { ISchemaRegistry, SchemaMetadata } from '../contracts/ISchemaRegistry.js';

/** Magic byte used in Confluent wire format */
const MAGIC_BYTE = 0x00;
/** Size of the framing header: 1 magic byte + 4 bytes schema ID */
const HEADER_SIZE = 5;

export interface AvroSchemaRegistryOptions {
  /** Base URL of the Confluent Schema Registry, e.g. http://localhost:8081 */
  baseUrl: string;
  /** Optional fetch timeout in milliseconds. Defaults to 5000. */
  timeoutMs?: number;
}

export class AvroSchemaRegistry implements ISchemaRegistry {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  /** Local cache: schemaId → parsed avro.Type */
  private readonly typeCache = new Map<number, avro.Type>();
  /** Local cache: subject → latest SchemaMetadata */
  private readonly latestCache = new Map<string, SchemaMetadata>();

  constructor(options: AvroSchemaRegistryOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.timeoutMs = options.timeoutMs ?? 5000;
  }

  // ─── ISchemaRegistry implementation ─────────────────────────────────────────

  async register(subject: string, schema: string): Promise<number> {
    // Validate schema parses before sending to registry
    avro.Type.forSchema(JSON.parse(schema) as avro.schema.AvroSchema);

    const response = await this.fetch(`/subjects/${subject}/versions`, {
      method: 'POST',
      body: JSON.stringify({ schema }),
    });

    const data = response as { id: number };
    return data.id;
  }

  async getById(id: number): Promise<SchemaMetadata> {
    const response = await this.fetch(`/schemas/ids/${id}`) as {
      schema: string;
      subject?: string;
      version?: number;
    };

    return {
      id,
      subject: response.subject ?? '',
      version: response.version ?? 0,
      schema: response.schema,
    };
  }

  async getLatest(subject: string): Promise<SchemaMetadata> {
    const response = await this.fetch(`/subjects/${subject}/versions/latest`) as {
      id: number;
      version: number;
      schema: string;
    };

    const metadata: SchemaMetadata = {
      id: response.id,
      subject,
      version: response.version,
      schema: response.schema,
    };

    this.latestCache.set(subject, metadata);
    return metadata;
  }

  async encode(subject: string, payload: unknown): Promise<Buffer> {
    const metadata = await this.getLatest(subject);
    const type = this.getOrParseType(metadata.id, metadata.schema);

    // Validate payload matches schema before encoding
    const validationResult = type.isValid(payload, { errorHook: () => true });
    if (!validationResult) {
      throw new Error(
        `Payload does not match Avro schema for subject "${subject}" (schema id: ${metadata.id})`,
      );
    }

    const avroBytes = type.toBuffer(payload);

    // Confluent wire format: [0x00][schemaId 4 bytes BE][avro payload]
    const buffer = Buffer.allocUnsafe(HEADER_SIZE + avroBytes.length);
    buffer.writeUInt8(MAGIC_BYTE, 0);
    buffer.writeInt32BE(metadata.id, 1);
    avroBytes.copy(buffer, HEADER_SIZE);

    return buffer;
  }

  async decode(buffer: Buffer): Promise<unknown> {
    if (buffer.length < HEADER_SIZE) {
      throw new Error(`Buffer too short to contain Confluent framing (got ${buffer.length} bytes)`);
    }

    const magic = buffer.readUInt8(0);
    if (magic !== MAGIC_BYTE) {
      throw new Error(`Invalid magic byte: expected 0x00, got 0x${magic.toString(16)}`);
    }

    const schemaId = buffer.readInt32BE(1);
    const avroBytes = buffer.subarray(HEADER_SIZE);

    const type = await this.resolveType(schemaId);
    return type.fromBuffer(Buffer.from(avroBytes));
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private getOrParseType(schemaId: number, schema: string): avro.Type {
    const cached = this.typeCache.get(schemaId);
    if (cached) return cached;

    const type = avro.Type.forSchema(JSON.parse(schema) as avro.schema.AvroSchema);
    this.typeCache.set(schemaId, type);
    return type;
  }

  private async resolveType(schemaId: number): Promise<avro.Type> {
    const cached = this.typeCache.get(schemaId);
    if (cached) return cached;

    const metadata = await this.getById(schemaId);
    return this.getOrParseType(schemaId, metadata.schema);
  }

  private async fetch(path: string, options?: { method?: string; body?: string }): Promise<unknown> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await globalThis.fetch(`${this.baseUrl}${path}`, {
        method: options?.method ?? 'GET',
        headers: {
          'Content-Type': 'application/vnd.schemaregistry.v1+json',
          'Accept': 'application/vnd.schemaregistry.v1+json',
        },
        body: options?.body,
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `Schema Registry error ${response.status} on ${options?.method ?? 'GET'} ${path}: ${errorBody}`,
        );
      }

      return response.json();
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error(`Schema Registry request timed out after ${this.timeoutMs}ms: ${path}`);
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }
}
