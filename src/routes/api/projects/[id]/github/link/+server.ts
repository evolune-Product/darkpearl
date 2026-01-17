import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { validateUserToken, unauthorizedResponse, getProject, updateProject } from '$lib/server/pb'
import { github_service } from '$lib/services/github'
import type { GitHubRepoLink } from '../../../../../darkpearl/types'

// POST /api/projects/[id]/github/link - Link project to GitHub repo
export const POST: RequestHandler = async ({ request, params }) => {
	const user = await validateUserToken(request)
	if (!user) return unauthorizedResponse()

	const { id } = params
	const project = await getProject(id)
	if (!project) {
		return json({ error: 'Project not found' }, { status: 404 })
	}

	try {
		const { repo_full_name } = await request.json()
		const repo = await github_service.get_repo(repo_full_name)

		const github_repo: GitHubRepoLink = {
			owner: repo.owner.login,
			name: repo.name,
			full_name: repo.full_name,
			default_branch: repo.default_branch
		}

		await updateProject(id, {
			settings: { ...project.settings, github_repo }
		})

		return json({ success: true, github_repo })
	} catch (err: any) {
		return json({ error: err.message }, { status: 500 })
	}
}

// DELETE /api/projects/[id]/github/link - Unlink project from GitHub
export const DELETE: RequestHandler = async ({ request, params }) => {
	const user = await validateUserToken(request)
	if (!user) return unauthorizedResponse()

	const { id } = params
	const project = await getProject(id)
	if (!project) {
		return json({ error: 'Project not found' }, { status: 404 })
	}

	const { github_repo, ...rest_settings } = project.settings || {}
	await updateProject(id, { settings: rest_settings })

	return json({ success: true })
}
