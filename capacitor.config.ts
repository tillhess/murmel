import type { CapacitorConfig } from '@capacitor/cli';

// Die iOS-App ist eine dünne Hülle um den Build in dist/ (siehe README, Abschnitt App Store).
const config: CapacitorConfig = {
  appId: 'de.tillhess.murmel',
  appName: 'Murmel',
  webDir: 'dist',
  ios: {
    // Das Spiel füllt den ganzen Bildschirm und kümmert sich selbst um die sicheren Ränder.
    contentInset: 'never',
    backgroundColor: '#1a2452',
  },
};

export default config;
