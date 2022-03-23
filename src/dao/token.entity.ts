import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm'

@Entity()
export class Token {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  value: string

  @Column()
  userID: number
}
