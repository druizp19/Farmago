// ============================================================================
// STOCK API HTTP CLIENT
// ============================================================================

import { ENV } from '../../config/env';
import { logger } from '../../shared/logger';
import type {
  StockItem,
  StockByWarehouse,
  StockApiLoginResponse,
} from '../../domain/types/Stock';

/** Timeout para todas las peticiones a la API de Stock */
const FETCH_TIMEOUT_MS = 15_000;

export class StockApiClient {
  private baseUrl: string;
  private username: string;
  private password: string;
  private token: string | null = null;
  private tokenExpiration: Date | null = null;

  constructor() {
    this.baseUrl = ENV.STOCK_API_URL;
    this.username = ENV.STOCK_API_USERNAME;
    this.password = ENV.STOCK_API_PASSWORD;
  }

  // ---------------------------------------------------------------------------
  // HELPERS PRIVADOS
  // ---------------------------------------------------------------------------

  /**
   * Fetch con timeout usando AbortController
   */
  private async fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timerId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        throw new Error(`Stock API timeout (${FETCH_TIMEOUT_MS / 1000}s) en: ${url}`);
      }
      throw err;
    } finally {
      clearTimeout(timerId);
    }
  }

  /**
   * Decodifica el payload del JWT y extrae la fecha de expiración (campo `exp`).
   * Usa Buffer.from para compatibilidad con Node.js (no depende de atob global).
   */
  private parseTokenExpiration(token: string): Date {
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        // Base64url → Base64 standard → Buffer → JSON
        const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'));
        if (typeof payload.exp === 'number') {
          return new Date(payload.exp * 1000); // exp está en segundos Unix
        }
      }
    } catch {
      // Ignorar error de parseo — usar fallback
    }
    // Fallback conservador: 1 hora
    return new Date(Date.now() + 60 * 60 * 1000);
  }

  /**
   * Devuelve el token vigente; hace login si no existe o está por expirar.
   */
  private async getValidToken(): Promise<string> {
    if (this.token && this.tokenExpiration) {
      const buffer = 5 * 60 * 1000; // renovar 5 minutos antes de expirar
      if (Date.now() < this.tokenExpiration.getTime() - buffer) {
        return this.token;
      }
    }
    await this.login();
    return this.token!;
  }

  // ---------------------------------------------------------------------------
  // LOGIN
  // ---------------------------------------------------------------------------

  private async login(): Promise<void> {
    logger.info('🔐 Stock API: Iniciando login...');
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/Auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: this.username,
          password: this.password,
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Login failed: HTTP ${response.status} — ${body}`);
      }

      const data = (await response.json()) as StockApiLoginResponse;
      this.token = data.token;

      // Prioridad: campo `expiration` del response → campo `exp` del JWT payload
      if (data.expiration || data.expirationDate) {
        this.tokenExpiration = new Date((data.expiration || data.expirationDate)!);
      } else {
        this.tokenExpiration = this.parseTokenExpiration(data.token);
      }

      const remainingMin = Math.round((this.tokenExpiration.getTime() - Date.now()) / 60_000);
      logger.info(`✅ Stock API: Login exitoso. Token válido ~${remainingMin} min`);
    } catch (error) {
      logger.error('❌ Stock API: Error en login:', error);
      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // FETCH STOCK
  // ---------------------------------------------------------------------------

  /**
   * Obtiene la lista completa de stock desde la API.
   * Si recibe 401, renueva el token y reintenta una sola vez.
   */
  async fetchStock(allowRetry = true): Promise<StockItem[]> {
    const token = await this.getValidToken();

    const response = await this.fetchWithTimeout(`${this.baseUrl}/api/Stock/Lista`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 401 && allowRetry) {
      logger.warn('⚠️ Token rechazado (401) — renovando y reintentando...');
      this.token = null;
      this.tokenExpiration = null;
      return this.fetchStock(false); // un solo reintento
    }

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`fetchStock failed: HTTP ${response.status} — ${body}`);
    }

    const data = (await response.json()) as StockItem[];
    logger.info(`📦 Stock obtenido: ${data.length} registros`);
    return data;
  }

  // ---------------------------------------------------------------------------
  // HELPERS PÚBLICOS
  // ---------------------------------------------------------------------------

  /**
   * Agrupa un array de StockItem por almacén (lwhs) y refId (lprod).
   */
  groupByWarehouse(stockItems: StockItem[]): StockByWarehouse {
    const grouped: StockByWarehouse = {};
    for (const item of stockItems) {
      if (!grouped[item.lwhs]) grouped[item.lwhs] = {};
      grouped[item.lwhs][item.lprod] = item.sdohr;
    }
    return grouped;
  }

  /**
   * Prueba de conectividad: login + fetch.
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getValidToken();
      const stock = await this.fetchStock();
      return stock.length > 0;
    } catch (error) {
      logger.error('❌ Stock API: Test de conexión fallido:', error);
      return false;
    }
  }
}
