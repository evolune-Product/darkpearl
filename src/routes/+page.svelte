<script lang="ts">
	import { goto } from "$app/navigation"
	import { onMount } from "svelte"
	import { auth } from "$lib/pocketbase.svelte"
	import Footer from "$lib/components/Footer.svelte"
	import {
		Sparkles,
		Code2,
		Image,
		GitBranch,
		Eye,
		Palette,
		Database,
		History,
		Rocket,
		FileCode,
		LayoutTemplate,
		Zap,
		ArrowRight,
		Check
	} from "lucide-svelte"

	let { data } = $props()

	// If already authenticated, redirect to dashboard
	onMount(() => {
		if (auth.is_authenticated) {
			goto("/darkpearl")
		}
	})

	const features = [
		{
			icon: Sparkles,
			title: "AI-Powered Development",
			description: "Describe what you want to build and our AI engine generates production-ready code instantly."
		},
		{
			icon: Image,
			title: "Screenshot to Code",
			description: "Upload a UI screenshot and watch it transform into clean, functional Svelte code."
		},
		{
			icon: GitBranch,
			title: "GitHub Integration",
			description: "Push and pull directly to GitHub. Keep your code synced and version controlled."
		},
		{
			icon: Eye,
			title: "Live Preview",
			description: "See your changes in real-time with instant hot reload as you build."
		},
		{
			icon: Code2,
			title: "Built-in Code Editor",
			description: "Full-featured CodeMirror editor with syntax highlighting, Emmet support, and more."
		},
		{
			icon: Palette,
			title: "Design System",
			description: "Customize colors, fonts, and spacing with a visual design panel. No CSS knowledge needed."
		},
		{
			icon: Database,
			title: "Data Management",
			description: "Built-in database for your app data. Create tables, manage records, all in one place."
		},
		{
			icon: History,
			title: "Version History",
			description: "Time travel through your project. Restore any previous version with one click."
		},
		{
			icon: Rocket,
			title: "One-Click Deploy",
			description: "Deploy your app to production instantly. No server configuration required."
		},
		{
			icon: LayoutTemplate,
			title: "Starter Templates",
			description: "Jump-start with beautiful templates. Landing pages, dashboards, and more."
		},
		{
			icon: FileCode,
			title: "CMS Integration",
			description: "Manage content fields like a CMS. Perfect for dynamic, content-driven apps."
		},
		{
			icon: Zap,
			title: "Lightning Fast",
			description: "Built on Svelte for blazing performance. Your apps load instantly."
		}
	]

	const highlights = [
		"Self-hosted - Own your data",
		"No vendor lock-in",
		"Full code access",
		"Ship CRUD apps in hours"
	]
</script>

<svelte:head>
	<title>darkpearl - AI-Powered App Builder</title>
	<meta name="description" content="Build production-ready web apps with AI. Screenshot to code, GitHub sync, one-click deploy." />
</svelte:head>

<div class="min-h-screen relative overflow-hidden"
	style="background: linear-gradient(135deg, #080812 0%, #0a0a14 50%, #0d0d1a 100%);">

	<!-- Background decorations -->
	<div class="absolute inset-0 pointer-events-none overflow-hidden">
		<!-- Pearl image -->
		<div class="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2">
			<img
				src="/dark_pearl.png"
				alt=""
				class="w-[800px] h-[800px] object-contain opacity-20"
				style="filter: blur(2px);"
			/>
		</div>

		<!-- Animated glow effects -->
		<div class="absolute top-20 left-1/4 w-[500px] h-[500px] rounded-full opacity-20 animate-pulse-slow"
			style="background: radial-gradient(circle, #a855f7 0%, transparent 70%); filter: blur(100px);"></div>
		<div class="absolute bottom-20 right-1/4 w-[500px] h-[500px] rounded-full opacity-20 animate-pulse-slow"
			style="background: radial-gradient(circle, #06b6d4 0%, transparent 70%); filter: blur(100px); animation-delay: 2s;"></div>
		<div class="absolute top-1/2 right-10 w-[300px] h-[300px] rounded-full opacity-10 animate-pulse-slow"
			style="background: radial-gradient(circle, #ec4899 0%, transparent 70%); filter: blur(80px); animation-delay: 4s;"></div>
	</div>

	<!-- Navigation -->
	<nav class="relative z-20 px-6 py-4">
		<div class="max-w-7xl mx-auto flex items-center justify-between">
			<div class="flex items-center gap-3">
				<img src="/dark_pearl.png" alt="darkpearl" class="w-10 h-10 object-contain" />
				<span class="text-xl font-semibold text-white">darkpearl</span>
			</div>
			<div class="flex items-center gap-4">
				<a
					href="/login"
					class="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
				>
					Sign in
				</a>
				<a
					href="/register"
					class="px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:scale-105"
					style="background: linear-gradient(135deg, #a855f7 0%, #06b6d4 100%); box-shadow: 0 4px 20px rgba(168, 85, 247, 0.3);"
				>
					Get Started
				</a>
			</div>
		</div>
	</nav>

	<!-- Hero Section -->
	<section class="relative z-10 px-6 pt-16 pb-24">
		<div class="max-w-4xl mx-auto text-center">
			<div class="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
				style="background: rgba(168, 85, 247, 0.15); border: 1px solid rgba(168, 85, 247, 0.3);">
				<Sparkles class="w-4 h-4 text-purple-400" />
				<span class="text-sm text-purple-300">AI-Powered App Builder</span>
			</div>

			<h1 class="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
				Build Apps with
				<span class="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
					AI Magic
				</span>
			</h1>

			<p class="text-xl text-gray-400 mb-8 max-w-2xl mx-auto leading-relaxed">
				Describe your idea, upload a screenshot, or start from a template.
				darkpearl turns your vision into production-ready web apps in minutes.
			</p>

			<!-- Highlight badges -->
			<div class="flex flex-wrap justify-center gap-3 mb-10">
				{#each highlights as highlight}
					<div class="flex items-center gap-2 px-3 py-1.5 rounded-full"
						style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3);">
						<Check class="w-3.5 h-3.5 text-emerald-400" />
						<span class="text-sm text-emerald-300">{highlight}</span>
					</div>
				{/each}
			</div>

			<div class="flex flex-col sm:flex-row items-center justify-center gap-4">
				<a
					href="/register"
					class="group px-8 py-4 rounded-xl text-lg font-medium text-white transition-all hover:scale-105 flex items-center gap-2"
					style="background: linear-gradient(135deg, #a855f7 0%, #06b6d4 100%); box-shadow: 0 4px 30px rgba(168, 85, 247, 0.4);"
				>
					Start Building Free
					<ArrowRight class="w-5 h-5 group-hover:translate-x-1 transition-transform" />
				</a>
				<a
					href="/login"
					class="px-8 py-4 rounded-xl text-lg font-medium text-white transition-all hover:bg-white/10"
					style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1);"
				>
					Sign in
				</a>
			</div>
		</div>
	</section>

	<!-- Features Grid -->
	<section class="relative z-10 px-6 py-20">
		<div class="max-w-7xl mx-auto">
			<div class="text-center mb-16">
				<h2 class="text-3xl md:text-4xl font-bold text-white mb-4">
					Everything You Need to Ship Fast
				</h2>
				<p class="text-lg text-gray-400 max-w-2xl mx-auto">
					A complete platform for building, previewing, and deploying web applications.
				</p>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{#each features as feature}
					<div class="group p-6 rounded-2xl transition-all duration-300 hover:scale-[1.02]"
						style="background: rgba(20, 20, 40, 0.5); border: 1px solid rgba(168, 85, 247, 0.15); backdrop-filter: blur(10px);">
						<div class="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors"
							style="background: linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%);">
							<svelte:component this={feature.icon} class="w-6 h-6 text-purple-400" />
						</div>
						<h3 class="text-lg font-semibold text-white mb-2">{feature.title}</h3>
						<p class="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- CTA Section -->
	<section class="relative z-10 px-6 py-20">
		<div class="max-w-4xl mx-auto">
			<div class="rounded-3xl p-12 text-center"
				style="background: linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%); border: 1px solid rgba(168, 85, 247, 0.2);">
				<h2 class="text-3xl md:text-4xl font-bold text-white mb-4">
					Ready to Build Something Amazing?
				</h2>
				<p class="text-lg text-gray-300 mb-8 max-w-xl mx-auto">
					Join developers who are shipping apps faster than ever. No credit card required.
				</p>
				<a
					href="/register"
					class="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-lg font-medium text-white transition-all hover:scale-105"
					style="background: linear-gradient(135deg, #a855f7 0%, #06b6d4 100%); box-shadow: 0 4px 30px rgba(168, 85, 247, 0.4);"
				>
					Get Started for Free
					<ArrowRight class="w-5 h-5" />
				</a>
			</div>
		</div>
	</section>

	<!-- Footer with Evolune Edgetech -->
	<Footer showEvolune={true} />
</div>

<style>
	@keyframes pulse-slow {
		0%, 100% { opacity: 0.15; transform: scale(1); }
		50% { opacity: 0.25; transform: scale(1.05); }
	}

	.animate-pulse-slow {
		animation: pulse-slow 6s ease-in-out infinite;
	}
</style>
