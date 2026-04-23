// ============================================================================
// PROMOTION DETECTION SERVICE
// ============================================================================

import type { OrderDetail } from '../types/Order';

export interface PromotionInfo {
  isCyberOrder: boolean;
  promotionName: string | undefined;
  discountValue: number;
  utmCampaign: string | undefined;
}

export class PromotionDetectionService {
  /**
   * Palabras clave para identificar promociones Cyber
   */
  private static readonly CYBER_KEYWORDS = [
    'cyber',
    'cyberwow',
    'cyber wow',
    'black friday',
    'hot sale',
    'hotsale',
    'descuento especial',
    'promocion especial',
  ];

  /**
   * Detecta si una orden es parte de una promoción Cyber
   */
  static detectPromotion(orderDetail: OrderDetail): PromotionInfo {
    let isCyberOrder = false;
    let promotionName: string | undefined = undefined;
    let discountValue = 0;
    let utmCampaign: string | undefined = undefined;

    // 1. Verificar ratesAndBenefitsData
    if (orderDetail.ratesAndBenefitsData?.rateAndBenefitsIdentifiers) {
      for (const benefit of orderDetail.ratesAndBenefitsData.rateAndBenefitsIdentifiers) {
        const name = benefit.name?.toLowerCase() || '';
        const description = benefit.description?.toLowerCase() || '';
        
        if (this.containsCyberKeyword(name) || this.containsCyberKeyword(description)) {
          isCyberOrder = true;
          promotionName = benefit.name || benefit.description || undefined;
          break;
        }
      }
    }

    // 2. Verificar marketingData (UTM Campaign)
    if (orderDetail.marketingData?.utmCampaign) {
      utmCampaign = orderDetail.marketingData.utmCampaign;
      const campaign = utmCampaign.toLowerCase();
      
      if (this.containsCyberKeyword(campaign)) {
        isCyberOrder = true;
        if (!promotionName) {
          promotionName = orderDetail.marketingData.utmCampaign;
        }
      }
    }

    // 3. Calcular descuento total de los items
    if (orderDetail.items) {
      for (const item of orderDetail.items) {
        if (item.priceTags) {
          for (const tag of item.priceTags) {
            if (tag.name?.includes('DISCOUNT')) {
              discountValue += Math.abs(tag.value || 0);
            }
          }
        }
      }
    }

    // 4. También verificar en totals
    if (orderDetail.totals) {
      const discountTotal = orderDetail.totals.find(t => t.id === 'Discounts');
      if (discountTotal && discountTotal.value < 0) {
        // Si no se calculó descuento de items, usar el total
        if (discountValue === 0) {
          discountValue = Math.abs(discountTotal.value);
        }
      }
    }

    return {
      isCyberOrder,
      promotionName,
      discountValue,
      utmCampaign,
    };
  }

  /**
   * Verifica si un texto contiene palabras clave de Cyber
   */
  private static containsCyberKeyword(text: string): boolean {
    return this.CYBER_KEYWORDS.some(keyword => text.includes(keyword));
  }

  /**
   * Extrae el nombre de la promoción de forma limpia
   */
  static cleanPromotionName(name: string | undefined): string {
    if (!name) return 'Sin promoción';
    
    // Limpiar y formatear el nombre
    return name
      .replace(/[-_]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
      .trim();
  }
}
