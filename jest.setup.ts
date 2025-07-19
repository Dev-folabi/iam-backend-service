import "reflect-metadata";
import * as dotenv from "dotenv";
import { TestDataSource } from "./src/test.datasource";

dotenv.config({ path: ".env.test" });
process.env.NODE_ENV = "test";

beforeAll(async () => {
  console.log("Initializing TestDataSource...");
  if (!TestDataSource.isInitialized) {
    await TestDataSource.initialize();
    console.log("TestDataSource initialized:", TestDataSource.isInitialized);
    console.log(
      "Entities loaded:",
      TestDataSource.entityMetadatas.map((e) => e.name)
    );
  }
});

afterEach(async () => {
  const entities = TestDataSource.entityMetadatas;
  for (const entity of entities) {
    const repository = TestDataSource.getRepository(entity.name);
    await repository.clear();
  }
});

afterAll(async () => {
  if (TestDataSource.isInitialized) {
    await TestDataSource.destroy();
    console.log("TestDataSource destroyed");
  }
});
