import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'
import { getProjectByDomain, isSetupComplete, pb } from '$lib/server/pb'

export const load: PageServerLoad = async ({ locals }) => {
	// Check if setup is needed first
	const setup_complete = await isSetupComplete()
	if (!setup_complete) {
		throw redirect(302, '/setup')
	}

	const domain = locals.domain

	// Try to find a project for this domain
	const project = await getProjectByDomain(domain)

	if (project) {
		// If project has published HTML, redirect to serve it via the server endpoint
		if (project.published_html) {
			// Redirect to a special endpoint that serves the production app
			throw redirect(302, '/_serve')
		}

		// If no compiled HTML yet, redirect to builder
		throw redirect(302, '/darkpearl/studio')
	}

	// No project for this domain - show landing page
	return {}
}
