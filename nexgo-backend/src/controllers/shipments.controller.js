const shipmentsService = require('../services/shipments.service');
const { successResponse } = require('../utils/helpers');
const { validationResult } = require('express-validator');

/**
 * POST /api/shipments
 */
const createShipment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, message: 'Datos inválidos', errors: errors.array() });
    }

    // Si es ADMIN o GESTOR_ADMINISTRATIVO, puede crear envíos para otros clientes
    const isPrivileged = ['ADMIN', 'GESTOR_ADMINISTRATIVO'].includes(req.user.role);
    const clientId = isPrivileged ? (req.body.clientId || req.user.id) : req.user.id;
    const shipment = await shipmentsService.createShipment(req.body, clientId);
    return successResponse(res, shipment, 'Envío registrado exitosamente', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/shipments
 */
const getShipments = async (req, res, next) => {
  try {
    const { status, month, year, page, limit } = req.query;
    let filters = { status, month, year, page, limit };

    // Roles de cliente: solo ven sus propios envíos
    const isClient = ['CLIENTE', 'SMALL_CUSTOMER', 'AVERAGE_CUSTOMER', 'FULL_CUSTOMER'].includes(req.user.role);
    if (isClient) {
      filters.clientId = req.user.id;
    }

    // Repartidor solo ve los envíos asignados a él
    if (req.user.role === 'REPARTIDOR') {
      filters.driverId = req.user.id;
    }

    const result = await shipmentsService.getShipments(filters);
    return successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/shipments/:id
 */
const getShipmentById = async (req, res, next) => {
  try {
    const shipment = await shipmentsService.getShipmentById(req.params.id);

    // Validar que el cliente solo vea sus propios envíos
    const isClient = ['CLIENTE', 'SMALL_CUSTOMER', 'AVERAGE_CUSTOMER', 'FULL_CUSTOMER'].includes(req.user.role);
    if (isClient && shipment.client_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Sin acceso a este envío' });
    }

    return successResponse(res, shipment);
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/shipments/:id/status
 */
const updateStatus = async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    const io = req.app.get('io');
    const result = await shipmentsService.updateShipmentStatus(
      req.params.id, status, notes, req.user.id, io
    );
    return successResponse(res, result, 'Estado actualizado');
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/shipments/:id/assign
 */
const assignDriver = async (req, res, next) => {
  try {
    const { driverId } = req.body;
    const result = await shipmentsService.assignDriver(req.params.id, driverId);
    return successResponse(res, result, 'Repartidor asignado');
  } catch (err) {
    next(err);
  }
};

module.exports = { createShipment, getShipments, getShipmentById, updateStatus, assignDriver };
