import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { Repository, DataSource, In } from 'typeorm';
import { OrderItem } from './entities/order-item.entity';
import { CartService } from 'src/cart/cart.service';
import { ProductsService } from 'src/products/products.service';
import { UserService } from 'src/users/user.service';
import { Product } from 'src/products/entities/product.entity';

@Injectable()
export class OrdersService {
  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,

    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,

    private readonly cartService: CartService,
    private readonly productService: ProductsService,
    private readonly userService: UserService,
  ) {}

  // 결제 
  async payment(userId: number) {
    const cartItems = await this.cartService.getCart(userId);
    if (cartItems.length === 0) {
      throw new BadRequestException('장바구니가 비어 있습니다.');
    }

    console.log('cartItems:', cartItems);
    return { message: '결제 처리 로직이 아직 구현되지 않았습니다.' };
  }

  //주문 내역 조회
  findAll(userId: number) {
    return this.orderRepository.find({
      where: { user: { id: userId } },
      relations: ['items', 'items.product'],
    });
  }

 //주문 상태 수정
  async updateStatus(orderId: number, status: OrderStatus, isAdmin: boolean) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });
    if (!order) {
      throw new NotFoundException('주문을 찾을 수 없습니다.');
    }
    if(!isAdmin) {
      throw new ForbiddenException('주문 상태 변경 권한이 없습니다.');
    }
    order.status = status;
    return this.orderRepository.save(order);
  }

  //주문 취소
  async cancel(orderId: number, userId: number, isAdmin: boolean) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['items', 'items.product', 'user'],
    });

    if (!order) {
      throw new NotFoundException('주문을 찾을 수 없습니다.');
    }

    if (!isAdmin && order.user.id !== userId) {
      throw new ForbiddenException('주문 취소 권한이 없습니다.');
    }

    if (order.status !== OrderStatus.PAID) {
      throw new BadRequestException('이미 처리된 주문은 취소할 수 없습니다.');
    }

    return this.dataSource.transaction(async (manager) => {
      for (const item of order.items) {
        const product = await manager
          .getRepository(Product)
          .findOne({ where: { id: item.product.id } });

        product.stock += item.quantity;
        await manager.getRepository(Product).save(product);
      }

      order.status = OrderStatus.CANCELLED;
      return manager.getRepository(Order).save(order);
    });
  }
}
