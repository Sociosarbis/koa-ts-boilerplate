import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm'

@Entity()
export class Token {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  value: string

  @Column()
  userID: number

  @CreateDateColumn()
  createdAt: Date

  @Column()
  expiresAt: Date
}
