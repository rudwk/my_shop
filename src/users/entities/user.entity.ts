import { BeforeInsert, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Table } from "typeorm";
import * as bcrypt from 'bcrypt';

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

  @BeforeInsert()
  private beforeInsert() {
    this.password = bcrypt.hashSync(this.password, 10);
  }
}