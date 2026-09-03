import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryItem, InventoryItemStatus } from './entities/inventory-item.entity';
import { InventoryTransaction, InventoryTransactionType } from './entities/inventory-transaction.entity';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(InventoryItem)
    private readonly itemRepo: Repository<InventoryItem>,
    @InjectRepository(InventoryTransaction)
    private readonly transactionRepo: Repository<InventoryTransaction>,
  ) {}

  // ── Inventory Item CRUD ────────────────────────────────────

  async create(tenantId: string, dto: CreateInventoryItemDto): Promise<InventoryItem> {
    const item = this.itemRepo.create({
      ...dto,
      tenantId,
      quantity: dto.quantity || 0,
      minimumStock: dto.minimumStock !== undefined ? dto.minimumStock : 5,
    });
    return this.itemRepo.save(item);
  }

  async findAll(tenantId: string, category?: string, lowStock?: boolean): Promise<InventoryItem[]> {
    const query = this.itemRepo.createQueryBuilder('item')
      .where('item.tenantId = :tenantId', { tenantId });

    if (category) {
      query.andWhere('item.category = :category', { category });
    }

    if (lowStock) {
      query.andWhere('item.quantity <= item.minimumStock');
    }

    query.orderBy('item.name', 'ASC');
    return query.getMany();
  }

  async findOne(id: string, tenantId: string): Promise<InventoryItem> {
    const item = await this.itemRepo.findOne({
      where: { id, tenantId },
    });
    if (!item) {
      throw new NotFoundException(`Inventory item ${id} not found`);
    }
    return item;
  }

  async update(id: string, tenantId: string, dto: UpdateInventoryItemDto): Promise<InventoryItem> {
    const item = await this.findOne(id, tenantId);
    Object.assign(item, dto);
    return this.itemRepo.save(item);
  }

  async remove(id: string, tenantId: string): Promise<{ success: boolean }> {
    const item = await this.findOne(id, tenantId);
    item.status = InventoryItemStatus.INACTIVE;
    await this.itemRepo.save(item);
    return { success: true };
  }

  // ── Stock Adjustments ──────────────────────────────────────

  async stockIn(
    id: string,
    tenantId: string,
    userId: string,
    dto: AdjustStockDto,
  ): Promise<InventoryItem> {
    const item = await this.findOne(id, tenantId);

    // Create Transaction
    const tx = this.transactionRepo.create({
      tenantId,
      itemId: id,
      type: InventoryTransactionType.STOCK_IN,
      quantity: dto.quantity,
      reason: dto.reason || 'Restocking',
      createdBy: userId,
    });

    item.quantity += dto.quantity;

    await this.transactionRepo.save(tx);
    return this.itemRepo.save(item);
  }

  async stockOut(
    id: string,
    tenantId: string,
    userId: string,
    dto: AdjustStockDto,
  ): Promise<InventoryItem> {
    const item = await this.findOne(id, tenantId);

    if (item.quantity < dto.quantity) {
      throw new BadRequestException(`Insufficient stock. Available: ${item.quantity} ${item.unit}. Requested: ${dto.quantity}.`);
    }

    // Create Transaction
    const tx = this.transactionRepo.create({
      tenantId,
      itemId: id,
      type: InventoryTransactionType.STOCK_OUT,
      quantity: dto.quantity,
      reason: dto.reason || 'Usage / Withdrawal',
      createdBy: userId,
    });

    item.quantity -= dto.quantity;

    await this.transactionRepo.save(tx);
    return this.itemRepo.save(item);
  }

  async findTransactions(tenantId: string, itemId?: string): Promise<InventoryTransaction[]> {
    const where: any = { tenantId };
    if (itemId) {
      where.itemId = itemId;
    }
    return this.transactionRepo.find({
      where,
      relations: ['item', 'creator'],
      order: { createdAt: 'DESC' },
    });
  }
}
