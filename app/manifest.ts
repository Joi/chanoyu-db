import type { MetadataRoute } from 'next';
import { APP_NAME, APP_DESCRIPTION } from '@/lib/branding';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_NAME,
    short_name: APP_NAME,
    description: APP_DESCRIPTION,
    icons: [
      {
        src: '/icon.svg',
        type: 'image/svg+xml',
        sizes: 'any'
      }
    ],
    theme_color: '#ffffff',
    background_color: '#ffffff',
    display: 'standalone'
  };
}


