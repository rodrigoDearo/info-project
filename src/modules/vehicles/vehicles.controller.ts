import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser, CurrentUser } from '../../shared/decorators/current-user.decorator';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { QueryVehicleDto } from './dto/query-vehicle.dto';

@ApiTags('Vehicles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  @ApiOperation({ summary: 'Register a vehicle' })
  create(@Body() dto: CreateVehicleDto, @CurrentUser() user: AuthenticatedUser) {
    return this.vehiclesService.create(dto, user.nickname);
  }

  @Get()
  @ApiOperation({ summary: 'List vehicles with pagination and filters (cached)' })
  findAll(@Query() query: QueryVehicleDto) {
    return this.vehiclesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get vehicle by ID (cached)' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.vehiclesService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update vehicle' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateVehicleDto, @CurrentUser() user: AuthenticatedUser) {
    return this.vehiclesService.update(id, dto, user.nickname);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove vehicle' })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthenticatedUser) {
    return this.vehiclesService.remove(id, user.nickname);
  }
}

