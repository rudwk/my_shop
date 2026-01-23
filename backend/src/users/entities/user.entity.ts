import { BeforeInsert, Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, Table } from "typeorm";
import * as bcrypt from 'bcrypt';
import { Cart } from "src/cart/entities/cart.entity";
import { Order } from "src/orders/entities/order.entity";

@Entity({name: 'users'})
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({unique: true})
  email: string;
  
  @Column()
  password: string;

  @Column()
  name: string;

  @Column({default: 'CUSTOMER'})
  role: string;

  @Column()
  address: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Cart, (cart) => cart.user, { cascade: true})
  cart: Cart[];

  @OneToMany(() => Order, (order) => order.user, {cascade: true})
  orders: Order;
}