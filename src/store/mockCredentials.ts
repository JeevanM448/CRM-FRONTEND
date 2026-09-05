/**
 * MOCK-ONLY credential helpers.
 * Production auth must use Supabase Auth — never store application passwords in CRM tables.
 */

export function mockHashPassword(password: string): string {
  return `mock:${Buffer.from(password, "utf8").toString("base64")}`;
}

export function verifyMockPassword(password: string, mockPasswordHash?: string): boolean {
  if (!mockPasswordHash) return false;
  return mockHashPassword(password) === mockPasswordHash;
}
