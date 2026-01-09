# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2.x.x   | :white_check_mark: |
| 1.x.x   | :x:                |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please report it responsibly.

### How to Report

**DO NOT** open a public GitHub issue for security vulnerabilities.

Instead, please email us at: **security@baraqex.tech**

Or use GitHub's private vulnerability reporting feature:
1. Go to the Security tab of this repository
2. Click "Report a vulnerability"
3. Fill out the form with details

### What to Include

- Type of vulnerability
- Full paths of source file(s) related to the vulnerability
- Location of the affected source code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Resolution Target**: Within 30 days (depending on complexity)

### Disclosure Policy

- We will acknowledge your email within 48 hours
- We will confirm the vulnerability and determine its impact
- We will release a fix as soon as possible, depending on complexity
- We will publicly disclose the vulnerability after a fix is available

### Recognition

We appreciate the security research community's efforts. Reporters who responsibly disclose vulnerabilities will be:

- Credited in our CHANGELOG (if desired)
- Added to our Security Hall of Fame
- Eligible for our bug bounty program (if applicable)

## Security Best Practices

When using Baraqex, follow these security recommendations:

### Server Configuration

```javascript
import { Server } from 'baraqex/server';

const server = new Server({
  // Use environment variables for secrets
  auth: {
    secret: process.env.JWT_SECRET,
    expiresIn: '1h', // Short-lived tokens
  },
  
  // Configure CORS properly
  corsOptions: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || 'https://yourdomain.com',
    credentials: true,
  },
  
  // Enable rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
  },
});
```

### Environment Variables

Never commit sensitive data. Use `.env` files:

```bash
# .env (add to .gitignore!)
JWT_SECRET=your-super-secret-key-minimum-32-chars
DATABASE_URL=postgres://user:pass@host:5432/db
API_KEY=your-api-key
```

### Input Validation

Always validate and sanitize user input:

```javascript
import { validateInput } from 'baraqex/forms';

export async function POST(req, res) {
  const { error, data } = validateInput(req.body, {
    email: { type: 'email', required: true },
    password: { type: 'string', minLength: 8, required: true },
    age: { type: 'number', min: 13 },
  });
  
  if (error) {
    return res.status(400).json({ error });
  }
  
  // Safe to use data
}
```

### SQL Injection Prevention

Use parameterized queries:

```javascript
// ❌ DON'T - Vulnerable to SQL injection
const query = `SELECT * FROM users WHERE id = ${userId}`;

// ✅ DO - Use parameterized queries
const result = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
```

### XSS Prevention

The Baraqex renderer automatically escapes content by default:

```jsx
// Content is automatically escaped
<div>{userInput}</div>

// If you need raw HTML (use with caution!)
<div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
```

## Dependencies

We regularly audit our dependencies using:

```bash
npm audit
```

We encourage you to do the same in your projects.

## Security Updates

Security updates are released as patch versions (e.g., 2.0.1). Subscribe to:

- GitHub Security Advisories
- npm security notifications
- Our mailing list at baraqex.tech

---

Thank you for helping keep Baraqex and its users safe! 🛡️
