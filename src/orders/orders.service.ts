  import { BadRequestException, ForbiddenException, Injectable, NotFoundException, UseGuards } from '@nestjs/common';
  import { CreateOrderDto } from './dto/create-order.dto';
  import { UpdateOrderDto } from './dto/update-order.dto';
  import { InjectRepository } from '@nestjs/typeorm';
  import { Order, OrderStatus } from './entities/order.entity';
  import { Repository } from 'typeorm';
  import { OrderItem } from './entities/order-item.entity';
  import { CartService } from 'src/cart/cart.service';
  import { ProductsService } from 'src/products/products.service';
  import { UserService } from 'src/users/user.service';
  import { Product } from 'src/products/entities/product.entity';
  import { JwtAuthGuard } from 'src/auth/jwt/jwt-auth.guard';

  @Injectable()
  export class OrdersService {
    constructor(
      @InjectRepository(Order)
      private readonly orderRepository: Repository<Order>,

      @InjectRepository(OrderItem)
      private readonly orderItemRepository: Repository<OrderItem>,

      private readonly cartService: CartService,
      private readonly productService: ProductsService,
      private readonly userService: UserService
    ){}

    async payment(userId: number){
      const user = await this.userService.findById(userId);
      if(!user) { throw new NotFoundException("해당 유저를 찾을 수 없습니다.") }
      const cartItems = await this.cartService.getCart(userId);
      if(!cartItems.length) { throw new BadRequestException("카트에 상품이 없습니다.") }

      const productIds = cartItems.map((cart) => cart.product.id);
      const productsMap = new Map<number, Product>();

      for(const product of await this.productService.findByIds(productIds)) {
        productsMap.set(product.id, product);
      }

      for(const item of cartItems) {
        const product = productsMap.get(item.product.id);
        if(!product || product.stock < item.quantity) {
          throw new BadRequestException("재고가 충분하지 않습니다");
        }
      }

      const order = this.orderRepository.create({
        user,
        total: 0,
        status: 'PENDING',
        items: [],
      })

      await this.orderRepository.save(order);

      let total = 0;
      for (const item of cartItems) {
        const product = productsMap.get(item.product.id) as Product;
        product.stock -= item.quantity;
        await this.productService.update(product.id, { stock: product.stock });

        const orderItem = this.orderItemRepository.create({
          order,
          product,
          quantity: item.quantity,
          price: Number(product.price),
        });
        total += Number(product.price) * item.quantity;
        order.items.push(orderItem);
        await this.orderItemRepository.save(orderItem);
      }

      order.total = total;
      order.status = 'SHIPPED';
      await this.orderRepository.save(order);
      await this.cartService.clear(userId);
      return order;
    }

    findAll(userId: number) {
      return this.orderRepository.find({where: { user: {id: userId}}, relations: ['items', 'items.product']});
    }

    updateStatus(orderId: number, status: OrderStatus){
      return this.orderRepository.update({id: orderId}, { status });
    }

    async cancel(orderId: number, userId: number, isAdmin: boolean) {
      const order = await this.orderRepository.findOne({where: { id: orderId }, relations: ['items', 'items.product', 'user']});
      if (!order) throw new NotFoundException('해당 주문을 찾을 수 없습니다.');
      if (!isAdmin && order.user.id !== userId) throw new ForbiddenException('해당 주문을 삭제할 권한이 없습니다');
      if (['SHIPPED', 'COMPLETED', 'CANCELLED'].includes(order.status)) {
        throw new BadRequestException('해당 주문은 취소할 수 없습니다.');
      }

      for (const item of order.items) {
        await this.productService.update(item.product.id, { stock: item.product.stock + item.quantity });
      }

      order.status = 'CANCELLED';
      await this.orderRepository.save(order);
      return order;
    }
  }
