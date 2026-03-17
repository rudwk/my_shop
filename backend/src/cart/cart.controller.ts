import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartDTO } from './dto/cart.dto';
import { JwtAuthGuard } from 'src/auth/jwt/jwt-auth.guard';

@Controller('carts')

export class CartController {
  constructor(private readonly cartService: CartService) {}

  @UseGuards(JwtAuthGuard)
  @Post('/add')
  async create(@Req() req, @Body() createCartDto: CartDTO.cartAddDto) {
    return this.cartService.addItem(req.user.id, createCartDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/find')
  async findAll(@Req() req) {
    return this.cartService.getCart(req.user.id)
  }

  @UseGuards(JwtAuthGuard)
  @Patch()
  async update(@Req() req, @Body() updateCartDto: CartDTO.quantityUpdateDto) {
    return this.cartService.updateQuantity(req.user.id, updateCartDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/:productId')
  async remove(@Req() req, @Param('productId') productId: number) {
    return this.cartService.remove(req.user.id, productId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete()
  async clear(@Req() req) {
    await this.cartService.clear(req.user.id);
    return { message: '장바구니가 비워졌습니다.' };
  }
}