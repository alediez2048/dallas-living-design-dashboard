import { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, Sparkles, X, ArrowRight } from 'lucide-react';
import { useData } from '../context/DataContext';

export const FileUploader = () => {
    const { loadData, loadDemoData, isLoading, error } = useData();
    const [isDragging, setIsDragging] = useState(false);
    const [stagedFiles, setStagedFiles] = useState<{ file: File; year: number }[]>([]);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragging(true);
        } else if (e.type === 'dragleave') {
            setIsDragging(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    }, []);

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFiles(e.target.files);
        }
    };

    const handleFiles = (files: FileList | File[]) => {
        const newFiles = Array.from(files).filter(f => f.name.match(/\.(xlsx|xls|csv)$/i));
        if (newFiles.length === 0) {
            alert("Please upload valid Excel files (.xlsx, .xls, or .csv)");
            return;
        }

        const currentYear = new Date().getFullYear();
        const mapped = newFiles.map(file => {
            const match = file.name.match(/202[0-9]/);
            const year = match ? parseInt(match[0]) : currentYear;
            return { file, year };
        });

        setStagedFiles(prev => [...prev, ...mapped]);
    };

    const updateYear = (index: number, year: number) => {
        setStagedFiles(prev => {
            const copy = [...prev];
            copy[index].year = year;
            return copy;
        });
    };

    const removeFile = (index: number) => {
        setStagedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleLoadData = () => {
        if (stagedFiles.length > 0) {
            loadData(stagedFiles);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center p-8 w-full max-w-3xl mx-auto mt-20">
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-teal-500 dark:from-blue-400 dark:to-teal-400 bg-clip-text text-transparent">
                    Dallas Living Design Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                    Upload your yearly project tracking spreadsheets to visualize and compare studio performance.
                </p>
            </div>

            <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`
                    w-full ${stagedFiles.length > 0 ? 'h-32 mb-6' : 'h-80'} rounded-2xl border-4 border-dashed transition-all duration-300 flex flex-col items-center justify-center cursor-pointer relative overflow-hidden
                    ${isDragging
                        ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-500/10 scale-[1.02]'
                        : 'border-gray-300 dark:border-white/10 hover:border-gray-400 dark:hover:border-white/20 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10'
                    }
                    ${error ? 'border-red-500/50 hover:border-red-500/70 dark:border-red-500/30' : ''}
                `}
            >
                <input
                    type="file"
                    multiple
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileInput}
                    accept=".xlsx,.xls,.csv"
                    disabled={isLoading}
                />

                {isLoading ? (
                    <div className="animate-pulse flex flex-col items-center">
                        <FileSpreadsheet className="w-12 h-12 text-blue-500 dark:text-blue-400 mb-2 animate-bounce" />
                        <p className="text-lg font-medium text-gray-900 dark:text-white">Parsing Project Data...</p>
                    </div>
                ) : (
                    <>
                        <div className={`p-4 rounded-full bg-gradient-to-br from-blue-500/20 to-teal-500/20 dark:from-blue-400/20 dark:to-teal-400/20 ${stagedFiles.length === 0 ? 'mb-6' : 'mb-2'} ${isDragging ? 'animate-bounce' : ''}`}>
                            <Upload className={`${stagedFiles.length > 0 ? 'w-6 h-6' : 'w-12 h-12'} text-blue-600 dark:text-blue-400`} />
                        </div>
                        <h3 className={`${stagedFiles.length > 0 ? 'text-lg' : 'text-2xl'} font-semibold text-gray-900 dark:text-white mb-1`}>
                            {isDragging ? 'Drop it like it\'s hot!' : 'Drag & Drop Excel files'}
                        </h3>
                        {stagedFiles.length === 0 && (
                            <>
                                <p className="text-gray-600 dark:text-gray-400 mb-6">or click to browse multiple years</p>
                                <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400">
                                    <span className="flex items-center gap-1"><FileSpreadsheet className="w-4 h-4" /> .xlsx, .xls, .csv supported</span>
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>

            {stagedFiles.length > 0 && !isLoading && (
                <div className="w-full bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <FileSpreadsheet className="w-5 h-5 text-teal-500" />
                        Staged Files
                    </h3>
                    <div className="flex flex-col gap-3 mb-6">
                        {stagedFiles.map((staged, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <FileSpreadsheet className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-[200px] sm:max-w-xs">
                                        {staged.file.name}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <label className="text-xs text-gray-500 uppercase font-semibold tracking-wider hidden sm:block">Year:</label>
                                        <input
                                            type="number"
                                            value={staged.year}
                                            onChange={(e) => updateYear(idx, parseInt(e.target.value) || new Date().getFullYear())}
                                            className="w-20 px-2 py-1 text-sm bg-white dark:bg-[#2a2a2a] border border-gray-200 dark:border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                        />
                                    </div>
                                    <button
                                        onClick={() => removeFile(idx)}
                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={handleLoadData}
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 dark:from-blue-500 dark:to-teal-400 text-white font-medium py-3 px-6 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
                    >
                        Load Dashboard
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            )}

            {error && (
                <div className="mt-2 mb-6 p-4 w-full bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-red-700 dark:text-red-200">
                    <p className="font-medium">Error</p>
                    <p className="text-sm mt-1">{error}</p>
                </div>
            )}

            {/* Demo Mode Button */}
            {stagedFiles.length === 0 && (
                <div className="w-full">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300 dark:border-white/10"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white dark:bg-[#121212] text-gray-500 dark:text-gray-400">
                                or
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={loadDemoData}
                        disabled={isLoading}
                        className="mt-6 w-full group relative overflow-hidden rounded-xl px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 dark:from-purple-600 dark:to-pink-600 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-700 dark:to-pink-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative flex items-center justify-center gap-2">
                            <Sparkles className="w-5 h-5 animate-pulse" />
                            <span>Try Demo with Sample Data</span>
                            <Sparkles className="w-5 h-5 animate-pulse" />
                        </div>
                    </button>

                    <p className="mt-3 text-center text-xs text-gray-500 dark:text-gray-400">
                        Explore the dashboard with realistic multi-year sample projects
                    </p>
                </div>
            )}
        </div>
    );
};
