# 22. Security & Privacy

Financial data is highly sensitive. Even though we are a simulation platform, we adhere to high security standards.

## 1. Data Minimization
- **No Data Collection:** The platform should be fully functional without an account.
- **Local-First:** User investment data (Notebook) is stored in the browser's `IndexedDB` by default.
- **No PII:** We do not ask for names, bank account numbers, or real identities.

## 2. Security Best Practices
- **HTTPS Only:** All traffic encrypted via TLS.
- **Content Security Policy (CSP):** Strict policy to prevent XSS (Cross-Site Scripting).
- **Input Sanitization:** All user-provided numbers and strings are validated before being used in calculations or stored.
- **Dependency Auditing:** Monthly `npm audit` to check for vulnerabilities in libraries like `Decimal.js` or `Next.js`.

## 3. Calculation Integrity
- **Tamper-proof Engine:** The calculation core is versioned. Results include a "Version ID" so users can verify which logic was used.
- **No Client-Side Overrides:** While the engine runs on the client, the "Rules" (Margins, Tax rates) are fetched from the secure server-side database.

## 4. Privacy Policy (Summary)
- We do not sell user data.
- Analytics are anonymized (e.g., using Plausible instead of Google Analytics) to respect user privacy.
- If a user creates an account for syncing, their data is encrypted before storage.

## 5. Security for Account Features (Future)
- **Auth:** Use a trusted provider like Supabase Auth or Clerk.
- **Encryption:** Use Web Crypto API to encrypt the "Notebook" using a user-derived key before it ever leaves the browser.
- **MFA:** Support for Multi-Factor Authentication for any account-based features.
