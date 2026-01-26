import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
    private readonly productService: ProductsService,
  ) {}

  async addItem(userId: number, cartDto: CartDTO.cartAddDto) {
    if (cartDto.quantity <= 0) {
      throw new BadRequestException('수량은 1 이상이어야 합니다.');
    }

    const user = await this.userService.findById(userId);
    const product = await this.productService.findById(cartDto.productId);

    if(product.stock < cartDto.quantity + (await this.findItem(userId, cartDto.productId))?.quantity) {
      throw new BadRequestException('재고가 부족합니다.');
    }

    let item = await this.cartRepository.findOne({
      where: {
        user: { id: userId },
        product: { id: cartDto.productId },
      },
      relations: ['user', 'product'],
    });

    if (item) {
      item.quantity += cartDto.quantity;
    } else {
      item = this.cartRepository.create({
        user,
        product,
        quantity: cartDto.quantity,
      });
    }

    return this.cartRepository.save(item);
  }

  async getCart(userId: number) {
    return this.cartRepository.find({
      where: { user: { id: userId } },
      relations: ['user', 'product'],
    });
  }

  private async findItem(userId: number, productId: number) {
    return this.cartRepository.findOne({
      where: {
        user: { id: userId },
        product: { id: productId },
      },
      relations: ['user', 'product'],
    });
  }

  async updateQuantity(userId: number, cartDto: CartDTO.quantityUpdateDto) {
    if (cartDto.quantity <= 0) {
      throw new BadRequestException('수량은 1 이상이어야 합니다.');
    }

    const item = await this.findItem(userId, cartDto.productId);
    if (!item) {
      throw new NotFoundException('해당 상품이 장바구니에 없습니다.');
    }

    item.quantity = cartDto.quantity;
    return this.cartRepository.save(item);
  }

  async remove(userId: number, productId: number) {
    const item = await this.findItem(userId, productId);
    if (!item) {
      throw new NotFoundException('해당 상품이 장바구니에 없습니다.');
    }

    await this.cartRepository.remove(item);
  }

  async clear(userId: number) {
    const items = await this.getCart(userId);
    if (items.length) {
      await this.cartRepository.remove(items);
    }
  }
}
