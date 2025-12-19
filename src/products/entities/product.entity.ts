import { Cart } from "src/cart/entities/cart.entity";
import { OrderItem } from "src/orders/entities/order-item.entity";
import { Order } from "src/orders/entities/order.entity";
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity({name: "products"})
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  price: number;

  @Column()
  stock: number;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Cart, (item) => item.product)
  cartItems: Cart[];

  @OneToMany(() => OrderItem, (order_items) => order_items.product)
  orderItems: OrderItem
}
