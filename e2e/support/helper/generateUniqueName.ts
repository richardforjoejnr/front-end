/**
 * Tests run fully parallel against one shared database, so any text a test asserts on
 * must be unique to that test run. Prefix keeps failures readable in the DB.
 */
export function generateUniqueName(prefix: string): string {
  const unique = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  return `${prefix} ${unique}`;
}
