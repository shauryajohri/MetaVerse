import { useCallback, useEffect, useState } from 'react';

/** Fetch on mount; exposes data, error and a reload function. */
export function useLoad<T>(fn: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const reload = useCallback(() => {
    setError('');
    fn()
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, [fn]);
  useEffect(reload, [reload]);
  return { data, setData, error, reload };
}
