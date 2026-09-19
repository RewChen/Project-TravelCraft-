import { supabase } from './supabaseClient';
import { isSupabaseConfigured } from './supabaseClient';
import { isSchemaMissing, markSchemaMissing, clearSchemaMissing, isMissingSchemaError } from './schemaGuard';

export const fetchGlobalSettings = async () => {
  if (!isSupabaseConfigured || isSchemaMissing('global_settings')) return null;
  const { data, error } = await supabase
    .from('global_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle();
  if (error) {
    if (isMissingSchemaError(error)) markSchemaMissing('global_settings');
    throw error;
  }
  clearSchemaMissing('global_settings');
  return data;
};

export const saveGlobalSettings = async (settings) => {
  if (!isSupabaseConfigured) return null;
  const row = {
    id: 1,
    max_pins_per_map: settings.maxPinsPerMap,
    auto_approve_community: settings.autoApproveCommunity,
    auto_approve_reviews: settings.autoApproveReviews,
    maintenance_mode: settings.maintenanceMode,
    allow_fast_travel: settings.allowFastTravel,
    auto_ban_strike_threshold: settings.autoBanStrikeThreshold,
    server_region: settings.serverRegion,
    radar_radius_km: settings.radarRadiusKm,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from('global_settings')
    .upsert(row, { onConflict: 'id' });
  if (error) {
    if (isMissingSchemaError(error)) markSchemaMissing('global_settings');
    throw error;
  }
  clearSchemaMissing('global_settings');
  return data;
};

export const reportRowToItem = (r) => {
  const reason = (r.reason || '').toUpperCase();
  const category = reason || 'OTHER';
  const categoryColor =
    category === 'SPAM'
      ? 'bg-red-100 text-red-700 border-red-400'
      : category === 'FAKE LOCATION'
      ? 'bg-amber-100 text-amber-800 border-amber-400'
      : 'bg-blue-100 text-blue-800 border-blue-400';
  return {
    id: r.id,
    locationName: r.location_name || 'Unknown Location',
    creator: r.reporter_name || 'Anonymous',
    category,
    categoryColor,
    count: 0,
    status: r.status,
    reason: r.details || r.reason || '',
    reportedAt: r.created_at,
    mapId: r.map_id || null,
  };
};

export const fetchReports = async () => {
  if (!isSupabaseConfigured || isSchemaMissing('reports')) return [];
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    if (isMissingSchemaError(error)) markSchemaMissing('reports');
    throw error;
  }
  clearSchemaMissing('reports');
  return data || [];
};

export const insertReport = async (report) => {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from('reports')
    .insert({
      reporter_id: report.reporterId,
      reporter_name: report.reporterName,
      map_id: report.mapId || null,
      location_name: report.locationName,
      reason: report.reason,
      details: report.details || null,
    })
    .select()
    .single();
  if (error) {
    if (isMissingSchemaError(error)) markSchemaMissing('reports');
    throw error;
  }
  clearSchemaMissing('reports');
  return data;
};

export const updateReportStatus = async (reportId, status) => {
  if (!isSupabaseConfigured) return null;
  const { error } = await supabase
    .from('reports')
    .update({ status })
    .eq('id', reportId);
  if (error) throw error;
};

export const deleteReportRow = async (reportId) => {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase
    .from('reports')
    .delete()
    .eq('id', reportId);
  if (error) throw error;
};

export const deleteReportsByLocation = async (locationName) => {
  if (!isSupabaseConfigured || !locationName) return;
  const { error } = await supabase
    .from('reports')
    .delete()
    .eq('location_name', locationName);
  if (error) throw error;
};

export const deleteReportsByMap = async (mapId) => {
  if (!isSupabaseConfigured || !mapId) return;
  const { error } = await supabase
    .from('reports')
    .delete()
    .eq('map_id', mapId);
  if (error) throw error;
};

export const upsertAdminBaseMap = async (mapRow) => {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase
    .from('base_maps')
    .upsert(mapRow, { onConflict: 'id' });
  if (error) throw error;
};

export const fetchAdminBaseMaps = async () => {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('base_maps')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    if (isMissingSchemaError(error)) markSchemaMissing('base_maps');
    throw error;
  }
  clearSchemaMissing('base_maps');
  return data || [];
};

export const deleteBaseMapRow = async (mapId) => {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase
    .from('base_maps')
    .delete()
    .eq('id', mapId);
  if (error) throw error;
};