// ─────────────────────────────────────────
//  CollegeYatra — One-time Setup Script
//  Run: node setup.js
//  This creates your .env with hashed credentials
// ─────────────────────────────────────────
const bcrypt   = require('bcryptjs');
const crypto   = require('crypto');
const fs       = require('fs');
const path     = require('path');
const readline = require('readline');

const ENV_PATH = path.join(__dirname, '.env');
const SALT_ROUNDS = 12;

const rl = readline.createInterface({
  input:  process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

function hiddenAsk(question) {
  return new Promise(resolve => {
    process.stdout.write(question);
    let password = '';
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', function handler(ch) {
      if (ch === '\n' || ch === '\r' || ch === '\u0003') {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdin.removeListener('data', handler);
        process.stdout.write('\n');
        resolve(password);
      } else if (ch === '\u007f') {
        // backspace
        if (password.length > 0) {
          password = password.slice(0, -1);
          process.stdout.clearLine(0);
          process.stdout.cursorTo(0);
          process.stdout.write(question + '*'.repeat(password.length));
        }
      } else {
        password += ch;
        process.stdout.write('*');
      }
    });
  });
}

async function main() {
  console.log('\n  ╔══════════════════════════════════════╗');
  console.log('  ║    CollegeYatra — Secure Setup       ║');
  console.log('  ╚══════════════════════════════════════╝\n');

  if (fs.existsSync(ENV_PATH)) {
    const overwrite = await ask('  ⚠  .env already exists. Overwrite? (y/N): ');
    if (overwrite.trim().toLowerCase() !== 'y') {
      console.log('  Aborted. Existing .env kept.\n');
      rl.close();
      return;
    }
  }

  console.log('  Set your admin credentials:\n');

  let username = (await ask('  Username [admin]: ')).trim();
  if (!username) username = 'admin';

  let password = '';
  // Try hidden input (works in real terminal), fallback if not a TTY
  try {
    if (process.stdin.isTTY) {
      password = await hiddenAsk('  Password [yatra2026]: ');
    }
  } catch (_) {}

  if (!password) {
    password = (await ask('  Password [yatra2026]: ')).trim();
  }
  if (!password) password = 'yatra2026';

  console.log('\n  Hashing credentials (this takes a moment)...');

  const usernameHash   = await bcrypt.hash(username, SALT_ROUNDS);
  const passwordHash   = await bcrypt.hash(password, SALT_ROUNDS);
  const sessionSecret  = crypto.randomBytes(48).toString('hex');
  const port           = (await ask('  Server port [3000]: ')).trim() || '3000';

  const envContent = `# ═══════════════════════════════════════════════
# CollegeYatra — Environment Configuration
# Generated: ${new Date().toISOString()}
# ⚠  DO NOT share or commit this file!
# ═══════════════════════════════════════════════

PORT=${port}

# Admin credentials — stored as bcrypt hashes (salt rounds: ${SALT_ROUNDS})
# Original credentials are NOT stored here.
# To change credentials, run: node setup.js
ADMIN_USERNAME_HASH=${usernameHash}
ADMIN_PASSWORD_HASH=${passwordHash}

# Session secret — random 48-byte hex string
SESSION_SECRET=${sessionSecret}
`;

  fs.writeFileSync(ENV_PATH, envContent, 'utf-8');

  console.log('\n  ✅  .env created successfully!');
  console.log(`  ✅  Username : ${username}`);
  console.log(`  ✅  Password : ${'*'.repeat(password.length)}`);
  console.log(`  ✅  Port     : ${port}`);
  console.log('\n  Now run: npm start');
  console.log('  Admin panel: http://localhost:' + port + '/admin.html\n');

  rl.close();
}

main().catch(err => {
  console.error('\n  ❌  Setup failed:', err.message);
  process.exit(1);
});
