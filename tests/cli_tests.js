/**
 * CLI Test Suite for "En Territorio Verde"
 * Uses native fetch (Node 24+) to verify the project's health.
 */

const BASE_URL = "http://localhost/CAS/enterritorioverde";
const COLORS = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m"
};

let passed = 0;
let total = 0;

async function test(name, fn) {
  total++;
  try {
    const result = await fn();
    if (result) {
      console.log(`${COLORS.green}✅ PASS: ${name}${COLORS.reset}`);
      passed++;
    } else {
      console.log(`${COLORS.red}❌ FAIL: ${name} (Condición no cumplida)${COLORS.reset}`);
    }
  } catch (e) {
    console.log(`${COLORS.red}❌ FAIL: ${name} (Error: ${e.message})${COLORS.reset}`);
  }
}

async function runAll() {
  console.log(`\n${COLORS.cyan}🚀 Iniciando Suite de Pruebas de Consola...${COLORS.reset}\n`);

  // T1: Disponibilidad de la Home
  await test("Página de Inicio (index.html) responde 200", async () => {
    const res = await fetch(`${BASE_URL}/index.html`);
    return res.status === 200;
  });

  // T2: Carga de Estilos
  await test("Archivo de Estilos (styles.css) es accesible", async () => {
    const res = await fetch(`${BASE_URL}/css/styles.css?v=6`);
    return res.status === 200 && res.headers.get('content-type').includes('css');
  });

  // T3: API de Datos (Sección Inicio)
  await test("API responde con JSON válido para 'inicio'", async () => {
    const res = await fetch(`${BASE_URL}/api.php?action=data&section=inicio`);
    const data = await res.json();
    return res.status === 200 && Array.isArray(data.programas_destacados);
  });

  // T4: Verificación de Logo (Transparencia PNG)
  await test("El logo (img/favicon.png) existe y es imagen", async () => {
    const res = await fetch(`${BASE_URL}/img/favicon.png`);
    return res.status === 200 && res.headers.get('content-type').includes('image');
  });

  // T5: Seguridad básica (Login fallido)
  await test("Endpoint de Login responde con error en credenciales vacías", async () => {
    const res = await fetch(`${BASE_URL}/api.php?action=login`, {
      method: 'POST',
      body: JSON.stringify({ user: '', pass: '' })
    });
    return res.status === 401; // Esperamos denegación
  });

  // T6: Datos de Nosotros
  await test("Sección 'Nosotros' tiene configuración disponible", async () => {
    const res = await fetch(`${BASE_URL}/api.php?action=data&section=nosotros`);
    const data = await res.json();
    return res.status === 200 && data.historia.titulo !== "";
  });

  console.log(`\n${COLORS.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLORS.reset}`);
  console.log(`${passed === total ? COLORS.green : COLORS.red}  RESUMEN: ${passed} de ${total} pruebas pasadas.${COLORS.reset}`);
  console.log(`${COLORS.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLORS.reset}\n`);

  if (passed !== total) process.exit(1);
}

runAll().catch(e => {
  console.error(e);
  process.exit(1);
});
