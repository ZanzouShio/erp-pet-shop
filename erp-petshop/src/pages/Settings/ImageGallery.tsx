import React, { useState, useEffect } from 'react';
import { Trash2, Copy, Search, Image as ImageIcon, Upload } from 'lucide-react';
import { API_URL, authFetch } from '../../services/api';
import { useToast } from '../../components/Toast';

interface UploadedFile {
    filename: string;
    url: string;
    size: number;
    createdAt: string;
}

export default function ImageGallery() {
    const [images, setImages] = useState<UploadedFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const toast = useToast();

    useEffect(() => {
        loadImages();
    }, []);

    const loadImages = async () => {
        try {
            setLoading(true);
            const response = await authFetch(`${API_URL}/uploads`);
            if (response.ok) {
                const data = await response.json();
                setImages(data);
            } else {
                toast.error('Erro ao carregar imagens');
            }
        } catch (error) {
            console.error('Erro ao buscar imagens:', error);
            toast.error('Erro de conexão ao buscar imagens');
        } finally {
            setLoading(false);
        }
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

            await response.json();
            toast.success('Imagem enviada com sucesso!');
            loadImages(); // Reload gallery
        } catch (error: any) {
            toast.error(error.message || 'Erro ao enviar imagem');
        } finally {
            setIsUploading(false);
            e.target.value = ''; // Reset input
        }
    };

    const handleDelete = async (filename: string) => {
        if (!confirm('Tem certeza que deseja excluir esta imagem? Se ela estiver sendo usada em algum produto, o link quebrará.')) return;

        try {
            const response = await authFetch(`${API_URL}/uploads/${filename}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setImages(prev => prev.filter(img => img.filename !== filename));
                toast.success('Imagem excluída');
            } else {
                toast.error('Erro ao excluir imagem');
            }
        } catch (error) {
            toast.error('Erro ao excluir imagem');
        }
    };

    const handleCopyUrl = (url: string) => {
        navigator.clipboard.writeText(url);
        toast.success('URL copiada para a área de transferência');
    };

    const filteredImages = images.filter(img =>
        img.filename.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Galeria de Imagens</h1>
                    <p className="text-gray-500">Gerencie as imagens enviadas para o sistema</p>
                </div>
                <div>
                    <label className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer">
                        {isUploading ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div> : <Upload size={20} />}
                        <span>Upload Nova Imagem</span>
                        <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileUpload}
                            disabled={isUploading}
                        />
                    </label>
                </div>
            </div>

            <div className="mb-6 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    placeholder="Buscar imagem por nome..."
                    className="pl-10 w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            ) : filteredImages.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <ImageIcon size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">Nenhuma imagem encontrada</h3>
                    <p className="text-gray-500 mt-1">
                        {searchTerm ? 'Tente buscar com outro termo' : 'Faça upload da primeira imagem para começar'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {filteredImages.map((img) => (
                        <div key={img.filename} className="group bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                            <div className="aspect-square relative bg-gray-100 overflow-hidden">
                                <img
                                    src={img.url}
                                    alt={img.filename}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    onError={(e) => {
                                        // Simple gray placeholder with X icon SVG as data URI
                                        e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNjY2MiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cmVjdCB4PSIzIiB5PSIzIiB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHJ4PSIyIiByeT0iMiIvPjxjaXJjbGUgY3g9IjguNSIgY3k9IjguNSIgcj0iMS41Ii8+PHBvbHlsaW5lIHBvaW50cz0iMjEgMTUgMTYgMTAgNSAyMSIvPjwvc3ZnPg==';
                                        e.currentTarget.style.padding = '20px';
                                        e.currentTarget.style.backgroundColor = '#f3f4f6';
                                    }}
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 gap-3">
                                    <button
                                        onClick={() => handleCopyUrl(img.url)}
                                        className="p-2 bg-white text-gray-700 rounded-full hover:bg-gray-100 shadow-sm"
                                        title="Copiar URL"
                                    >
                                        <Copy size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(img.filename)}
                                        className="p-2 bg-white text-red-600 rounded-full hover:bg-red-50 shadow-sm"
                                        title="Excluir"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                            <div className="p-3">
                                <p className="text-sm font-medium text-gray-900 truncate" title={img.filename}>
                                    {img.filename.substring(img.filename.indexOf('-') + 1)}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {(img.size / 1024).toFixed(1)} KB
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
