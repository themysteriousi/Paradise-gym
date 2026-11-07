import { useState, useEffect } from 'react';
import {
  renderWhatsAppTemplate,
  generateWhatsAppUrl,
  type TemplateType,
} from '@/services/whatsappTemplateService';
import { X, MessageCircle, Copy, Check, Send } from 'lucide-react';

interface WhatsAppShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  phone: string;
  memberName: string;
  initialTemplateType?: TemplateType;
  templateParams: Record<string, any>;
}

export default function WhatsAppShareModal({
  isOpen,
  onClose,
  phone,
  memberName,
  initialTemplateType = 'welcome',
  templateParams,
}: WhatsAppShareModalProps) {
  const [templateType, setTemplateType] = useState<TemplateType>(initialTemplateType);
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const text = renderWhatsAppTemplate(templateType, {
      memberName,
      gymName: 'Paradise Gym',
      ...templateParams,
    });
    setMessage(text);
  }, [templateType, memberName, templateParams]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = () => {
    const url = generateWhatsAppUrl(phone, message);
    window.open(url, '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Share on WhatsApp</h2>
              <p className="text-xs text-slate-400">
                To: {memberName} ({phone})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Template Tabs */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Message Template</label>
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
              {(
                [
                  { id: 'welcome', label: 'Welcome' },
                  { id: 'expiry_reminder', label: 'Expiry' },
                  { id: 'due_reminder', label: 'Due Reminder' },
                  { id: 'payment_receipt', label: 'Receipt' },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTemplateType(t.id)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg shrink-0 transition ${
                    templateType === t.id
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Editable Text Area */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">Message Text</label>
              <span className="text-[10px] text-slate-500">{message.length} chars</span>
            </div>
            <textarea
              rows={8}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-xs text-white leading-relaxed placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans"
            />
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              type="button"
              onClick={handleCopy}
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-400" />
                  <span>Copy Text</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleSend}
              className="py-2.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition shadow-lg shadow-emerald-500/20"
            >
              <Send className="w-4 h-4" />
              <span>Open WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

