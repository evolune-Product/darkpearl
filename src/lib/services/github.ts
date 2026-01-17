/**
 * GitHub Service - Server-side GitHub API operations
 *
 * This module provides GitHub OAuth and API operations.
 * It handles authentication, repository management, and file operations.
 *
 * Usage (server-side only):
 *   import { github_service } from '$lib/services/github'
 *
 *   // Get OAuth URL
 *   const url = github_service.get_auth_url(state)
 *
 *   // Exchange code for token
 *   const token = await github_service.exchange_code(code)
 */

import { env } from '$env/dynamic/private'
import { pb, ensureAuth } from '$lib/server/pb'
import type { GitHubAuth, GitHubUser, GitHubRepo, GitHubRepoLink } from '../../routes/darkpearl/types'

const GITHUB_API = 'https://api.github.com'
const GITHUB_OAUTH_URL = 'https://github.com/login/oauth/authorize'
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token'

const SETTINGS_COLLECTION = '_dp_settings'
const GITHUB_AUTH_KEY = 'github_auth'

/**
 * Get GitHub OAuth configuration from environment
 */
function get_github_config() {
	return {
		client_id: env.GITHUB_CLIENT_ID || '',
		client_secret: env.GITHUB_CLIENT_SECRET || '',
		redirect_uri: env.GITHUB_REDIRECT_URI || ''
	}
}

/**
 * Check if GitHub OAuth is configured
 */
export function is_github_configured(): boolean {
	const config = get_github_config()
	return !!(config.client_id && config.client_secret && config.redirect_uri)
}

/**
 * GitHub service for server-side operations
 */
export const github_service = {
	/**
	 * Check if GitHub OAuth is configured in environment
	 */
	is_configured(): boolean {
		return is_github_configured()
	},

	/**
	 * Get the GitHub OAuth authorization URL
	 */
	get_auth_url(state: string): string {
		const config = get_github_config()
		if (!config.client_id) {
			throw new Error('GitHub OAuth not configured: GITHUB_CLIENT_ID missing')
		}

		const params = new URLSearchParams({
			client_id: config.client_id,
			redirect_uri: config.redirect_uri,
			scope: 'repo read:user',
			state,
			allow_signup: 'true'
		})

		return `${GITHUB_OAUTH_URL}?${params.toString()}`
	},

	/**
	 * Exchange OAuth code for access token
	 */
	async exchange_code(code: string): Promise<{ access_token: string; token_type: string; scope: string }> {
		const config = get_github_config()
		if (!config.client_id || !config.client_secret) {
			throw new Error('GitHub OAuth not configured')
		}

		const response = await fetch(GITHUB_TOKEN_URL, {
			method: 'POST',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				client_id: config.client_id,
				client_secret: config.client_secret,
				code,
				redirect_uri: config.redirect_uri
			})
		})

		if (!response.ok) {
			throw new Error(`GitHub token exchange failed: ${response.status}`)
		}

		const data = await response.json()
		if (data.error) {
			throw new Error(`GitHub OAuth error: ${data.error_description || data.error}`)
		}

		return data
	},

	/**
	 * Get authenticated user info from GitHub
	 */
	async get_user(access_token: string): Promise<GitHubUser> {
		const response = await fetch(`${GITHUB_API}/user`, {
			headers: {
				'Authorization': `Bearer ${access_token}`,
				'Accept': 'application/vnd.github+json',
				'X-GitHub-Api-Version': '2022-11-28'
			}
		})

		if (!response.ok) {
			throw new Error(`GitHub API error: ${response.status}`)
		}

		return response.json()
	},

	/**
	 * Save GitHub auth to Pocketbase settings
	 */
	async save_auth(auth: GitHubAuth): Promise<void> {
		const authed = await ensureAuth()
		if (!authed) {
			throw new Error('Server not authenticated to Pocketbase')
		}

		try {
			// Try to update existing record
			await pb.collection(SETTINGS_COLLECTION).update(GITHUB_AUTH_KEY, {
				value: auth
			})
		} catch {
			// Create new record if it doesn't exist
			await pb.collection(SETTINGS_COLLECTION).create({
				id: GITHUB_AUTH_KEY,
				value: auth
			})
		}
	},

	/**
	 * Get stored GitHub auth from Pocketbase
	 */
	async get_auth(): Promise<GitHubAuth | null> {
		const authed = await ensureAuth()
		if (!authed) return null

		try {
			const record = await pb.collection(SETTINGS_COLLECTION).getOne(GITHUB_AUTH_KEY)
			return record?.value as GitHubAuth || null
		} catch {
			return null
		}
	},

	/**
	 * Delete GitHub auth from Pocketbase (disconnect)
	 */
	async delete_auth(): Promise<void> {
		const authed = await ensureAuth()
		if (!authed) {
			throw new Error('Server not authenticated to Pocketbase')
		}

		try {
			await pb.collection(SETTINGS_COLLECTION).delete(GITHUB_AUTH_KEY)
		} catch {
			// Ignore if record doesn't exist
		}
	},

	/**
	 * Get connection status
	 */
	async get_status(): Promise<{ connected: boolean; username?: string; avatar_url?: string; user_id?: number }> {
		const auth = await this.get_auth()
		if (!auth) {
			return { connected: false }
		}

		// Verify token is still valid
		try {
			await this.get_user(auth.access_token)
			return {
				connected: true,
				username: auth.username,
				avatar_url: auth.avatar_url,
				user_id: auth.user_id
			}
		} catch {
			// Token invalid, clean up
			await this.delete_auth()
			return { connected: false }
		}
	},

	/**
	 * List user's repositories
	 */
	async list_repos(): Promise<GitHubRepo[]> {
		const auth = await this.get_auth()
		if (!auth) {
			throw new Error('GitHub not connected')
		}

		const response = await fetch(`${GITHUB_API}/user/repos?sort=updated&per_page=100`, {
			headers: {
				'Authorization': `Bearer ${auth.access_token}`,
				'Accept': 'application/vnd.github+json',
				'X-GitHub-Api-Version': '2022-11-28'
			}
		})

		if (!response.ok) {
			throw new Error(`GitHub API error: ${response.status}`)
		}

		return response.json()
	},

	/**
	 * Create a new repository
	 */
	async create_repo(name: string, is_private: boolean = true, description?: string): Promise<GitHubRepo> {
		const auth = await this.get_auth()
		if (!auth) {
			throw new Error('GitHub not connected')
		}

		const response = await fetch(`${GITHUB_API}/user/repos`, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${auth.access_token}`,
				'Accept': 'application/vnd.github+json',
				'X-GitHub-Api-Version': '2022-11-28',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				name,
				private: is_private,
				description,
				auto_init: true
			})
		})

		if (!response.ok) {
			const error = await response.json()
			throw new Error(`Failed to create repo: ${error.message || response.status}`)
		}

		return response.json()
	},

	/**
	 * Get file content from a repository
	 */
	async get_file(repo_full_name: string, path: string, branch?: string): Promise<string | null> {
		const auth = await this.get_auth()
		if (!auth) {
			throw new Error('GitHub not connected')
		}

		let url = `${GITHUB_API}/repos/${repo_full_name}/contents/${path}`
		if (branch) {
			url += `?ref=${branch}`
		}

		const response = await fetch(url, {
			headers: {
				'Authorization': `Bearer ${auth.access_token}`,
				'Accept': 'application/vnd.github+json',
				'X-GitHub-Api-Version': '2022-11-28'
			}
		})

		if (response.status === 404) {
			return null
		}

		if (!response.ok) {
			throw new Error(`GitHub API error: ${response.status}`)
		}

		const data = await response.json()
		// Content is base64 encoded
		return Buffer.from(data.content, 'base64').toString('utf-8')
	},

	/**
	 * Get file SHA (needed for updates)
	 */
	async get_file_sha(repo_full_name: string, path: string, branch?: string): Promise<string | null> {
		const auth = await this.get_auth()
		if (!auth) {
			throw new Error('GitHub not connected')
		}

		let url = `${GITHUB_API}/repos/${repo_full_name}/contents/${path}`
		if (branch) {
			url += `?ref=${branch}`
		}

		const response = await fetch(url, {
			headers: {
				'Authorization': `Bearer ${auth.access_token}`,
				'Accept': 'application/vnd.github+json',
				'X-GitHub-Api-Version': '2022-11-28'
			}
		})

		if (response.status === 404) {
			return null
		}

		if (!response.ok) {
			throw new Error(`GitHub API error: ${response.status}`)
		}

		const data = await response.json()
		return data.sha
	},

	/**
	 * Push a file to a repository (create or update)
	 */
	async push_file(
		repo_full_name: string,
		path: string,
		content: string,
		message: string,
		branch?: string
	): Promise<void> {
		const auth = await this.get_auth()
		if (!auth) {
			throw new Error('GitHub not connected')
		}

		// Get existing file SHA if updating
		const sha = await this.get_file_sha(repo_full_name, path, branch)

		const body: any = {
			message,
			content: Buffer.from(content).toString('base64'),
			branch
		}

		if (sha) {
			body.sha = sha
		}

		const response = await fetch(`${GITHUB_API}/repos/${repo_full_name}/contents/${path}`, {
			method: 'PUT',
			headers: {
				'Authorization': `Bearer ${auth.access_token}`,
				'Accept': 'application/vnd.github+json',
				'X-GitHub-Api-Version': '2022-11-28',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(body)
		})

		if (!response.ok) {
			const error = await response.json()
			throw new Error(`Failed to push file: ${error.message || response.status}`)
		}
	},

	/**
	 * Push multiple files to a repository using Git tree API
	 * More efficient for multiple files
	 */
	async push_files(
		repo_full_name: string,
		files: Array<{ path: string; content: string }>,
		message: string,
		branch: string = 'main'
	): Promise<void> {
		const auth = await this.get_auth()
		if (!auth) {
			throw new Error('GitHub not connected')
		}

		// Get the latest commit SHA
		const refResponse = await fetch(`${GITHUB_API}/repos/${repo_full_name}/git/refs/heads/${branch}`, {
			headers: {
				'Authorization': `Bearer ${auth.access_token}`,
				'Accept': 'application/vnd.github+json',
				'X-GitHub-Api-Version': '2022-11-28'
			}
		})

		if (!refResponse.ok) {
			throw new Error(`Failed to get branch ref: ${refResponse.status}`)
		}

		const refData = await refResponse.json()
		const latestCommitSha = refData.object.sha

		// Get the tree SHA from the commit
		const commitResponse = await fetch(`${GITHUB_API}/repos/${repo_full_name}/git/commits/${latestCommitSha}`, {
			headers: {
				'Authorization': `Bearer ${auth.access_token}`,
				'Accept': 'application/vnd.github+json',
				'X-GitHub-Api-Version': '2022-11-28'
			}
		})

		if (!commitResponse.ok) {
			throw new Error(`Failed to get commit: ${commitResponse.status}`)
		}

		const commitData = await commitResponse.json()
		const baseTreeSha = commitData.tree.sha

		// Create blobs for each file
		const treeItems = await Promise.all(files.map(async (file) => {
			const blobResponse = await fetch(`${GITHUB_API}/repos/${repo_full_name}/git/blobs`, {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${auth.access_token}`,
					'Accept': 'application/vnd.github+json',
					'X-GitHub-Api-Version': '2022-11-28',
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					content: file.content,
					encoding: 'utf-8'
				})
			})

			if (!blobResponse.ok) {
				throw new Error(`Failed to create blob for ${file.path}`)
			}

			const blobData = await blobResponse.json()

			return {
				path: file.path,
				mode: '100644',
				type: 'blob',
				sha: blobData.sha
			}
		}))

		// Create new tree
		const treeResponse = await fetch(`${GITHUB_API}/repos/${repo_full_name}/git/trees`, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${auth.access_token}`,
				'Accept': 'application/vnd.github+json',
				'X-GitHub-Api-Version': '2022-11-28',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				base_tree: baseTreeSha,
				tree: treeItems
			})
		})

		if (!treeResponse.ok) {
			throw new Error(`Failed to create tree: ${treeResponse.status}`)
		}

		const treeData = await treeResponse.json()

		// Create commit
		const newCommitResponse = await fetch(`${GITHUB_API}/repos/${repo_full_name}/git/commits`, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${auth.access_token}`,
				'Accept': 'application/vnd.github+json',
				'X-GitHub-Api-Version': '2022-11-28',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				message,
				tree: treeData.sha,
				parents: [latestCommitSha]
			})
		})

		if (!newCommitResponse.ok) {
			throw new Error(`Failed to create commit: ${newCommitResponse.status}`)
		}

		const newCommitData = await newCommitResponse.json()

		// Update branch reference
		const updateRefResponse = await fetch(`${GITHUB_API}/repos/${repo_full_name}/git/refs/heads/${branch}`, {
			method: 'PATCH',
			headers: {
				'Authorization': `Bearer ${auth.access_token}`,
				'Accept': 'application/vnd.github+json',
				'X-GitHub-Api-Version': '2022-11-28',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				sha: newCommitData.sha
			})
		})

		if (!updateRefResponse.ok) {
			throw new Error(`Failed to update branch: ${updateRefResponse.status}`)
		}
	},

	/**
	 * Get repository info
	 */
	async get_repo(full_name: string): Promise<GitHubRepo> {
		const auth = await this.get_auth()
		if (!auth) {
			throw new Error('GitHub not connected')
		}

		const response = await fetch(`${GITHUB_API}/repos/${full_name}`, {
			headers: {
				'Authorization': `Bearer ${auth.access_token}`,
				'Accept': 'application/vnd.github+json',
				'X-GitHub-Api-Version': '2022-11-28'
			}
		})

		if (!response.ok) {
			throw new Error(`GitHub API error: ${response.status}`)
		}

		return response.json()
	}
}
