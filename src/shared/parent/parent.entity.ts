import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("parent")
export class Parent {
  @PrimaryGeneratedColumn()
  email: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  password: string;

  @Column({ nullable: true })
  user_role: string;
}