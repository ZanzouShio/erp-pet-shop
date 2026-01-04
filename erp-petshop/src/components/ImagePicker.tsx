import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Link, Upload, Trash2, Check } from 'lucide-react';
import { API_URL, authFetch } from '../services/api';
import { useToast } from './Toast';

interface ImagePickerProps {
    value: string;
    onChange: (url: string) => void;
}

interface UploadedFile {
    filename: string;
    url: string;
    size: number;
    createdAt: string;
}

export default function ImagePicker({ value, onChange }: ImagePickerProps) {
    const [activeTab, setActiveTab] = useState<'url' | 'upload' | 'gallery'>('upload');
    const [galleryImages, setGalleryImages] = useState<UploadedFile[]>([]);
    const [urlInput, setUrlInput] = useState(value || '');
    const [isUploading, setIsUploading] = useState(false);
    const [isLoadingGallery, setIsLoadingGallery] = useState(false);
    const toast = useToast();

    // Sync internal state with prop
    useEffect(() => {
        setUrlInput(value || '');
    }, [value]);

    // Load gallery when tab changes
    useEffect(() => {
        if (activeTab === 'gallery') {
            loadGallery();
        }
    }, [activeTab]);

    const loadGallery = async () => {
        try {
            setIsLoadingGallery(true);
            const response = await authFetch(`${API_URL}/uploads`);
            if (response.ok) {
                const data = await response.json();
                setGalleryImages(data);
            }
        } catch (error) {
            console.error('Erro ao carregar galeria:', error);
            toast.error('Erro ao carregar imagens da galeria');
        } finally {
            setIsLoadingGallery(false);
        }
    };

    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVal = e.target.value;
        setUrlInput(newVal);
        onChange(newVal);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);

        try {
            setIsUploading(true);
            const response = await authFetch(`${API_URL}/uploads`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Erro no upload');
            }

            const data = await response.json();
            toast.success('Imagem enviada com sucesso!');

            // Set the new URL
            onChange(data.url);
            setUrlInput(data.url); // visual update

            // If we were in gallery, reload would be nice, but we are in upload tab usually
        } catch (error: any) {
            toast.error(error.message || 'Erro ao enviar imagem');
        } finally {
            setIsUploading(false);
            // Clear input
            e.target.value = '';
        }
    };

    const handleSelectFromGallery = (url: string) => {
        onChange(url);
        setUrlInput(url);
        toast.success('Imagem selecionada!');
    };

    const handleDeleteFromGallery = async (filename: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Tem certeza que deseja excluir esta imagem?')) return;

        try {
            const response = await authFetch(`${API_URL}/uploads/${filename}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setGalleryImages(prev => prev.filter(img => img.filename !== filename));
                toast.success('Imagem excluída');
            } else {
                throw new Error('Erro ao excluir');
            }
        } catch (error) {
            toast.error('Erro ao excluir imagem');
        }
    };

    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
            <div className="flex border-b border-gray-200 bg-gray-50">
                <button
                    type="button"
                    onClick={() => setActiveTab('upload')}
                    className={`flex-1 py-2 px-4 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'upload' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Upload size={16} /> Upload
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('gallery')}
                    className={`flex-1 py-2 px-4 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'gallery' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <ImageIcon size={16} /> Galeria
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('url')}
                    className={`flex-1 py-2 px-4 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'url' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Link size={16} /> URL
                </button>
            </div>

            <div className="p-4">
                {/* Visual Preview of selected image */}
                {value && (
                    <div className="mb-4 flex justify-center bg-gray-100 rounded-lg p-2 border border-dashed border-gray-300">
                        <img
                            src={value}
                            alt="Preview"
                            className="h-32 object-contain"
                            onError={(e) => (e.currentTarget.style.display = 'none')}
                        />
                    </div>
                )}

                {activeTab === 'url' && (
                    <div>
                        <input
                            type="text"
                            value={urlInput}
                            onChange={handleUrlChange}
                            placeholder="Cole a URL da imagem aqui..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                    </div>
                )}

                {activeTab === 'upload' && (
                    <div className="text-center">
                        <label className="block w-full cursor-pointer bg-indigo-50 border-2 border-dashed border-indigo-300 rounded-lg p-6 hover:bg-indigo-100 transition-colors">
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileUpload}
                                disabled={isUploading}
                            />
                            {isUploading ? (
                                <div className="animate-pulse flex flex-col items-center text-indigo-600">
                                    <Upload size={24} className="mb-2" />
                                    <span>Enviando...</span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center text-indigo-600">
                                    <Upload size={24} className="mb-2" />
                                    <span className="font-medium">Clique para fazer upload</span>
                                    <span className="text-xs text-indigo-400 mt-1">PNG, JPG, JPEG, WEBP (Max 5MB)</span>
                                </div>
                            )}
                        </label>
                    </div>
                )}

                {activeTab === 'gallery' && (
                    <div className="max-h-60 overflow-y-auto pr-1">
                        {isLoadingGallery ? (
                            <p className="text-center text-gray-500 py-4">Carregando...</p>
                        ) : galleryImages.length === 0 ? (
                            <p className="text-center text-gray-500 py-4">Nenhuma imagem na galeria.</p>
                        ) : (
                            <div className="grid grid-cols-3 gap-2">
                                {galleryImages.map((img) => (
                                    <div
                                        key={img.filename}
                                        className={`group relative aspect-square border rounded-lg overflow-hidden cursor-pointer hover:border-indigo-500 transition-all ${value === img.url ? 'ring-2 ring-indigo-500 border-transparent' : 'border-gray-200'}`}
                                        onClick={() => handleSelectFromGallery(img.url)}
                                    >
                                        <img
                                            src={img.url}
                                            alt={img.filename}
                                            className="w-full h-full object-cover"
                                        />
                                        {/* Overlay Actions */}
                                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 gap-2">
                                            {value === img.url && (
                                                <div className="absolute top-1 right-1 bg-indigo-600 text-white rounded-full p-0.5">
                                                    <Check size={12} />
                                                </div>
                                            )}
                                            <button
                                                onClick={(e) => handleDeleteFromGallery(img.filename, e)}
                                                className="p-1.5 bg-white text-red-600 rounded-full hover:bg-red-50"
                                                title="Excluir"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
