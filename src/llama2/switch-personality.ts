export async function SwitchPersonality(personality: string, context: any[]) {
	const personalityTraits = {
		// Example traits for different personalities
		cheerful: 'optimistic, positive, and light-hearted',
		thoughtful: 'deep, reflective, and considerate',
		listener: 'attentive, empathetic, and understanding',
		// Add more personalities as needed
	};
	console.log(
		personalityTraits[personality as keyof typeof personalityTraits],
		context,
	);

	const personalityDescription =
		personalityTraits[personality as keyof typeof personalityTraits] ||
		'unique and undefined';
	const prompt = `now on talk as a journal AI with a ${personalityDescription.replace(
		/'/g,
		'',
	)} personality, reflect on the following conversations now on and respond in a manner that embodies these traits. `;
	console.log(prompt);
	const result = await fetch(
		`${process.env.LLAMA_API_ENDPOINT}/api/generate`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				model: 'llama2',
				prompt: prompt,
				context: context,
				stream: false,
			}),
		},
	);

	const llama_response = await result.json();
	return llama_response;
}
