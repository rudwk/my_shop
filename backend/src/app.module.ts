import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './users/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/entities/user.entity';
import { ProductsModule } from './products/products.module';
import { Product } from './products/entities/product.entity';
import { AuthModule } from './auth/auth.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { Cart } from './cart/entities/cart.entity';
import { Order } from './orders/entities/order.entity';
import { OrderItem } from './orders/entities/order-item.entity';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
require('dotenv').config();


@Module({
  imports: [UserModule,
    TypeOrmModule.forRoot({
    type: 'mysql',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [User, Product, Cart, Order, OrderItem],
    synchronize: true
  }),
  // MailerModule.forRootAsync({
  //   useFactory: () => ({
  //     transport: 'smtps://user@domain.com:pass@smtp.domain.com',
  //     defaults: {
  //       from: '"nest-modules" <modules@nestjs.com>',
  //     },
  //     template: {
  //       dir: __dirname + '/templates',
  //       adapter: new HandlebarsAdapter(),
  //       options: {
  //         strict: true,
  //       },
  //     }
  //   })
  // }),
    ProductsModule,
    AuthModule,
    CartModule,
    OrdersModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
