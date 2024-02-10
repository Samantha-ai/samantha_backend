export async function GenerateEmbeddings(message: string) {
	const embedding_url =
		'https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2';
	const hf_token = process.env.HF_ACCESS_TOKEN;
	const result = await fetch(embedding_url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${hf_token}`,
		},
		body: JSON.stringify({
			inputs: `${message}`,
		}),
	});
	const llama_response = await result.json();
	return llama_response;
}
