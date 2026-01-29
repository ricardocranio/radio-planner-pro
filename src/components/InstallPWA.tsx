import { Download, Check, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWA } from '@/hooks/usePWA';

export function InstallPWA() {
  const { canInstall, isInstalled, isOnline, install } = usePWA();

  if (isInstalled) {
    return (
      <div className="flex items-center gap-2 text-xs text-primary">
        <Check className="h-3 w-3" />
        <span>App instalado</span>
        {!isOnline && <WifiOff className="h-3 w-3 text-yellow-500" />}
      </div>
    );
  }

  if (!canInstall) {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={install}
      className="gap-2 text-xs border-primary/30 hover:border-primary hover:bg-primary/10"
    >
      <Download className="h-3 w-3" />
      Instalar App
    </Button>
  );
}
