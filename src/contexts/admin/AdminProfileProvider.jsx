import { useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../AuthContext';

// Import the context from the main ProfileContext file so useProfile() works
import { ProfileContext } from '../ProfileContext';

export function ProfileProvider({ children }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Load profile when user changes
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error);
      }

      if (data) {
        setProfile(data);
        setShowProfileModal(false);
      } else {
        // No profile exists - for admin, don't force modal, just proceed
        setProfile(null);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = useCallback(async (allianceName, nickname) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const profileData = {
        id: user.id,
        alliance_name: allianceName.trim(),
        nickname: nickname.trim(),
      };

      const { data, error } = await supabase
        .from('user_profiles')
        .upsert(profileData, { onConflict: 'id' })
        .select()
        .single();

      if (error) {
        console.error('Error saving profile:', error);
        return { success: false, error: error.message };
      }

      setProfile(data);
      setShowProfileModal(false);
      return { success: true };
    } catch (error) {
      console.error('Error saving profile:', error);
      return { success: false, error: error.message };
    }
  }, [user]);

  // Get display name with [ADMIN] prefix
  const displayName = profile
    ? `[ADMIN] ${profile.nickname}`
    : user?.user_metadata?.full_name || user?.email || '[ADMIN]';

  const value = {
    profile,
    loading,
    displayName,
    showProfileModal,
    setShowProfileModal,
    saveProfile,
    loadProfile,
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
}

// Re-export useProfile from the main file
export { useProfile } from '../ProfileContext';
