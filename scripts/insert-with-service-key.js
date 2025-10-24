import { createClient } from '@supabase/supabase-js';

// ⚠️ ATTENTION: Remplacez cette clé par votre clé SERVICE_ROLE
// Trouvez-la dans: Dashboard Supabase > Settings > API > service_role key
const supabaseUrl = 'https://hhbjkrdazcnmwqdpczhr.supabase.co';
const supabaseServiceKey = 'VOTRE_CLE_SERVICE_ROLE_ICI'; // ⚠️ À REMPLACER

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function insertTestUsers() {
  console.log('🚀 Insertion des utilisateurs avec service_role key...\n');

  // Récupérer une entité existante
  const { data: entites } = await supabase
    .from('entites')
    .select('id_entite')
    .limit(1);

  const entiteId = entites && entites[0] ? entites[0].id_entite : null;

  const testUsers = [
    {
      nom: 'ADMIN',
      prenom: 'Système',
      email: 'admin@sigfp.cd',
      mot_de_passe: 'Admin2024!',
      role: 'Administrateur',
      id_entite: entiteId,
      adresse: 'Kinshasa, RDC',
      telephone: '+243-12-000-0001'
    },
    {
      nom: 'INSPECTEUR',
      prenom: 'Général',
      email: 'igf@sigfp.cd',
      mot_de_passe: 'IGF2024!',
      role: 'IGF',
      id_entite: entiteId,
      adresse: 'Kinshasa, RDC',
      telephone: '+243-12-000-0002'
    },
    {
      nom: 'MUKENDI',
      prenom: 'Jean-Pierre',
      email: 'controleur1@sigfp.cd',
      mot_de_passe: 'Ctrl2024!',
      role: 'Contrôleur',
      id_entite: entiteId,
      adresse: 'Kinshasa, RDC',
      telephone: '+243-12-000-0003'
    },
    {
      nom: 'LUMUMBA',
      prenom: 'Patrice',
      email: 'comptable1@sigfp.cd',
      mot_de_passe: 'Cmpt2024!',
      role: 'Comptable',
      id_entite: entiteId,
      adresse: 'Kinshasa, RDC',
      telephone: '+243-12-000-0005'
    }
  ];

  for (const user of testUsers) {
    const { data, error } = await supabase
      .from('utilisateurs')
      .insert([user])
      .select();

    if (error) {
      console.error(`❌ ${user.email}:`, error.message);
    } else {
      console.log(`✅ ${user.email} créé avec succès`);
    }
  }

  const { count } = await supabase
    .from('utilisateurs')
    .select('*', { count: 'exact', head: true });
  
  console.log(`\n✅ Total: ${count} utilisateurs\n`);
}

if (supabaseServiceKey === 'VOTRE_CLE_SERVICE_ROLE_ICI') {
  console.error('❌ ERREUR: Vous devez d\'abord remplacer la clé service_role dans le script!');
  console.log('\n📍 Trouvez votre clé dans:');
  console.log('   Dashboard Supabase > Settings > API > service_role key\n');
} else {
  insertTestUsers().catch(console.error);
}
