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

  async payment(userId: number) {
    return this.dataSource.transaction(async (manager) => {
      const user = await this.userService.findById(userId);
      const cartItems = await this.cartService.getCart(userId);

      if (!cartItems.length) {
        throw new BadRequestException('장바구니에 상품이 없습니다.');
      }

      const productIds = cartItems.map((c) => c.product.id);
      const products = await manager.getRepository(Product).find({
        where: { id: In(productIds) },
        lock: { mode: 'pessimistic_write' },
      });

      const productMap = new Map<number, Product>();
      products.forEach((p) => productMap.set(p.id, p));

      for (const item of cartItems) {
        const product = productMap.get(item.product.id);
        if (!product || product.stock < item.quantity) {
          throw new BadRequestException('재고가 부족한 상품이 있습니다.');
        }
      }

      const order = manager.getRepository(Order).create({
        user,
        status: OrderStatus.PAID,
        total: 0,
        items: [],
      });

      await manager.getRepository(Order).save(order);

      let total = 0;

      for (const item of cartItems) {
        const product = productMap.get(item.product.id);

        product.stock -= item.quantity;
        await manager.getRepository(Product).save(product);

        const orderItem = manager.getRepository(OrderItem).create({
          order,
          product,
          quantity: item.quantity,
          price: Number(product.price),
        });

        total += Number(product.price) * item.quantity;
        await manager.getRepository(OrderItem).save(orderItem);
      }

      order.total = total;
      await manager.getRepository(Order).save(order);

      await this.cartService.clear(userId);
      return order;
    });
  }

  findAll(userId: number) {
    return this.orderRepository.find({
      where: { user: { id: userId } },
      relations: ['items', 'items.product'],
    });
  }

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
