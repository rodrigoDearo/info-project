import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive, IsString, Matches, Max, Min } from 'class-validator';

export class CreateVehicleDto {
  @ApiProperty({ example: 'ABC-1234' })
  @IsString()
  @Matches(/^[A-Z]{3}-\d{4}$|^[A-Z]{3}\d[A-Z]\d{2}$/, {
    message: 'license_plate must follow Brazilian format: ABC-1234 or ABC1D23',
  })
  license_plate: string;

  @ApiProperty({ example: '9BWZZZ377VT004251' })
  @IsString()
  chassis: string;

  @ApiProperty({ example: '12345678901' })
  @IsString()
  @Matches(/^\d{11}$/, { message: 'renavam must have 11 digits' })
  renavam: string;

  @ApiProperty({ example: 2024 })
  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear() + 1)
  year: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @IsPositive()
  model_id: number;
}

