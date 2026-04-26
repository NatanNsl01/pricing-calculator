# Calculadora de Precificação Marketplace

Sistema web para cálculo de precificação em marketplaces brasileiros.

## Funcionalidades

- Login local simples (sem backend)
- Calculadora de precificação completa
- Suporte a múltiplos marketplaces (Shopee, Mercado Livre, Amazon, TikTok Shop, Shein, Manual)
- Cadastro e gerenciamento de produtos
- Histórico de cálculos
- Exportação para CSV
- Filtros por marketplace
- Cálculos detalhados com margem, ROI e preço sugerido
- Interface responsiva estilo dashboard

## Instalação

```bash
# Clone ou extraia o projeto
cd marketplace-pricing-calculator

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

O projeto estará disponível em `http://localhost:5173`

## Construção para Produção

```bash
npm run build
```

Os arquivos будут gerados na pasta `dist/`

## Marketplaces Suportados

| Marketplace | Comissão | Taxa Fixa |
|-------------|----------|-----------|
| Shopee | 20% | R$ 4,00 |
| Mercado Livre Clássico | 12,5% | - |
| Mercado Livre Premium | 17,5% | - |
| Amazon | 15% | - |
| TikTok Shop | 12% | R$ 2,00 |
| Shein | 20% | R$ 5,00 |
| Manual/Outro | customizável | customizável |

## Fórmulas de Cálculo

- **Custo Total** = custoProduto + embalagem + frete + taxaFixa
- **Taxas Percentuais** = preçoVenda × (comissão + imposto + desconto + anúncios) / 100
- **Lucro Líquido** = preçoVenda - custoTotal - taxasPercentuais
- **Margem Líquida** = (lucroLíquido / preçoVenda) × 100
- **ROI** = (lucroLíquido / custoTotal) × 100
- **Preço Mínimo** = custoTotal / (1 - somaTaxas/100)
- **Preço Sugerido** = custoTotal / (1 - somaTaxas/100 - margemDesejada/100)

## Stack

- React 18
- Vite
- Tailwind CSS
- Lucide React (ícones)
- localStorage (persistência)