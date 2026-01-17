/**
 * GitHub client-side store for reactive state
 */

import type { GitHubConnectionStatus, GitHubRepo } from '../../routes/darkpearl/types'
import { pb } from '$lib/pocketbase.svelte'

let is_connected = $state(false)
let username = $state<string | null>(null)
let avatar_url = $state<string | null>(null)
let user_id = $state<number | null>(null)
let is_loading = $state(false)
let repos = $state<GitHubRepo[]>([])

export const github_store = {
	get is_connected() { return is_connected },
	get username() { return username },
	get avatar_url() { return avatar_url },
	get user_id() { return user_id },
	get is_loading() { return is_loading },
	get repos() { return repos },

	async check_status(): Promise<GitHubConnectionStatus> {
		is_loading = true
		try {
			const response = await fetch('/api/github/status', {
				headers: { 'Authorization': `Bearer ${pb.authStore.token}` }
			})
			const data = await response.json()
			is_connected = data.connected
			username = data.username || null
			avatar_url = data.avatar_url || null
			user_id = data.user_id || null
			return data
		} catch {
			is_connected = false
			return { connected: false }
		} finally {
			is_loading = false
		}
	},

	async disconnect(): Promise<void> {
		is_loading = true
		try {
			await fetch('/api/github/disconnect', {
				method: 'POST',
				headers: { 'Authorization': `Bearer ${pb.authStore.token}` }
			})
			is_connected = false
			username = null
			avatar_url = null
			user_id = null
			repos = []
		} finally {
			is_loading = false
		}
	},

	async load_repos(): Promise<GitHubRepo[]> {
		if (!is_connected) return []
		is_loading = true
		try {
			const response = await fetch('/api/github/repos', {
				headers: { 'Authorization': `Bearer ${pb.authStore.token}` }
			})
			if (response.ok) {
				repos = await response.json()
			}
			return repos
		} catch {
			return []
		} finally {
			is_loading = false
		}
	},

	reset() {
		is_connected = false
		username = null
		avatar_url = null
		user_id = null
		repos = []
	}
}
