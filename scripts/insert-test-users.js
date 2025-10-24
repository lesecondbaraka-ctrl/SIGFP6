import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hhbjkrdazcnmwqdpczhr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoYmprcmRhemNubXdxZHBjemhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1MDA5NjgsImV4cCI6MjA3MzA3Njk2OH0.ij_lSBoJmbuCW5nMBkUibBVoCG5nenPItHrWdsJ9Ipg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function insertTestUsers() {
  console.log('🚀 Insertion des utilisateurs de test...\n');

  // D'abord, récupérer l'ID d'une entité existante ou en créer une
  let entiteId = null;
  
  console.log('1️⃣ Vérification des entités...');
  const { data: entites, error: entiteError } = await supabase
    .from('entites')
    .select('id_entite, nom_entite')
    .limit(1);

  if (entiteError) {
    console.error('❌ Erreur:', entiteError.message);
    console.log('\n⚠️ La table "entites" doit exister. Création d\'une entité de test...');
    
    // Créer une entité de test
    const { data: newEntite, error: createError } = await supabase
      .from('entites')
      .insert([{
        nom_entite: 'Ministère du Budget',
        statut: true
      }])
      .select();

    if (createError) {
      console.error('❌ Impossible de créer l\'entité:', createError.message);
      return;
    }
    entiteId = newEntite[0].id_entite;
    console.log('✅ Entité créée:', newEntite[0].nom_entite);
  } else if (entites && entites.length > 0) {
    entiteId = entites[0].id_entite;
    console.log('✅ Entité existante trouvée:', entites[0].nom_entite);
  }

  // Insertion des utilisateurs de test
  console.log('\n2️⃣ Insertion des utilisateurs...');
  
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
      console.error(`❌ Erreur insertion ${user.email}:`, error.message);
      if (error.code === '23505') {
        console.log(`   ℹ️ L'utilisateur ${user.email} existe déjà`);
      }
    } else {
      console.log(`✅ Utilisateur créé: ${user.email} (${user.role})`);
    }
  }

  // Vérification finale
  console.log('\n3️⃣ Vérification finale...');
  const { count } = await supabase
    .from('utilisateurs')
    .select('*', { count: 'exact', head: true });
  
  console.log(`✅ Total utilisateurs dans la base: ${count}`);
  
  console.log('\n📝 Identifiants de connexion disponibles:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Admin:       admin@sigfp.cd       / Admin2024!');
  console.log('IGF:         igf@sigfp.cd         / IGF2024!');
  console.log('Contrôleur:  controleur1@sigfp.cd / Ctrl2024!');
  console.log('Comptable:   comptable1@sigfp.cd  / Cmpt2024!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

insertTestUsers().catch(console.error);
