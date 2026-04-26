import { useState, useEffect } from 'react';
import { Calculator, Package, History, LogOut, Download, Link, ExternalLink, CheckCircle, AlertCircle, Trash2, Edit2, Copy, TrendingUp, DollarSign, Percent, Target, AlertTriangle } from 'lucide-react';
import { calculatePricing, formatCurrency, formatPercentage } from '../utils/calculations.js';
import { saveProducts, getProducts, saveCalculationToHistory, getHistory, clearHistory, exportToCSV } from '../utils/storage.js';
import { parseAnnouncementUrl, getMarketplaceFromUrl } from '../utils/urlParser.js';
import { MARKETPLACE_PRESETS, AD_TYPES, CATEGORIES, ANNOUNCEMENT_TYPES, AD_PERCENTAGES } from '../data/marketplaceData.js';

const TABS = [
  { id: 'calculator', name: 'Calculadora', icon: Calculator },
  { id: 'products', name: 'Produtos', icon: Package },
  { id: 'history', name: 'Histórico', icon: History },
];

export default function Dashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('calculator');
  const [products, setProducts] = useState([]);
  const [history, setHistory] = useState([]);
  const [filterMarketplace, setFilterMarketplace] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [announcementUrl, setAnnouncementUrl] = useState('');
  const [urlStatus, setUrlStatus] = useState({ type: null, message: '' });
  const [formData, setFormData] = useState(getInitialFormData());

  useEffect(() => {
    setProducts(getProducts());
    setHistory(getHistory());
  }, []);

  function getInitialFormData() {
    return {
      name: '',
      sku: '',
      marketplace: 'shopee',
      announcementType: 'standard',
      category: 'Outros',
      sellingPrice: '',
      productCost: '',
      packaging: '',
      shippingCost: '',
      desiredMargin: '20',
      customCommission: '0',
      customFixedFee: '0',
      customTax: '0',
      customDiscount: '0',
      adType: 'none',
    };
  }

  function parseValue(value) {
    if (value === '' || value === null || value === undefined) return '';
    const parsed = parseFloat(value);
    return isNaN(parsed) ? '' : String(parsed);
  }

  const results = calculatePricing(formData);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleUrlPaste = () => {
    navigator.clipboard.readText().then(text => {
      setAnnouncementUrl(text);
      processUrl(text);
    }).catch(() => {
      setUrlStatus({ type: 'error', message: 'Não foi possível acessar a área de transferência' });
    });
  };

  const processUrl = (url) => {
    if (!url || !url.trim()) {
      setUrlStatus({ type: 'error', message: 'Cole um link válido' });
      return;
    }

    const result = parseAnnouncementUrl(url);

    if (!result) {
      setUrlStatus({ type: 'error', message: 'Link inválido ou não suportado' });
      return;
    }

    if (!result.detected) {
      setUrlStatus({ type: 'warning', message: 'Marketplace não identificado. Selecione manualmente.' });
      setFormData(prev => ({ ...prev, marketplace: 'manual' }));
      return;
    }

    // Atualizar marketplace
    setFormData(prev => ({
      ...prev,
      marketplace: result.marketplace,
    }));

    // Se encontrou preço no URL, aplicar
    if (result.sellingPrice) {
      setFormData(prev => ({
        ...prev,
        sellingPrice: result.sellingPrice,
      }));
    }

    setUrlStatus({
      type: 'success',
      message: `${MARKETPLACE_PRESETS[result.marketplace]?.name || 'Marketplace'} detectado! Marketplace pré-selecionado.`,
    });

    // Limpar mensagem após 3 segundos
    setTimeout(() => setUrlStatus({ type: null, message: '' }), 3000);
  };

  const handleUrlChange = (e) => {
    const value = e.target.value;
    setAnnouncementUrl(value);
    if (value && value.includes('http')) {
      processUrl(value);
    } else {
      setUrlStatus({ type: null, message: '' });
    }
  };

  const handleSaveProduct = () => {
    if (!formData.name.trim()) {
      alert('Nome do produto é obrigatório');
      return;
    }

    const product = {
      ...formData,
      originalUrl: announcementUrl,
      id: editingProduct?.id || Date.now().toString(),
      results,
      commission: results.commission,
      fixedFee: results.fixedFee,
      createdAt: editingProduct?.createdAt || new Date().toISOString(),
    };

    let updatedProducts;
    if (editingProduct) {
      updatedProducts = products.map(p => p.id === product.id ? product : p);
    } else {
      updatedProducts = [product, ...products];
    }

    setProducts(updatedProducts);
    saveProducts(updatedProducts);
    saveCalculationToHistory(product);
    setHistory(getHistory());
    
    setEditingProduct(null);
    setAnnouncementUrl('');
    setUrlStatus({ type: null, message: '' });
    setFormData(getInitialFormData());
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setAnnouncementUrl(product.originalUrl || '');
    setUrlStatus({ type: null, message: '' });
    setFormData({
      name: product.name,
      sku: product.sku || '',
      marketplace: product.marketplace,
      announcementType: product.announcementType || 'standard',
      category: product.category,
      sellingPrice: product.sellingPrice,
      productCost: product.productCost,
      packaging: product.packaging || '',
      shippingCost: product.shippingCost || '',
      desiredMargin: product.desiredMargin || '20',
      customCommission: product.customCommission || '0',
      customFixedFee: product.customFixedFee || '0',
      customTax: product.customTax || '0',
      customDiscount: product.customDiscount || '0',
      adType: product.adType || 'none',
    });
  };

  const handleDuplicateProduct = (product) => {
    const newProduct = {
      ...product,
      id: Date.now().toString(),
      name: `${product.name} (cópia)`,
      createdAt: new Date().toISOString(),
    };
    const updatedProducts = [newProduct, ...products];
    setProducts(updatedProducts);
    saveProducts(updatedProducts);
  };

  const handleDeleteProduct = (productId) => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      const updatedProducts = products.filter(p => p.id !== productId);
      setProducts(updatedProducts);
      saveProducts(updatedProducts);
    }
  };

  const handleClearHistory = () => {
    if (confirm('Tem certeza que deseja limpar todo o histórico?')) {
      clearHistory();
      setHistory([]);
    }
  };

  const handleExportCSV = () => {
    const filteredProducts = filterMarketplace === 'all'
      ? products
      : products.filter(p => p.marketplace === filterMarketplace);
    exportToCSV(filteredProducts);
  };

  const filteredProducts = filterMarketplace === 'all'
    ? products
    : products.filter(p => p.marketplace === filterMarketplace);

  const totalEstimatedProfit = products.reduce((sum, p) => sum + (p.results?.netProfit || 0), 0);

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <Calculator className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Precificação Marketplace</h1>
                <p className="text-xs text-slate-400">Olá, {user.username}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-slate-700"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-slate-800/30 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto py-2">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-emerald-500 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.name}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Calculator Tab */}
        {activeTab === 'calculator' && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Form */}
            <div className="bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-emerald-500" />
                  Dados do Produto
                </h2>
              </div>

              {/* Campo de URL do Anúncio */}
              <div className="mb-6 p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Link do Anúncio (opcional)
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="url"
                      value={announcementUrl}
                      onChange={handleUrlChange}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                      placeholder="Cole o link do anúncio aqui..."
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleUrlPaste}
                    className="px-4 py-2.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/30 transition-all text-sm font-medium"
                  >
                    <span className="hidden sm:inline">Colar</span>
                    <span className="sm:hidden">📋</span>
                  </button>
                </div>
                
                {/* Status Messages */}
                {urlStatus.type === 'success' && (
                  <div className="mt-2 flex items-center gap-2 text-emerald-400 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    {urlStatus.message}
                  </div>
                )}
                {urlStatus.type === 'warning' && (
                  <div className="mt-2 flex items-center gap-2 text-yellow-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {urlStatus.message}
                  </div>
                )}
                {urlStatus.type === 'error' && (
                  <div className="mt-2 flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {urlStatus.message}
                  </div>
                )}

                <p className="mt-2 text-slate-500 text-xs">
                  Suporta: Shopee, Mercado Livre, Amazon, TikTok Shop, Shein
                </p>
              </div>

              <div className="space-y-4">
                {/* Nome e SKU */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Nome do Produto *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Ex: Camiseta Polo"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">SKU</label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => handleInputChange('sku', e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="SKU-001"
                    />
                  </div>
                </div>

                {/* Marketplace e Tipo */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Marketplace</label>
                    <select
                      value={formData.marketplace}
                      onChange={(e) => handleInputChange('marketplace', e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {Object.values(MARKETPLACE_PRESETS).map(mp => (
                        <option key={mp.id} value={mp.id}>{mp.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Tipo de Anúncio</label>
                    <select
                      value={formData.announcementType}
                      onChange={(e) => handleInputChange('announcementType', e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {ANNOUNCEMENT_TYPES.map(type => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Categoria */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Categoria</label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Preços */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Preço de Venda (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.sellingPrice}
                      onChange={(e) => handleInputChange('sellingPrice', e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="99.90"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Custo do Produto (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.productCost}
                      onChange={(e) => handleInputChange('productCost', e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="30.00"
                    />
                  </div>
                </div>

                {/* Custos */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Embalagem (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.packaging}
                      onChange={(e) => handleInputChange('packaging', e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="2.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Frete (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.shippingCost}
                      onChange={(e) => handleInputChange('shippingCost', e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="10.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Margem Desejada (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={formData.desiredMargin}
                      onChange={(e) => handleInputChange('desiredMargin', e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="20"
                    />
                  </div>
                </div>

                {/* Taxas */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Comissão {formData.marketplace !== 'manual' && `(${MARKETPLACE_PRESETS[formData.marketplace]?.commission}%)`}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={formData.marketplace === 'manual' ? formData.customCommission : results.commission}
                      onChange={(e) => handleInputChange('customCommission', e.target.value)}
                      disabled={formData.marketplace !== 'manual'}
                      className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Taxa Fixa {formData.marketplace !== 'manual' && `(${MARKETPLACE_PRESETS[formData.marketplace]?.fixedFee})`}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.marketplace === 'manual' ? formData.customFixedFee : results.fixedFee}
                      onChange={(e) => handleInputChange('customFixedFee', e.target.value)}
                      disabled={formData.marketplace !== 'manual'}
                      className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Imposto (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={formData.customTax}
                      onChange={(e) => handleInputChange('customTax', e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Desconto (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={formData.customDiscount}
                      onChange={(e) => handleInputChange('customDiscount', e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Anúncios (%)</label>
                    <select
                      value={formData.adType}
                      onChange={(e) => handleInputChange('adType', e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {AD_TYPES.map(ad => (
                        <option key={ad.id} value={ad.id}>{ad.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleSaveProduct}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold py-3 rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all"
                >
                  {editingProduct ? 'Atualizar' : 'Salvar Produto'}
                </button>
                <button
                  onClick={() => {
                    setFormData(getInitialFormData());
                    setEditingProduct(null);
                    setAnnouncementUrl('');
                    setUrlStatus({ type: null, message: '' });
                  }}
                  className="px-4 py-3 bg-slate-700 text-slate-300 rounded-xl hover:bg-slate-600 transition-all"
                >
                  Limpar
                </button>
              </div>
            </div>

            {/* Results */}
            <div className="space-y-4">
              {/* Status Card */}
              <div className={`bg-slate-800/50 backdrop-blur rounded-2xl border p-6 ${
                results.status === 'good' ? 'border-emerald-500/50' :
                results.status === 'warning' ? 'border-yellow-500/50' :
                'border-red-500/50'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">Status</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    results.status === 'good' ? 'bg-emerald-500/20 text-emerald-400' :
                    results.status === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {results.statusText}
                  </span>
                </div>

                <div className="text-center py-4">
                  <p className="text-4xl font-bold text-white mb-2">
                    {formatCurrency(results.netProfit)}
                  </p>
                  <p className="text-slate-400">Lucro Líquido</p>
                </div>
              </div>

              {/* Warning */}
              {results.warning && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p className="text-yellow-300 text-sm">{results.warning}</p>
                </div>
              )}

              {/* Results Grid */}
              <div className="grid grid-cols-2 gap-4">
                <ResultCard
                  icon={DollarSign}
                  label="Custo Total"
                  value={formatCurrency(results.totalCost)}
                  color="blue"
                />
                <ResultCard
                  icon={TrendingUp}
                  label="Total de Taxas"
                  value={formatCurrency(results.totalFees)}
                  color="orange"
                />
                <ResultCard
                  icon={Percent}
                  label="Margem Líquida"
                  value={formatPercentage(results.netMargin)}
                  color={results.netMargin >= 10 ? 'green' : results.netMargin >= 0 ? 'yellow' : 'red'}
                />
                <ResultCard
                  icon={TrendingUp}
                  label="ROI"
                  value={formatPercentage(results.roi)}
                  color={results.roi >= 50 ? 'green' : results.roi >= 0 ? 'yellow' : 'red'}
                />
                <ResultCard
                  icon={Target}
                  label="Preço Mínimo"
                  value={formatCurrency(results.minimumPrice)}
                  color="purple"
                />
                <ResultCard
                  icon={Target}
                  label="Preço Sugerido"
                  value={formatCurrency(results.suggestedPrice)}
                  color="emerald"
                />
              </div>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700 p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-500" />
                Produtos Cadastrados ({filteredProducts.length})
              </h2>
              <div className="flex flex-wrap gap-3">
                <select
                  value={filterMarketplace}
                  onChange={(e) => setFilterMarketplace(e.target.value)}
                  className="bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">Todos os Marketplaces</option>
                  {Object.values(MARKETPLACE_PRESETS).map(mp => (
                    <option key={mp.id} value={mp.id}>{mp.name}</option>
                  ))}
                </select>
                <button
                  onClick={handleExportCSV}
                  disabled={filteredProducts.length === 0}
                  className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-all disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  Exportar CSV
                </button>
              </div>
            </div>

            {/* Summary Card */}
            {products.length > 0 && (
              <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-300 text-sm">Lucro Total Estimado</p>
                    <p className={`text-2xl font-bold ${totalEstimatedProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {formatCurrency(totalEstimatedProfit)}
                    </p>
                  </div>
                  <div className="text-right text-slate-400 text-sm">
                    <p>{products.length} produtos</p>
                    <p>{products.filter(p => p.results?.netProfit >= 0).length} lucrativos</p>
                  </div>
                </div>
              </div>
            )}

            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Nenhum produto cadastrado</p>
                <p className="text-slate-500 text-sm mt-1">Use a calculadora para adicionar produtos</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredProducts.map(product => (
                  <div
                    key={product.id}
                    className="bg-slate-900/50 rounded-xl p-4 border border-slate-700 hover:border-slate-600 transition-all"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-white">{product.name}</h3>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            product.results?.status === 'good' ? 'bg-emerald-500/20 text-emerald-400' :
                            product.results?.status === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {product.results?.statusText}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-400">
                          <span>SKU: {product.sku || '-'}</span>
                          <span>Marketplace: {MARKETPLACE_PRESETS[product.marketplace]?.name}</span>
                          <span>Venda: {formatCurrency(product.sellingPrice)}</span>
                          <span>Custo: {formatCurrency(product.productCost)}</span>
                          {product.originalUrl && (
                            <a 
                              href={product.originalUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Ver Anúncio
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className={`text-xl font-bold ${product.results?.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {formatCurrency(product.results?.netProfit || 0)}
                          </p>
                          <p className="text-slate-400 text-sm">
                            Margem: {formatPercentage(product.results?.netMargin || 0)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="p-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-all"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDuplicateProduct(product)}
                            className="p-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-all"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-500" />
                Histórico de Cálculos ({history.length})
              </h2>
              {history.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="flex items-center gap-2 bg-red-500/20 text-red-400 px-4 py-2 rounded-lg hover:bg-red-500/30 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  Limpar Histórico
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="text-center py-12">
                <History className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Nenhum cálculo no histórico</p>
                <p className="text-slate-500 text-sm mt-1">Salve produtos para adicionar ao histórico</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map(entry => (
                  <div
                    key={entry.id}
                    className="bg-slate-900/50 rounded-xl p-4 border border-slate-700"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-white">{entry.name}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-400 mt-1">
                          <span>{MARKETPLACE_PRESETS[entry.marketplace]?.name}</span>
                          <span>{formatCurrency(entry.sellingPrice)}</span>
                          <span>Custo: {formatCurrency(entry.productCost)}</span>
                        </div>
                        <p className="text-slate-500 text-xs mt-1">
                          {new Date(entry.timestamp).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${entry.results?.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {formatCurrency(entry.results?.netProfit || 0)}
                        </p>
                        <p className="text-slate-400 text-sm">
                          Margem: {formatPercentage(entry.results?.netMargin || 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function ResultCard({ icon: Icon, label, value, color }) {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    orange: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    red: 'bg-red-500/10 text-red-400 border-red-500/30',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  };

  return (
    <div className={`bg-slate-800/50 backdrop-blur rounded-xl border p-4 ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" />
        <span className="text-sm font-medium opacity-80">{label}</span>
      </div>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}