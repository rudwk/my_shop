import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from 'src/auth/jwt/jwt-auth.guard';
import { CurrentUser } from 'src/auth/common/user.decorator';
import { OrderStatus } from './entities/order.entity';

@Controller('order')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @UseGuards(JwtAuthGuard)
  @Post('/payment')
  checkout(@CurrentUser()user) {
    return this.ordersService.payment(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@CurrentUser()user) {
    return this.ordersService.findAll(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':orderId/status/:status')
  updateStatus(@CurrentUser()user, @Param('orderId', ParseIntPipe)orderId: number, @Param("status")status: OrderStatus){
    const isAdmin = user.role === "ADMIN"
    return this.ordersService.updateStatus(orderId, status);
  }

  @UseGuards(JwtAuthGuard)
  @Patch("/:orderId/cancel")
  cancel(@CurrentUser() user, @Param('orderId')orderId: number){
    const isAdmin = user.role === 'ADMIN';
    return this.ordersService.cancel(orderId, user.id, isAdmin)
  }
}
