import { supabase } from './supabaseClient';
import { validateApiKey } from './geminiService';

export interface StoredApiKey {
  id: string;
  user_id: string;
  api_key: string; // encrypted in production, stored securely
  is_valid: boolean;
  created_at: string;
  updated_at: string;
  quota_exceeded_at?: string;
}

/**
 * Get user's API key from database
 */
export const getUserApiKey = async (userId: string): Promise<string | null> => {
  if (!userId) return null;

  try {
    const { data, error } = await supabase
      .from('user_api_keys')
      .select('api_key')
      .eq('user_id', userId)
      .single();

    if (error) {
      // Table might not exist or no record found - this is expected on first use
      console.log('No API key found for user:', error.message);
      return null;
    }

    return data?.api_key || null;
  } catch (error) {
    console.error('Error fetching API key:', error);
    return null;
  }
};

/**
 * Save user's API key to database (create or update)
 */
export const saveUserApiKey = async (
  userId: string,
  apiKey: string,
  isValid: boolean = true
): Promise<boolean> => {
  if (!userId || !apiKey) return false;

  try {
    // First, check if record exists
    const { data: existing } = await supabase
      .from('user_api_keys')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('user_api_keys')
        .update({
          api_key: apiKey,
          is_valid: isValid,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) throw error;
    } else {
      // Insert new
      const { error } = await supabase
        .from('user_api_keys')
        .insert({
          user_id: userId,
          api_key: apiKey,
          is_valid: isValid,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
    }

    return true;
  } catch (error) {
    console.error('Error saving API key:', error);
    return false;
  }
};

/**
 * Delete user's API key
 */
export const deleteUserApiKey = async (userId: string): Promise<boolean> => {
  if (!userId) return false;

  try {
    const { error } = await supabase
      .from('user_api_keys')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting API key:', error);
    return false;
  }
};

/**
 * Validate API key and save to database
 */
export const validateAndSaveApiKey = async (
  userId: string,
  apiKey: string
): Promise<{ valid: boolean; message: string }> => {
  if (!userId || !apiKey) {
    return { valid: false, message: 'API Key tidak boleh kosong.' };
  }

  try {
    // Test the API key with Gemini
    const isValid = await validateApiKey(apiKey);

    if (!isValid) {
      return {
        valid: false,
        message:
          'API Key tidak valid. Pastikan API key aktif dan benar dari Google AI Studio.',
      };
    }

    // Save to database
    const saved = await saveUserApiKey(userId, apiKey, true);

    if (!saved) {
      return {
        valid: false,
        message: 'Gagal menyimpan API key. Silakan coba lagi.',
      };
    }

    return {
      valid: true,
      message: 'API Key berhasil disimpan dan terverifikasi!',
    };
  } catch (error) {
    console.error('Error validating and saving API key:', error);
    return {
      valid: false,
      message: 'Terjadi kesalahan saat memvalidasi API key. Coba lagi nanti.',
    };
  }
};

/**
 * Mark API key as quota exceeded
 */
export const markQuotaExceeded = async (userId: string): Promise<boolean> => {
  if (!userId) return false;

  try {
    const { error } = await supabase
      .from('user_api_keys')
      .update({
        is_valid: false,
        quota_exceeded_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error marking quota exceeded:', error);
    return false;
  }
};

/**
 * Check if API key has quota exceeded
 */
export const isQuotaExceeded = async (userId: string): Promise<boolean> => {
  if (!userId) return false;

  try {
    const { data } = await supabase
      .from('user_api_keys')
      .select('quota_exceeded_at')
      .eq('user_id', userId)
      .single();

    return !!data?.quota_exceeded_at;
  } catch (error) {
    console.error('Error checking quota:', error);
    return false;
  }
};
