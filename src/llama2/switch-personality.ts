import dotenv from 'dotenv';

dotenv.config();

export async function Chat(personality: string, context: any[]) {
	const result = await fetch(
		`${process.env.LLAMA_API_ENDPOINT}/api/generate`,
		{
			method: 'POST',
			cache: 'no-store',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				model: 'llama2',
				prompt: `Hi samantha you should switch to ${personality} personality, now on to talk to me. You should make sure the major traits of ${personality} personality are reflected in your responses.You should response everything in the new personality of yours, even though AI cant have emotions you can make use of trained data on personalities`,
				context: context,
				stream: false,
			}),
		},
	);
	const llama_response = await result.json();
	return llama_response;
}
