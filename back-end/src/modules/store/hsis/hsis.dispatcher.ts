import { FastifyRequest, FastifyReply } from 'fastify';
import { pool } from '@/prisma/db';
import { HSIS_CONTROLLER_REGISTRY, AVAILABLE_HSIS_CONTROLLERS } from './hsis.controllers';
import { AppError } from '../../../utils/AppError';

export interface IHsisEndpointModel {
  id: string;
  name: string;
  route: string;
  method: string;
  description?: string;
  controller: string;
  handler_action: string;
  headers?: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const hsisDispatcher = {
  /**
   * Mengambil semua endpoint HSIS yang terdaftar di database
   */
  async listEndpoints(): Promise<IHsisEndpointModel[]> {
    const res = await pool.query(
      'SELECT * FROM store.hsis_endpoints ORDER BY created_at ASC'
    );
    return res.rows;
  },

  /**
   * Membuat pendaftaran endpoint HSIS baru (diinput oleh user di ERP)
   */
  async createEndpoint(data: {
    name: string;
    route: string;
    method: string;
    description?: string;
    controller: string;
    handler_action: string;
    headers?: Record<string, any>;
  }): Promise<IHsisEndpointModel> {
    const id = `EP-${Date.now().toString().slice(-6)}`;
    
    // Normalisasi route: pastikan diawali slash
    let cleanRoute = data.route.trim();
    if (!cleanRoute.startsWith('/')) {
      cleanRoute = `/${cleanRoute}`;
    }

    const res = await pool.query(
      `INSERT INTO store.hsis_endpoints 
       (id, name, route, method, description, controller, handler_action, headers, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
       RETURNING *`,
      [
        id,
        data.name.trim(),
        cleanRoute,
        data.method.toUpperCase(),
        data.description || null,
        data.controller.trim(),
        data.handler_action.trim(),
        JSON.stringify(data.headers || {}),
      ]
    );
    return res.rows[0];
  },

  /**
   * Mengupdate endpoint HSIS yang ada
   */
  async updateEndpoint(
    id: string,
    data: Partial<{
      name: string;
      route: string;
      method: string;
      description?: string;
      controller: string;
      handler_action: string;
      headers?: Record<string, any>;
      is_active: boolean;
    }>
  ): Promise<IHsisEndpointModel> {
    const existing = await pool.query('SELECT * FROM store.hsis_endpoints WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      throw new AppError('Endpoint HSIS tidak ditemukan', 404);
    }

    const current = existing.rows[0];
    const updated = {
      name: data.name ?? current.name,
      route: data.route ?? current.route,
      method: (data.method ?? current.method).toUpperCase(),
      description: data.description ?? current.description,
      controller: data.controller ?? current.controller,
      handler_action: data.handler_action ?? current.handler_action,
      headers: data.headers ?? current.headers,
      is_active: data.is_active ?? current.is_active,
    };

    const res = await pool.query(
      `UPDATE store.hsis_endpoints
       SET name = $1, route = $2, method = $3, description = $4,
           controller = $5, handler_action = $6, headers = $7, is_active = $8, updated_at = NOW()
       WHERE id = $9
       RETURNING *`,
      [
        updated.name,
        updated.route,
        updated.method,
        updated.description,
        updated.controller,
        updated.handler_action,
        JSON.stringify(updated.headers),
        updated.is_active,
        id,
      ]
    );
    return res.rows[0];
  },

  /**
   * Menghapus endpoint HSIS dari database
   */
  async deleteEndpoint(id: string): Promise<boolean> {
    const res = await pool.query('DELETE FROM store.hsis_endpoints WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  },

  /**
   * Menjalankan dispatch eksekusi controller & action berdasarkan ID endpoint
   */
  async dispatchById(id: string, payload: any = {}): Promise<any> {
    const res = await pool.query('SELECT * FROM store.hsis_endpoints WHERE id = $1', [id]);
    if (res.rows.length === 0) {
      throw new AppError('Endpoint HSIS tidak ditemukan', 404);
    }
    const endpoint = res.rows[0];
    if (!endpoint.is_active) {
      throw new AppError('Endpoint ini sedang dinonaktifkan di sistem', 400);
    }

    return this.executeHandler(endpoint, {
      body: payload.body || {},
      query: payload.query || {},
      params: payload.params || {},
      headers: payload.headers || {},
    });
  },

  /**
   * Dynamic Routing Matcher: Mencocokkan incoming HTTP request dengan tabel database
   */
  async matchAndDispatch(req: FastifyRequest, reply: FastifyReply): Promise<any> {
    const incomingPath = req.url.split('?')[0]; // Ambil pathname tanpa query string
    const incomingMethod = req.method.toUpperCase();

    // Query ke database mencari endpoint aktif yang jalurnya cocok
    const res = await pool.query(
      `SELECT * FROM store.hsis_endpoints 
       WHERE is_active = true 
         AND (route = $1 OR route = $2)
         AND method = $3
       LIMIT 1`,
      [incomingPath, `/api/v1/hsis${incomingPath.replace(/^\/api\/v1\/hsis/, '')}`, incomingMethod]
    );

    if (res.rows.length === 0) {
      throw new AppError(
        `Dynamic Route HSIS '${incomingMethod} ${incomingPath}' tidak terdaftar di database store.hsis_endpoints`,
        404
      );
    }

    const endpoint = res.rows[0];
    const result = await this.executeHandler(endpoint, {
      body: req.body,
      query: req.query,
      params: req.params,
      headers: req.headers,
    });

    return reply.status(200).send({
      status: 'success',
      endpoint: {
        id: endpoint.id,
        name: endpoint.name,
        controller: endpoint.controller,
        action: endpoint.handler_action,
      },
      data: result,
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * Resolver Controller & Action Execution Engine (Mirip Laravel Container Dispatcher)
   */
  async executeHandler(endpoint: IHsisEndpointModel, inputCtx: any): Promise<any> {
    const ControllerClass = HSIS_CONTROLLER_REGISTRY[endpoint.controller];
    if (!ControllerClass) {
      throw new AppError(
        `Controller '${endpoint.controller}' belum terdaftar di HSIS_CONTROLLER_REGISTRY. Pastikan nama class controller valid.`,
        500
      );
    }

    const handlerFn = ControllerClass[endpoint.handler_action];
    if (typeof handlerFn !== 'function') {
      throw new AppError(
        `Action method '${endpoint.handler_action}' tidak ditemukan pada controller '${endpoint.controller}'`,
        500
      );
    }

    const executionContext = {
      params: inputCtx.params || {},
      query: inputCtx.query || {},
      body: inputCtx.body || {},
      headers: inputCtx.headers || {},
      endpointRecord: endpoint,
    };

    return await handlerFn(executionContext);
  },

  getAvailableControllers() {
    return AVAILABLE_HSIS_CONTROLLERS;
  },
};
