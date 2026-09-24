import { useEffect, useState } from 'react';

/** Current tab from `location.hash`, falling back to the first id. */
export function useHashTab(ids: string[]) {
  const read = () => ids.find((id) => `#${id}` === location.hash) ?? ids[0];
  const [tab, setTab] = useState(read);
  useEffect(() => {
    const onHash = () => setTab(read());
    addEventListener('hashchange', onHash);
    return () => removeEventListener('hashchange', onHash);
  });
  return tab;
}
