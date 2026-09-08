import { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, ExternalLink } from 'lucide-react';
import { Button, ExternalButtonLink } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/States';
import { safeExternalUrl, slugify } from '@/lib/utils';

interface RsvpQrProps {
  url: string | null;
  celebrantName: string;
}

export function RsvpQr({ url, celebrantName }: RsvpQrProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const safeUrl = safeExternalUrl(url);

  if (!safeUrl) {
    return (
      <ErrorState
        title="The RSVP form is not linked yet"
        message="An admin needs to add a valid RSVP form URL in the admin area before this page can accept responses."
      />
    );
  }

  function download() {
    const canvas = containerRef.current?.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `${slugify(celebrantName) || 'rsvp'}-qr.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  return (
    <div className="flex flex-col items-center gap-8">
      <div ref={containerRef} className="rounded-2xl bg-mist p-5 shadow-frame sm:p-6">
        <QRCodeCanvas
          value={safeUrl}
          size={220}
          level="M"
          marginSize={1}
          bgColor="#F6F1EA"
          fgColor="#150F1E"
          aria-label="QR code linking to the RSVP form"
        />
      </div>

      <div>
        <p className="text-center text-lg text-mist">Scan to RSVP</p>
        <p className="mt-1 text-center text-sm text-muted">
          Point your phone camera at the code, or use the button below.
        </p>
      </div>

      <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <ExternalButtonLink href={safeUrl} size="lg" className="w-full sm:w-auto">
          <ExternalLink aria-hidden="true" className="h-4 w-4" />
          Open RSVP form
        </ExternalButtonLink>
        <Button variant="outline" size="lg" onClick={download} className="w-full sm:w-auto">
          <Download aria-hidden="true" className="h-4 w-4" />
          Save QR code
        </Button>
      </div>
    </div>
  );
}
