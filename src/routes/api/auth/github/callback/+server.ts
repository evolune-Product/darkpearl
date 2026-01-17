import { redirect } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { github_service } from '$lib/services/github'
import type { GitHubAuth } from '../../../../darkpearl/types'

// GET /api/auth/github/callback - Handle OAuth callback
export const GET: RequestHandler = async ({ url, cookies }) => {
	const code = url.searchParams.get('code')
	const state = url.searchParams.get('state')
	const error = url.searchParams.get('error')
	const saved_state = cookies.get('github_oauth_state')

	// Clear state cookie
	cookies.delete('github_oauth_state', { path: '/' })

	if (error) {
		throw redirect(302, `/darkpearl/settings?github_error=${encodeURIComponent(error)}`)
	}

	if (!code || !state || state !== saved_state) {
		throw redirect(302, '/darkpearl/settings?github_error=invalid_state')
	}

	try {
		// Exchange code for token
		const token_data = await github_service.exchange_code(code)

		// Get user info
		const user = await github_service.get_user(token_data.access_token)

		// Save auth
		const auth: GitHubAuth = {
			access_token: token_data.access_token,
			user_id: user.id,
			username: user.login,
			avatar_url: user.avatar_url,
			connected_at: new Date().toISOString()
		}

		await github_service.save_auth(auth)

		throw redirect(302, '/darkpearl/settings?github_success=true')
	} catch (err: any) {
		if (err?.status === 302) throw err // Re-throw redirects
		console.error('[GitHub OAuth] Error:', err)
		throw redirect(302, `/darkpearl/settings?github_error=${encodeURIComponent(err.message || 'unknown')}`)
	}
}
