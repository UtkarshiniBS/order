import {MigrationInterface, QueryRunner, Table} from "typeorm";

export class piiDetails1614618066872 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: "piiDetails",
            columns: [
                {
                    name: "id",
                    type: "int",
                    isPrimary: true
                },
                {
                    name: "attributes",
                    type: "varchar",
                },
                {
                    name: "status",
                    type: "boolean",
                }
            ]
        }), true)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("piiDetails");
    }

}
