import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.INVENTORY_MANAGER)
  create(@CurrentUser() user: any, @Body() dto: CreateInventoryItemDto) {
    return this.inventoryService.create(user.tenantId, dto);
  }

  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_ADMIN,
    UserRole.INVENTORY_MANAGER,
    UserRole.TEACHER,
  )
  findAll(
    @CurrentUser() user: any,
    @Query('category') category?: string,
    @Query('lowStock') lowStock?: string,
  ) {
    return this.inventoryService.findAll(
      user.tenantId,
      category,
      lowStock === 'true',
    );
  }

  @Get('transactions')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_ADMIN,
    UserRole.INVENTORY_MANAGER,
    UserRole.TEACHER,
  )
  findTransactions(
    @CurrentUser() user: any,
    @Query('itemId') itemId?: string,
  ) {
    return this.inventoryService.findTransactions(user.tenantId, itemId);
  }

  @Get(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_ADMIN,
    UserRole.INVENTORY_MANAGER,
    UserRole.TEACHER,
  )
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.inventoryService.findOne(id, user.tenantId);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.INVENTORY_MANAGER)
  update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateInventoryItemDto,
  ) {
    return this.inventoryService.update(id, user.tenantId, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.INVENTORY_MANAGER)
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.inventoryService.remove(id, user.tenantId);
  }

  @Post(':id/stock-in')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.INVENTORY_MANAGER)
  stockIn(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: AdjustStockDto,
  ) {
    return this.inventoryService.stockIn(id, user.tenantId, user.userId, dto);
  }

  @Post(':id/stock-out')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.INVENTORY_MANAGER)
  stockOut(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: AdjustStockDto,
  ) {
    return this.inventoryService.stockOut(id, user.tenantId, user.userId, dto);
  }
}
