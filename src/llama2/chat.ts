import dotenv from 'dotenv';

dotenv.config();

export async function Chat(message: string, context: any[], model: string) {
	const result = await fetch(
		`${process.env.LLAMA_API_ENDPOINT}/api/generate`,
		{
			method: 'POST',
			cache: 'no-store',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				model: model,
				prompt: `${message}`,
				context: context,
				stream: false,
			}),
		},
	);
	const llama_response = await result.json();
	return llama_response;
}
