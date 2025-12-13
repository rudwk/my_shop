import { Product } from "src/products/entities/product.entity";
import { User } from "src/users/entities/user.entity";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn} from "typeorm";

@Entity({name: "carts"})
export class Cart {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.cart, { onDelete: 'CASCADE'})
  user: User;

  @ManyToOne(() => Product, (product) => product.cartItems, {eager: true})
  product: Product;

  @Column({default: 1})
  quantity: number;
}