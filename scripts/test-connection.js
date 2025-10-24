import { createClient } from '@supabase/supabase-js';

// Read from environment variables to avoid hardcoding secrets in VCS
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes: SUPABASE_URL et/ou SUPABASE_KEY.');
  console.error('   Définissez-les avant d\'exécuter ce script.');
  process.exit(1);
}

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
