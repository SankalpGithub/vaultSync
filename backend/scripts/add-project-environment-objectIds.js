import mongoose, { Types } from "mongoose";
import { env } from "../src/configs/env.config.js";
const isDryRun = process.argv.includes("--dry-run");
const migrateProjectEnvironmentIds = async () => {
    await mongoose.connect(env.MONGO_URI);
    const projectsCollection = mongoose.connection.collection("projects");
    const cursor = projectsCollection.find({
        "environments._id": { $exists: false },
    });
    let updatedCount = 0;
    const operations = [];
    for await (const project of cursor) {
        const environments = Array.isArray(project.environments)
            ? project.environments.map((environment) => ({
                ...environment,
                _id: environment._id instanceof Types.ObjectId
                    ? environment._id
                    : new Types.ObjectId(),
            }))
            : [];
        if (isDryRun) {
            console.log(`Would update project ${project._id.toString()} with ${environments.length} environment IDs`);
        }
        else {
            operations.push({
                updateOne: {
                    filter: { _id: project._id },
                    update: { $set: { environments } },
                },
            });
        }
        updatedCount += 1;
    }
    if (!isDryRun && operations.length > 0) {
        const result = await projectsCollection.bulkWrite(operations);
        console.log(`Updated ${result.modifiedCount} projects`);
    }
    else if (isDryRun) {
        console.log(`Dry run matched ${updatedCount} projects`);
    }
    else {
        console.log("No projects require migration");
    }
};
migrateProjectEnvironmentIds()
    .catch((error) => {
    console.error("Environment ID migration failed:", error);
    process.exitCode = 1;
})
    .finally(async () => {
    await mongoose.disconnect();
});
//# sourceMappingURL=add-project-environment-objectIds.js.map