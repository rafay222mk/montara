import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { TenantsService } from '../tenants/tenants.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly tenantsService: TenantsService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // 1. Verify tenant exists and is active
    const tenant = await this.tenantsService.findOne(createUserDto.tenantId);
    if (!tenant.isActive) {
      throw new BadRequestException('Cannot create user for an inactive tenant');
    }

    // 2. Check email uniqueness
    const existing = await this.findByEmail(createUserDto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    // 3. Hash password
    const passwordHash = await bcrypt.hash(createUserDto.password, 10);

    // 4. Create and save user
    const user = this.userRepository.create({
      name: createUserDto.name,
      email: createUserDto.email,
      passwordHash,
      role: createUserDto.role,
      tenantId: createUserDto.tenantId,
    });

    const savedUser = await this.userRepository.save(user);
    // Delete passwordHash from the object just in case (although select: false is set)
    delete (savedUser as any).passwordHash;
    return savedUser;
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['tenant'],
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string, includePassword = false): Promise<User | null> {
    const query = this.userRepository.createQueryBuilder('user')
      .where('user.email = :email', { email });

    if (includePassword) {
      query.addSelect('user.passwordHash');
    }

    return query.getOne();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (updateUserDto.password) {
      const passwordHash = await bcrypt.hash(updateUserDto.password, 10);
      user.passwordHash = passwordHash;
    }

    const { password, ...otherData } = updateUserDto;
    this.userRepository.merge(user, otherData);

    const updatedUser = await this.userRepository.save(user);
    delete (updatedUser as any).passwordHash;
    return updatedUser;
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }
}
