import { z } from 'zod';

export const addressSchema = z.object({
  recipientName: z.string().trim().min(2).max(100),
  phone: z
    .string()
    .trim()
    .regex(/^(0|\+84)[0-9]{9,10}$/),
  line1: z.string().trim().min(5).max(200),
  ward: z.string().trim().max(100).optional().default(''),
  district: z.string().trim().min(2).max(100),
  province: z.string().trim().min(2).max(100),
});

export const createOrderSchema = z.object({
  email: z.email().trim(),
  phone: z
    .string()
    .trim()
    .regex(/^(0|\+84)[0-9]{9,10}$/),
  shippingAddress: addressSchema,
  customerNote: z.string().trim().max(500).optional(),
  paymentMethod: z.enum(['cod', 'online']),
  voucherCode: z.string().trim().max(40).optional(),
  idempotencyKey: z.uuid(),
  items: z
    .array(
      z.object({
        variantId: z.string().min(1).max(80),
        quantity: z.number().int().min(1).max(10),
      }),
    )
    .min(1)
    .max(30),
});

export const orderStatusSchema = z.object({
  status: z.enum([
    'confirmed',
    'processing',
    'ready_to_ship',
    'shipped',
    'delivered',
    'cancelled',
    'returned',
  ]),
  reason: z.string().trim().max(300).optional(),
});

export const inventoryAdjustmentSchema = z.object({
  inventoryItemId: z.string().min(1),
  quantityDelta: z
    .number()
    .int()
    .min(-10_000)
    .max(10_000)
    .refine((value) => value !== 0),
  reason: z.string().trim().min(3).max(300),
  idempotencyKey: z.uuid(),
});

const inventoryReason = z.string().trim().min(3).max(300);
const optionalReference = z.string().trim().max(80).optional();
const optionalNotes = z.string().trim().max(500).optional();

export const inventoryReceiptSchema = z.object({
  warehouseId: z.string().min(1).max(80),
  inventoryItemId: z.string().min(1).max(80),
  quantity: z.number().int().min(1).max(100_000),
  unitCostCents: z.number().int().min(0).max(1_000_000_000).optional(),
  referenceNumber: optionalReference,
  reason: inventoryReason,
  notes: optionalNotes,
  idempotencyKey: z.uuid(),
});

export const inventoryTransferSchema = z.object({
  sourceInventoryItemId: z.string().min(1).max(80),
  destinationWarehouseId: z.string().min(1).max(80),
  quantity: z.number().int().min(1).max(100_000),
  referenceNumber: optionalReference,
  reason: inventoryReason,
  notes: optionalNotes,
  idempotencyKey: z.uuid(),
});

export const inventoryCountSchema = z.object({
  inventoryItemId: z.string().min(1).max(80),
  actualQuantity: z.number().int().min(0).max(1_000_000),
  reason: inventoryReason,
  notes: optionalNotes,
  idempotencyKey: z.uuid(),
});

export const productMutationSchema = z.object({
  name: z.string().trim().min(2).max(160),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/),
  subtitle: z.string().trim().max(180).optional(),
  description: z.string().trim().min(20).max(5_000),
  material: z.string().trim().max(300).optional(),
  status: z.enum(['draft', 'active', 'archived']).default('draft'),
  featured: z.boolean().default(false),
  categoryId: z.string().min(1).max(80).optional(),
  initialVariant: z
    .object({
      sku: z.string().trim().min(3).max(80),
      size: z.string().trim().min(1).max(40),
      color: z.string().trim().min(1).max(80),
      colorHex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      priceCents: z.number().int().min(1_000).max(1_000_000_000),
      compareAtPriceCents: z
        .number()
        .int()
        .min(1_000)
        .max(1_000_000_000)
        .optional(),
      warehouseId: z.string().min(1).max(80),
      openingStock: z.number().int().min(0).max(1_000_000),
      safetyStock: z.number().int().min(0).max(100_000).default(0),
      reorderPoint: z.number().int().min(0).max(100_000).default(0),
    })
    .optional(),
});
