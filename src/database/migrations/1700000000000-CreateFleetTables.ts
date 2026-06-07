import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFleetTables1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE users (
        id          INT IDENTITY(1,1) PRIMARY KEY,
        nickname    NVARCHAR(100) NOT NULL UNIQUE,
        name        NVARCHAR(255) NOT NULL,
        email       NVARCHAR(255) NOT NULL UNIQUE,
        password    NVARCHAR(255) NOT NULL,
        created_at  DATETIME2 DEFAULT GETDATE(),
        updated_at  DATETIME2 DEFAULT GETDATE()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE brands (
        id          INT IDENTITY(1,1) PRIMARY KEY,
        name        NVARCHAR(100) NOT NULL UNIQUE,
        created_by  NVARCHAR(100) NOT NULL,
        created_at  DATETIME2 DEFAULT GETDATE(),
        updated_at  DATETIME2 DEFAULT GETDATE()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE models (
        id          INT IDENTITY(1,1) PRIMARY KEY,
        name        NVARCHAR(100) NOT NULL,
        brand_id    INT NULL,
        created_by  NVARCHAR(100) NOT NULL,
        created_at  DATETIME2 DEFAULT GETDATE(),
        updated_at  DATETIME2 DEFAULT GETDATE(),
        CONSTRAINT FK_models_brands FOREIGN KEY (brand_id) REFERENCES brands(id)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE vehicles (
        id            INT IDENTITY(1,1) PRIMARY KEY,
        license_plate NVARCHAR(10)  NOT NULL UNIQUE,
        chassis       NVARCHAR(17)  NOT NULL UNIQUE,
        renavam       NVARCHAR(11)  NOT NULL UNIQUE,
        year          INT           NOT NULL,
        model_id      INT           NOT NULL,
        created_by    NVARCHAR(100) NOT NULL,
        created_at    DATETIME2 DEFAULT GETDATE(),
        updated_at    DATETIME2 DEFAULT GETDATE(),
        CONSTRAINT FK_vehicles_models FOREIGN KEY (model_id) REFERENCES models(id)
      )
    `);

    await queryRunner.query(`CREATE INDEX IDX_vehicles_license_plate ON vehicles(license_plate)`);
    await queryRunner.query(`CREATE INDEX IDX_vehicles_model_id ON vehicles(model_id)`);
    await queryRunner.query(`CREATE INDEX IDX_vehicles_year ON vehicles(year)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS vehicles`);
    await queryRunner.query(`DROP TABLE IF EXISTS models`);
    await queryRunner.query(`DROP TABLE IF EXISTS brands`);
    await queryRunner.query(`DROP TABLE IF EXISTS users`);
  }
}
