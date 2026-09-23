import { useEffect, useRef } from 'react';
import { Town } from './Town';

/** Full-screen live pixel town used as the app backdrop. */
export default function PixelTown() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const town = new Town(ref.current!, still);
    town.start();
    const onResize = () => town.resize();
    addEventListener('resize', onResize);
    return () => {
      town.stop();
      removeEventListener('resize', onResize);
    };
  }, []);

  return <canvas ref={ref} className="town" aria-hidden />;
}
