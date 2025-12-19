import { Injectable, NotFoundException } from '@nestjs/common';
import { CartDTO } from './dto/cart.dto';
import { UserService } from 'src/users/user.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Cart } from './entities/cart.entity';
import { Repository } from 'typeorm';
import { ProductsService } from 'src/products/products.service';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    private readonly userService: UserService,
    private readonly productService: ProductsService
  ){}

  async addItem(userId: number, cartDto: CartDTO.cartAddDto) {
    const user = await this.userService.findById(userId);
    const product = await this.productService.findById(cartDto.productId)
    if(!product) throw new NotFoundException("해당 상품을 찾을 수 없습니다.")

    let item = await this.cartRepository.findOne({
      where: { user: { id: userId }, product: { id: cartDto.productId } },
      relations: ['product', 'user'],
    });

    if (item) {
      item.quantity += cartDto.quantity;
    } else {
      item = this.cartRepository.create({ user, product, quantity: cartDto.quantity });
    }
    return this.cartRepository.save(item);
  }

  async getCart(userId: number) {
    return await this.cartRepository.find({ where: { user: { id: userId } }, relations: ['user'] });
  }

  async hasItem(userId: number, productId: number) {
    const item = await this.cartRepository.findOne({
      where: { user: { id: userId }, product: { id: productId } },
      relations: ['product', 'user'],
    });

    if(!item) { return null }
    else { return item; }
  }

  async updateQuantity(userId: number, cartDto: CartDTO.quantityUpdateDto) {
    const { productId, quantity } = cartDto;
    const item = await this.hasItem(userId, productId);
    if(item == null) { throw new NotFoundException("해당 상품을 찾을 수 없습니다"); }

    item.quantity = quantity;
    return this.cartRepository.save(item);
  }

  async remove(userId: number, productId: number) {
    const item = await this.hasItem(userId, productId);
    if(item == null) { throw new NotFoundException("해당 상품을 찾을 수 없습니다"); }

    return this.cartRepository.remove(item);
  }

  async clear(userId: number) {
    const items = await this.getCart(userId);
    await this.cartRepository.remove(items);
  }
}
