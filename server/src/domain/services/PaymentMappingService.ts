// ============================================================================
// PAYMENT MAPPING SERVICE
// ============================================================================

/**
 * Normaliza los nombres de métodos de pago según reglas de negocio
 */
export class PaymentMappingService {
  /**
   * Mapea el nombre del método de pago a un nombre normalizado
   * Retorna tanto el método principal como el tipo específico de tarjeta
   */
  static normalizePaymentName(paymentName: string): { 
    normalized: string; 
    cardType: string | null;
  } {
    if (!paymentName) return { normalized: 'Otro', cardType: null };

    const trimmed = paymentName.trim();

    // Si contiene "MONNET" o "BAN", es Monnet - Bank
    if (trimmed.includes('MONNET') || trimmed.includes('BAN')) {
      return { normalized: 'Monnet - Bank', cardType: null };
    }

    // Todos los demás métodos son Open Pay con su tipo de tarjeta específico
    // (Visa, Mastercard, American Express, Diners, etc.)
    return { normalized: 'Open Pay', cardType: trimmed };
  }

  /**
   * Versión legacy para compatibilidad
   */
  static normalizePaymentNameLegacy(paymentName: string): string {
    return this.normalizePaymentName(paymentName).normalized;
  }
}
