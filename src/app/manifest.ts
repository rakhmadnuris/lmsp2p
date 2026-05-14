import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Pendidikan Pengawas Partisipatif',
    short_name: 'LMS P2P',
    description: 'Sistem Manajemen Pembelajaran Pendidikan Pengawas Partisipatif Bawaslu',
    start_url: '/',
    display: 'standalone',
    background_color: '#0D0D0F',
    theme_color: '#FF2B2B',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
