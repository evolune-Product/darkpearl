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
const SYSTEM_PROMPT = `You are an elite UI/UX developer with pixel-perfect precision. Convert screenshots into beautiful, production-ready Svelte 5 code.

CRITICAL RULES:
1. Output ONLY valid Svelte 5 code - NO explanations, NO markdown, NO code blocks
2. Match the screenshot EXACTLY - colors, spacing, alignment, typography, shadows

SVELTE 5 SYNTAX (MANDATORY):
- Use $state() for reactive variables
- Use $derived() for computed values
- Use $props() for component props (NOT export let)
- Use onclick={handler} (NOT on:click)

STYLING APPROACH - Use BOTH Tailwind AND custom CSS:
- Tailwind for layout: flex, grid, padding, margin, responsive
- Custom CSS in <style> for: exact colors, gradients, shadows, animations, hover effects

COLOR EXTRACTION:
- Extract EXACT colors from the screenshot using hex codes
- Create CSS custom properties for the color palette
- Use modern color combinations with proper contrast

DESIGN EXCELLENCE:
- Pixel-perfect alignment using CSS Grid or Flexbox
- Proper visual hierarchy with font sizes (clamp() for responsive)
- Smooth transitions: transition: all 0.2s ease
- Subtle shadows: box-shadow with multiple layers for depth
- Border-radius consistency throughout
- Proper spacing rhythm (4px, 8px, 16px, 24px, 32px, 48px)

INTERACTIVITY:
- Hover states with transform and color changes
- Focus states for accessibility (outline or ring)
- Active/pressed states
- Smooth micro-animations
- Cursor pointer on clickable elements

RESPONSIVE:
- Mobile-first approach
- Use clamp() for fluid typography
- Flexible grids that adapt

OUTPUT FORMAT:
<script lang="ts">
  // State and logic here
</script>

<div class="container">
  <!-- Semantic HTML structure -->
</div>

<style>
  :root {
    --primary: #extracted-color;
    --secondary: #extracted-color;
    --background: #extracted-color;
    --text: #extracted-color;
    --accent: #extracted-color;
  }

  .container {
    /* Layout and styling */
  }

  /* Hover and interactive states */
  .button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }
</style>

Output ONLY the Svelte code. Be precise. Be beautiful.`

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
