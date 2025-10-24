import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Document {
  id: string;
  nom: string;
  type: string;
  categorie: 'BUDGET' | 'DEPENSE' | 'RECETTE' | 'RAPPORT' | 'CONTRAT' | 'AUTRE';
  taille: number;
  taille_formatee?: string;
  url: string;
  entite_id: string;
  entite_nom?: string;
  uploaded_by: string;
  uploaded_by_name?: string;
  date_upload: string;
  ressource_type?: string;
  ressource_id?: string;
  statut: 'ACTIF' | 'ARCHIVE' | 'SUPPRIME';
  metadata?: any;
}

export const useDocuments = (filters?: {
  categorie?: string;
  entite_id?: string;
  ressource_type?: string;
  ressource_id?: string;
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('documents')
        .select('*')
        .neq('statut', 'SUPPRIME')
        .order('date_upload', { ascending: false });

      if (filters?.categorie) {
        query = query.eq('categorie', filters.categorie);
      }
      if (filters?.entite_id) {
        query = query.eq('entite_id', filters.entite_id);
      }
      if (filters?.ressource_type) {
        query = query.eq('ressource_type', filters.ressource_type);
      }
      if (filters?.ressource_id) {
        query = query.eq('ressource_id', filters.ressource_id);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Formater la taille des fichiers
      const documentsFormattes = (data || []).map((doc: Document) => ({
        ...doc,
        taille_formatee: formatFileSize(doc.taille)
      }));

      setDocuments(documentsFormattes);
    } catch (err: any) {
      console.error('Erreur chargement documents:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();

    // Écouter les changements en temps réel
    const channel = supabase
      .channel('documents_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'documents' },
        () => {
          fetchDocuments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filters?.categorie, filters?.entite_id, filters?.ressource_type, filters?.ressource_id]);

  const uploadDocument = async (
    file: File,
    metadata: {
      categorie: Document['categorie'];
      entite_id: string;
      entite_nom: string;
      uploaded_by: string;
      uploaded_by_name: string;
      ressource_type?: string;
      ressource_id?: string;
    }
  ) => {
    try {
      // 1. Upload du fichier vers Supabase Storage
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `documents/${metadata.categorie}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('sigfp-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Obtenir l'URL publique
      const { data: urlData } = supabase.storage
        .from('sigfp-documents')
        .getPublicUrl(filePath);

      // 3. Créer l'entrée dans la base de données
      const { data, error } = await supabase
        .from('documents')
        .insert([{
          nom: file.name,
          type: file.type,
          categorie: metadata.categorie,
          taille: file.size,
          url: urlData.publicUrl,
          entite_id: metadata.entite_id,
          entite_nom: metadata.entite_nom,
          uploaded_by: metadata.uploaded_by,
          uploaded_by_name: metadata.uploaded_by_name,
          date_upload: new Date().toISOString(),
          ressource_type: metadata.ressource_type,
          ressource_id: metadata.ressource_id,
          statut: 'ACTIF',
          metadata: {
            original_name: file.name,
            mime_type: file.type,
            size: file.size
          }
        }])
        .select()
        .single();

      if (error) throw error;

      await fetchDocuments();
      return { success: true, data };
    } catch (err: any) {
      console.error('Erreur upload document:', err);
      return { success: false, error: err.message };
    }
  };

  const deleteDocument = async (id: string) => {
    try {
      const document = documents.find(d => d.id === id);
      if (!document) throw new Error('Document non trouvé');

      // 1. Supprimer du storage
      const filePath = document.url.split('/').slice(-3).join('/');
      await supabase.storage
        .from('sigfp-documents')
        .remove([filePath]);

      // 2. Marquer comme supprimé dans la BD
      const { error } = await supabase
        .from('documents')
        .update({ statut: 'SUPPRIME' })
        .eq('id', id);

      if (error) throw error;

      await fetchDocuments();
      return { success: true };
    } catch (err: any) {
      console.error('Erreur suppression document:', err);
      return { success: false, error: err.message };
    }
  };

  const archiveDocument = async (id: string) => {
    try {
      const { error } = await supabase
        .from('documents')
        .update({ statut: 'ARCHIVE' })
        .eq('id', id);

      if (error) throw error;

      await fetchDocuments();
      return { success: true };
    } catch (err: any) {
      console.error('Erreur archivage document:', err);
      return { success: false, error: err.message };
    }
  };

  const downloadDocument = async (document: Document) => {
    try {
      const response = await fetch(document.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.nom;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      return { success: true };
    } catch (err: any) {
      console.error('Erreur téléchargement document:', err);
      return { success: false, error: err.message };
    }
  };

  return {
    documents,
    loading,
    error,
    uploadDocument,
    deleteDocument,
    archiveDocument,
    downloadDocument,
    refresh: fetchDocuments
  };
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
