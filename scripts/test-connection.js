import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hhbjkrdazcnmwqdpczhr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoYmprcmRhemNubXdxZHBjemhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1MDA5NjgsImV4cCI6MjA3MzA3Njk2OH0.ij_lSBoJmbuCW5nMBkUibBVoCG5nenPItHrWdsJ9Ipg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('🔍 Test de connexion Supabase...\n');

  // Test 1: Vérifier la connexion
  console.log('1️⃣ Vérification de la connexion...');
  try {
    const { data, error } = await supabase.from('utilisateurs').select('count');
    if (error) {
      console.error('❌ Erreur de connexion:', error.message);
      console.error('   Code:', error.code);
      console.error('   Détails:', error.details);
    } else {
      console.log('✅ Connexion réussie!');
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
  }

  // Test 2: Lister les tables disponibles
  console.log('\n2️⃣ Vérification de la structure...');
  try {
    const { data, error } = await supabase.from('utilisateurs').select('*').limit(1);
    if (error) {
      console.error('❌ Erreur:', error.message);
      if (error.code === '42P01') {
        console.error('   ⚠️ La table "utilisateurs" n\'existe pas dans Supabase!');
      }
    } else {
      console.log('✅ Table "utilisateurs" existe');
      if (data.length > 0) {
        console.log('   Colonnes disponibles:', Object.keys(data[0]));
      }
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
  }

  // Test 3: Chercher un utilisateur de test
  console.log('\n3️⃣ Recherche de l\'utilisateur admin...');
  try {
    const { data, error } = await supabase
      .from('utilisateurs')
      .select('*')
      .eq('email', 'admin@sigfp.cd')
      .single();
    
    if (error) {
      console.error('❌ Erreur:', error.message);
      console.error('   Code:', error.code);
    } else if (data) {
      console.log('✅ Utilisateur trouvé:');
      console.log('   Email:', data.email);
      console.log('   Nom:', data.nom, data.prenom);
      console.log('   Role:', data.role);
      console.log('   Mot de passe stocké:', data.mot_de_passe ? '***' : 'NULL');
    } else {
      console.log('⚠️ Aucun utilisateur avec cet email');
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
  }

  // Test 4: Compter les utilisateurs
  console.log('\n4️⃣ Comptage des utilisateurs...');
  try {
    const { count, error } = await supabase
      .from('utilisateurs')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Erreur:', error.message);
    } else {
      console.log('✅ Nombre d\'utilisateurs:', count);
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
  }
}

testConnection();
