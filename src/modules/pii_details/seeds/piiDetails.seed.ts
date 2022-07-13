import { Connection } from "typeorm";
import { Seeder, Factory } from "typeorm-seeding";
import { PiiDetailsEntity } from "../entity/piiDetails.entity";

export default class CreatePiiAttributes implements Seeder {
    public async run(factory: Factory, connection: Connection): Promise<any> {
        // for (let index = 0; index < array.length; index++) {
        //     const element = array[index];
        //     await factory(PiiDetailsEntity)();
        // }
        // await factory(PiiDetailsEntity)().createMany(3)
        const piiAttribute = await connection
            .getRepository(PiiDetailsEntity)
            .createQueryBuilder()
            .getCount();
            
        if (!piiAttribute) {
            await connection
                .createQueryBuilder()
                .insert()
                .into(PiiDetailsEntity)
                .values([
                    { id: 1, attributes: "sffd", status: false },
                ])
                .execute()
        }
    }
}