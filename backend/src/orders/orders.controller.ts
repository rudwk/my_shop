import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards, Req } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from 'src/auth/jwt/jwt-auth.guard';
import { OrderStatus } from './entities/order.entity';

@Controller('order')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @UseGuards(JwtAuthGuard)
  @Post('/payment')
  checkout(@Req() req, @Param('resultCode') result: string) {
    return this.ordersService.payment(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Req() req) {
    return this.ordersService.findAll(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':orderId/status/:status')
  updateStatus(@Req() req, @Param('orderId', ParseIntPipe)orderId: number, @Param("status")status: OrderStatus){
    const isAdmin = req.user.role === "ADMIN"
    return this.ordersService.updateStatus(orderId, status, isAdmin);
  }

  @UseGuards(JwtAuthGuard)
  @Patch("/:orderId/cancel")
  cancel(@Req() req, @Param('orderId')orderId: number){
    const isAdmin = req.user.role === 'ADMIN';
    return this.ordersService.cancel(orderId, req.user.id, isAdmin)
  }
}
