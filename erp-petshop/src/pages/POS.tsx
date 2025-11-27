import { useState, useEffect } from 'react';
import type { Product, CartItem, PaymentMethod } from '../types/index';
// import { mockProducts } from '../data/mockProducts'; // Não usar mais mock
import ProductSearch from '../components/ProductSearch';
import Cart from '../components/Cart';
import PaymentModal from '../components/PaymentModal';

const API_URL = 'http://localhost:3001/api';

interface POSProps {
  onExit?: () => void;
}

export default function POS({ onExit }: POSProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [loading, setLoading] = useState(true);


  // Buscar produtos da API
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/products`);

      if (!response.ok) {
        throw new Error('Erro ao buscar produtos');
      }

      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('❌ Erro ao carregar produtos:', error);
      alert('Erro ao carregar produtos. Verifique se o backend está rodando.');
    } finally {
      setLoading(false);
    }
  };

  // Buscar produtos ao carregar
  useEffect(() => {
    fetchProducts();
  }, []);

  // Calcular totais do carrinho
  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const totalDiscount = cart.reduce((sum, item) => sum + item.discount, 0);
  const total = subtotal - totalDiscount;

  // Adicionar produto ao carrinho
  const addToCart = (product: Product, quantity: number = 1) => {
    const existingItem = cart.find((item) => item.id === product.id);

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.id === product.id
            ? {
              ...item,
              quantity: item.quantity + quantity,
              subtotal: (item.quantity + quantity) * item.price,
            }
            : item
        )
      );
    } else {
      const newItem: CartItem = {
        ...product,
        quantity,
        discount: 0,
        subtotal: product.price * quantity,
      };
      setCart([...cart, newItem]);
    }
  };

  // Remover produto do carrinho
  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.id !== productId));
  };

  // Atualizar quantidade
  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(
      cart.map((item) =>
        item.id === productId
          ? {
            ...item,
            quantity,
            subtotal: quantity * item.price,
          }
          : item
      )
    );
  };

  // Aplicar desconto
  const applyDiscount = (productId: string, discount: number) => {
    setCart(
      cart.map((item) =>
        item.id === productId
          ? {
            ...item,
            discount,
          }
          : item
      )
    );
  };

  // Finalizar venda
  const completeSale = async (paymentMethod: PaymentMethod) => {
    try {
      // Preparar dados da venda para enviar ao backend
      const saleData = {
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
          discount: item.discount || 0
        })),
        payment_method: paymentMethod,
        discount_amount: totalDiscount,
        notes: null
      };

      // Enviar venda ao backend
      const response = await fetch(`${API_URL}/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao finalizar venda');
      }

      const result = await response.json();

      // Mostrar confirmação
      alert(`✅ Venda #${result.sale.sale_number} concluída!\n\nTotal: R$ ${total.toFixed(2)}\nPagamento: ${paymentMethod.toUpperCase()}\n\nObrigado pela preferência!`);

      // Limpar carrinho e fechar modal
      setCart([]);
      setShowPayment(false);

      // Recarregar produtos (estoque foi atualizado)
      fetchProducts();
    } catch (error: any) {
      console.error('❌ Erro ao finalizar venda:', error);
      alert(`Erro ao finalizar venda: ${error.message}`);
    }
  };

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // F2 - Foco na busca
      if (e.key === 'F2') {
        e.preventDefault();
        document.getElementById('product-search')?.focus();
      }
      // F4 - Finalizar venda
      if (e.key === 'F4' && cart.length > 0) {
        e.preventDefault();
        setShowPayment(true);
      }
      // ESC - Cancelar
      if (e.key === 'Escape') {
        setShowPayment(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [cart.length]);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #f9fafb, #e5e7eb)' }}>
      {/* Loading State */}
      {loading && (
        <div style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          zIndex: 9999
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '3rem',
              marginBottom: '1rem',
              animation: 'spin 2s linear infinite'
            }}>
              🐾
            </div>
            <p style={{ fontSize: '1.25rem', color: '#0284c7', fontWeight: '600' }}>
              Carregando produtos...
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <header style={{
        backgroundColor: 'white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '1rem 1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{
              fontSize: '1.875rem',
              fontWeight: 'bold',
              color: '#0284c7'
            }}>
              🐾 ERP Pet Shop
            </h1>
            <p style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              marginTop: '0.25rem'
            }}>
              Ponto de Venda - Terminal 01
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {onExit && (
              <button
                onClick={onExit}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#6366f1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4f46e5'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#6366f1'}
              >
                ← Voltar ao Menu
              </button>
            )}
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Operador</p>
              <p style={{ fontWeight: '600' }}>Admin</p>
            </div>
            <div style={{
              width: '2.5rem',
              height: '2.5rem',
              backgroundColor: '#0ea5e9',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold'
            }}>
              A
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        maxWidth: '1440px',
        margin: '0 auto',
        padding: '1.5rem 1rem'
      }}>
        {/* Search Bar (Topo) */}
        <div style={{ marginBottom: '1.5rem' }}>
          <ProductSearch
            products={products}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onAddToCart={addToCart}
          />
        </div>

        {/* Grid 2 Colunas: Produtos | Carrinho */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 400px',
          gap: '1.5rem',
          alignItems: 'start'
        }}>
          {/* Coluna Esquerda: Grid de Produtos */}
          <div>
            <ProductSearch
              products={products}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onAddToCart={addToCart}
              showOnlyProducts={true}
            />
          </div>

          {/* Coluna Direita: Carrinho */}
          <div>
            <Cart
              items={cart}
              subtotal={subtotal}
              discount={totalDiscount}
              total={total}
              onRemoveItem={removeFromCart}
              onUpdateQuantity={updateQuantity}
              onApplyDiscount={applyDiscount}
              onCheckout={() => setShowPayment(true)}
            />
          </div>
        </div>
      </main>

      {/* Payment Modal */}
      {showPayment && (
        <PaymentModal
          total={total}
          onClose={() => setShowPayment(false)}
          onComplete={completeSale}
        />
      )}

      {/* Keyboard Shortcuts Help */}
      <div style={{
        position: 'fixed',
        bottom: '1rem',
        right: '1rem',
        backgroundColor: '#1f2937',
        color: 'white',
        padding: '0.5rem 1rem',
        borderRadius: '0.5rem',
        fontSize: '0.75rem',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Atalhos:</p>
        <p>F2 - Buscar | F4 - Finalizar | ESC - Cancelar</p>
      </div>
    </div>
  );
}


