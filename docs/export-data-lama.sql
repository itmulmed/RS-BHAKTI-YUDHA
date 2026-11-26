-- Jalankan di SQL Editor database LAMA. Hasilnya satu sel berisi JSON.
-- Simpan isinya (atau unduh hasil sebagai JSON) menjadi file legacy-export.json
-- di folder project. File ini berisi data internal: JANGAN di-commit.
select jsonb_build_object(
  'page_settings',    coalesce((select jsonb_agg(to_jsonb(t)) from public.page_settings t), '[]'::jsonb),
  'links',            coalesce((select jsonb_agg(to_jsonb(t) order by t.position) from public.links t), '[]'::jsonb),
  'analytics_events', coalesce((select jsonb_agg(to_jsonb(t) order by t.id) from public.analytics_events t), '[]'::jsonb),
  'audit_log',        coalesce((select jsonb_agg(to_jsonb(t) order by t.id) from public.audit_log t), '[]'::jsonb)
) as data;
