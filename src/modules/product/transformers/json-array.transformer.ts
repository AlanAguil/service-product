import { ValueTransformer } from 'typeorm';

export class JsonArrayTransformer implements ValueTransformer {
  to(value: string[] | null): string | null {
    return value ? JSON.stringify(value) : null;
  }

  from(value: string | null): string[] {
    return value ? JSON.parse(value) : [];
  }
} 