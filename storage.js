const STORAGE_KEYS = {
  PRODUCTS: 'pricing_calculator_products',
  USER: 'pricing_calculator_user',
  HISTORY: 'pricing_calculator_history',
};

export function saveUser(userData) {
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
}

export function getUser() {
  const data = localStorage.getItem(STORAGE_KEYS.USER);
  return data ? JSON.parse(data) : null;
}

export function clearUser() {
  localStorage.removeItem(STORAGE_KEYS.USER);
}

export function saveProducts(products) {
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
}

export function getProducts() {
  const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
  return data ? JSON.parse(data) : [];
}

export function saveCalculationToHistory(calculation) {
  const history = getHistory();
  const entry = {
    ...calculation,
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
  };
  history.unshift(entry);
  // Mantém apenas os últimos 100 cálculos
  if (history.length > 100) {
    history.pop();
  }
  localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  return entry;
}

export function getHistory() {
  const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
  return data ? JSON.parse(data) : [];
}

export function clearHistory() {
  localStorage.removeItem(STORAGE_KEYS.HISTORY);
}

export function exportToCSV(products) {
  const headers = [
    'Nome',
    'SKU',
    'Link do Anúncio',
    'Marketplace',
    'Preço de Venda',
    'Custo do Produto',
    'Embalagem',
    'Frete',
    'Comissão %',
    'Taxa Fixa R$',
    'Imposto %',
    'Desconto %',
    'Custo com Anúncios %',
    'Margem Desejada %',
    'Custo Total',
    'Total de Taxas',
    'Lucro Líquido',
    'Margem Líquida %',
    'ROI %',
    'Preço Mínimo',
    'Preço Sugerido',
    'Status',
  ];

  const rows = products.map(p => [
    p.name,
    p.sku || '',
    p.originalUrl || '',
    p.marketplace,
    p.sellingPrice,
    p.productCost,
    p.packaging,
    p.shippingCost,
    p.commission,
    p.fixedFee,
    p.customTax,
    p.customDiscount,
    p.adType,
    p.desiredMargin,
    p.results?.totalCost || 0,
    p.results?.totalFees || 0,
    p.results?.netProfit || 0,
    p.results?.netMargin || 0,
    p.results?.roi || 0,
    p.results?.minimumPrice || 0,
    p.results?.suggestedPrice || 0,
    p.results?.statusText || '',
  ]);

  const csvContent = [
    headers.join(';'),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(';')),
  ].join('\n');

  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `produtos_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
}