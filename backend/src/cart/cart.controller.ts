import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartDTO } from './dto/cart.dto';
import { CurrentUser } from 'src/auth/common/user.decorator';
import { JwtAuthGuard } from 'src/auth/jwt/jwt-auth.guard';

@Controller('carts')

export class CartController {
  constructor(private readonly cartService: CartService) {}

  @UseGuards(JwtAuthGuard)
  @Post('/add')
  create(@CurrentUser()user, @Body() createCartDto: CartDTO.cartAddDto) {
    return this.cartService.addItem(user.id, createCartDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/find')
  findAll(@CurrentUser() user) {
    return this.cartService.getCart(user.id)
  }

  @UseGuards(JwtAuthGuard)
  @Patch()
  update(@CurrentUser()user, @Body() updateCartDto: CartDTO.quantityUpdateDto) {
    return this.cartService.updateQuantity(user.id, updateCartDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/:productId')
  remove(@CurrentUser()user, @Param('productId') productId: number) {
    return this.cartService.remove(user.id, productId);
  }
}