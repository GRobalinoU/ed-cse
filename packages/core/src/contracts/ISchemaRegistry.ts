/**
 * ISchemaRegistry — Port definition for schema evolution (Avro-based).
 *
 * Wraps Confluent Schema Registry or any compatible implementation.
 * Enables versioned event contracts — critical for fintech and long-lived systems.
 */

export interface SchemaMetadata {
  id: number;
  subject: string;
  version: number;
  schema: string;
}

export interface ISchemaRegistry {
  /**
   * Register a new schema version for a subject (typically: "<eventType>-value").
   * Returns the assigned schema ID.
   */
  register(subject: string, schema: string): Promise<number>;

  /**
   * Retrieve schema metadata by its ID.
   */
  getById(id: number): Promise<SchemaMetadata>;

  /**
   * Retrieve the latest schema for a subject.
   */
  getLatest(subject: string): Promise<SchemaMetadata>;

  /**
   * Encode a payload using the registered schema for a subject.
   */
  encode(subject: string, payload: unknown): Promise<Buffer>;

  /**
   * Decode a previously encoded payload back to its original form.
   */
  decode(buffer: Buffer): Promise<unknown>;
}
