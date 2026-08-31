#!/usr/bin/env node
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(process.cwd())

function ok(msg){ console.log(`✅ ${msg}`) }
function warn(msg){ console.warn(`⚠️  ${msg}`) }
function err(msg){ console.error(`❌ ${msg}`) }

function pkgInstalled(dep){
  try { require.resolve(dep, { paths: [root] }); return true } catch { return false }
}

function ensureDeps() {
  const required = [
    'react', 'react-dom', '@vitejs/plugin-react', 'vite', 'typescript'
  ]
  let missing = []
  for (const dep of required) {
    if (pkgInstalled(dep)) ok(`dep ${dep}`)
    else { warn(`manquant: ${dep}`); missing.push(dep) }
  }
  if (missing.length) {
    try {
      execSync('pnpm install', { stdio: 'inherit' })
      ok('Dépendances frontend installées')
    } catch {
      err('Échec installation deps frontend')
      process.exitCode = 1
    }
  }
}

function ensureIndexHtml() {
  const file = path.join(root, 'index.html')
  if (!fs.existsSync(file)) {
    err('index.html manquant (créé automatiquement précédemment)')
    process.exitCode = 1
  } else {
    ok('index.html présent')
  }
}

function ensureEnv() {
  // optional variable hint
  ok('Variables d\'environnement Vite facultatives (VITE_API_URL)')
}

ensureDeps()
ensureIndexHtml()
ensureEnv()
console.log('\n— Frontend check terminé —')


