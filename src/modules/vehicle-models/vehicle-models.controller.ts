import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser, CurrentUser } from '../../shared/decorators/current-user.decorator';
import { VehicleModelsService } from './vehicle-models.service';
import { CreateVehicleModelDto } from './dto/create-vehicle-model.dto';
import { UpdateVehicleModelDto } from './dto/update-vehicle-model.dto';

@ApiTags('Vehicle Models')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('models')
export class VehicleModelsController {
  constructor(private readonly vehicleModelsService: VehicleModelsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a vehicle model' })
  create(@Body() dto: CreateVehicleModelDto, @CurrentUser() user: AuthenticatedUser) {
    return this.vehicleModelsService.create(dto, user.nickname);
  }

  @Get()
  @ApiOperation({ summary: 'List all vehicle models' })
  findAll() {
    return this.vehicleModelsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get vehicle model by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.vehicleModelsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update vehicle model' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateVehicleModelDto, @CurrentUser() user: AuthenticatedUser) {
    return this.vehicleModelsService.update(id, dto, user.nickname);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove vehicle model' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.vehicleModelsService.remove(id);
  }
}

