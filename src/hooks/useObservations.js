import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Fetches all observations within a date range, optionally filtered by crew.
 * Returns raw rows — charts and KPI cards derive their own slices.
 */
export function useObservations({ days = 180, crewName = 'all' } = {}) {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      const since = new Date();
      since.setDate(since.getDate() - days);

      let query = supabase
        .from('observations')
        .select('*')
        .gte('observed_at', since.toISOString())
        .order('observed_at', { ascending: true });

      if (crewName !== 'all') {
        query = query.eq('crew_name', crewName);
      }

      const { data: rows, error: err } = await query;

      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }

      setData(rows || []);
      setLoading(false);
    };

    fetchData();

    // Real-time subscription — new submissions appear instantly
    const channel = supabase
      .channel('observations_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'observations' }, () => {
        fetchData();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [days, crewName]);

  return { data, loading, error };
}
