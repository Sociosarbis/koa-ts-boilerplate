import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm'

@Entity({ name: 'user' })
export class User {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ unique: true })
  username: string

  @Column({ name: 'hashed_passworded' })
  hashedPassword: string

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date
}
