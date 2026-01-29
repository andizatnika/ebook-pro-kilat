import React, { useEffect, useRef, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { EbookData, Chapter, GenerationState, AppStep, ImageRegistry } from '../types';
import { Play, Check, Clock, Loader2, Download, FileText, ChevronDown, Edit2, Save, Image as ImageIcon, RefreshCw, Wand2, Cloud, CloudUpload, AlertCircle, Plus, AlertTriangle, RotateCcw, Trash2, Menu, X } from 'lucide-react';
import { generateIllustration } from '../services/geminiService';

interface WriterWorkspaceProps {
  ebookData: EbookData;
  genState: GenerationState;
  imageRegistry: ImageRegistry;
  onGenerateChapter: (chapterId: string) => void;
  onUpdateChapter: (chapterId: string, content: string) => void;
  onImageGenerated: (promptKey: string, base64: string) => void;
  onFinish: () => void;
  onSave: () => void;
  onDelete?: () => void; // Optional delete handler
  onNewEbook: () => void; 
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  step: AppStep;
}

const AIIllustrationBlock: React.FC<{ 
  prompt: string; 
  existingImage?: string; 
  onGenerate: (prompt: string, img: string) => void; 
}> = ({ prompt, existingImage, onGenerate }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const attemptRef = useRef(false);

  useEffect(() => {
    if (!existingImage && !loading && !attemptRef.current && !error) {
      const generate = async () => {
        setLoading(true);
        attemptRef.current = true;
        try {
          let cleanPrompt = prompt
            .replace(/^>\s*/, '')
            .replace(/\*\*/g, '')
            .replace(/\[IMAGE PROMPT\]:/i, '')
            .trim();
          
          if (!cleanPrompt) throw new Error("Empty prompt");

          const base64 = await generateIllustration(cleanPrompt);
          onGenerate(prompt, base64);
        } catch (e) {
          console.error("Auto image gen failed", e);
          setError(true);
        } finally {
          setLoading(false);
        }
      };
      generate();
    }
  }, [existingImage, prompt, loading, error, onGenerate]);

  const handleRetry = async () => {
    setError(false);
    attemptRef.current = false;
  };

  if (existingImage) {
    return (
      <div className="my-6 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm break-inside-avoid">
        <img src={existingImage} alt="AI Generated Illustration" className="w-full h-auto object-cover max-h-[500px]" />
        <div className="bg-gray-50 dark:bg-gray-800 p-2 text-xs text-center text-gray-500 italic border-t border-gray-100 dark:border-gray-700">
           {prompt.replace(/^>\s*\*\*\[IMAGE PROMPT\]:\*\*/i, '').trim().substring(0, 100)}...
        </div>
      </div>
    );
  }

  return (
    <div className="my-6 p-6 rounded-lg border-2 border-dashed border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/10 flex flex-col items-center justify-center text-center">
      {loading ? (
        <div className="flex flex-col items-center gap-2 text-indigo-600 dark:text-indigo-400">
          <Wand2 className="w-8 h-8 animate-spin" />
          <span className="text-sm font-semibold animate-pulse">Sedang menggambar ilustrasi AI...</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-2 text-red-500">
          <span className="text-sm">Gagal membuat gambar.</span>
          <button onClick={handleRetry} className="text-xs underline font-bold">Coba Lagi</button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 text-indigo-400">
           <ImageIcon className="w-8 h-8 opacity-50" />
           <span className="text-xs">Menyiapkan generator gambar...</span>
        </div>
      )}
      <div className="mt-2 text-[10px] text-gray-400 max-w-md truncate">
        {prompt}
      </div>
    </div>
  );
};

export const WriterWorkspace: React.FC<WriterWorkspaceProps> = ({ 
  genState, 
  imageRegistry,
  onGenerateChapter, 
  onUpdateChapter,
  onImageGenerated,
  onFinish,
  onSave,
  onDelete,
  onNewEbook,
  isSaving,
  hasUnsavedChanges,
  step 
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedPreview, setSelectedPreview] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const sections = useMemo(() => {
    return {
      front: ebookData.outline.filter(c => c.sectionType === 'front'),
      body: ebookData.outline.filter(c => c.sectionType === 'body'),
      back: ebookData.outline.filter(c => c.sectionType === 'back'),
    };
  }, [ebookData.outline]);

  useEffect(() => {
    if (!selectedPreview && ebookData.outline.length > 0) {
      setSelectedPreview(ebookData.outline[0].id);
    }
  }, [ebookData.outline, selectedPreview]);

  useEffect(() => {
    const chapter = ebookData.outline.find(c => c.id === selectedPreview);
    if (chapter) {
      setEditContent(chapter.content || '');
    }
  }, [selectedPreview, ebookData.outline]);

  const getPreviewContent = () => {
    const chapter = ebookData.outline.find(c => c.id === selectedPreview);
    return chapter?.content || "";
  };

  const handleSaveEdit = () => {
    onUpdateChapter(selectedPreview, editContent);
    setIsEditing(false);
  };

  // --- IMPROVED EXPORT FUNCTION ---
  const handleExportDOC = () => {
    // CSS to match the app's look and feel (Inter for headers, Serif for body)
    const cssStyles = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800&family=Merriweather:wght@300;400;700&display=swap');
        
        body {
          font-family: 'Merriweather', 'Georgia', serif;
          font-size: 12pt;
          line-height: 1.6;
          color: #334155;
          max-width: 100%;
        }
        
        /* Title Page Style */
        .title-page {
          text-align: center;
          padding-top: 100px;
          page-break-after: always;
        }
        .main-title {
          font-family: 'Inter', 'Arial', sans-serif;
          font-size: 36pt;
          font-weight: 800;
          color: #1e293b;
          margin-bottom: 20px;
        }
        .sub-title {
          font-family: 'Inter', 'Arial', sans-serif;
          font-size: 18pt;
          color: #64748b;
          margin-bottom: 50px;
        }

        /* Chapter Headings */
        h1 {
          font-family: 'Inter', 'Arial', sans-serif;
          font-size: 24pt;
          font-weight: 800;
          color: #1e293b;
          margin-top: 0;
          margin-bottom: 24px;
          page-break-before: always; /* New page for each chapter */
          padding-bottom: 10px;
          border-bottom: 2px solid #e2e8f0;
        }
        
        h2 {
          font-family: 'Inter', 'Arial', sans-serif;
          font-size: 18pt;
          font-weight: 700;
          color: #4338ca; /* Indigo-700 */
          margin-top: 30px;
          margin-bottom: 16px;
        }
        
        h3 {
          font-family: 'Inter', 'Arial', sans-serif;
          font-size: 14pt;
          font-weight: 600;
          color: #1e293b;
          margin-top: 24px;
          margin-bottom: 12px;
        }

        /* Body Text */
        p {
          margin-bottom: 16px;
          text-align: justify;
        }

        /* Formatting */
        strong, b {
          font-weight: 700;
          color: #0f172a;
        }
        
        ul, ol {
          margin-bottom: 16px;
          margin-left: 24px;
        }
        
        li {
          margin-bottom: 8px;
        }

        /* Blockquotes - match App style */
        blockquote {
          border-left: 4px solid #6366f1;
          background-color: #f5f7ff;
          padding: 16px 20px;
          margin: 20px 0;
          font-style: italic;
          color: #3730a3;
        }

        /* Images */
        img {
          display: block;
          max-width: 100%;
          height: auto;
          margin: 20px auto;
          border-radius: 8px;
        }
        
        .img-caption {
          text-align: center;
          font-size: 10pt;
          color: #94a3b8;
          font-style: italic;
          margin-top: 5px;
        }
      </style>
    `;

    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${ebookData.title}</title>
        ${cssStyles}
      </head>
      <body>`;
    
    // Title Page Content
    const titlePage = `
      <div class="title-page">
        <div class="main-title">${ebookData.title}</div>
        <div class="sub-title">${ebookData.subtitle}</div>
      </div>
    `;

    const footer = "</body></html>";
    
    const allContent = ebookData.outline
      .filter(c => c.content) // Only include generated chapters
      .map(c => {
         let content = c.content || '';
         
         // Process Images
         const imgRegex = /^>\s*\*\*\[IMAGE PROMPT\]:\*\*(.*?)$/gm;
         content = content.replace(imgRegex, (match) => {
             const imageData = imageRegistry[match.trim()];
             if (imageData) {
                 return `<br><img src="${imageData}" width="500" alt="Illustration" /><br>`;
             }
             return ``; // Remove prompt text if image not generated to keep it clean, or keep prompt
         });

         // Process Markdown to HTML (Simple replacement for export)
         let htmlBody = content
            .replace(/^# (.*$)/gim, '<h1>$1</h1>') // Should not happen often if chapter title is separate, but just in case
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/\*\*(.*?)\*\*/gim, '<b>$1</b>')
            .replace(/\*(.*?)\*/gim, '<i>$1</i>')
            .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
            .replace(/\n\n/g, '</p><p>') // Double newline to paragraph
            .replace(/\n/g, '<br>');      // Single newline to break
         
         // Wrap content in p tags if not already
         if (!htmlBody.startsWith('<')) htmlBody = '<p>' + htmlBody + '</p>';

         return `<h1>${c.title}</h1>\n${htmlBody}`;
      })
      .join('\n'); // CSS h1 { page-break-before: always } handles the breaks

    const sourceHTML = header + titlePage + allContent + footer;
    
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), sourceHTML], {
      type: 'application/msword'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${ebookData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderSectionGroup = (title: string, group: Chapter[]) => {
    if (group.length === 0) return null;
    return (
      <div className="mb-6">
        <h4 className="px-3 mb-2 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-1">
          <ChevronDown size={12} /> {title}
        </h4>
        <div className="space-y-2">
          {group.map((chapter) => (
            <div 
                key={chapter.id}
                onClick={() => {
                  setSelectedPreview(chapter.id);
                  setIsEditing(false);
                }}
                className={`mx-2 p-3 rounded-lg border transition-all cursor-pointer relative ${
                      selectedPreview === chapter.id 
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 ring-1 ring-indigo-200 dark:ring-indigo-800' 
                      : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-indigo-200 dark:hover:border-indigo-700'
                }`}
            >
                <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2 overflow-hidden">
                       <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          chapter.status === 'completed' ? 'bg-green-500' : 
                          chapter.status === 'generating' ? 'bg-indigo-500 animate-pulse' : 
                          chapter.status === 'error' ? 'bg-red-500' : 'bg-gray-300 dark:bg-gray-600'
                       }`} />
                       <span className={`text-sm font-semibold truncate ${selectedPreview === chapter.id ? 'text-indigo-900 dark:text-indigo-100' : 'text-gray-700 dark:text-gray-300'}`}>
                         {chapter.title}
                       </span>
                    </div>
                    {chapter.status === 'completed' && <Check size={14} className="text-green-600 shrink-0"/>}
                    {chapter.status === 'generating' && <Loader2 size={14} className="animate-spin text-indigo-600 shrink-0"/>}
                    {chapter.status === 'pending' && <Clock size={14} className="text-gray-300 shrink-0"/>}
                    {chapter.status === 'error' && <AlertTriangle size={14} className="text-red-500 shrink-0"/>}
                </div>
                
                {!genState.isGenerating && (
                    <div className="flex justify-end mt-2">
                         {(chapter.status === 'pending' || chapter.status === 'error' || (chapter.status === 'completed' && selectedPreview === chapter.id)) && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); onGenerateChapter(chapter.id); }}
                                className={`text-xs font-bold py-1 px-2 rounded flex items-center gap-1 transition-colors ${
                                    chapter.status === 'completed' 
                                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    : chapter.status === 'error'
                                        ? 'w-full justify-center bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
                                        : 'w-full justify-center bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-800'
                                }`}
                                title={chapter.status === 'completed' ? "Regenerate Chapter" : "Generate Chapter"}
                            >
                                {chapter.status === 'completed' ? <RefreshCw size={10} /> : chapter.status === 'error' ? <RotateCcw size={10} /> : <Play size={10} />}
                                {chapter.status === 'completed' ? "Regenerate" : chapter.status === 'error' ? "Retry" : "Generate"}
                            </button>
                        )}
                    </div>
                )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const activeChapter = ebookData.outline.find(c => c.id === selectedPreview);
  const hasContent = activeChapter?.content && activeChapter.content.length > 0;
  
  const isSaved = !!ebookData.id;
  const isDirty = hasUnsavedChanges;

  const renderSaveButton = () => (
      <button 
        onClick={onSave}
        disabled={isSaving}
        className={`flex-1 py-2.5 rounded-lg font-bold border transition-all flex justify-center items-center gap-2 ${
            isDirty
            ? 'bg-indigo-600 text-white hover:bg-indigo-700 border-transparent shadow-md' 
            : isSaved 
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-700' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 border-transparent shadow-md' 
        }`}
    >
       {isSaving ? <Loader2 size={16} className="animate-spin" /> : <CloudUpload size={16} />}
       {isSaving ? 'Saving...' : isDirty ? 'Save Changes' : isSaved ? 'Saved' : 'Save to Library'}
    </button>
  );

  return (
    <div className="flex h-full relative">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* LEFT SIDEBAR - Navigation */}
      <div className={`fixed lg:static inset-y-0 left-0 w-80 border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex flex-col shrink-0 no-print transition-colors duration-200 z-50 lg:z-auto transform transition-transform duration-300 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Close Button - Visible on All Screens */}
        <button 
          onClick={() => setIsSidebarOpen(false)}
          className="absolute top-3 right-3 z-20 p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors shadow-sm"
          title="Tutup Sidebar"
        >
          <X size={20} />
        </button>

        <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm z-10 flex flex-col gap-2">
            <div className="flex justify-between items-start gap-2">
                <div className="overflow-hidden pr-8">
                    <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight truncate" title={ebookData.title}>{ebookData.title || "Untitled Book"}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">{ebookData.subtitle}</p>
                </div>
                
                <div className="flex items-center gap-1">
                   {/* Create New Button */}
                   <button 
                      type="button"
                      onClick={onNewEbook}
                      className="shrink-0 p-2 rounded-lg text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-400 transition-colors"
                      title="Buat eBook Baru"
                   >
                      <Plus size={18} />
                   </button>
                   
                   {/* Save Status Icon */}
                   <button 
                      onClick={onSave}
                      disabled={isSaving}
                      className={`shrink-0 p-2 rounded-lg transition-colors flex items-center justify-center ${
                          isDirty
                          ? 'text-amber-600 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:hover:bg-amber-900/40 animate-pulse'
                          : isSaved
                              ? 'text-green-600 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/40' 
                              : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                      title={isSaving ? "Saving..." : isDirty ? "Unsaved Changes" : "Saved"}
                  >
                      {isSaving ? <Loader2 size={18} className="animate-spin" /> : isDirty ? <Save size={18} /> : isSaved ? <Check size={18} /> : <Cloud size={18} />}
                  </button>

                  {/* DELETE BUTTON (Added) */}
                  {onDelete && (
                      <button 
                        type="button"
                        onClick={onDelete}
                        className="shrink-0 p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
                        title="Hapus Proyek Ini"
                      >
                          <Trash2 size={18} />
                      </button>
                  )}
                </div>
            </div>
            {!isSaved && (
                <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded border border-amber-100 dark:border-amber-800">
                    <AlertCircle size={14} />
                    <span>Belum disimpan ke Library</span>
                </div>
            )}
            {isSaved && isDirty && (
                 <div className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded border border-indigo-100 dark:border-indigo-800">
                    <AlertCircle size={14} />
                    <span>Ada perubahan belum disimpan</span>
                </div>
            )}
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
            {renderSectionGroup("Bagian Awal", sections.front)}
            {renderSectionGroup("Isi Utama", sections.body)}
            {renderSectionGroup("Bagian Akhir", sections.back)}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
            {step === AppStep.GENERATING && (
                <>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-3 text-center min-h-[1.5rem] flex items-center justify-center">
                        {genState.isGenerating ? (
                            <span className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-medium">
                                <Loader2 size={12} className="animate-spin"/> {genState.currentTask}
                            </span>
                        ) : (
                           <span className="text-gray-400 dark:text-gray-600">Pilih chapter untuk mulai menulis</span>
                        )}
                    </div>
                    
                    <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full mb-4 overflow-hidden">
                       <div 
                          className="h-full bg-indigo-500 transition-all duration-500"
                          style={{ width: `${(ebookData.outline.filter(c => c.status === 'completed').length / ebookData.outline.length) * 100}%` }}
                       />
                    </div>

                    <div className="flex gap-2">
                        {renderSaveButton()}

                        {ebookData.outline.filter(c => c.status === 'completed').length > 0 && (
                            <button 
                                onClick={onFinish}
                                className="flex-1 py-2.5 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 shadow-md hover:shadow-lg transition-all"
                            >
                                Finish
                            </button>
                        )}
                    </div>
                </>
            )}

             {step === AppStep.COMPLETED && (
                 <div className="space-y-2">
                    <div className="mb-2">
                        {renderSaveButton()}
                    </div>
                    
                    <button 
                        onClick={handleExportDOC}
                        className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 flex items-center justify-center gap-2 shadow transition-all"
                    >
                        <FileText size={16} /> Export DOC (Word)
                    </button>
                 </div>
             )}
        </div>
      </div>

      {/* RIGHT: Editor/Preview Area */}
      <div className="flex-1 flex flex-col h-full bg-white dark:bg-gray-900 relative transition-colors duration-200">
        <div className="h-14 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 lg:px-6 bg-white dark:bg-gray-900 shrink-0">
            {/* Menu Button - Visible on All Screens */}
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors border border-indigo-200 dark:border-indigo-800"
              title={isSidebarOpen ? "Tutup Sidebar" : "Buka Sidebar"}
            >
              {isSidebarOpen ? <X size={22} strokeWidth={2.5} /> : <Menu size={22} strokeWidth={2.5} />}
            </button>

            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="font-semibold text-gray-900 dark:text-gray-100 truncate">{activeChapter?.title}</span>
                {hasContent && <span className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wide hidden sm:inline-block">Ready</span>}
            </div>

            {hasContent && (
                <div className="flex items-center gap-2">
                    {isEditing ? (
                        <button onClick={handleSaveEdit} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded hover:bg-indigo-700 transition-colors">
                            <Save size={14} /> Simpan Perubahan
                        </button>
                    ) : (
                        <button onClick={() => setIsEditing(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 text-xs font-bold rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors hidden sm:flex">
                            <Edit2 size={14} /> Edit Konten
                        </button>
                    )}
                </div>
            )}
        </div>

        <div className="h-full overflow-y-auto px-4 lg:px-12 py-8 lg:py-12 scroll-smooth bg-gray-50/50 dark:bg-gray-950/50" ref={scrollRef}>
            <div className={`max-w-3xl mx-auto min-h-[600px] bg-white dark:bg-gray-900 shadow-sm p-6 lg:p-10 transition-colors duration-200 ${isEditing ? 'h-full' : ''}`}>
                 
                 {hasContent ? (
                    isEditing ? (
                        <textarea 
                            className="w-full h-[600px] p-4 font-mono text-sm leading-relaxed bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                        />
                    ) : (
                        <div className="prose prose-slate dark:prose-invert prose-lg max-w-none 
                                      prose-headings:font-sans prose-headings:font-bold prose-headings:text-slate-900 dark:prose-headings:text-gray-100
                                      prose-p:font-serif prose-p:leading-relaxed prose-p:text-slate-700 dark:prose-p:text-gray-300
                                      prose-blockquote:border-l-indigo-500 prose-blockquote:bg-indigo-50 dark:prose-blockquote:bg-indigo-900/20 prose-blockquote:not-italic prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:text-slate-700 dark:prose-blockquote:text-gray-300
                                      prose-li:text-slate-700 dark:prose-li:text-gray-300">
                            <ReactMarkdown 
                                components={{
                                    h1: ({node, ...props}) => <h1 className="text-4xl font-extrabold mb-8 pb-4 border-b-2 border-gray-100 dark:border-gray-800" {...props} />,
                                    h2: ({node, ...props}) => <h2 className="text-2xl font-bold mt-10 mb-4 text-indigo-900 dark:text-indigo-300" {...props} />,
                                    blockquote: ({node, children, ...props}) => {
                                        const getText = (child: any): string => {
                                            if (typeof child === 'string') return child;
                                            if (Array.isArray(child)) return child.map(getText).join('');
                                            if (child?.props?.children) return getText(child.props.children);
                                            return '';
                                        };
                                        const text = getText(children);
                                        
                                        if (text.includes('[IMAGE PROMPT]')) {
                                            return (
                                              <AIIllustrationBlock 
                                                prompt={text} 
                                                existingImage={imageRegistry[text]}
                                                onGenerate={onImageGenerated}
                                              />
                                            );
                                        }

                                        return (
                                            <blockquote className="border-l-4 border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 p-4 my-4 rounded-r-lg" {...props}>
                                                <div className="flex items-start gap-3">
                                                    <div className="text-sm italic text-indigo-800 dark:text-indigo-200">
                                                        {children}
                                                    </div>
                                                </div>
                                            </blockquote>
                                        )
                                    }
                                }}
                            >
                                {getPreviewContent()}
                            </ReactMarkdown>
                        </div>
                    )
                 ) : (
                     <div className="flex flex-col items-center justify-center h-full text-gray-300 dark:text-gray-600 min-h-[400px]">
                         <FileText size={64} className="mb-4 opacity-20"/>
                         <p className="text-lg font-medium text-gray-400 dark:text-gray-500">Konten belum tersedia.</p>
                         <p className="text-sm">Pilih bagian ini di sidebar lalu klik Generate.</p>
                     </div>
                 )}
            </div>
            <div className="h-32"></div> 
        </div>
      </div>
    </div>
  );
};