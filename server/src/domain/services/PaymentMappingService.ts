// ============================================================================
// PAYMENT MAPPING SERVICE
// ============================================================================

/**
 * Normaliza los nombres de métodos de pago según reglas de negocio
 */
export class PaymentMappingService {
  /**
   * Mapea el nombre del método de pago a un nombre normalizado
   */
  static normalizePaymentName(paymentName: string): string {
    if (!paymentName) return 'Otro';

    const normalized = paymentName.trim();

    // Si contiene "MONNET" o "BAN", es Monnet - Bank
    if (normalized.includes('MONNET') || normalized.includes('BAN')) {
      return 'Monnet - Bank';
    }

    // Todos los demás métodos son Open Pay
    // (Visa, Mastercard, American Express, Diners, etc.)
    return 'Open Pay';
  }
}
