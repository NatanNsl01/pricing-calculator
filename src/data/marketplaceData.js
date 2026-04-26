export const MARKETPLACE_PRESETS = {
  shopee: {
    id: 'shopee',
    name: 'Shopee',
    commission: 20,
    fixedFee: 4,
    description: 'Taxa padrão Shopee',
  },
  mercadolivre_classico: {
    id: 'mercadolivre_classico',
    name: 'Mercado Livre Clássico',
    commission: 12.5,
    fixedFee: 0,
    description: 'Mercado Livre forma padrão',
  },
  mercadolivre_premium: {
    id: 'mercadolivre_premium',
    name: 'Mercado Livre Premium',
    commission: 17.5,
    fixedFee: 0,
    description: 'Mercado Livre com exposição adicional',
  },
  amazon: {
    id: 'amazon',
    name: 'Amazon',
    commission: 15,
    fixedFee: 0,
    description: 'Taxa referencial Amazon',
  },
  tiktokshop: {
    id: 'tiktokshop',
    name: 'TikTok Shop',
    commission: 12,
    fixedFee: 2,
    description: 'Taxa TikTok Shop',
  },
  shein: {
    id: 'shein',
    name: 'Shein',
    commission: 20,
    fixedFee: 5,
    description: 'Taxa padrão Shein',
  },
  manual: {
    id: 'manual',
    name: 'Manual/Outro',
    commission: 0,
    fixedFee: 0,
    description: 'Defina suas próprias taxas',
  },
};

export const AD_TYPES = [
  { id: 'none', name: 'Sem Anúncio' },
  { id: 'low', name: 'Baixo (5%)' },
  { id: 'medium', name: 'Médio (10%)' },
  { id: 'high', name: 'Alto (20%)' },
];

export const AD_PERCENTAGES = {
  none: 0,
  low: 5,
  medium: 10,
  high: 20,
};

export const CATEGORIES = [
  'Eletrônicos',
  'Vestuário e Acessórios',
  'Casa e Decoração',
  'Beleza e Cuidado Pessoal',
  'Esportes e Fitness',
  'Brinquedos e Jogos',
  'Alimentos e Bebidas',
  'Automotivo',
  'Ferramentas',
  'Papelaria e Escritório',
  'Pet Shop',
  'Saúde',
  'Outros',
];

export const ANNOUNCEMENT_TYPES = [
  { id: 'standard', name: 'Anúncio Padrão' },
  { id: 'premium', name: 'Anúncio Premium/Destaque' },
  { id: 'gold', name: 'Anúncio Gold/Top' },
];