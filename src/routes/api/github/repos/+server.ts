import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { validateUserToken, unauthorizedResponse } from '$lib/server/pb'
import { github_service } from '$lib/services/github'

// GET /api/github/repos - List user's repositories
export const GET: RequestHandler = async ({ request }) => {
	const user = await validateUserToken(request)
	if (!user) return unauthorizedResponse()

	try {
		const repos = await github_service.list_repos()
		return json(repos)
	} catch (err: any) {
		return json({ error: err.message }, { status: 500 })
	}
}

// POST /api/github/repos - Create new repository
export const POST: RequestHandler = async ({ request }) => {
	const user = await validateUserToken(request)
	if (!user) return unauthorizedResponse()

	try {
		const { name, private: is_private, description } = await request.json()
		const repo = await github_service.create_repo(name, is_private ?? true, description)
		return json(repo)
	} catch (err: any) {
		return json({ error: err.message }, { status: 500 })
	}
}
