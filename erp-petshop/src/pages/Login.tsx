
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await api.post('/auth/login', { email, password });
            const { token, user } = response.data;

            login(token, user);
            navigate('/admin/dashboard');
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.error || 'Erro ao fazer login');
        } finally {
            setLoading(false);
        }
    };

    // Helper para dev
    const setDevCredentials = () => {
        setEmail('pay_1765117827944@test.com'); // Pegar um válido do banco seria melhor, mas o usuário pode editar
        // Ou melhor: Admin Padrão se tiver, mas os seeds geram aleatórios.
        // Vamos deixar vazio mas colocar um botão "Preencher Mock" se conseguíssemos saber.
        // Como não sabemos o email exato sem olhar o banco (que é aleatório),
        // vamos deixar o usuário copiar do console do backend ou instruir.
        // Mas espere, eu vi o email no `check_users.js` output: 'pay_1765117827944@test.com'
        setEmail('pay_1765117827944@test.com');
        setPassword('AutoPass123!');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">ERP Pet Shop</h2>
                <h3 className="text-lg font-semibold mb-4 text-center">Login</h3>

                {error && (
                    <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 block w-full p-2 border rounded border-gray-300"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Senha</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 block w-full p-2 border rounded border-gray-300"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
                    >
                        {loading ? 'Entrando...' : 'Entrar'}
                    </button>
                </form>

                <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-gray-500 mb-2 text-center">Ambiente de Teste</p>
                    <button
                        type="button"
                        onClick={setDevCredentials}
                        className="w-full bg-gray-200 text-gray-700 py-1 rounded text-sm hover:bg-gray-300"
                    >
                        Preencher Credenciais (Dev)
                    </button>
                </div>
            </div>
        </div>
    );
}
