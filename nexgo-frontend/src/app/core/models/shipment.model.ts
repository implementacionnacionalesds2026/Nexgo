export type ShipmentStatus =
  | 'PENDIENTE'
  | 'RECOGIDO'
  | 'EN_TRANSITO'
  | 'EN_DESTINO'
  | 'ENTREGADO'
  | 'CANCELADO';

export interface ShipmentStatusEntry {
  id: number;
  status: ShipmentStatus;
  notes: string;
  location: string;
  updatedByName: string;
  updated_by_username?: string;
  updatedByUsername?: string;
  updated_by_role?: string;
  createdAt?: string;
  created_at?: string;
}

export interface Shipment {
  id: string;
  trackingNumber: string;
  clientId: string;
  clientName?: string;
  companyName?: string;
  assignedDriverId?: string;
  driverName?: string;
  driverPhone?: string;
  pricingRuleId?: number;

  // Remitente
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  originCity: string;
  originLat?: number;
  originLng?: number;

  // Destinatario
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  destinationCity: string;
  destinationLat?: number;
  destinationLng?: number;
  
  // Ubicación Detallada
  recipientMunicipality?: string;
  recipientDepartment?: string;
  recipientZone?: string;

  // Paquete
  weightKg: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  quantity: number;
  description?: string;
  isFragile: boolean;

  // Pago y Etiquetas
  totalPaymentAmount?: number;
  paymentInstructions?: string;
  paymentMethod?: string;
  serviceType?: string;
  orderNumber?: string;
  ticketNumber?: string;
  destinationCode?: string;
  serviceTag?: string;
  comments?: string;

  // Costos
  distanceKm?: number;
  estimatedCost?: number;
  finalCost?: number;

  // Estado
  currentStatus: ShipmentStatus;
  estimatedDelivery?: string;
  deliveredAt?: string;
  notes?: string;

  createdAt: string;
  updatedAt: string;

  statusHistory?: ShipmentStatusEntry[];
}

export interface CreateShipmentRequest {
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  originCity: string;
  originLat?: number;
  originLng?: number;
  
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  destinationCity: string;
  destinationLat?: number;
  destinationLng?: number;

  // Ubicación Detallada
  recipientMunicipality?: string;
  recipientDepartment?: string;
  recipientZone?: string;

  weightKg: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  quantity: number;
  description?: string;
  isFragile?: boolean;
  
  // Pago y Etiquetas
  totalPaymentAmount?: number;
  paymentInstructions?: string;
  orderNumber?: string;
  ticketNumber?: string;
  destinationCode?: string;
  serviceTag?: string;
  comments?: string;

  distanceKm?: number;
  pricingRuleId?: number;
}

export interface CotizacionResult {
  ruleId: number;
  ruleName: string;
  basePrice: number;
  totalCost: number;
  breakdown: {
    baseCost: number;
    weightCost: number;
    distanceCost: number;
    extraPkgCost: number;
  };
}

export interface PricingRule {
  id: number;
  name: string;
  basePrice: number;
  base_price?: number;
  pricePerKg: number;
  pricePerKm: number;
  pricePerExtraPkg: number;
  dimensionSurcharge: number;
  maxWeightKg: number;
  base_weight?: number;
  weight_unit?: string;
  extra_weight_price?: number;
  role_id?: number;
  user_id?: string;
  isActive: boolean;
}
