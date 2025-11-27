import { useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../AuthContext';

// Import the context from the main AllianceContext file so useAlliance() works
import { AllianceContext } from '../AllianceContext';

// Color palette from spec - colors are assigned in order as alliances are created
const ALLIANCE_COLORS = [
  '#E74C3C', // Red
  '#3498DB', // Blue
  '#2ECC71', // Green
  '#F39C12', // Orange
  '#9B59B6', // Purple
  '#1ABC9C', // Teal
  '#E91E63', // Pink
  '#00BCD4', // Cyan
  '#FF5722', // Deep Orange
  '#8BC34A', // Light Green
  '#673AB7', // Deep Purple
  '#FFC107', // Amber
  '#795548', // Brown
  '#607D8B', // Blue Grey
  '#CDDC39', // Lime
  '#FF9800', // Orange Alt
  '#03A9F4', // Light Blue
  '#4CAF50', // Green Alt
  '#F44336', // Red Alt
  '#00E676', // Bright Green
];

export function AllianceProvider({ children }) {
  const { user } = useAuth();
  const [alliance, setAlliance] = useState(null);
  const [allAlliances, setAllAlliances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllianceModal, setShowAllianceModal] = useState(false);

  // Load all alliances on mount
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }
    loadAlliances();
  }, []);

  // Auto-select first alliance when loaded (for admin convenience)
  useEffect(() => {
    if (allAlliances.length > 0 && !alliance) {
      setAlliance(allAlliances[0]);
    }
  }, [allAlliances, alliance]);

  const loadAlliances = async () => {
    try {
      const { data, error } = await supabase
        .from('alliances')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error loading alliances:', error);
        return;
      }

      setAllAlliances(data || []);
    } catch (error) {
      console.error('Error loading alliances:', error);
    } finally {
      setLoading(false);
    }
  };

  // Admin can switch to any alliance
  const switchAlliance = useCallback((allianceId) => {
    const found = allAlliances.find(a => a.id === allianceId);
    if (found) {
      setAlliance(found);
    }
  }, [allAlliances]);

  // Create a new alliance (admin only) - directly inserts without user association
  const createAlliance = useCallback(async (allianceName) => {
    if (!allianceName.trim()) {
      return { success: false, error: 'Alliance name is required' };
    }

    try {
      // Check if alliance already exists locally
      const nameLower = allianceName.trim().toLowerCase();
      const existing = allAlliances.find(a => a.name_lowercase === nameLower);
      if (existing) {
        // Alliance exists - just select it
        setAlliance(existing);
        return { success: true, alliance: existing };
      }

      // Get the actual count from database to determine next color index
      const { count, error: countError } = await supabase
        .from('alliances')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.error('Error getting alliance count:', countError);
        return { success: false, error: countError.message };
      }

      const nextColorIndex = (count || 0) % ALLIANCE_COLORS.length;
      const nextColor = ALLIANCE_COLORS[nextColorIndex];

      // Direct insert - admin doesn't need to be associated with the alliance
      const { data, error } = await supabase
        .from('alliances')
        .insert({
          name: allianceName.trim(),
          name_lowercase: nameLower,
          color_index: nextColorIndex,
          color: nextColor,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating alliance:', error);
        return { success: false, error: error.message };
      }

      // Add to local state and select it
      const updatedAlliances = [...allAlliances, data].sort((a, b) => a.name.localeCompare(b.name));
      setAllAlliances(updatedAlliances);
      setAlliance(data);

      return { success: true, alliance: data };
    } catch (error) {
      console.error('Error creating alliance:', error);
      return { success: false, error: error.message };
    }
  }, [allAlliances]);

  // Join alliance (same as regular, but admin can also create)
  const joinAlliance = useCallback(async (allianceName) => {
    return createAlliance(allianceName);
  }, [createAlliance]);

  const loadUserAlliance = useCallback(async () => {
    // Admin doesn't need to load user alliance, they pick it
  }, []);

  // Get alliance by ID
  const getAllianceById = useCallback((allianceId) => {
    return allAlliances.find(a => a.id === allianceId) || null;
  }, [allAlliances]);

  // Get alliance color by ID (using color_index to look up from palette)
  const getAllianceColor = useCallback((allianceId) => {
    const found = getAllianceById(allianceId);
    if (!found) return '#f8f9fa';
    // Support both color (hex) and color_index (number)
    if (found.color) return found.color;
    if (found.color_index !== undefined) return ALLIANCE_COLORS[found.color_index] || '#f8f9fa';
    return '#f8f9fa';
  }, [getAllianceById]);

  // Get alliance name by ID
  const getAllianceName = useCallback((allianceId) => {
    const found = getAllianceById(allianceId);
    return found?.name || null;
  }, [getAllianceById]);

  const value = {
    alliance,
    allAlliances,
    loading,
    showAllianceModal,
    setShowAllianceModal,
    joinAlliance,
    loadUserAlliance,
    loadAlliances,
    getAllianceById,
    getAllianceColor,
    getAllianceName,
    // Admin-specific
    switchAlliance,
    createAlliance,
    isAdmin: true,
  };

  return (
    <AllianceContext.Provider value={value}>
      {children}
    </AllianceContext.Provider>
  );
}

// Re-export useAlliance from the main file
export { useAlliance } from '../AllianceContext';
