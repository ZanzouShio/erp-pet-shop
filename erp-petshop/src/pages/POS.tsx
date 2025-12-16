import { useState, useEffect, useCallback } from 'react';
import { User, AlertTriangle } from 'lucide-react';
import type { Product, CartItem, PaymentMethod } from '../types/index';
// import { mockProducts } from '../data/mockProducts'; // Não usar mais mock
import ProductSearch from '../components/ProductSearch';
import CustomerSearch from '../components/CustomerSearch';
import QuickCustomerModal from '../components/QuickCustomerModal';
import Cart from '../components/Cart';
import PaymentModal from '../components/PaymentModal';
import SaleSuccessModal from '../components/SaleSuccessModal';
import CustomerLastSales from '../components/CustomerLastSales';

// Cash Operations
import useCashRegister from '../hooks/useCashRegister';
import CashOperationsMenu from '../components/CashOperationsMenu';
import CashOpenModal from '../components/CashOpenModal';
import CashCloseModal from '../components/CashCloseModal';
import SangriaModal from '../components/SangriaModal';
import SuprimentoModal from '../components/SuprimentoModal';
import CashReportModal from '../components/CashReportModal';

import { API_URL } from '../services/api';
import { useHardware } from '../hooks/useHardware';
import HardwareStatusIndicator from '../components/HardwareStatusIndicator';
import { useAuth } from '../contexts/AuthContext';

interface POSProps {
  onExit?: () => void;
}

export default function POS({ onExit }: POSProps) {
  // Auth
  const { user } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cartDiscount, setCartDiscount] = useState(0); // Desconto geral do carrinho
  const [discountReason, setDiscountReason] = useState(''); // Motivo do desconto

  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showQuickCustomerModal, setShowQuickCustomerModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastSale, setLastSale] = useState<{
    saleNumber: string;
    total: number;
    paymentMethod: string;
    change: number;
    items: any[];
    installments?: number;
  } | null>(null);

  // Cash Register State
  const TERMINAL_ID = 'terminal-01'; // ID do terminal (pode vir de config futuramente)
  const { state: cashState, checkStatus, openCash, closeCash, sangria, suprimento, getReport } = useCashRegister();
  const [showCashOpenModal, setShowCashOpenModal] = useState(false);
  const [showCashCloseModal, setShowCashCloseModal] = useState(false);
  const [showSangriaModal, setShowSangriaModal] = useState(false);
  const [showSuprimentoModal, setShowSuprimentoModal] = useState(false);
  const [cashLoading, setCashLoading] = useState(false);
  const [cashReport, setCashReport] = useState<any>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [closingSummary, setClosingSummary] = useState<any>(null);

  // Cash operation success modal
  const [cashSuccessModal, setCashSuccessModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    details?: { label: string; value: string }[];
    type: 'success' | 'info';
    showPrint?: boolean;
    printData?: {
      operatorName: string;
      terminalName: string;
      openedAt: string;
      closedAt: string;
      openingBalance: number;
      closingBalance: number;
      expectedBalance: number;
      difference: number;
      totalSales: number;
      totalSangrias: number;
      totalSuprimentos: number;
    };
  }>({ show: false, title: '', message: '', type: 'success' });

  // Hardware Service Integration
  const { status: hardwareStatus, lastBarcode, lastWeight, openDrawer, printReceipt, printerConnected } = useHardware();

  // Handle barcode from hardware scanner
  const handleBarcodeScanned = useCallback(async (barcode: string) => {
    console.log('📦 Barcode scanned:', barcode);

    // Search for product by barcode/EAN
    try {
      const response = await fetch(`${API_URL}/products?search=${encodeURIComponent(barcode)}`);
      if (response.ok) {
        const data = await response.json();
        const productsFound = data.data || data;

        // Find exact match by barcode or ean
        const product = productsFound.find((p: Product) =>
          p.barcode === barcode || p.ean === barcode
        );

        if (product) {
          addToCart(product, 1);
        } else {
          console.log('Product not found for barcode:', barcode);
        }
      }
    } catch (error) {
      console.error('Error searching product by barcode:', error);
    }
  }, []);

  // React to barcode scans
  useEffect(() => {
    if (lastBarcode) {
      handleBarcodeScanned(lastBarcode);
    }
  }, [lastBarcode, handleBarcodeScanned]);

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

  // Verificar status do caixa ao carregar
  useEffect(() => {
    checkStatus(TERMINAL_ID);
  }, [checkStatus]);

  // Handlers para operações de caixa
  const handleOpenCash = async (openingBalance: number, notes?: string) => {
    setCashLoading(true);
    const success = await openCash(TERMINAL_ID, openingBalance, notes);
    setCashLoading(false);
    if (success) {
      setShowCashOpenModal(false);
    }
  };

  const handleCloseCash = async (closingBalance: number, notes?: string) => {
    setCashLoading(true);
    const result = await closeCash(closingBalance, notes);
    setCashLoading(false);
    if (result.success) {
      setShowCashCloseModal(false);
      setCashSuccessModal({
        show: true,
        title: '✓ Caixa Fechado com Sucesso!',
        message: 'O fechamento do caixa foi realizado corretamente.',
        details: [
          { label: 'Diferença', value: `R$ ${result.summary?.difference?.toFixed(2) || '0.00'}` },
          { label: 'Saldo Esperado', value: `R$ ${result.summary?.expectedBalance?.toFixed(2) || '0.00'}` },
          { label: 'Saldo Contado', value: `R$ ${result.summary?.closingBalance?.toFixed(2) || '0.00'}` },
        ],
        type: 'success',
        showPrint: true,
        printData: {
          operatorName: closingSummary?.register?.operatorName || cashState.register?.operatorName || 'Operador',
          terminalName: closingSummary?.register?.terminalName || cashState.register?.terminalName || 'Terminal',
          openedAt: closingSummary?.register?.openedAt || cashState.register?.openedAt || new Date().toISOString(),
          closedAt: new Date().toISOString(),
          openingBalance: closingSummary?.summary?.opening || parseFloat(String(cashState.register?.openingBalance || '0')),
          closingBalance: result.summary?.closingBalance || closingBalance,
          expectedBalance: result.summary?.expectedBalance || closingSummary?.summary?.expected || 0,
          difference: result.summary?.difference || 0,
          totalSales: closingSummary?.summary?.sales?.cash || 0,
          totalSangrias: closingSummary?.summary?.sangrias || 0,
          totalSuprimentos: closingSummary?.summary?.suprimentos || 0,
        }
      });
    }
  };

  const handleSangria = async (amount: number, reason: string) => {
    setCashLoading(true);
    const success = await sangria(amount, reason);
    setCashLoading(false);
    if (success) {
      setShowSangriaModal(false);
      setCashSuccessModal({
        show: true,
        title: '✓ Sangria Realizada',
        message: `Retirada de R$ ${amount.toFixed(2)} registrada com sucesso.`,
        type: 'success'
      });
    }
  };

  const handleSuprimento = async (amount: number, reason?: string) => {
    setCashLoading(true);
    const success = await suprimento(amount, reason);
    setCashLoading(false);
    if (success) {
      setShowSuprimentoModal(false);
      setCashSuccessModal({
        show: true,
        title: '✓ Suprimento Realizado',
        message: `Entrada de R$ ${amount.toFixed(2)} registrada com sucesso.`,
        type: 'success'
      });
    }
  };

  const handlePreCloseCash = async () => {
    try {
      setCashLoading(true);
      const report = await getReport();
      setClosingSummary(report);
      setShowCashCloseModal(true);
    } catch (error) {
      console.error('Error fetching report for close:', error);
      alert('Erro ao preparar fechamento de caixa');
    } finally {
      setCashLoading(false);
    }
  };

  const handleViewReport = async () => {
    try {
      setCashLoading(true);
      const report = await getReport();
      setCashReport(report);
      setShowReportModal(true);
    } catch (error) {
      alert('Erro ao obter relatório');
    } finally {
      setCashLoading(false);
    }
  };

  // Calcular totais do carrinho
  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const itemDiscount = cart.reduce((sum, item) => sum + item.discount, 0);
  const totalDiscount = itemDiscount + cartDiscount; // Soma desconto por item + desconto geral
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
  const completeSale = async (paymentMethod: PaymentMethod, details?: any) => {
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
        discount_reason: discountReason || null,
        customer_id: selectedCustomer?.id,
        cash_register_id: cashState.register?.id || null,
        notes: null,
        ...details // Incluir paymentConfigId, installments, feePercent, useWalletBalance
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
      setLastSale({
        saleNumber: result.sale.sale_number,
        total: total,
        paymentMethod: paymentMethod,
        change: details?.change || 0,
        items: [...cart],
        installments: details?.installments
      });
      setShowSuccessModal(true);
      // alert(`✅ Venda #${result.sale.sale_number} concluída!\n\nTotal: R$ ${total.toFixed(2)}\nPagamento: ${paymentMethod.toUpperCase()}\n\nObrigado pela preferência!`);

      // Limpar carrinho e fechar modal
      setCart([]);
      setCartDiscount(0); // Resetar desconto
      setDiscountReason(''); // Resetar motivo
      setShowPayment(false);
      setSelectedCustomer(null); // Resetar cliente após venda

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
      // F2 - Foco na busca de produtos
      if (e.key === 'F2') {
        e.preventDefault();
        document.getElementById('product-search')?.focus();
      }

      // F8 - Foco na busca de clientes
      if (e.key === 'F8') {
        e.preventDefault();
        document.getElementById('customer-search')?.focus();
      }

      // F4 or F9 - Finalizar venda
      if ((e.key === 'F4' || e.key === 'F9') && cart.length > 0) {
        e.preventDefault();
        setShowPayment(true);
      }

      // ESC - Cancelar
      if (e.key === 'Escape') {
        e.preventDefault();
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
            {/* Cash Operations Menu */}
            <CashOperationsMenu
              terminalId={TERMINAL_ID}
              onOpenCash={() => setShowCashOpenModal(true)}
              onCloseCash={handlePreCloseCash}
              onSangria={() => setShowSangriaModal(true)}
              onSuprimento={() => setShowSuprimentoModal(true)}
              onViewReport={handleViewReport}
              isOpen={cashState.isOpen}
              currentBalance={Number(cashState.register?.currentBalance) || 0}
              operatorName={cashState.register?.operatorName}
            />

            {/* Hardware Status Indicator */}
            <HardwareStatusIndicator
              connected={hardwareStatus.connected}
              devices={hardwareStatus.devices}
            />
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
              <p style={{ fontWeight: '600' }}>{user?.name || 'Não identificado'}</p>
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
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
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
            onBarcodeSubmit={async (barcode) => {
              // Find product by exact barcode or EAN
              const product = products.find(p =>
                p.barcode === barcode || p.ean === barcode
              );

              if (product) {
                addToCart(product);
                setSearchTerm('');
              } else {
                alert(`Produto não encontrado para código: ${barcode}`);
              }
            }}
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
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <User size={20} className="text-blue-600" />
                  Cliente
                </h2>
                <button
                  onClick={() => setShowQuickCustomerModal(true)}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline flex items-center gap-1"
                >
                  <span>+</span> Novo
                </button>
              </div>
              <CustomerSearch
                onSelectCustomer={setSelectedCustomer}
                selectedCustomer={selectedCustomer}
              />
            </div>

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
              cartDiscount={cartDiscount}
              onCartDiscountChange={(value, reason) => {
                setCartDiscount(value);
                setDiscountReason(reason);
              }}
            />
            {selectedCustomer && (
              <div className="mt-4">
                <CustomerLastSales customerId={selectedCustomer.id} />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Payment Modal */}
      {showPayment && (
        <PaymentModal
          total={total}
          customer={selectedCustomer}
          onClose={() => setShowPayment(false)}
          onComplete={completeSale}
        />
      )}

      {/* Success Modal */}
      {showQuickCustomerModal && (
        <QuickCustomerModal
          onClose={() => setShowQuickCustomerModal(false)}
          onSuccess={(customer) => {
            setSelectedCustomer(customer);
            setShowQuickCustomerModal(false);
          }}
        />
      )}

      {showSuccessModal && lastSale && (
        <SaleSuccessModal
          saleNumber={lastSale.saleNumber}
          total={lastSale.total}
          paymentMethod={lastSale.paymentMethod}
          change={lastSale.change}
          items={lastSale.items}
          installments={lastSale.installments}
          onClose={() => setShowSuccessModal(false)}
          printerConnected={printerConnected}
          printReceipt={printReceipt}
          operator={user?.name}
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
        <p>F2 - Buscar Prod. | F8 - Buscar Cliente | F4/F9 - Finalizar | ESC - Cancelar</p>
      </div>

      {/* Cash Open Modal */}
      <CashOpenModal
        isOpen={showCashOpenModal}
        onClose={() => setShowCashOpenModal(false)}
        onConfirm={handleOpenCash}
        isLoading={cashLoading}
      />

      {/* Cash Close Modal */}
      <CashCloseModal
        isOpen={showCashCloseModal}
        onClose={() => setShowCashCloseModal(false)}
        onConfirm={handleCloseCash}
        expectedBalance={closingSummary?.summary?.expected || parseFloat(String(cashState.register?.currentBalance ?? 0))}
        openingBalance={closingSummary?.summary?.opening || parseFloat(cashState.register?.openingBalance?.toString() || '0')}
        totalSales={closingSummary?.summary?.sales?.cash || 0}
        totalDebit={closingSummary?.summary?.sales?.debit_card || 0}
        totalCredit={closingSummary?.summary?.sales?.credit_card || 0}
        totalPix={closingSummary?.summary?.sales?.pix || 0}
        totalSangrias={closingSummary?.summary?.sangrias || 0}
        totalSuprimentos={closingSummary?.summary?.suprimentos || 0}
        operatorName={closingSummary?.register?.operatorName || cashState.register?.operatorName || 'Operador'}
        terminalName={closingSummary?.register?.terminalName || TERMINAL_ID}
        openedAt={closingSummary?.register?.openedAt || cashState.register?.openedAt}
        isLoading={cashLoading}
      />

      {/* Sangria Modal */}
      <SangriaModal
        isOpen={showSangriaModal}
        onClose={() => setShowSangriaModal(false)}
        onConfirm={handleSangria}
        currentBalance={parseFloat(String(cashState.register?.currentBalance ?? 0))}
        isLoading={cashLoading}
      />

      {/* Suprimento Modal */}
      <SuprimentoModal
        isOpen={showSuprimentoModal}
        onClose={() => setShowSuprimentoModal(false)}
        onConfirm={handleSuprimento}
        currentBalance={parseFloat(String(cashState.register?.currentBalance ?? 0))}
        isLoading={cashLoading}
      />

      {/* Cash Report Modal */}
      <CashReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        report={cashReport}
      />

      {/* Cash Closed Alert Overlay */}
      {!cashState.isOpen && !cashState.loading && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 40
        }}>
          <div style={{
            backgroundColor: '#1e293b',
            padding: '2rem',
            borderRadius: '1rem',
            textAlign: 'center',
            maxWidth: '400px',
            border: '1px solid #334155'
          }}>
            <AlertTriangle style={{ width: '4rem', height: '4rem', color: '#f59e0b', marginBottom: '1rem', margin: '0 auto 1rem auto' }} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>
              Caixa Fechado
            </h2>
            <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>
              É necessário abrir o caixa antes de realizar vendas.
            </p>
            <button
              onClick={() => setShowCashOpenModal(true)}
              style={{
                padding: '0.75rem 2rem',
                background: 'linear-gradient(to right, #16a34a, #22c55e)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Abrir Caixa
            </button>
          </div>
        </div>
      )}

      {/* Cash Operation Success Modal */}
      {cashSuccessModal.show && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '1rem',
            textAlign: 'center',
            maxWidth: '420px',
            width: '90%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            {/* Success Icon */}
            <div style={{
              width: '4rem',
              height: '4rem',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto'
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>

            {/* Title */}
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '0.5rem'
            }}>
              {cashSuccessModal.title}
            </h2>

            {/* Message */}
            <p style={{
              color: '#6b7280',
              marginBottom: '1.5rem',
              fontSize: '0.95rem'
            }}>
              {cashSuccessModal.message}
            </p>

            {/* Details */}
            {cashSuccessModal.details && cashSuccessModal.details.length > 0 && (
              <div style={{
                backgroundColor: '#f9fafb',
                borderRadius: '0.75rem',
                padding: '1rem',
                marginBottom: '1.5rem'
              }}>
                {cashSuccessModal.details.map((detail, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0',
                    borderBottom: idx < cashSuccessModal.details!.length - 1 ? '1px solid #e5e7eb' : 'none'
                  }}>
                    <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>{detail.label}</span>
                    <span style={{
                      fontWeight: '600',
                      color: detail.label === 'Diferença' && detail.value !== 'R$ 0.00' ? '#ef4444' : '#1f2937',
                      fontSize: '0.875rem'
                    }}>{detail.value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              {/* Print Button - only for cash close */}
              {cashSuccessModal.showPrint && cashSuccessModal.printData && (
                <button
                  onClick={() => {
                    const data = cashSuccessModal.printData!;
                    const formatCurrency = (v: number) => `R$ ${v.toFixed(2)}`;
                    const formatDate = (d: string) => new Date(d).toLocaleString('pt-BR');

                    const receiptHTML = `
                      <!DOCTYPE html>
                      <html>
                      <head>
                        <meta charset="utf-8">
                        <title>Fechamento de Caixa</title>
                        <style>
                          @page { size: 80mm auto; margin: 0; }
                          body { 
                            font-family: 'Courier New', monospace; 
                            width: 80mm; 
                            padding: 5mm;
                            margin: 0 auto;
                            font-size: 12px;
                          }
                          .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 8px; margin-bottom: 8px; }
                          .title { font-weight: bold; font-size: 14px; }
                          .row { display: flex; justify-content: space-between; margin: 4px 0; }
                          .separator { border-top: 1px dashed #000; margin: 8px 0; }
                          .total { font-weight: bold; font-size: 13px; }
                          .center { text-align: center; }
                          .difference { color: ${data.difference !== 0 ? '#c00' : '#000'}; }
                        </style>
                      </head>
                      <body>
                        <div class="header">
                          <div class="title">FECHAMENTO DE CAIXA</div>
                          <div>${data.terminalName}</div>
                        </div>
                        <div class="row"><span>Operador:</span><span>${data.operatorName}</span></div>
                        <div class="row"><span>Abertura:</span><span>${formatDate(data.openedAt)}</span></div>
                        <div class="row"><span>Fechamento:</span><span>${formatDate(data.closedAt)}</span></div>
                        <div class="separator"></div>
                        <div class="row"><span>Saldo Inicial:</span><span>${formatCurrency(data.openingBalance)}</span></div>
                        <div class="row"><span>Vendas Dinheiro:</span><span>${formatCurrency(data.totalSales)}</span></div>
                        <div class="row"><span>Suprimentos:</span><span>+ ${formatCurrency(data.totalSuprimentos)}</span></div>
                        <div class="row"><span>Sangrias:</span><span>- ${formatCurrency(data.totalSangrias)}</span></div>
                        <div class="separator"></div>
                        <div class="row total"><span>Saldo Esperado:</span><span>${formatCurrency(data.expectedBalance)}</span></div>
                        <div class="row total"><span>Saldo Contado:</span><span>${formatCurrency(data.closingBalance)}</span></div>
                        <div class="row total difference"><span>DIFERENÇA:</span><span>${formatCurrency(data.difference)}</span></div>
                        <div class="separator"></div>
                        <div class="center" style="margin-top: 10px; font-size: 10px;">
                          ${new Date().toLocaleString('pt-BR')}
                        </div>
                      </body>
                      </html>
                    `;

                    const printWindow = window.open('', '_blank', 'width=350,height=600');
                    if (printWindow) {
                      printWindow.document.write(receiptHTML);
                      printWindow.document.close();
                      setTimeout(() => {
                        printWindow.print();
                      }, 250);
                    }
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'white',
                    color: '#374151',
                    border: '2px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.1s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = '#6366f1';
                    e.currentTarget.style.color = '#6366f1';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.color = '#374151';
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 6 2 18 2 18 9"></polyline>
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                    <rect x="6" y="14" width="12" height="8"></rect>
                  </svg>
                  Imprimir
                </button>
              )}

              {/* OK Button */}
              <button
                onClick={() => setCashSuccessModal({ ...cashSuccessModal, show: false })}
                style={{
                  padding: '0.75rem 2.5rem',
                  background: 'linear-gradient(to right, #6366f1, #8b5cf6)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  transition: 'transform 0.1s, box-shadow 0.1s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 10px 25px rgba(99, 102, 241, 0.3)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


