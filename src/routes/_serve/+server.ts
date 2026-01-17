import { redirect } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { getProjectByDomain, pb } from '$lib/server/pb'

export const GET: RequestHandler = async ({ locals }) => {
	const domain = locals.domain

	// Try to find a project for this domain
	const project = await getProjectByDomain(domain)

	if (project && project.published_html) {
		// Serve the production app (compiled HTML from file attachment)
		const file_url = pb.files.getURL(project, project.published_html)
		const response = await fetch(file_url)
		if (response.ok) {
			const html = await response.text()
			return new Response(html, {
				headers: {
					'Content-Type': 'text/html; charset=utf-8'
				}
			})
		}
	}

	// Fallback to landing page
	throw redirect(302, '/')
}
