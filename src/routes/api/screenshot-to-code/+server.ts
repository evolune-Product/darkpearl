import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { env } from '$env/dynamic/private'
import { validateUserToken, unauthorizedResponse } from '$lib/server/pb'

// LLM configuration from environment variables
const LLM_PROVIDER = env.LLM_PROVIDER || 'anthropic'
const LLM_API_KEY = env.LLM_API_KEY || ''
const LLM_MODEL = env.LLM_MODEL || 'claude-sonnet-4-20250514'
const LLM_BASE_URL = env.LLM_BASE_URL

// System prompt for screenshot to code conversion
const SYSTEM_PROMPT = `You are an expert UI developer. Convert screenshots into production-ready Svelte 5 code.

ABSOLUTELY CRITICAL - READ THIS FIRST:
- Output ONLY raw Svelte code
- NEVER wrap code in markdown code blocks (\`\`\`svelte or \`\`\`)
- NEVER add explanations before or after the code
- Start your response directly with <script lang="ts"> or the first HTML element
- End your response with </style> or the last HTML element

SVELTE 5 SYNTAX RULES:
- let count = $state(0) for reactive state
- let doubled = $derived(count * 2) for computed
- let { prop = default } = $props() for props
- onclick={handler} NOT on:click={handler}

STRUCTURE YOUR OUTPUT EXACTLY LIKE THIS:
<script lang="ts">
  let selected = $state('option1')

  function handleSelect(value: string) {
    selected = value
  }
</script>

<div class="container">
  <h1 class="title">Title Text</h1>
  <div class="cards">
    <button class="card" onclick={() => handleSelect('a')}>
      <span class="icon">Icon</span>
      <span class="label">Label</span>
    </button>
  </div>
</div>

<style>
  .container {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 2rem;
    background: #ffffff;
  }

  .card {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1.5rem;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    background: white;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .card:hover {
    border-color: #10b981;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }
</style>

DESIGN REQUIREMENTS:
- Extract exact colors from screenshot as hex codes
- Match spacing, alignment, and proportions precisely
- Use Tailwind for layout (flex, grid, p-*, m-*, gap-*)
- Use <style> block for colors, shadows, animations
- Add hover/focus states for interactive elements
- Use semantic HTML (button, nav, main, section)

REMEMBER: Raw Svelte code only. No markdown. No backticks. No explanations.`

export const POST: RequestHandler = async ({ request }) => {
	const user = await validateUserToken(request)
	if (!user) return unauthorizedResponse('Authentication required')

	try {
		const { image, image_type, description } = await request.json()

		if (!image) {
			return json({ error: 'Image is required' }, { status: 400 })
		}

		if (!LLM_API_KEY) {
			return json({ error: 'AI service is not configured. Please set up LLM in settings.' }, { status: 503 })
		}

		// Build the prompt
		const userPrompt = description || 'Convert this screenshot to Svelte 5 code with Tailwind CSS'

		// Create streaming response
		const stream = new ReadableStream({
			async start(controller) {
				try {
					let generatedCode = ''

					if (LLM_PROVIDER === 'anthropic') {
						const { createAnthropic } = await import('@ai-sdk/anthropic')
						const { streamText } = await import('ai')

						const anthropic = createAnthropic({ apiKey: LLM_API_KEY })

						const result = streamText({
							model: anthropic(LLM_MODEL),
							system: SYSTEM_PROMPT,
							messages: [
								{
									role: 'user',
									content: [
										{
											type: 'image',
											image: `data:${image_type};base64,${image}`
										},
										{
											type: 'text',
											text: userPrompt
										}
									]
								}
							],
							maxTokens: 8000
						})

						for await (const chunk of (await result).textStream) {
							generatedCode += chunk
							controller.enqueue(
								new TextEncoder().encode(`data: ${JSON.stringify({ chunk })}\n\n`)
							)
						}
					} else if (LLM_PROVIDER === 'openai') {
						const { createOpenAI } = await import('@ai-sdk/openai')
						const { streamText } = await import('ai')

						const openai = createOpenAI({
							apiKey: LLM_API_KEY,
							baseURL: LLM_BASE_URL
						})

						const result = streamText({
							model: openai(LLM_MODEL),
							system: SYSTEM_PROMPT,
							messages: [
								{
									role: 'user',
									content: [
										{
											type: 'image',
											image: `data:${image_type};base64,${image}`
										},
										{
											type: 'text',
											text: userPrompt
										}
									]
								}
							],
							maxTokens: 8000
						})

						for await (const chunk of (await result).textStream) {
							generatedCode += chunk
							controller.enqueue(
								new TextEncoder().encode(`data: ${JSON.stringify({ chunk })}\n\n`)
							)
						}
					} else if (LLM_PROVIDER === 'gemini') {
						const { createGoogleGenerativeAI } = await import('@ai-sdk/google')
						const { streamText } = await import('ai')

						const google = createGoogleGenerativeAI({ apiKey: LLM_API_KEY })

						const result = streamText({
							model: google(LLM_MODEL),
							system: SYSTEM_PROMPT,
							messages: [
								{
									role: 'user',
									content: [
										{
											type: 'image',
											image: `data:${image_type};base64,${image}`
										},
										{
											type: 'text',
											text: userPrompt
										}
									]
								}
							],
							maxTokens: 8000
						})

						for await (const chunk of (await result).textStream) {
							generatedCode += chunk
							controller.enqueue(
								new TextEncoder().encode(`data: ${JSON.stringify({ chunk })}\n\n`)
							)
						}
					} else {
						throw new Error(`Unsupported LLM provider: ${LLM_PROVIDER}`)
					}

					// Send final code
					controller.enqueue(
						new TextEncoder().encode(`data: ${JSON.stringify({ code: generatedCode })}\n\n`)
					)
					controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
					controller.close()
				} catch (error) {
					console.error('[Screenshot-to-Code] Error:', error)
					const errorMessage = error instanceof Error ? error.message : 'Unknown error'
					controller.enqueue(
						new TextEncoder().encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`)
					)
					controller.close()
				}
			}
		})

		return new Response(stream, {
			headers: {
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache',
				Connection: 'keep-alive'
			}
		})
	} catch (error) {
		console.error('[Screenshot-to-Code] Request error:', error)
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to process request' },
			{ status: 500 }
		)
	}
}
