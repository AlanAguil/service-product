import { ValueTransformer } from 'typeorm';
import { KeyValuePair } from './interfaces';

export class KeyValueTransformer implements ValueTransformer {
  to(value: KeyValuePair[] | null): string | null {
    return value ? JSON.stringify(value) : null;
  }

  from(value: string | null): KeyValuePair[] {
    return value ? JSON.parse(value) : [];
  }
} 