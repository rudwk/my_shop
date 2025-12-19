export class UserResponseDto {
  id: number;
  email: string;
  name: string;
  address: string;
  createdAt: Date;

  constructor(user: any) {
    this.id = user.id;
    this.email = user.email;
    this.name = user.name;
    this.address = user.address;
    this.createdAt = user.createdAt;
  }
}