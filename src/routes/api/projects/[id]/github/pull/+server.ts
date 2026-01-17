import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { validateUserToken, unauthorizedResponse, getProject, updateProject, createSnapshot } from '$lib/server/pb'
import { github_service } from '$lib/services/github'

// POST /api/projects/[id]/github/pull - Pull from GitHub to project
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
		// Create safety snapshot before pull
		await createSnapshot(id, 'Before GitHub pull')

		const branch = github_repo.default_branch

		// Pull files
		const code = await github_service.get_file(github_repo.full_name, 'src/App.svelte', branch)
		const design_str = await github_service.get_file(github_repo.full_name, 'darkpearl/design.json', branch)
		const content_str = await github_service.get_file(github_repo.full_name, 'darkpearl/content.json', branch)
		const data_str = await github_service.get_file(github_repo.full_name, 'darkpearl/data.json', branch)

		const updates: any = {}
		if (code !== null) updates.frontend_code = code
		if (design_str) {
			try { updates.design = JSON.parse(design_str) } catch {}
		}
		if (content_str) {
			try { updates.content = JSON.parse(content_str) } catch {}
		}
		if (data_str) {
			try { updates.data = JSON.parse(data_str) } catch {}
		}

		if (Object.keys(updates).length > 0) {
			await updateProject(id, updates)
		}

		return json({ success: true, message: 'Pulled from GitHub', updated: Object.keys(updates) })
	} catch (err: any) {
		return json({ error: err.message }, { status: 500 })
	}
}
