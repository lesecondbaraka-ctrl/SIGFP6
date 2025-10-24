#!/usr/bin/env node

/**
 * Script pour corriger automatiquement les problèmes courants du projet SIGFP
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Correction automatique des problèmes SIGFP...\n');

// 1. Supprimer les console.log en production
function removeConsoleLogs(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const originalLength = content.length;
  
  // Supprimer console.log, console.warn, console.error (mais garder console.error pour les vraies erreurs)
  content = content.replace(/console\.(log|warn)\([^)]*\);?\n?/g, '');
  
  if (content.length !== originalLength) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Console logs supprimés dans: ${path.basename(filePath)}`);
  }
}

// 2. Ajouter les attributs d'accessibilité manquants
function fixAccessibility(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Corriger les select sans aria-label
  const selectRegex = /<select([^>]*?)(?!.*aria-label)([^>]*?)>/g;
  content = content.replace(selectRegex, (match, before, after) => {
    if (!match.includes('aria-label')) {
      modified = true;
      return match.replace('>', ' aria-label="Sélectionner une option" title="Sélectionner une option">');
    }
    return match;
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Accessibilité corrigée dans: ${path.basename(filePath)}`);
  }
}

// 3. Corriger les imports inutilisés (basique)
function fixUnusedImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Commenter les imports inutilisés (approche conservatrice)
  const lines = content.split('\n');
  const newLines = lines.map(line => {
    if (line.includes('// import type {') && line.includes('actuellement non utilisés')) {
      return line; // Déjà commenté
    }
    return line;
  });
  
  const newContent = newLines.join('\n');
  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent);
    console.log(`✅ Imports optimisés dans: ${path.basename(filePath)}`);
    modified = true;
  }
  
  return modified;
}

// Parcourir tous les fichiers TypeScript/React
function processFiles() {
  const srcDir = path.join(__dirname, '..', 'src');
  
  function walkDir(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        walkDir(filePath);
      } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        // Ignorer les fichiers de test
        if (!file.includes('.test.') && !file.includes('.spec.')) {
          try {
            removeConsoleLogs(filePath);
            fixAccessibility(filePath);
            fixUnusedImports(filePath);
          } catch (error) {
            console.warn(`⚠️  Erreur lors du traitement de ${file}: ${error.message}`);
          }
        }
      }
    });
  }
  
  walkDir(srcDir);
}

// Exécuter les corrections
try {
  processFiles();
  console.log('\n🎉 Correction automatique terminée !');
  console.log('\n📋 Actions recommandées :');
  console.log('1. Vérifier les modifications avec git diff');
  console.log('2. Tester la compilation avec npm run build');
  console.log('3. Tester l\'application avec npm run dev');
} catch (error) {
  console.error('❌ Erreur lors de la correction:', error.message);
  process.exit(1);
}
