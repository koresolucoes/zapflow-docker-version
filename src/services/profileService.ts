import { apiGet, apiPut } from '../lib/apiClient.js';
import type { Profile, EditableProfile } from '../types/index.js';

export const getProfile = async (userId: string): Promise<Profile | null> => {
    try {
        const data = await apiGet<Profile>(`/profiles/${userId}`);
        return data || null;
    } catch (error) {
        console.error("Error fetching profile:", error);
        throw error;
    }
};

export const updateProfileInDb = async (userId: string, profileData: EditableProfile): Promise<Profile> => {
    try {
        // First try to update the profile
        const updatedProfile = await apiPut<Profile>(`/profiles/${userId}`, profileData);
        return updatedProfile;
    } catch (error: any) {
        if (error.message.includes('not found')) {
            // If profile doesn't exist, create it
            const newProfile = await apiPut<Profile>('/profiles', { ...profileData, id: userId });
            return newProfile;
        }
        throw error;
    }
};