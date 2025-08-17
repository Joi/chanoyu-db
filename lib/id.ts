import { customAlphabet } from 'nanoid';

const alphabet = '0123456789bcdfghjkmnpqrstvwxz';

export function mintToken(length: number = 12): string {
  const len = Math.max(10, Math.min(20, length));
  return customAlphabet(alphabet, len)();
}
