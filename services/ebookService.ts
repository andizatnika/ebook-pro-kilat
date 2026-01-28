import { supabase } from './supabaseClient';
import { EbookData } from '../types';

// Interface sesuai Tabel 'projects' di Supabase
export interface ProjectRow {
  id: string;
  user_id: string;
  title: string;
  description: string; // Maps to 'subtitle'
  content_json: any;   // Maps to 'outline' inside data
  status: string;      // 'draft', 'active', 'completed'
  created_at: string;
  updated_at: string;
  is_local?: boolean;  // Marker untuk data lokal
}

const LOCAL_STORAGE_KEY = 'pro_ebook_kilat_local_projects';

// --- LOCAL STORAGE HELPERS ---
const getLocalProjects = (): ProjectRow[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn("Local storage access failed", e);
    return [];
  }
};

const saveToLocal = (project: ProjectRow) => {
  const projects = getLocalProjects();
  const index = projects.findIndex(p => p.id === project.id);
  if (index >= 0) {
    projects[index] = project;
  } else {
    projects.unshift(project);
  }
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(projects));
};

const deleteFromLocal = (id: string) => {
  const projects = getLocalProjects();
  const filtered = projects.filter(p => p.id !== id);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
};

// Helper: Mapping DB Row -> App State
const mapRowToEbookData = (row: ProjectRow): EbookData => {
  return {
    id: row.id,
    title: row.title || 'Tanpa Judul',
    subtitle: row.description || '', // Map description -> subtitle
    outline: row.content_json?.outline || [], // Map content_json -> outline
    lastUpdated: row.updated_at
  };
};

// 1. CREATE EMPTY PROJECT
export const createEmptyEbook = async (userId: string): Promise<EbookData> => {
  const timestamp = new Date().toISOString();
  console.log("Creating new project for user:", userId);

  // Payload standar
  const payload = {
    user_id: userId,
    title: 'Proyek Baru',
    description: 'Draft',
    content_json: {
      outline: [] 
    },
    status: 'draft',
    created_at: timestamp,
    updated_at: timestamp
  };

  try {
    // Coba insert ke Supabase
    const { data, error } = await supabase
      .from('projects')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error("No data returned from DB");

    return mapRowToEbookData(data);

  } catch (error: any) {
    // FALLBACK: Jika Gagal (Tabel tidak ada / Offline), gunakan Local Storage
    console.warn("Supabase create failed (Table missing?), falling back to Local Storage.", error.message);
    
    // Generate ID lokal (pseudo-UUID)
    const localId = `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const localProject: ProjectRow = {
        ...payload,
        id: localId,
        is_local: true
    };
    
    saveToLocal(localProject);
    return mapRowToEbookData(localProject);
  }
};

// 2. SAVE / UPDATE PROJECT
export const saveEbook = async (userId: string, ebookData: EbookData): Promise<EbookData> => {
  const timestamp = new Date().toISOString();
  
  const payload: any = {
    user_id: userId,
    title: ebookData.title || 'Proyek Tanpa Judul',
    description: ebookData.subtitle || '',
    content_json: {
      outline: ebookData.outline
    },
    status: 'active',
    updated_at: timestamp
  };

  // Jika proyek ini adalah proyek lokal, simpan ke lokal saja
  if (ebookData.id && ebookData.id.startsWith('local-')) {
     const localProject: ProjectRow = {
         ...payload,
         id: ebookData.id,
         created_at: timestamp, 
         is_local: true
     };
     saveToLocal(localProject);
     return mapRowToEbookData(localProject);
  }

  try {
    let result;
    
    if (ebookData.id) {
      // UPDATE DB
      const { data, error } = await supabase
        .from('projects')
        .update(payload)
        .eq('id', ebookData.id)
        .select()
        .single();
        
      if (error) throw error;
      result = data;
    } else {
      // INSERT DB
      payload.created_at = timestamp;
      const { data, error } = await supabase
        .from('projects')
        .insert(payload)
        .select()
        .single();
        
      if (error) throw error;
      result = data;
    }

    return mapRowToEbookData(result);

  } catch (error: any) {
    // Jika simpan ke DB gagal, simpan ke lokal sebagai backup agar user tidak kehilangan data
    console.warn("Supabase save failed, saving to Local Storage as backup:", error.message);
    
    const fallbackId = ebookData.id || `local-${Date.now()}`;
    const localFallback: ProjectRow = {
        ...payload,
        id: fallbackId,
        created_at: timestamp,
        is_local: true
    };
    saveToLocal(localFallback);
    return mapRowToEbookData(localFallback);
  }
};

// 3. GET ALL PROJECTS
export const getEbooks = async (userId: string): Promise<EbookData[]> => {
  let dbProjects: ProjectRow[] = [];
  
  // 1. Coba ambil dari Supabase
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId) 
      .order('updated_at', { ascending: false });

    if (error) throw error;
    if (data) dbProjects = data as ProjectRow[];
  } catch (error) {
    console.warn("Could not fetch from Supabase (Offline or Table Missing). Using Local Data.");
  }

  // 2. Ambil dari Local Storage
  const localProjects = getLocalProjects().filter(p => p.user_id === userId);

  // 3. Gabungkan (Local + DB)
  const allProjects = [...localProjects, ...dbProjects];
  
  // Urutkan berdasarkan waktu update terbaru
  allProjects.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  return allProjects.map(mapRowToEbookData);
};

// 4. DELETE PROJECT
export const deleteEbook = async (ebookId: string, userId: string): Promise<void> => {
  // Jika ID lokal, hapus dari storage browser
  if (ebookId.startsWith('local-')) {
      deleteFromLocal(ebookId);
      return;
  }

  try {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', ebookId)
      .eq('user_id', userId); 

    if (error) throw error;
  } catch (error) {
    // Jika gagal delete di server, pastikan juga tidak ada di lokal (fallback)
    console.warn("Supabase delete failed, checking local removal", error);
    deleteFromLocal(ebookId);
  }
};