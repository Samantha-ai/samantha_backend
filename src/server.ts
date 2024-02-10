import ExpressConfig from './Express/express.config.js';
import bodyParser from 'body-parser';
import { Onboard } from './llama2/onboard.js';
import { mongoClient } from './mongoclient.js';
import { Chat } from './llama2/chat.js';
import { GenerateEmbeddings } from './llama2/generate_embeddings.js';
import dotenv from 'dotenv';
import { areSameDay } from './utils/check-timestamps.js';

dotenv.config();
const app = ExpressConfig();
const PORT = process.env.PORT || 8000;
var urlencodedParser = bodyParser.urlencoded({ extended: false });
app.use(bodyParser.json());

app.post('/onboarding', urlencodedParser, async function (req, res) {
	const llama_response = await Onboard(req.body.name, req.body.age);

	const response = {
		first_name: req.body.name,
		last_name: req.body.age,
		content: llama_response.response,
	};
	const db = mongoClient.db('journal');
	const conversations = db.collection('conversations');
	const embeddings = await GenerateEmbeddings(llama_response.response);
	const doc = {
		conversation: llama_response.response,
		context: llama_response.context,
		convo_embedding: embeddings,
		entry_time: Date.now(),
	};
	await conversations.insertOne(doc);
	res.end(JSON.stringify(response));
});

app.post('/chat', urlencodedParser, async function (req, res) {
	const db = mongoClient.db('journal');
	const conversations = db.collection('conversations');

	const context = await conversations
		.find({})
		.sort({ entry_time: -1 })
		.toArray();

	const llama_response = await Chat(req.body.message, context[0].context);
	const embeddings = await GenerateEmbeddings(llama_response.response);

	const doc = {
		conversation: llama_response.response,
		context: llama_response.context,
		convo_embedding: embeddings,
		entry_time: Date.now(),
	};
	await conversations.insertOne(doc);

	res.end(JSON.stringify({ response: llama_response.response }));
});

app.post('/switch-personality', urlencodedParser, async function (req, res) {
	const db = mongoClient.db('journal');

	const conversations = db.collection('conversations');

	const context = await conversations
		.find({})
		.sort({ entry_time: -1 })
		.toArray();

	const llama_response = await Chat(req.body.personality, context[0].context);
	const embeddings = await GenerateEmbeddings(llama_response.response);

	const doc = {
		conversation: llama_response.response,
		context: llama_response.context,
		convo_embedding: embeddings,
		entry_time: Date.now(),
	};
	await conversations.insertOne(doc);

	res.end(JSON.stringify({ response: llama_response.response }));
});

app.post('/submit-daily-entry', urlencodedParser, async function (_req, res) {
	const db = mongoClient.db('journal');
	const journal_entries = db.collection('journal_entries');
	const conversations = db.collection('conversations');

	const context = await conversations
		.find({})
		.sort({ entry_time: -1 })
		.toArray();

	const llama_response = await Chat(
		'okay samantha lets mark this entry for today, please reply with the summarisation what did i do for the day in bullet points, remember only reply with summary no salutaion or anything',
		context[0].context,
	);

	const doc = {
		entry: llama_response.response,
		entry_time: Date.now(),
	};
	await journal_entries.insertOne(doc);

	res.end(JSON.stringify({ response: llama_response.response }));
});

app.post('/semantic-search', urlencodedParser, async function (req, res) {
	const db = mongoClient.db('journal');
	const conversations = db.collection('conversations');
	const e = await GenerateEmbeddings(req.body.message);

	const vector_search_result = conversations
		.aggregate([
			{
				$vectorSearch: {
					index: 'ConvoVectorSearch',
					path: 'convo_embedding',
					queryVector: e,
					numCandidates: 100,
					limit: 2,
				},
			},
		])
		.toArray();

	const response = await vector_search_result;

	res.end(JSON.stringify({ response: response, status: 'OK' }));
});

app.get('/journal-entry/:timestamp', async function (req, res) {
	const db = mongoClient.db('journal');
	const entries = await db.collection('journal_entries').find({}).toArray();
	const entry = entries.find(
		(entry) =>
			areSameDay(entry.entry_time, parseInt(req.params.timestamp)) ===
			true,
	);

	res.end(
		JSON.stringify({
			response: entry || '',
			status: 'OK',
		}),
	);
});

app.listen(PORT, () => console.log('Server Running on Port ' + PORT));
