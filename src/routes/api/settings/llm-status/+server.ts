import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { validateUserToken, unauthorizedResponse } from '$lib/server/pb'
import { env } from '$env/dynamic/private'

// GET /api/settings/llm-status - Check if LLM is configured (platform-provided)
export const GET: RequestHandler = async ({ request }) => {
	const user = await validateUserToken(request)
	if (!user) {
		return unauthorizedResponse('Authentication required')
	}

	// LLM is configured via environment variables by the platform
	const has_env_key = !!(env.LLM_API_KEY)

	return json({
		configured: has_env_key,
		source: has_env_key ? 'platform' : null
	})
}
