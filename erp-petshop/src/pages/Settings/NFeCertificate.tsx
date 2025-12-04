import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload } from 'lucide-react';

export default function NFeCertificate() {
    const navigate = useNavigate();
    const [file, setFile] = useState<File | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <button
                    onClick={() => navigate('/admin/settings/invoices/nfe')}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                >
                    <ArrowLeft size={20} />
                    Voltar
                </button>
            </div>

            <h1 className="text-2xl font-bold text-gray-800 mb-2">
                Anexe o certificado A1 para verificar a identidade da sua empresa
            </h1>
            <p className="text-gray-600 mb-6">
                Você deve anexar o Certificado Digital CNPJ A1 ou o Certificado Digital A1. Os certificados são documentos eletrônicos com validade jurídica que garantem a autenticidade das informações contidas nas notas fiscais.
            </p>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                <h3 className="font-semibold text-gray-700 mb-4">Certificado Digital</h3>

                <div className="border-2 border-dashed border-blue-300 rounded-xl p-10 text-center hover:bg-blue-50 transition-colors relative">
                    <input
                        type="file"
                        accept=".pfx,.p12"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center gap-3">
                        <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                            <Upload size={32} />
                        </div>
                        <div>
                            <p className="text-blue-600 font-medium text-lg">
                                {file ? file.name : 'Selecionar ou arrastar o arquivo para cá'}
                            </p>
                            <p className="text-gray-400 text-sm">Formatos permitidos: .pfx, .p12</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
