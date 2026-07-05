import { useCallback, useEffect, useState } from 'react';

/**
 * Loads the dashboard's static demo dataset (public/data/observations.json)
 * once and caches it in module scope. It's a same-origin static file, not a
 * database query, so this has no dependency on Supabase staying awake and
 * no meaningful load time. The dataset is generated ahead of time by
 * scripts/generate-demo-dashboard-data.mjs and fixed to a specific end
 * date, so filtering by "days ago" is relative to that fixed date rather
 * than the real current date. That's what makes the dashboard look the
 * same no matter when someone opens it.
 */
let cache = null;

export function useRawObservations() {
  const [data, setData] = useState(cache);
  const [loading, setLoading] = useState(!cache);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    if (cache) {
      setData(cache);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    fetch('/data/observations.json')
      .then(res => {
        if (!res.ok) throw new Error(`Failed to load dataset (${res.status})`);
        return res.json();
      })
      .then(json => {
        cache = json;
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, refetch: load };
}
