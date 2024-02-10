import ExpressConfig from './Express/express.config.js';
import bodyParser from 'body-parser';
import { Onboard } from './ai/onboard.js';
import { mongoClient } from './mongoclient.js';
import { Chat } from './ai/chat.js';
import { GenerateEmbeddings } from './ai/generate_embeddings.js';
import dotenv from 'dotenv';
import { areSameDay } from './utils/check-timestamps.js';
// import { SwitchPersonality } from './llama2/switch-personality.js';
import cors from 'cors';

dotenv.config();
const app = ExpressConfig();
const PORT = process.env.PORT || 8000;
var urlencodedParser = bodyParser.urlencoded({ extended: false });
app.use(bodyParser.json());
app.use(cors());

app.post('/onboarding', urlencodedParser, async function (req, res) {
	const onboard_response = await Onboard(
		req.body.name,
		req.body.age,
		req.body.model,
	);

	const response = {
		first_name: req.body.name,
		last_name: req.body.age,
		content: onboard_response.response,
	};

	if (req.body.model === 'llama2') {
		const db = mongoClient.db('journal');
		const conversations = db.collection('conversations');
		const embeddings = await GenerateEmbeddings(onboard_response.response);
		const doc = {
			conversation: onboard_response.response,
			context: onboard_response.context,
			convo_embedding: embeddings,
			entry_time: Date.now(),
		};
		await conversations.insertOne(doc);
		res.end(JSON.stringify(response));
	} else {
		const db = mongoClient.db('journal');
		const mistral_conversations = db.collection('mistral_conversations');
		const embeddings = await GenerateEmbeddings(onboard_response.response);
		const doc = {
			conversation: onboard_response.response,
			context: onboard_response.context,
			convo_embedding: embeddings,
			entry_time: Date.now(),
		};
		await mistral_conversations.insertOne(doc);
		res.end(JSON.stringify(response));
	}
});

app.post('/chat', urlencodedParser, async function (req, res) {
	const db = mongoClient.db('journal');

	if (req.body.model === 'llama2') {
		const conversations = db.collection('conversations');

		const context = await conversations
			.find({})
			.sort({ entry_time: -1 })
			.toArray();

		const llama_response = await Chat(
			req.body.message,
			context[0].context,
			'llama2',
		);
		const embeddings = await GenerateEmbeddings(llama_response.response);

		const doc = {
			conversation: llama_response.response,
			context: llama_response.context,
			convo_embedding: embeddings,
			entry_time: Date.now(),
		};
		await conversations.insertOne(doc);

		res.end(JSON.stringify({ response: llama_response.response }));
	} else {
		const conversations = db.collection('mistral_conversations');

		const context = await conversations
			.find({})
			.sort({ entry_time: -1 })
			.toArray();

		const mistral_response = await Chat(
			req.body.message,
			context[0].context,
			'mistral',
		);
		const embeddings = await GenerateEmbeddings(mistral_response.response);

		const doc = {
			conversation: mistral_response.response,
			context: mistral_response.context,
			convo_embedding: embeddings,
			entry_time: Date.now(),
		};
		await conversations.insertOne(doc);

		res.end(JSON.stringify({ response: mistral_response.response }));
	}
});

// app.post('/switch-personality', urlencodedParser, async function (req, res) {
// 	const db = mongoClient.db('journal');
// 	const conversations = db.collection('conversations');

// 	const context = await conversations
// 		.find({})
// 		.sort({ entry_time: -1 })
// 		.toArray();

// 	const llama_response = await SwitchPersonality(
// 		req.body.personality,
// 		context[0].context,
// 	);

// 	res.end(JSON.stringify({ response: llama_response.response }));
// });

app.post('/submit-daily-entry', urlencodedParser, async function (req, res) {
	const db = mongoClient.db('journal');
	if (req.body.model === 'llama2') {
		const journal_entries = db.collection('journal_entries');
		const conversations = db.collection('conversations');

		const context = await conversations
			.find({})
			.sort({ entry_time: -1 })
			.toArray();

		const llama_response = await Chat(
			'okay samantha lets mark this entry for today, please reply with the summarisation what did i do for the day in bullet points, remember only reply with summary no salutaion or anything',
			context[0].context,
			'llama2',
		);

		const doc = {
			entry: llama_response.response,
			entry_time: Date.now(),
		};
		await journal_entries.insertOne(doc);

		res.end(JSON.stringify({ response: llama_response.response }));
	} else {
		const journal_entries = db.collection('mistral_journal_entries');
		const conversations = db.collection('mistral_conversations');

		const context = await conversations
			.find({})
			.sort({ entry_time: -1 })
			.toArray();

		const mistral_response = await Chat(
			'okay john lets mark this entry for today, please reply with the summarisation what did i do for the day in bullet points, remember only reply with summary no salutaion or anything',
			context[0].context,
			'mistral',
		);

		const doc = {
			entry: mistral_response.response,
			entry_time: Date.now(),
		};
		await journal_entries.insertOne(doc);

		res.end(JSON.stringify({ response: mistral_response.response }));
	}
});

app.post('/semantic-search', urlencodedParser, async function (req, res) {
	const db = mongoClient.db('journal');
	if (req.body.model === 'llama2') {
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
	} else {
		const conversations = db.collection('mistral_conversations');
		const e = await GenerateEmbeddings(req.body.message);

		const vector_search_result = conversations
			.aggregate([
				{
					$vectorSearch: {
						index: 'MistralConvoVectorSearch',
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
	}
});

app.get('/journal-entry/:model/:timestamp', async function (req, res) {
	const db = mongoClient.db('journal');
	if (req.params.model === 'llama2') {
		const entries = await db
			.collection('journal_entries')
			.find({})
			.toArray();
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
	} else {
		const entries = await db
			.collection('mistral_journal_entries')
			.find({})
			.toArray();
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
	}
});

app.listen(PORT, () => console.log('Server Running on Port ' + PORT));
