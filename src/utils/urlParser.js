export function parseAnnouncementUrl(url) {
  if (!url) return null;

  try {
    const urlLower = url.toLowerCase();
    
    // Detectar marketplace pelo domínio
    let marketplace = 'manual';
    let productId = '';
    
    if (urlLower.includes('shopee.com.br') || urlLower.includes('shopee.')) {
      marketplace = 'shopee';
      // Shopee URLs: https://shopee.com.br/produto-slug-i.123456789.987654321
      const shopeeMatch = url.match(/i\.(\d+)\.(\d+)/);
      if (shopeeMatch) {
        productId = shopeeMatch[2];
      }
    } else if (urlLower.includes('mercadolivre.com.br') || urlLower.includes('mercadolivre.') || urlLower.includes('mercadocsh')) {
      marketplace = 'mercadolivre_classico';
      // Mercado Livre: https://produto.mercadolivre.com.br/MLB-123456789
      const mlMatch = url.match(/MLB[-_]?(\d+)/i);
      if (mlMatch) {
        productId = mlMatch[1];
      }
    } else if (urlLower.includes('amazon.com.br') || urlLower.includes('amazon.')) {
      marketplace = 'amazon';
      // Amazon: https://www.amazon.com.br/dp/B07DJ5ST5K ou /gp/product/B07DJ5ST5K
      const amazonMatch = url.match(/(?:dp|gp\/product)\/([A-Z0-9]{10})/i);
      if (amazonMatch) {
        productId = amazonMatch[1];
      }
    } else if (urlLower.includes('tiktok.com') || urlLower.includes('tiktokshop')) {
      marketplace = 'tiktokshop';
      const tiktokMatch = url.match(/product\/(\d+)/);
      if (tiktokMatch) {
        productId = tiktokMatch[1];
      }
    } else if (urlLower.includes('shein.com') || urlLower.includes('shein.')) {
      marketplace = 'shein';
      const sheinMatch = url.match(/product\/(\d+)/i);
      if (sheinMatch) {
        productId = sheinMatch[1];
      }
    }

    // Extrair preço se estiver no URL (alguns marketplaces incluem na URL)
    let sellingPrice = '';
    const priceMatch = url.match(/[?&](?:price|preco)=(\d+[.,]?\d*)/i);
    if (priceMatch) {
      sellingPrice = priceMatch[1].replace(',', '.');
    }

    return {
      marketplace,
      productId,
      sellingPrice,
      originalUrl: url,
      detected: marketplace !== 'manual',
    };
  } catch (error) {
    console.error('Erro ao parsear URL:', error);
    return null;
  }
}

export function getMarketplaceFromUrl(url) {
  const result = parseAnnouncementUrl(url);
  return result?.marketplace || 'manual';
}