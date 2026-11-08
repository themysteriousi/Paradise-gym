import { useRef, useState, useEffect } from 'react';
import { Dumbbell, Download, MessageSquare, X } from 'lucide-react';
import type { DbMember } from '@/types/database';
import { cardGeneratorService } from '@/services/cardGeneratorService';
import { whatsappService } from '@/services/whatsappService';
import { generateMemberQrToken, getActiveTokenForMember } from '@/services/qrService';
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
  planName = 'No Active Plan',
  expiryDateFormatted = 'N/A',
  isOpen,
  onClose,
}: DigitalCardProps) {
  const currentGym = useAuthStore((s) => s.currentGym);
  const cardRef = useRef<HTMLDivElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    async function loadToken() {
      try {
        const gymId = currentGym?.id || member.gym_id;
        let tokenRecord = getActiveTokenForMember(member.id);
        if (!tokenRecord) {
          tokenRecord = await generateMemberQrToken({
            gym_id: gymId,
            member_id: member.id,
            expires_in_days: 365,
          });
        }

        if (tokenRecord?.token && isMounted) {
          const url = await cardGeneratorService.generateQRCodeDataUrl(tokenRecord.token);
          if (isMounted) setQrDataUrl(url);
        }
      } catch (err) {
        console.error('Failed to generate pass QR code:', err);
      }
    }

    loadToken();
    return () => {
      isMounted = false;
    };
  }, [member.id, member.gym_id, currentGym?.id, isOpen]);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="max-w-xs w-full space-y-3.5">
        {/* Close Button Header */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white rounded-md bg-[#14161c] border border-white/[0.08]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* The Printable Digital Card */}
        <div
          ref={cardRef}
          className="bg-[#0e1014] border border-white/[0.12] rounded-2xl p-5 shadow-2xl relative overflow-hidden space-y-3.5 text-center text-zinc-100"
        >
          {/* Card Top Brand */}
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="flex items-center space-x-2 text-left">
              <div className="w-7 h-7 rounded-md bg-white/[0.06] border border-white/[0.1] text-zinc-200 flex items-center justify-center">
                <Dumbbell className="w-3.5 h-3.5 stroke-[2]" />
              </div>
              <div>
                <h4 className="text-xs font-semibold tracking-tight text-zinc-100 leading-tight">{gymName}</h4>
                <span className="text-[10px] text-zinc-500 font-mono">Access Pass</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono capitalize tracking-wide bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {member.status}
            </span>
          </div>

          {/* Member Profile */}
          <div className="space-y-0.5">
            <h3 className="text-sm font-semibold text-zinc-100">{member.full_name}</h3>
            <p className="text-[11px] text-zinc-500 font-mono">{member.phone}</p>
          </div>

          {/* QR Code Container */}
          <div className="bg-white p-2.5 rounded-xl inline-block shadow-sm">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="Attendance QR Code" className="w-32 h-32 mx-auto" />
            ) : (
              <div className="w-32 h-32 bg-zinc-200 animate-pulse rounded-lg" />
            )}
          </div>

          <p className="text-[10px] text-zinc-500 font-mono">Desk Terminal QR • Non-PII Token</p>

          {/* Card Meta Info */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.08] text-[10px] text-left">
            <div>
              <span className="text-zinc-500 block uppercase font-mono tracking-wider">Plan</span>
              <span className="text-zinc-200 font-medium">{planName}</span>
            </div>
            <div className="text-right">
              <span className="text-zinc-500 block uppercase font-mono tracking-wider">Valid Until</span>
              <span className="text-emerald-400 font-mono font-medium">{expiryDateFormatted}</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="h-9 px-3 bg-[#14161c] hover:bg-[#1a1d24] text-zinc-200 border border-white/[0.08] rounded-lg text-xs font-medium flex items-center justify-center space-x-1.5 transition"
          >
            <Download className="w-3.5 h-3.5 text-zinc-400" />
            <span>{downloading ? 'Exporting...' : 'Save PNG'}</span>
          </button>
          <button
            onClick={handleWhatsAppShare}
            className="h-9 px-3 bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
}

