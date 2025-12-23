import { useState, useCallback } from 'react';
import { Upload, FileUp, X, FileSpreadsheet } from 'lucide-react';
import { useData } from '../context/DataContext';

export const FileUploader = () => {
    const { loadData, isLoading, error } = useData();
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
    }, [loadData]);

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = (file: File) => {
        if (!file.name.match(/\.(xlsx|xls|csv)$/)) {
            alert("Please upload an Excel file (.xlsx)");
            return;
        }
        loadData(file);
    };

    return (
        <div className="flex flex-col items-center justify-center p-8 w-full max-w-2xl mx-auto mt-20">
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
                    Dallas Living Design Dashboard
                </h1>
                <p className="text-gray-400 text-lg">
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
                        ? 'border-blue-500 bg-blue-500/10 scale-[1.02]'
                        : 'border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10'
                    }
                    ${error ? 'border-red-500/50 hover:border-red-500/70' : ''}
                `}
            >
                <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileInput}
                    accept=".xlsx,.xls,.csv"
                />

                {isLoading ? (
                    <div className="animate-pulse flex flex-col items-center">
                        <FileSpreadsheet className="w-16 h-16 text-blue-400 mb-4 animate-bounce" />
                        <p className="text-xl font-medium text-white">Parsing Project Data...</p>
                        <p className="text-sm text-gray-400 mt-2">This usually takes a few seconds</p>
                    </div>
                ) : (
                    <>
                        <div className={`p-6 rounded-full bg-gradient-to-br from-blue-500/20 to-teal-500/20 mb-6 ${isDragging ? 'animate-bounce' : ''}`}>
                            <Upload className="w-12 h-12 text-blue-400" />
                        </div>
                        <h3 className="text-2xl font-semibold text-white mb-2">
                            {isDragging ? 'Drop it like it\'s hot!' : 'Drag & Drop your Excel file'}
                        </h3>
                        <p className="text-gray-400 mb-6">or click to browse</p>
                        <div className="flex gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1"><FileSpreadsheet className="w-4 h-4" /> .xlsx supported</span>
                        </div>
                    </>
                )}
            </div>

            {error && (
                <div className="mt-6 p-4 w-full bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-200">
                    <X className="w-5 h-5 flex-shrink-0" />
                    <p>{error}</p>
                </div>
            )}
        </div>
    );
};
