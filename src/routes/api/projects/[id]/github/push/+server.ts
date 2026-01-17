import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { validateUserToken, unauthorizedResponse, getProject } from '$lib/server/pb'
import { github_service } from '$lib/services/github'

// POST /api/projects/[id]/github/push - Push project to GitHub
export const POST: RequestHandler = async ({ request, params }) => {
	const user = await validateUserToken(request)
	if (!user) return unauthorizedResponse()

	const { id } = params
	const project = await getProject(id)
	if (!project) {
		return json({ error: 'Project not found' }, { status: 404 })
	}

	const github_repo = project.settings?.github_repo
	if (!github_repo) {
		return json({ error: 'No GitHub repo linked' }, { status: 400 })
	}

	try {
		const body = await request.json().catch(() => ({}))
		const message = body.message || `Update from darkpearl - ${new Date().toISOString()}`

		const files = [
			{ path: 'src/App.svelte', content: project.frontend_code || '' },
			{ path: 'darkpearl/design.json', content: JSON.stringify(project.design || [], null, 2) },
			{ path: 'darkpearl/content.json', content: JSON.stringify(project.content || [], null, 2) },
			{ path: 'darkpearl/data.json', content: JSON.stringify(project.data || {}, null, 2) }
		]

		await github_service.push_files(
			github_repo.full_name,
			files,
			message,
			github_repo.default_branch
		)

		return json({ success: true, message: 'Pushed to GitHub' })
	} catch (err: any) {
		return json({ error: err.message }, { status: 500 })
	}
}
