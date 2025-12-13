import { Injectable, NotFoundException } from '@nestjs/common';
import { CartAddDto } from './dto/cart-dto';
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

  async addItem(userId: number, cartDto: CartAddDto) {
    const user = this.userService.findById(userId);
    const product = await this.productService.findById(cartDto.productId)
    if(!product) throw new NotFoundException("해당 상품을 찾을 수 없습니다.")

    let item = await this.cartRepository.findOne({
      where: { user: { id: userId }, product: { id: cartDto.productId } },
      relations: ['product', 'user'],
    });

    if (item) {
      item.quantity += cartDto.quantity;
    } else {
      item = this.cartRepository.create({ product, quantity: cartDto.quantity });
    }
    return this.cartRepository.save(item);
  }

  async findAll(id: number) {
    return this.cartRepository.find({where: {user: await this.userService.findById(id)}});
  }

  async updateQuantity(userId: number, quantity: number) {
    
  }

  async remove(id: number) {
    return `This action removes a #${id} cart`;
  }
}
