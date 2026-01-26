import { Product } from "src/products/entities/product.entity";
import { User } from "src/users/entities/user.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { OrderItem } from "./order-item.entity";

export enum OrderStatus {
  PENDING = 'PENDING', // 주문 접수
  PAID = 'PAID', // 결제 완료
  SHIPPED = 'SHIPPED', // 배송 중
  DELIVERED = 'DELIVERED', // 배송 완료
  CANCELLED = 'CANCELLED' // 주문 취소
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  total: number;

  @Column({default: OrderStatus.PENDING})
  status: string;

  @CreateDateColumn()
  orderedAt: Date;

  @ManyToOne(() => User, (user) => user.orders, { eager: true})
  user: User;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];
}
