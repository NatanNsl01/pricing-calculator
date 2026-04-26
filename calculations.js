import { MARKETPLACE_PRESETS, AD_PERCENTAGES } from '../data/marketplaceData.js';

export function calculatePricing(data) {
  const {
    sellingPrice,
    productCost,
    packaging,
    shippingCost,
    marketplace,
    customCommission,
    customFixedFee,
    customTax,
    customDiscount,
    adType,
    desiredMargin,
  } = data;

  const preset = MARKETPLACE_PRESETS[marketplace] || MARKETPLACE_PRESETS.manual;
  
  // Usa valores customizados se for manual, caso contrário usa o preset
  const commission = marketplace === 'manual' ? (parseFloat(customCommission) || 0) : preset.commission;
  const fixedFee = marketplace === 'manual' ? (parseFloat(customFixedFee) || 0) : preset.fixedFee;
  const tax = parseFloat(customTax) || 0;
  const discount = parseFloat(customDiscount) || 0;
  const adPercentage = AD_PERCENTAGES[adType] || 0;
  
  const price = parseFloat(sellingPrice) || 0;
  const cost = parseFloat(productCost) || 0;
  const pack = parseFloat(packaging) || 0;
  const ship = parseFloat(shippingCost) || 0;
  const fixed = parseFloat(fixedFee) || 0;
  const margin = parseFloat(desiredMargin) || 0;

  // Custo total = custoProduto + embalagem + frete + taxaFixa
  const totalCost = cost + pack + ship + fixed;

  // Taxas percentuais = preçoVenda * (comissão + imposto + desconto + anúncios)
  const percentageRates = price * ((commission + tax + discount + adPercentage) / 100);

  // Lucro líquido = preçoVenda - custoProduto - embalagem - frete - taxaFixa - taxasPercentuais
  const netProfit = price - totalCost - percentageRates;

  // Margem líquida = lucroLiquido / preçoVenda
  const netMargin = price > 0 ? (netProfit / price) * 100 : 0;

  // ROI = lucroLiquido / custoProduto
  const totalInvested = cost + pack + ship;
  const roi = totalInvested > 0 ? (netProfit / totalInvested) * 100 : 0;

  // Total de taxas
  const totalFees = fixed + percentageRates;

  // Preço mínimo para não ter prejuízo (lucro = 0)
  // 0 = preco - totalCost - preco * (taxasPercentuais / 100)
  // preco * (1 - taxas/100) = totalCost
  // preco = totalCost / (1 - taxas/100)
  const taxPercentage = commission + tax + discount + adPercentage;
  const minimumPrice = taxPercentage < 100 
    ? totalCost / (1 - taxPercentage / 100) 
    : Infinity;

  // Preço sugerido com margem desejada
  // lucro = preco * margem - totalCost - preco * (comissao + imposto + desconto + ads)/100
  // lucro = preco * (margem - taxas/100) - totalCost
  // Para lucro = 0: preco = totalCost / (margem - taxas/100)
  // Para preço com margem: preco = totalCost / (1 - taxas/100 - margem)
  const marginDecimal = margin / 100;
  const suggestedPrice = (1 - marginDecimal - taxPercentage / 100) > 0
    ? totalCost / (1 - marginDecimal - taxPercentage / 100)
    : Infinity;

  // Status visual
  let status = 'good';
  let statusText = 'Lucro Bom';
  
  if (netProfit < 0) {
    status = 'bad';
    statusText = 'Prejuízo';
  } else if (netMargin < 10) {
    status = 'warning';
    statusText = 'Margem Baixa';
  }

  // Aviso se soma de taxas + margem passar de 100%
  const totalDeduction = taxPercentage + margin;
  const warning = totalDeduction > 100 ? `Atenção: Taxas + margem (${totalDeduction.toFixed(1)}%) excedem 100%` : null;

  return {
    totalCost,
    totalFees,
    netProfit,
    netMargin,
    roi,
    minimumPrice,
    suggestedPrice,
    status,
    statusText,
    warning,
    totalDeduction,
    commission,
    fixedFee,
  };
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatPercentage(value) {
  return `${value.toFixed(2)}%`;
}