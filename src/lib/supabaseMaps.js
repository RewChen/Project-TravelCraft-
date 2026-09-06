import { supabase } from './supabaseClient';

const mapRowToItem = (row) => ({
  ...(row.data || {}),
  id: row.id,
  ownerId: row.owner_id ?? row.data?.ownerId ?? null,
  updatedAt: row.updated_at || row.data?.updatedAt || null
});

const mapItemToRow = (item) => ({
  id: item.id,
  owner_id: item.ownerId ?? null,
  title: item.title ?? 'UNTITLED MAP',
  privacy: item.privacy ?? 'private',
  is_editor_map: Boolean(item.isEditorMap),
  data: item
});

export const fetchAllMaps = async () => {
  const { data, error } = await supabase
    .from('maps')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapRowToItem);
};

export const upsertMap = async (item) => {
  const row = mapItemToRow(item);
  const { data, error } = await supabase
    .from('maps')
    .upsert(row, { onConflict: 'id' });

  if (error) throw error;
  return data;
};

export const deleteMapRow = async (mapId) => {
  const { error } = await supabase
    .from('maps')
    .delete()
    .eq('id', mapId);

  if (error) throw error;
};