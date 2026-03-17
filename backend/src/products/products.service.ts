import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { productDTO } from './dto/product-dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { In, Repository } from 'typeorm';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(dto: productDTO.createProduct, role: string) {
    if (role !== 'ADMIN' && role !== 'SELLER') {
      throw new ForbiddenException('상품 등록 권한이 없습니다.');
    }

    try {
      const product = this.productRepository.create(dto);
      await this.productRepository.save(product);
      return { message: '상품이 등록되었습니다.' };
    } catch(e) {
      console.log(e);
      throw new InternalServerErrorException('상품 생성 실패');
    }
  }

  findAll() {
    return this.productRepository.find();
  }

  async findById(id: number) {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException('상품을 찾을 수 없습니다.');
    }
    return product;
  }

  async findByIds(ids: number[]) {
    return this.productRepository.find({
      where: { id: In(ids) },
    });
  }

  async findByName(name: string) {
    return this.productRepository.findOne({
      where: { name },
    });
  }

  async update(
    productId: number,
    dto: productDTO.updateProduct,
    role: string,
  ) {
    if (role !== 'ADMIN' && role !== 'SELLER') {
      throw new ForbiddenException('상품 수정 권한이 없습니다.');
    }

    const result = await this.productRepository.update(productId, dto);
    if (result.affected === 0) {
      throw new NotFoundException('상품 수정 실패');
    }

    return { message: '상품이 수정되었습니다.' };
  }

  async remove(productId: number, role: string) {
    if (role !== 'ADMIN' && role !== 'SELLER') {
      throw new ForbiddenException('상품 삭제 권한이 없습니다.');
    }

    const result = await this.productRepository.delete(productId);
    if (result.affected === 0) {
      throw new NotFoundException('상품 삭제 실패');
    }

    return { message: '상품이 삭제되었습니다.' };
  }
}
