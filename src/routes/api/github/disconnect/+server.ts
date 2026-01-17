import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { validateUserToken, unauthorizedResponse } from '$lib/server/pb'
import { github_service } from '$lib/services/github'

// POST /api/github/disconnect - Disconnect GitHub
export const POST: RequestHandler = async ({ request }) => {
	const user = await validateUserToken(request)
	if (!user) return unauthorizedResponse()

	await github_service.delete_auth()
	return json({ success: true })
}
