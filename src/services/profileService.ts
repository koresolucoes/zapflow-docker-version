import { supabase } from '../lib/supabaseClient.js';
import { Profile, EditableProfile } from '../types/index.js';

export const getProfile = async (userId: string): Promise<Profile | null> => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found, which is not an error here
        console.error("Error fetching profile:", error);
        throw error;
    }
    return data as unknown as Profile | null;
};

export const updateProfileInDb = async (userId: string, profileData: EditableProfile): Promise<Profile> => {
    // Tenta update; se não houver linha (PGRST116), faz upsert
    const { data, error } = await supabase
        .from('profiles')
        .update(profileData as any)
        .eq('id', userId)
        .select('*')
        .maybeSingle();

    if (error && error.code !== 'PGRST116') {
        throw error;
    }

    if (data) return data as unknown as Profile;

    const { data: upserted, error: upsertError } = await supabase
        .from('profiles')
        .upsert({ id: userId, ...(profileData as any) }, { onConflict: 'id' })
        .select('*')
        .single();

    if (upsertError) throw upsertError;
    return upserted as unknown as Profile;
};