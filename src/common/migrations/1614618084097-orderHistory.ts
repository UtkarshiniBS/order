import {MigrationInterface, QueryRunner, Table} from "typeorm";
import { StorageType } from "../entityTypes/orderHistoryEntity.type";

export class orderHistory1614618084097 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: "orderHistory",
            columns: [
                {
                    name: "id",
                    type: "int",
                    isPrimary: true
                },
                {
                    name: "file_path",
                    type: "varchar",
                },
                {
                    name: "storage_type",
                    type: "enum",
                    enum: Object.values(StorageType)
                },
                {
                    name: "from_date",
                    type: "date",
                },
                {
                    name: "to_date",
                    type: "date",
                },
                {
                    name: "panelist_id",
                    type: "varchar",
                },
                {
                    name: "amazon_id",
                    type: "varchar",
                }
            ]
        }), true)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("orderHistory");
    }

}
