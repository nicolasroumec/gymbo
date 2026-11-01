// PreToolUse (Edit|Write): bloquea cambios a migraciones ya commiteadas.
// Una migración nueva (sin commitear) se puede editar libremente.
import { execFileSync } from 'node:child_process';

let input = '';
for await (const chunk of process.stdin) input += chunk;
let file = '';
try { file = JSON.parse(input).tool_input?.file_path ?? ''; } catch { process.exit(0); }

if (!file.replace(/\\/g, '/').includes('supabase/migrations/')) process.exit(0);

try {
  execFileSync('git', ['ls-files', '--error-unmatch', file], { stdio: 'ignore' });
} catch {
  process.exit(0); // no está commiteada (o todavía no hay repo git): se permite
}

console.error(`Bloqueado: ${file} es una migración commiteada y puede estar aplicada en la base. Creá una nueva con "npx supabase migration new <nombre>".`);
process.exit(2);
