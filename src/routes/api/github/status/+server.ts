import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { validateUserToken, unauthorizedResponse } from '$lib/server/pb'
import { github_service } from '$lib/services/github'

// GET /api/github/status - Check GitHub connection status
export const GET: RequestHandler = async ({ request }) => {
	const user = await validateUserToken(request)
	if (!user) return unauthorizedResponse()

	const status = await github_service.get_status()
	return json({
		...status,
		configured: github_service.is_configured()
	})
}
