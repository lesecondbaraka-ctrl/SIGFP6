import { createClient } from '@supabase/supabase-js';

// Read from environment variables to avoid hardcoding secrets
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes: SUPABASE_URL et/ou SUPABASE_KEY.');
  console.error('   Définissez-les puis relancez ce script.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyUsers() {
  console.log('🔍 Vérification des utilisateurs dans la base...\n');

  // Test 1: Lire tous les utilisateurs
  console.log('1️⃣ Lecture de tous les utilisateurs...');
  const { data: users, error: usersError } = await supabase
    .from('utilisateurs')
    .select('id_utilisateur, nom, prenom, email, role, mot_de_passe');

  if (usersError) {
    console.error('❌ Erreur:', usersError.message);
    console.error('   Code:', usersError.code);
    
    if (usersError.code === 'PGRST301' || usersError.message.includes('JWT')) {
      console.log('\n⚠️ Problème RLS: Les politiques de sécurité bloquent la lecture!');
    }
    return;
  }

  if (!users || users.length === 0) {
    console.log('❌ Aucun utilisateur trouvé dans la base!\n');
    return;
  }

  console.log(`✅ ${users.length} utilisateur(s) trouvé(s)\n`);
  
  users.forEach((user, index) => {
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Utilisateur ${index + 1}:`);
    console.log(`  Nom:           ${user.nom} ${user.prenom}`);
    console.log(`  Email:         ${user.email}`);
    console.log(`  Email (lower): ${user.email.toLowerCase()}`);
    console.log(`  Role:          ${user.role}`);
    console.log(`  Mot de passe:  ${user.mot_de_passe}`);
    console.log(`  ID:            ${user.id_utilisateur}`);
  });
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  // Test 2: Simuler l'authentification
  console.log('2️⃣ Test d\'authentification simulée...\n');
  
  const testEmail = 'admin@sigfp.cd';
  const testPassword = 'Admin2024!';
  
  console.log(`Tentative avec: ${testEmail} / ${testPassword}`);
  
  const { data: authTest, error: authError } = await supabase
    .from('utilisateurs')
    .select('*')
    .eq('email', testEmail)
    .eq('mot_de_passe', testPassword)
    .single();

  if (authError) {
    console.error('❌ Échec authentification:', authError.message);
    console.error('   Code:', authError.code);
    
    // Test avec des variations
    console.log('\n3️⃣ Test des variations...');
    
    // Test sans mot de passe
    const { data: emailOnly, error: emailError } = await supabase
      .from('utilisateurs')
      .select('*')
      .eq('email', testEmail);
    
    if (emailOnly && emailOnly.length > 0) {
      console.log('✅ Email trouvé dans la base');
      console.log(`   Mot de passe dans la base: "${emailOnly[0].mot_de_passe}"`);
      console.log(`   Mot de passe testé:        "${testPassword}"`);
      console.log(`   Correspondent:             ${emailOnly[0].mot_de_passe === testPassword ? '✅ OUI' : '❌ NON'}`);
      
      if (emailOnly[0].mot_de_passe !== testPassword) {
        console.log(`\n   ⚠️ Les mots de passe ne correspondent pas!`);
        console.log(`   Longueur DB:   ${emailOnly[0].mot_de_passe.length} caractères`);
        console.log(`   Longueur test: ${testPassword.length} caractères`);
      }
    } else {
      console.log('❌ Email non trouvé:', emailError?.message);
    }
  } else {
    console.log('✅ Authentification réussie!');
    console.log(`   Utilisateur: ${authTest.nom} ${authTest.prenom}`);
    console.log(`   Role: ${authTest.role}`);
  }

  // Test 4: Vérifier les politiques RLS
  console.log('\n4️⃣ Vérification des politiques RLS...');
  const { data: policies, error: policiesError } = await supabase
    .from('utilisateurs')
    .select('email')
    .limit(1);
  
  if (policiesError) {
    console.log('❌ RLS bloque la lecture:', policiesError.message);
  } else {
    console.log('✅ RLS permet la lecture');
  }
}

verifyUsers().catch(console.error);
