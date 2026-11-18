import React, { useEffect, useState } from 'react';
import { Check, Copy, Database, FileCode2, FolderTree } from 'lucide-react';
import { apiFetch } from '../utils/apiClient';

interface SourceFileEntry {
  path: string;
  language: string;
  content: string;
}

export function SpringBootSourceView() {
  const [files, setFiles] = useState<SourceFileEntry[]>([]);
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    apiFetch<SourceFileEntry[]>('/api/spring-boot-files')
      .then((data) => {
        if (!active) return;
        setFiles(data);
        const preferred =
          data.find((f) => f.path.endsWith('schema.sql')) ??
          data.find((f) => f.path.endsWith('pom.xml')) ??
          data[0];
        if (preferred) setSelectedPath(preferred.path);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const selectedFile = files.find((f) => f.path === selectedPath) ?? files[0];

  async function handleCopy() {
    if (!selectedFile) return;
    try {
      await navigator.clipboard.writeText(selectedFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard fallback ignored if restricted
    }
  }

  return (
    <div className="space-y-6">
      {/* Local Setup Guide Summary */}
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Java Spring Boot + MySQL + Bootstrap Project Bundle
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Complete Maven project exported under <span className="font-mono text-slate-800">/spring-boot-hms/</span>{' '}
              with layered OOP entities (<span className="font-mono">Person</span> inheritance), Spring Data JPA repositories,
              REST controllers, MySQL DDL/seed scripts, and Bootstrap 5 UI.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600 shrink-0">
            <Database className="h-4 w-4 text-teal-700" />
            <span>MySQL 8.0 · Java 17 · Spring Boot 3.3</span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 border-t border-slate-200 pt-4 text-xs text-slate-700 md:grid-cols-3">
          <div>
            <p className="font-semibold text-slate-900">1. Create MySQL Database</p>
            <p className="mt-1 text-slate-600">
              Run <span className="font-mono text-slate-800">schema.sql</span> and{' '}
              <span className="font-mono text-slate-800">data.sql</span> in MySQL Workbench, then set your password in{' '}
              <span className="font-mono text-slate-800">application.properties</span>.
            </p>
          </div>
          <div>
            <p className="font-semibold text-slate-900">2. Import in IntelliJ or Eclipse</p>
            <p className="mt-1 text-slate-600">
              Open <span className="font-mono text-slate-800">spring-boot-hms/pom.xml</span> as an Existing Maven Project
              and wait for dependencies to sync.
            </p>
          </div>
          <div>
            <p className="font-semibold text-slate-900">3. Run Spring Boot Server</p>
            <p className="mt-1 text-slate-600">
              Execute <span className="font-mono text-slate-800">HospitalManagementApplication.java</span> or run{' '}
              <span className="font-mono text-slate-800">mvn spring-boot:run</span> on port 8080.
            </p>
          </div>
        </div>
      </section>

      {/* 2-Column Code Explorer */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <aside className="lg:col-span-4 rounded-lg border border-slate-200 bg-white">
          <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3 text-xs font-semibold text-slate-700">
            <FolderTree className="h-4 w-4 text-teal-700" />
            <span>Project Files ({files.length})</span>
          </div>

          {loading ? (
            <div className="p-4 text-xs text-slate-500">Loading project files...</div>
          ) : (
            <nav aria-label="Spring Boot source files" className="max-h-[540px] overflow-y-auto divide-y divide-slate-100">
              {files.map((file) => {
                const isSelected = file.path === selectedFile?.path;
                return (
                  <button
                    key={file.path}
                    type="button"
                    onClick={() => setSelectedPath(file.path)}
                    className={`flex w-full items-center gap-2 px-4 py-2.5 text-left font-mono text-xs transition-colors ${
                      isSelected
                        ? 'bg-teal-50 font-semibold text-teal-900'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <FileCode2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="truncate">{file.path}</span>
                  </button>
                );
              })}
            </nav>
          )}
        </aside>

        <section className="lg:col-span-8 rounded-lg border border-slate-200 bg-slate-900 text-slate-100 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
            <span className="font-mono text-xs text-slate-300 truncate">
              {selectedFile?.path ?? 'Select a file'}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              disabled={!selectedFile}
              className="inline-flex items-center gap-1.5 rounded border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-medium text-slate-200 hover:bg-slate-700 whitespace-nowrap shrink-0"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy Code'}
            </button>
          </div>
          <pre className="max-h-[540px] overflow-auto p-4 font-mono text-xs leading-relaxed text-slate-200">
            <code>{selectedFile?.content ?? ''}</code>
          </pre>
        </section>
      </div>
    </div>
  );
}
