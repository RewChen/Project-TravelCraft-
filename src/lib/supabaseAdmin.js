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

export const setMapBaseFlag = async (mapId, isBase) => {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase
    .from('maps')
    .update({ is_base_map: isBase })
    .eq('id', mapId);
  if (error) throw error;
};