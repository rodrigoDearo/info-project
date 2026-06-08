import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Brand } from '../../brands/entities/brand.entity';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';

@Entity('models')
export class VehicleModel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  brand_id: number;

  @ManyToOne(() => Brand, (brand) => brand.models, { nullable: true, eager: false })
  @JoinColumn({ name: 'brand_id' })
  brand: Brand;

  @OneToMany(() => Vehicle, (vehicle) => vehicle.model)
  vehicles: Vehicle[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column()
  created_by: string;
}

