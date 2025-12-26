import { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, Sparkles } from 'lucide-react';
import { useData } from '../context/DataContext';

export const FileUploader = () => {
    const { loadData, loadDemoData, isLoading, error } = useData();
    const [isDragging, setIsDragging] = useState(false);

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

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    }, []);

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = (file: File) => {
        if (!file.name.match(/\.(xlsx|xls|csv)$/)) {
            alert("Please upload an Excel file (.xlsx, .xls, or .csv)");
            return;
        }
        loadData(file);
    };

    return (
        <div className="flex flex-col items-center justify-center p-8 w-full max-w-2xl mx-auto mt-20">
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-teal-500 dark:from-blue-400 dark:to-teal-400 bg-clip-text text-transparent">
                    Dallas Living Design Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                    Upload your project tracking spreadsheet to visualize studio performance.
                </p>
            </div>

            <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`
                    w-full h-80 rounded-2xl border-4 border-dashed transition-all duration-300 flex flex-col items-center justify-center cursor-pointer relative overflow-hidden
                    ${isDragging
                        ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-500/10 scale-[1.02]'
                        : 'border-gray-300 dark:border-white/10 hover:border-gray-400 dark:hover:border-white/20 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10'
                    }
                    ${error ? 'border-red-500/50 hover:border-red-500/70 dark:border-red-500/30' : ''}
                `}
            >
                <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileInput}
                    accept=".xlsx,.xls,.csv"
                    disabled={isLoading}
                />

                {isLoading ? (
                    <div className="animate-pulse flex flex-col items-center">
                        <FileSpreadsheet className="w-16 h-16 text-blue-500 dark:text-blue-400 mb-4 animate-bounce" />
                        <p className="text-xl font-medium text-gray-900 dark:text-white">Parsing Project Data...</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">This usually takes a few seconds</p>
                    </div>
                ) : (
                    <>
                        <div className={`p-6 rounded-full bg-gradient-to-br from-blue-500/20 to-teal-500/20 dark:from-blue-400/20 dark:to-teal-400/20 mb-6 ${isDragging ? 'animate-bounce' : ''}`}>
                            <Upload className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                            {isDragging ? 'Drop it like it\'s hot!' : 'Drag & Drop your Excel file'}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">or click to browse</p>
                        <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1"><FileSpreadsheet className="w-4 h-4" /> .xlsx, .xls, .csv supported</span>
                        </div>
                    </>
                )}
            </div>

            {error && (
                <div className="mt-6 p-4 w-full bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-red-700 dark:text-red-200">
                    <p className="font-medium">Error</p>
                    <p className="text-sm mt-1">{error}</p>
                </div>
            )}

            {/* Demo Mode Button */}
            <div className="mt-8 w-full">
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300 dark:border-white/10"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-gray-50 dark:bg-[#1a1a1a] text-gray-500 dark:text-gray-400">
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
                    Explore the dashboard with realistic sample projects
                </p>
            </div>
        </div>
    );
};
