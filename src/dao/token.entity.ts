import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm'

@Entity({ name: 'token' })
@Index(['value', 'userID'], { unique: true })
export class Token {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  value: string

  @Column({ name: 'user_id' })
  userID: number

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date

  @Column({ name: 'expires_at', type: 'datetime' })
  expiresAt: Date
}