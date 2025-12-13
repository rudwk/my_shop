import { BeforeInsert, Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, Table } from "typeorm";
import * as bcrypt from 'bcrypt';
import { Cart } from "src/cart/entities/cart.entity";

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

  @Column({default: 'customer'})
  role: string;

  @Column()
  address: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Cart, (cart) => cart.user, { cascade: true})
  cart: Cart[];

  @BeforeInsert()
  private beforeInsert() {
    this.password = bcrypt.hashSync(this.password, 10);
  }
}