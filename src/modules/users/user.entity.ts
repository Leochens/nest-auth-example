// src/entities/user.entity.ts
import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity()
export class User {
  @PrimaryColumn()
  user_id: string;

  @Column()
  user_name: string;
  
  @Column()
  @Exclude()
  password: string;

  @Column({ nullable: true })
  user_phone: string;
  
  @Column({ unique: true })
  user_email: string;

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ nullable: true })
  avatar: string;

  @CreateDateColumn()
  created_time: Date;

  @UpdateDateColumn()
  updated_time: Date;

  @Column({ default: true })
  isActive: boolean;
}
