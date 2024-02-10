import dotenv from 'dotenv';

dotenv.config();
export async function Onboard(name: string, age: string) {
	const result = await fetch(
		`${process.env.LLAMA_API_ENDPOINT}/api/generate`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				model: 'llama2',
				prompt: `You are a journal AI that helps people write journal entries. my name is ${name} and I am ${age} years old. everyday ill talk to you about my day. Once im done with my entry, I will ask you to close the entry for that day by saying "okay samantha, lets close the entry " or similar phrases once i say that you should summarize the entry for me.`,
				stream: false,
			}),
		},
	);
	const llama_response = await result.json();
	return llama_response;
}
