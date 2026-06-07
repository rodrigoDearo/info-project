import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { VehicleModel } from '../../vehicle-models/entities/vehicle-model.entity';

@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  license_plate: string;

  @Column({ unique: true })
  chassis: string;

  @Column({ unique: true })
  renavam: string;

  @Column()
  year: number;

  @Column()
  model_id: number;

  @ManyToOne(() => VehicleModel, (model) => model.vehicles, { eager: true })
  @JoinColumn({ name: 'model_id' })
  model: VehicleModel;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column()
  created_by: string;
}
