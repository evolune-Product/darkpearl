import { redirect } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { github_service } from '$lib/services/github'

// GET /api/auth/github - Start OAuth flow
export const GET: RequestHandler = async ({ cookies }) => {
	if (!github_service.is_configured()) {
		return new Response(JSON.stringify({ error: 'GitHub OAuth not configured' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		})
	}

	// Generate state for CSRF protection
	const state = crypto.randomUUID()
	cookies.set('github_oauth_state', state, {
		path: '/',
		httpOnly: true,
		secure: true,
		sameSite: 'lax',
		maxAge: 600 // 10 minutes
	})

	const auth_url = github_service.get_auth_url(state)
	throw redirect(302, auth_url)
}
