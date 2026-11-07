import { useRef, useState, useEffect } from 'react';
import { Dumbbell, Download, MessageSquare, X } from 'lucide-react';
import type { DbMember } from '@/types/database';
import { cardGeneratorService } from '@/services/cardGeneratorService';
import { whatsappService } from '@/services/whatsappService';
import { useAuthStore } from '@/stores/authStore';

interface DigitalCardProps {
  member: DbMember;
  planName?: string;
  expiryDateFormatted?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function DigitalCard({
  member,
  planName = 'Monthly Standard',
  expiryDateFormatted = '31 Dec 2026',
  isOpen,
  onClose,
}: DigitalCardProps) {
  const currentGym = useAuthStore((s) => s.currentGym);
  const cardRef = useRef<HTMLDivElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    // Generate secure non-PII token
    const token = `PGYM-TOKEN-${member.id.slice(0, 8)}`;
    cardGeneratorService.generateQRCodeDataUrl(token).then(setQrDataUrl);
  }, [member.id]);

  if (!isOpen) return null;

  const gymName = currentGym?.name || 'Paradise Gym';

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      setDownloading(true);
      await cardGeneratorService.downloadCardAsPNG({
        element: cardRef.current,
        fileName: `${member.full_name.replace(/\s+/g, '_')}_Card.png`,
      });
    } finally {
      setDownloading(false);
    }
  };

  const handleWhatsAppShare = () => {
    const text = whatsappService.formatWelcomeMessage({
      memberName: member.full_name,
      gymName,
      planName,
      expiryDate: expiryDateFormatted,
    });
    const url = whatsappService.getWhatsAppLink({
      phone: member.phone,
      message: text,
    });
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in">
      <div className="max-w-xs w-full space-y-4">
        {/* Close Button Header */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-full bg-slate-900 border border-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* The Printable Digital Card */}
        <div
          ref={cardRef}
          className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border-2 border-brand-500/40 rounded-3xl p-5 shadow-2xl relative overflow-hidden space-y-4 text-center text-white"
        >
          {/* Card Top Brand */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center space-x-2 text-left">
              <div className="bg-brand-500 p-1.5 rounded-xl text-slate-950">
                <Dumbbell className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <h4 className="text-xs font-black tracking-tight text-white leading-none">{gymName}</h4>
                <span className="text-[9px] text-slate-400">Membership Pass</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-brand-500/10 text-brand-400 border border-brand-500/30">
              {member.status}
            </span>
          </div>

          {/* Member Profile */}
          <div className="space-y-1">
            <h3 className="text-base font-black text-white">{member.full_name}</h3>
            <p className="text-[11px] text-slate-400">{member.phone}</p>
          </div>

          {/* QR Code Container */}
          <div className="bg-white p-3 rounded-2xl inline-block shadow-inner">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="Attendance QR Code" className="w-32 h-32 mx-auto" />
            ) : (
              <div className="w-32 h-32 bg-slate-200 animate-pulse rounded-xl" />
            )}
          </div>

          <p className="text-[10px] text-slate-500">Scan at gym entrance for attendance</p>

          {/* Card Meta Info */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-[10px] text-left">
            <div>
              <span className="text-slate-500 block uppercase font-bold">Plan</span>
              <span className="text-slate-200 font-semibold">{planName}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 block uppercase font-bold">Valid Until</span>
              <span className="text-emerald-400 font-semibold">{expiryDateFormatted}</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="py-2.5 px-3 bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{downloading ? 'Exporting...' : 'Save PNG'}</span>
          </button>
          <button
            onClick={handleWhatsAppShare}
            className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 shadow-lg shadow-emerald-600/20 transition active:scale-95"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
}

