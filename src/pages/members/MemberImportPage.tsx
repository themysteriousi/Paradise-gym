import { useState } from 'react';
import { Upload, ArrowLeft, CheckCircle2, AlertTriangle, FileSpreadsheet, Download } from 'lucide-react';
import { importService, ValidatedImportRow, ImportErrorRow } from '@/services/importService';
import { memberService } from '@/services/memberService';
import { useAuthStore } from '@/stores/authStore';

interface MemberImportPageProps {
  onBack: () => void;
  onImportComplete: () => void;
}

export default function MemberImportPage({ onBack, onImportComplete }: MemberImportPageProps) {
  const currentGym = useAuthStore((s) => s.currentGym);
  const [csvText, setCsvText] = useState('');
  const [validRows, setValidRows] = useState<ValidatedImportRow[]>([]);
  const [errors, setErrors] = useState<ImportErrorRow[]>([]);
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [importing, setImporting] = useState(false);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvText(content);
      analyzeCSV(content);
    };
    reader.readAsText(file);
  };

  const analyzeCSV = async (content: string) => {
    if (!currentGym) return;
    const existing = await memberService.getMembers({ gymId: currentGym.id });
    const result = importService.parseAndValidateCSV(content, existing);
    setValidRows(result.validRows);
    setErrors(result.errors);
    setIsAnalyzed(true);
    setSuccessCount(null);
  };

  const handleExecuteImport = async () => {
    if (!currentGym || validRows.length === 0) return;
    try {
      setImporting(true);
      const imported = await importService.executeBatchImport(currentGym.id, validRows);
      setSuccessCount(imported);
      onImportComplete();
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadSample = () => {
    const sample = `Name,Phone,Email,Gender,DOB,Notes
Aarav Sharma,9876543210,aarav@example.com,male,1995-05-12,Morning batch
Neha Verma,9876543211,neha@example.com,female,1998-10-20,Strength focus`;
    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'gym_members_sample.csv';
    link.click();
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Members</span>
        </button>
        <button
          onClick={handleDownloadSample}
          className="flex items-center space-x-1 text-xs text-brand-500 font-semibold hover:underline"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Sample Template</span>
        </button>
      </div>

      {/* Hero card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-sm">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-brand-500/10 text-brand-500 rounded-xl">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Import Members via CSV</h2>
            <p className="text-xs text-slate-400">Bulk upload existing members with instant validation</p>
          </div>
        </div>
      </div>

      {/* Upload Dropzone */}
      <div className="bg-slate-900/60 border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-2xl p-6 text-center space-y-3 transition">
        <Upload className="w-8 h-8 text-slate-500 mx-auto" />
        <div>
          <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-brand-500/20 active:scale-95 transition">
            <span>Choose CSV File</span>
            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
          </label>
          <p className="text-[11px] text-slate-500 mt-2">Format: Name, Phone, Email, Gender, DOB, Notes</p>
        </div>
      </div>

      {/* Manual Paste Alternative */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
        <label className="block text-xs font-medium text-slate-300">Or Paste CSV Text</label>
        <textarea
          rows={3}
          value={csvText}
          onChange={(e) => {
            setCsvText(e.target.value);
            if (e.target.value.trim()) analyzeCSV(e.target.value);
          }}
          placeholder="Name,Phone,Email&#10;Kunal Rao,9876543210,kunal@gmail.com"
          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 font-mono focus:outline-none focus:border-brand-500"
        />
      </div>

      {/* Validation Analysis Preview */}
      {isAnalyzed && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-emerald-950/40 border border-emerald-800/60 p-3 rounded-xl flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="font-bold text-white block">{validRows.length} Valid</span>
                <span className="text-[10px] text-emerald-400">Ready to import</span>
              </div>
            </div>

            <div className="bg-red-950/40 border border-red-800/60 p-3 rounded-xl flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <div>
                <span className="font-bold text-white block">{errors.length} Errors</span>
                <span className="text-[10px] text-red-400">Skipped automatically</span>
              </div>
            </div>
          </div>

          {errors.length > 0 && (
            <div className="bg-slate-900 border border-red-900/40 rounded-2xl p-4 space-y-2 text-xs">
              <h4 className="font-bold text-red-400 text-[11px] uppercase tracking-wider">Error Details</h4>
              <ul className="space-y-1 max-h-32 overflow-y-auto text-slate-300">
                {errors.map((err, i) => (
                  <li key={i} className="text-[11px] flex items-start space-x-1">
                    <span className="text-slate-500 font-mono">Row {err.rowNumber}:</span>
                    <span className="text-red-300">{err.reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {successCount !== null ? (
            <div className="p-4 bg-emerald-950/80 border border-emerald-800 rounded-2xl text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="text-sm font-bold text-white">Successfully imported {successCount} members!</p>
              <button
                onClick={onBack}
                className="px-4 py-2 bg-slate-800 text-slate-200 text-xs font-semibold rounded-xl"
              >
                View Members List
              </button>
            </div>
          ) : (
            <button
              onClick={handleExecuteImport}
              disabled={importing || validRows.length === 0}
              className="w-full py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-brand-500/20 active:scale-[0.98] transition flex items-center justify-center space-x-1.5"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              <span>{importing ? 'Importing...' : `Confirm Import (${validRows.length} Members)`}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

