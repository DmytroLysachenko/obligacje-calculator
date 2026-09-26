import { vi } from 'vitest';

// Unit suites never inherit a developer's live Neon connection. Authenticated
// database checks run in the separate isolated integration workflow.
vi.stubEnv('DATABASE_URL', '');
