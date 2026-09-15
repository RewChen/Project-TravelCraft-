-- =========================================
-- PERFORMANCE MIGRATION — Run once in Supabase SQL Editor
-- Adds maps.summary (lightweight feed data) + backfills existing rows.
-- Safe to run repeatedly (idempotent).
-- =========================================

ALTER TABLE public.maps ADD COLUMN IF NOT EXISTS summary JSONB;

UPDATE public.maps
SET summary = jsonb_build_object(
    'title', COALESCE(data->>'title', title),
    'imageUrl', data->>'imageUrl',
    'pinCount', CASE
        WHEN jsonb_typeof(data->'pins') = 'array' THEN jsonb_array_length(data->'pins')
        WHEN jsonb_typeof(data->'editorState'->'elements') = 'array' THEN jsonb_array_length(data->'editorState'->'elements')
        ELSE 0
    END,
    'lore', data->'details'->>'lore',
    'region', data->'details'->>'region',
    'category', data->>'category',
    'rarity', data->>'rarity',
    'rarityColor', data->>'rarityColor',
    'tags', COALESCE(data->'tags', '[]'::jsonb),
    'discoveredBy', data->>'discoveredBy',
    'authorBadgeColor', data->>'authorBadgeColor',
    'authorRole', data->>'authorRole',
    'previewBackground', data->'previewBackground',
    'details', jsonb_build_object(
        'title', data->'details'->>'title',
        'region', data->'details'->>'region',
        'type', data->'details'->>'type',
        'tag', data->'details'->>'tag',
        'lore', data->'details'->>'lore',
        'hours', data->'details'->>'hours',
        'fee', data->'details'->>'fee',
        'bestTime', data->'details'->>'bestTime',
        'travel', data->'details'->>'travel',
        'popularity', data->'details'->>'popularity',
        'visitors', data->'details'->>'visitors',
        'rarity', data->'details'->>'rarity'
    )
)
WHERE summary IS NULL;