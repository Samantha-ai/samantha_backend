import { MongoClient, ServerApiVersion } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

export const mongoClient = new MongoClient(process.env.MONGO_URI!, {
	serverApi: {
		version: ServerApiVersion.v1,
		strict: false,
		deprecationErrors: true,
	},
});
