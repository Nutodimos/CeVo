"use client";
import { toastConfirm } from '@/lib/toast-dialogs';
import toast from 'react-hot-toast';

import { useState, useRef } from "react";
import { Upload, X, AlertTriangle, FileText, Trash2, Search, Download } from "lucide-react";
import { importVoterRoll, deleteVoter } from "@/app/actions/setup";
import { useRouter } from "next/navigation";

type Voter = {
  id: string;
  matricNumber: string;
  name: string;
  level: string | null;
  hasVoted: boolean;
};

type ParsedRow = {
  matricNumber: string;
  name: string;
  level: string;
  isValid: boolean;
  errors: string[];
};

export default function VoterRollManager({ 
  electionId, 
  initialVoters, 
  isLocked 
}: { 
  electionId: string; 
  initialVoters: Voter[]; 
  isLocked: boolean;
}) {
  const [voters, setVoters] = useState(initialVoters);
  const [isDragging, setIsDragging] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedRow[] | null>(null);
  const [importMode, setImportMode] = useState<"replace" | "append">("replace");
  const [isPending, setIsPending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isLocked) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isLocked) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      parseCSV(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      parseCSV(e.target.files[0]);
    }
  };

  const parseCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
      
      const parsed: ParsedRow[] = [];
      const seenMatrics = new Set<string>();

      // Skip header if it looks like a header
      const startIndex = lines[0].toLowerCase().includes("matric") ? 1 : 0;

      for (let i = startIndex; i < lines.length; i++) {
        // Handle basic comma separation (assuming no commas in names for simplicity, or quoted strings)
        // A more robust regex for CSV:
        const matches = lines[i].match(/(?:"([^"]*)")|([^,]+)/g);
        if (!matches) continue;
        
        const cols = matches.map(m => m.replace(/^"|"$/g, '').trim());
        const matricNumber = cols[0] || "";
        const name = cols[1] || "";
        const level = cols[2] || "";

        const errors: string[] = [];
        
        if (!matricNumber) errors.push("Missing Matric Number");
        if (!name) errors.push("Missing Name");
        if (!level) errors.push("Missing Level (required)"); // Enforced Level
        
        if (matricNumber && seenMatrics.has(matricNumber.toLowerCase())) {
          errors.push("Duplicate Matric Number in file");
        }
        
        if (matricNumber) seenMatrics.add(matricNumber.toLowerCase());

        parsed.push({
          matricNumber,
          name,
          level,
          isValid: errors.length === 0,
          errors
        });
      }

      setParsedData(parsed);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!parsedData) return;
    const validRows = parsedData.filter(r => r.isValid);
    if (validRows.length === 0) {
      toast("No valid rows to import.");
      return;
    }

    setIsPending(true);
    const res = await importVoterRoll(electionId, validRows, importMode === "replace");
    
    if (res.success) {
      setParsedData(null);
      // We rely on router.refresh() to update data, but we can also artificially update local state if preferred.
      // For simplicity and freshness:
      router.refresh();
      // Wait a moment for refresh to happen, or just alert success
      setTimeout(() => toast.success(`Successfully imported ${validRows.length} voters.`), 500);
    } else {
      toast.error(res.error || "Failed to import voters.");
    }
    setIsPending(false);
  };

  const handleDelete = async (voterId: string) => {
    if (isLocked) return;
    if (!(await toastConfirm("Remove this voter from the election?"))) return;
    
    setIsPending(true);
    const res = await deleteVoter(electionId, voterId);
    if (res.success) {
      setVoters(voters.filter(v => v.id !== voterId));
      router.refresh();
    } else {
      toast.error(res.error || "Failed to delete voter");
    }
    setIsPending(false);
  };

  const filteredVoters = voters.filter(v => 
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    v.matricNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {isLocked && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-blue-500" />
          <p className="text-sm font-medium">This election is no longer in Setup phase. The voter roll is locked and cannot be modified.</p>
        </div>
      )}

      {/* Upload Section */}
      {!isLocked && !parsedData && (
        <div 
          className={`border-2 border-dashed rounded-2xl p-10 text-center transition-colors ${
            isDragging ? "border-primary-500 bg-primary-50" : "border-surface-200 bg-white hover:border-primary-300"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="w-16 h-16 bg-primary-50 text-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Upload className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-surface-900 mb-2">Upload Voter Roll CSV</h3>
          <p className="text-surface-500 text-sm mb-6 max-w-md mx-auto">
            Drag and drop your CSV file here, or click to browse. The file must contain three columns: <code className="bg-surface-100 px-1 py-0.5 rounded">Matric Number</code>, <code className="bg-surface-100 px-1 py-0.5 rounded">Name</code>, and <code className="bg-surface-100 px-1 py-0.5 rounded">Level</code>.
          </p>
          <input 
            type="file" 
            accept=".csv" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          <div className="flex items-center justify-center gap-4">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="btn-primary py-2 px-6"
            >
              Browse Files
            </button>
            <a 
              href="data:text/csv;charset=utf-8,Matric Number,Name,Level%0A20/1234,Jane Doe,400L%0A21/5678,John Smith,300L"
              download="sample-voters.csv"
              className="btn-secondary py-2 px-6 flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> Sample CSV
            </a>
          </div>
        </div>
      )}

      {/* Preview Section */}
      {parsedData && (
        <div className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden animate-scale-in">
          <div className="p-6 border-b border-surface-100 bg-surface-50 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-surface-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-500" />
                Upload Preview
              </h2>
              <p className="text-sm text-surface-500 mt-1">
                Found {parsedData.length} total rows. {parsedData.filter(r => r.isValid).length} valid, {parsedData.filter(r => !r.isValid).length} with errors.
              </p>
            </div>
            <button 
              onClick={() => setParsedData(null)}
              className="p-2 text-surface-400 hover:text-surface-700 hover:bg-surface-200 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 border-b border-surface-100">
            <div className="flex items-center gap-4 mb-4">
              <label className="text-sm font-medium text-surface-700">Import Mode:</label>
              <label className="flex items-center gap-2 text-sm text-surface-600 cursor-pointer">
                <input 
                  type="radio" 
                  name="importMode" 
                  value="replace" 
                  checked={importMode === "replace"} 
                  onChange={(e) => setImportMode(e.target.value as any)}
                  className="accent-primary-500"
                />
                Replace entire roll (recommended for setup)
              </label>
              <label className="flex items-center gap-2 text-sm text-surface-600 cursor-pointer">
                <input 
                  type="radio" 
                  name="importMode" 
                  value="append" 
                  checked={importMode === "append"} 
                  onChange={(e) => setImportMode(e.target.value as any)}
                  className="accent-primary-500"
                />
                Append (ignores existing matric numbers)
              </label>
            </div>

            <div className="overflow-x-auto border border-surface-200 rounded-lg max-h-64 overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-2 font-medium text-surface-600 border-b border-surface-200">Matric Number</th>
                    <th className="px-4 py-2 font-medium text-surface-600 border-b border-surface-200">Name</th>
                    <th className="px-4 py-2 font-medium text-surface-600 border-b border-surface-200">Level</th>
                    <th className="px-4 py-2 font-medium text-surface-600 border-b border-surface-200">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {parsedData.slice(0, 50).map((row, i) => (
                    <tr key={i} className={row.isValid ? "" : "bg-red-50/50"}>
                      <td className="px-4 py-2">{row.matricNumber}</td>
                      <td className="px-4 py-2">{row.name}</td>
                      <td className="px-4 py-2">{row.level}</td>
                      <td className="px-4 py-2">
                        {row.isValid ? (
                          <span className="text-emerald-600 text-xs font-medium">Valid</span>
                        ) : (
                          <span className="text-red-600 text-xs font-medium" title={row.errors.join(", ")}>
                            {row.errors[0]} {row.errors.length > 1 && `(+${row.errors.length - 1})`}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {parsedData.length > 50 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-3 text-center text-surface-500 text-xs bg-surface-50">
                        ... and {parsedData.length - 50} more rows
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-4 bg-surface-50 flex justify-end gap-3">
            <button 
              onClick={() => setParsedData(null)}
              className="btn-secondary py-2 text-sm"
              disabled={isPending}
            >
              Cancel
            </button>
            <button 
              onClick={handleImport}
              className="btn-primary py-2 text-sm"
              disabled={isPending || parsedData.filter(r => r.isValid).length === 0}
            >
              {isPending ? "Importing..." : `Import ${parsedData.filter(r => r.isValid).length} Voters`}
            </button>
          </div>
        </div>
      )}

      {/* Voters List */}
      <div className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-surface-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-surface-900">Current Voters</h2>
            <p className="text-sm text-surface-500">{voters.length} registered voters</p>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
            <input 
              type="text" 
              placeholder="Search voters..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-surface-200 rounded-lg text-sm w-full md:w-64 focus:outline-none focus:border-primary-400"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-surface-50 border-b border-surface-100">
              <tr>
                <th className="px-6 py-3 font-medium text-surface-600">Matric Number</th>
                <th className="px-6 py-3 font-medium text-surface-600">Name</th>
                <th className="px-6 py-3 font-medium text-surface-600">Level</th>
                <th className="px-6 py-3 font-medium text-surface-600">Status</th>
                {!isLocked && <th className="px-6 py-3 font-medium text-surface-600 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {filteredVoters.length === 0 ? (
                <tr>
                  <td colSpan={isLocked ? 4 : 5} className="px-6 py-8 text-center text-surface-500">
                    No voters found.
                  </td>
                </tr>
              ) : (
                filteredVoters.slice(0, 100).map((voter) => (
                  <tr key={voter.id} className="hover:bg-surface-50/50 transition-colors">
                    <td className="px-6 py-3 font-mono text-xs">{voter.matricNumber}</td>
                    <td className="px-6 py-3 font-medium text-surface-900">{voter.name}</td>
                    <td className="px-6 py-3 text-surface-600">{voter.level}</td>
                    <td className="px-6 py-3">
                      {voter.hasVoted ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700">Voted</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-surface-100 text-surface-600">Pending</span>
                      )}
                    </td>
                    {!isLocked && (
                      <td className="px-6 py-3 text-right">
                        <button
                          onClick={() => handleDelete(voter.id)}
                          disabled={isPending}
                          className="p-1.5 text-danger-500 hover:bg-danger-50 rounded transition-colors disabled:opacity-50"
                          title="Remove Voter"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
              {filteredVoters.length > 100 && (
                <tr>
                  <td colSpan={isLocked ? 4 : 5} className="px-6 py-3 text-center text-surface-500 text-xs bg-surface-50">
                    ... and {filteredVoters.length - 100} more rows
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
