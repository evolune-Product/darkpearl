<script lang="ts">
  import Logo from "$lib/assets/Logo.svelte";
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import {
    Plus,
    ArrowRight,
    Loader2,
    LogOut,
    Settings,
    ExternalLink,
    LayoutDashboard,
    Camera,
    ChevronRight,
    Clock,
    Sparkles,
    Zap,
    Shield
  } from "lucide-svelte";
  import { get_saved_theme, apply_builder_theme } from "$lib/builder_themes";
  import { auth } from "$lib/pocketbase.svelte";
  import { project_service } from "$lib/services/project.svelte";
  import type { Project } from "./types";

  // State
  let projects = $state<Project[]>([]);
  let is_loading = $state(true);
  let show_sidebar = $state(false);

  // Derived - recent projects (last 10)
  let recent_projects = $derived(
    projects
      .slice()
      .sort((a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime())
      .slice(0, 10)
  );

  onMount(async () => {
    const theme = get_saved_theme();
    apply_builder_theme(theme);

    try {
      projects = await project_service.list();
    } catch (err) {
      console.error("Failed to load projects:", err);
    } finally {
      is_loading = false;
    }
  });

  function handle_logout() {
    auth.logout();
    goto("/login");
  }

  function get_studio_href(project: Project): string {
    return `/darkpearl/studio?id=${project.id}`;
  }

  function format_date(date: string): string {
    return new Date(date).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric"
    });
  }
</script>

<svelte:head>
  <title>darkpearl - AI-Powered App Builder</title>
</svelte:head>

<div class="page-container">
  <!-- Layered background system -->
  <div class="bg-base"></div>

  <!-- Tech aesthetic top glow -->
  <div class="top-glow"></div>
  <div class="top-line"></div>

  <!-- Pearl image with proper blending -->
  <div class="pearl-container">
    <div class="pearl-glow"></div>
    <img src="/dark_pearl.png" alt="" class="pearl-image" />
    <div class="pearl-fade-top"></div>
    <div class="pearl-fade-bottom"></div>
    <div class="pearl-fade-left"></div>
    <div class="pearl-fade-right"></div>
  </div>

  <!-- Floating orbs for ambient effect -->
  <div class="orb orb-1"></div>
  <div class="orb orb-2"></div>
  <div class="orb orb-3"></div>

  <!-- Subtle grid pattern -->
  <div class="grid-pattern"></div>

  <!-- Header -->
  <header class="header">
    <div class="header-content">
      <Logo width="5rem" />

      <nav class="header-nav">
        <a href="/darkpearl/dashboard" class="nav-link">Dashboard</a>
        <a href="/darkpearl/settings" class="nav-link">
          <Settings class="w-4 h-4" />
        </a>
        <button onclick={handle_logout} class="nav-link" title="Sign out">
          <LogOut class="w-4 h-4" />
        </button>
      </nav>
    </div>
  </header>

  <!-- Main Content -->
  <main class="main-content">
    <!-- Badge -->
    <div class="badge">
      <Sparkles class="w-3.5 h-3.5" />
      <span>AI-Powered Development Platform</span>
    </div>

    <!-- Heading -->
    <h1 class="heading">
      <span class="heading-line">Build apps at the</span>
      <span class="heading-gradient">speed of thought</span>
    </h1>

    <!-- Subheading -->
    <p class="subheading">
      Let AI handle the repetitive 80%. Focus on what makes your app unique.
      <br class="hidden sm:block" />
      Ship production-ready apps in hours, not weeks.
    </p>

    <!-- CTA Buttons -->
    <div class="cta-group">
      <a href="/darkpearl/new-kit" class="btn-primary">
        <Plus class="w-5 h-5" />
        <span>Start Building</span>
        <div class="btn-shine"></div>
      </a>
      <a href="/darkpearl/dashboard" class="btn-secondary">
        <LayoutDashboard class="w-5 h-5" />
        <span>Open Dashboard</span>
      </a>
    </div>

    <!-- Screenshot to Code Button -->
    <a href="/darkpearl/screenshot-to-code" class="screenshot-btn">
      <div class="screenshot-btn-glow"></div>
      <div class="screenshot-btn-content">
        <Camera class="w-5 h-5" />
        <span>Screenshot to Code</span>
        <span class="screenshot-btn-badge">Magic</span>
      </div>
      <ArrowRight class="w-4 h-4 screenshot-btn-arrow" />
    </a>

    <!-- Feature pills -->
    <div class="features">
      <div class="feature-pill">
        <Zap class="w-4 h-4 text-amber-400" />
        <span>Instant Preview</span>
      </div>
      <div class="feature-pill">
        <Shield class="w-4 h-4 text-emerald-400" />
        <span>Self-Hosted</span>
      </div>
      <div class="feature-pill">
        <Camera class="w-4 h-4 text-cyan-400" />
        <span>Screenshot to Code</span>
      </div>
    </div>
  </main>

  <!-- Recent Projects Toggle -->
  {#if recent_projects.length > 0 || is_loading}
    <button
      onclick={() => show_sidebar = !show_sidebar}
      class="sidebar-toggle"
      class:sidebar-toggle-active={show_sidebar}
    >
      <Clock class="w-4 h-4" />
      <span class="sidebar-toggle-label">Recent</span>
      <span class="chevron" class:rotate-180={show_sidebar}>
        <ChevronRight class="w-4 h-4" />
      </span>
    </button>
  {/if}

  <!-- Side Panel -->
  <aside class="sidebar" class:sidebar-open={show_sidebar}>
    <div class="sidebar-inner">
      <div class="sidebar-header">
        <h2 class="sidebar-title">
          <Clock class="w-5 h-5 text-purple-400" />
          Recent Projects
        </h2>
        <button onclick={() => show_sidebar = false} class="sidebar-close">
          <ChevronRight class="w-5 h-5" />
        </button>
      </div>

      <div class="sidebar-content">
        {#if is_loading}
          <div class="sidebar-loading">
            <Loader2 class="w-6 h-6 animate-spin text-purple-400" />
          </div>
        {:else if recent_projects.length === 0}
          <div class="sidebar-empty">
            <p>No projects yet</p>
          </div>
        {:else}
          {#each recent_projects as project (project.id)}
            <a href={get_studio_href(project)} class="project-card">
              <div class="project-info">
                <h3 class="project-name">{project.name}</h3>
                {#if project.domain}
                  <p class="project-domain">{project.domain}</p>
                {/if}
              </div>
              <span class="project-date">{format_date(project.updated)}</span>
              {#if project.domain}
                <button
                  class="project-external"
                  onclick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.open(`https://${project.domain}`, '_blank');
                  }}
                >
                  <ExternalLink class="w-3.5 h-3.5" />
                </button>
              {/if}
            </a>
          {/each}
        {/if}
      </div>

      <div class="sidebar-footer">
        <a href="/darkpearl/dashboard" class="sidebar-footer-link">
          View all projects
          <ArrowRight class="w-4 h-4" />
        </a>
      </div>
    </div>
  </aside>

  <!-- Backdrop -->
  {#if show_sidebar}
    <button class="backdrop" onclick={() => show_sidebar = false} aria-label="Close"></button>
  {/if}

  <!-- Footer -->
  <footer class="footer">
    <p>
      &copy; 2026 darkpearl. A product of <a href="https://evolune.in/" target="_blank" rel="noopener noreferrer">Evolune EdgeTech</a>
    </p>
  </footer>
</div>

<style>
  /* Base Layout */
  .page-container {
    position: relative;
    min-height: 100vh;
    width: 100%;
    overflow: hidden;
  }

  /* Background Layers */
  .bg-base {
    position: absolute;
    inset: 0;
    background: #050508;
  }

  /* Tech aesthetic top glow */
  .top-glow {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 80%;
    height: 400px;
    background: radial-gradient(ellipse 100% 100% at 50% 0%, rgba(139, 92, 246, 0.15) 0%, transparent 60%);
    pointer-events: none;
  }

  .top-line {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: min(600px, 80%);
    height: 1px;
    background: linear-gradient(90deg, transparent 0%, rgba(139, 92, 246, 0.5) 20%, rgba(6, 182, 212, 0.8) 50%, rgba(139, 92, 246, 0.5) 80%, transparent 100%);
    box-shadow: 0 0 20px rgba(139, 92, 246, 0.5), 0 0 40px rgba(6, 182, 212, 0.3);
    pointer-events: none;
  }

  .top-line::after {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100px;
    height: 1px;
    background: white;
    filter: blur(1px);
    opacity: 0.8;
  }

  /* Pearl Container with Fade */
  .pearl-container {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }

  .pearl-glow {
    position: absolute;
    width: 75vmin;
    height: 75vmin;
    background: radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, rgba(6, 182, 212, 0.1) 40%, transparent 70%);
    filter: blur(60px);
    animation: glow-pulse 8s ease-in-out infinite;
  }

  .pearl-image {
    position: relative;
    width: 70vmin;
    height: 70vmin;
    object-fit: contain;
    opacity: 0.6;
    mix-blend-mode: screen;
    filter: saturate(1.2) contrast(1.1);
  }

  /* Fade edges for seamless blend */
  .pearl-fade-top,
  .pearl-fade-bottom,
  .pearl-fade-left,
  .pearl-fade-right {
    position: absolute;
    pointer-events: none;
  }

  .pearl-fade-top {
    top: 0;
    left: 0;
    right: 0;
    height: 30%;
    background: linear-gradient(to bottom, #050508 0%, transparent 100%);
  }

  .pearl-fade-bottom {
    bottom: 0;
    left: 0;
    right: 0;
    height: 35%;
    background: linear-gradient(to top, #050508 0%, transparent 100%);
  }

  .pearl-fade-left {
    top: 0;
    bottom: 0;
    left: 0;
    width: 25%;
    background: linear-gradient(to right, #050508 0%, transparent 100%);
  }

  .pearl-fade-right {
    top: 0;
    bottom: 0;
    right: 0;
    width: 25%;
    background: linear-gradient(to left, #050508 0%, transparent 100%);
  }

  /* Floating Orbs */
  .orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.4;
    animation: float 20s ease-in-out infinite;
  }

  .orb-1 {
    width: 400px;
    height: 400px;
    background: rgba(139, 92, 246, 0.3);
    top: 10%;
    left: 10%;
    animation-delay: 0s;
  }

  .orb-2 {
    width: 300px;
    height: 300px;
    background: rgba(6, 182, 212, 0.25);
    bottom: 20%;
    right: 15%;
    animation-delay: -7s;
  }

  .orb-3 {
    width: 250px;
    height: 250px;
    background: rgba(168, 85, 247, 0.2);
    top: 50%;
    right: 30%;
    animation-delay: -14s;
  }

  /* Subtle Grid */
  .grid-pattern {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(139, 92, 246, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(139, 92, 246, 0.03) 1px, transparent 1px);
    background-size: 60px 60px;
    mask-image: radial-gradient(ellipse 50% 50% at 50% 50%, black 20%, transparent 70%);
  }

  /* Header */
  .header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 50;
    padding: 1rem 1.5rem;
    background: linear-gradient(to bottom, rgba(5, 5, 8, 0.9) 0%, rgba(5, 5, 8, 0) 100%);
  }

  .header-content {
    max-width: 1400px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .header-nav {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .nav-link {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.875rem;
    font-weight: 500;
    border-radius: 0.5rem;
    transition: all 0.2s;
    background: transparent;
    border: none;
    cursor: pointer;
  }

  .nav-link:hover {
    color: white;
    background: rgba(255, 255, 255, 0.08);
  }

  /* Main Content */
  .main-content {
    position: relative;
    z-index: 10;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 6rem 1.5rem 3rem;
    text-align: center;
  }

  /* Badge */
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: rgba(139, 92, 246, 0.1);
    border: 1px solid rgba(139, 92, 246, 0.2);
    border-radius: 100px;
    color: rgba(167, 139, 250, 1);
    font-size: 0.8rem;
    font-weight: 500;
    letter-spacing: 0.02em;
    margin-bottom: 2rem;
    animation: fade-in-up 0.6s ease-out;
  }

  /* Heading */
  .heading {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    margin-bottom: 1.5rem;
    animation: fade-in-up 0.6s ease-out 0.1s backwards;
  }

  .heading-line {
    font-size: clamp(2rem, 5vw, 3.5rem);
    font-weight: 600;
    color: rgba(230, 230, 245, 0.95);
    letter-spacing: -0.03em;
    line-height: 1.1;
    text-shadow: 0 0 40px rgba(139, 92, 246, 0.3);
  }

  .heading-gradient {
    font-size: clamp(2.5rem, 6vw, 4.5rem);
    font-weight: 700;
    background: linear-gradient(135deg, #a78bfa 0%, #06b6d4 50%, #a78bfa 100%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: -0.03em;
    line-height: 1.1;
    animation: gradient-shift 8s linear infinite;
  }

  /* Subheading */
  .subheading {
    max-width: 540px;
    font-size: 1.125rem;
    line-height: 1.7;
    color: rgba(200, 200, 220, 0.85);
    margin-bottom: 2.5rem;
    animation: fade-in-up 0.6s ease-out 0.2s backwards;
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
  }

  /* CTA Group */
  .cta-group {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 1rem;
    margin-bottom: 3rem;
    animation: fade-in-up 0.6s ease-out 0.3s backwards;
  }

  .btn-primary {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 0.625rem;
    padding: 1rem 2rem;
    background: linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%);
    color: white;
    font-size: 1rem;
    font-weight: 600;
    border-radius: 0.75rem;
    overflow: hidden;
    transition: all 0.3s;
    box-shadow:
      0 0 0 1px rgba(139, 92, 246, 0.5),
      0 4px 20px rgba(139, 92, 246, 0.4),
      0 8px 40px rgba(6, 182, 212, 0.2);
  }

  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow:
      0 0 0 1px rgba(139, 92, 246, 0.6),
      0 8px 30px rgba(139, 92, 246, 0.5),
      0 16px 60px rgba(6, 182, 212, 0.3);
  }

  .btn-shine {
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    animation: shine 3s infinite;
  }

  .btn-secondary {
    display: inline-flex;
    align-items: center;
    gap: 0.625rem;
    padding: 1rem 2rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.8);
    font-size: 1rem;
    font-weight: 600;
    border-radius: 0.75rem;
    transition: all 0.3s;
    backdrop-filter: blur(10px);
  }

  .btn-secondary:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.2);
    color: white;
    transform: translateY(-2px);
  }

  /* Screenshot to Code Button */
  .screenshot-btn {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 1rem;
    padding: 0.875rem 1.5rem;
    margin-bottom: 2rem;
    background: rgba(6, 182, 212, 0.08);
    border: 1px solid rgba(6, 182, 212, 0.2);
    border-radius: 100px;
    color: rgba(255, 255, 255, 0.9);
    font-size: 0.9rem;
    font-weight: 500;
    overflow: hidden;
    transition: all 0.3s;
    animation: fade-in-up 0.6s ease-out 0.35s backwards;
  }

  .screenshot-btn:hover {
    background: rgba(6, 182, 212, 0.15);
    border-color: rgba(6, 182, 212, 0.4);
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(6, 182, 212, 0.2);
  }

  .screenshot-btn-glow {
    position: absolute;
    top: 50%;
    left: 20%;
    width: 60%;
    height: 200%;
    background: radial-gradient(ellipse, rgba(6, 182, 212, 0.3) 0%, transparent 70%);
    transform: translateY(-50%);
    opacity: 0;
    transition: opacity 0.3s;
    pointer-events: none;
  }

  .screenshot-btn:hover .screenshot-btn-glow {
    opacity: 1;
  }

  .screenshot-btn-content {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.625rem;
  }

  .screenshot-btn-badge {
    padding: 0.2rem 0.5rem;
    background: linear-gradient(135deg, rgba(6, 182, 212, 0.3), rgba(139, 92, 246, 0.3));
    border-radius: 100px;
    font-size: 0.65rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #67e8f9;
  }

  .screenshot-btn-arrow {
    position: relative;
    color: rgba(6, 182, 212, 0.8);
    transition: transform 0.3s;
  }

  .screenshot-btn:hover .screenshot-btn-arrow {
    transform: translateX(4px);
    color: #22d3ee;
  }

  /* Features */
  .features {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.75rem;
    animation: fade-in-up 0.6s ease-out 0.4s backwards;
  }

  .feature-pill {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 100px;
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.8rem;
    font-weight: 500;
  }

  /* Sidebar Toggle */
  .sidebar-toggle {
    position: fixed;
    right: 1.5rem;
    top: 50%;
    transform: translateY(-50%);
    z-index: 40;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: rgba(20, 20, 30, 0.8);
    border: 1px solid rgba(139, 92, 246, 0.2);
    border-radius: 0.75rem;
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;
    backdrop-filter: blur(12px);
    transition: all 0.3s;
  }

  .sidebar-toggle:hover {
    background: rgba(30, 30, 45, 0.9);
    border-color: rgba(139, 92, 246, 0.4);
    color: white;
  }

  .sidebar-toggle-active {
    background: rgba(139, 92, 246, 0.2);
    border-color: rgba(139, 92, 246, 0.4);
  }

  .chevron {
    display: flex;
    transition: transform 0.3s;
  }

  .chevron.rotate-180 {
    transform: rotate(180deg);
  }

  .sidebar-toggle-label {
    display: none;
  }

  @media (min-width: 768px) {
    .sidebar-toggle-label {
      display: inline;
    }
  }

  /* Sidebar */
  .sidebar {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: 320px;
    z-index: 45;
    transform: translateX(100%);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .sidebar-open {
    transform: translateX(0);
  }

  .sidebar-inner {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: rgba(8, 8, 15, 0.95);
    border-left: 1px solid rgba(139, 92, 246, 0.15);
    backdrop-filter: blur(20px);
  }

  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem 1.25rem;
    border-bottom: 1px solid rgba(139, 92, 246, 0.1);
    margin-top: 3.5rem;
  }

  .sidebar-title {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    font-size: 0.95rem;
    font-weight: 600;
    color: white;
  }

  .sidebar-close {
    padding: 0.375rem;
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.5);
    border-radius: 0.375rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .sidebar-close:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }

  .sidebar-content {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
  }

  .sidebar-loading,
  .sidebar-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 3rem 1rem;
    color: rgba(255, 255, 255, 0.4);
    font-size: 0.875rem;
  }

  .project-card {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 0.5rem;
    padding: 0.875rem;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.04);
    border-radius: 0.625rem;
    margin-bottom: 0.5rem;
    transition: all 0.2s;
  }

  .project-card:hover {
    background: rgba(139, 92, 246, 0.08);
    border-color: rgba(139, 92, 246, 0.2);
  }

  .project-info {
    min-width: 0;
  }

  .project-name {
    font-size: 0.875rem;
    font-weight: 500;
    color: white;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: color 0.2s;
  }

  .project-card:hover .project-name {
    color: #a78bfa;
  }

  .project-domain {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.4);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-top: 0.125rem;
  }

  .project-date {
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.3);
    white-space: nowrap;
    align-self: start;
  }

  .project-external {
    grid-column: 2;
    padding: 0.25rem;
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.3);
    border-radius: 0.25rem;
    cursor: pointer;
    opacity: 0;
    transition: all 0.2s;
  }

  .project-card:hover .project-external {
    opacity: 1;
  }

  .project-external:hover {
    color: #06b6d4;
    background: rgba(6, 182, 212, 0.1);
  }

  .sidebar-footer {
    padding: 1rem;
    border-top: 1px solid rgba(139, 92, 246, 0.1);
  }

  .sidebar-footer-link {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0.75rem;
    background: rgba(139, 92, 246, 0.1);
    border: 1px solid rgba(139, 92, 246, 0.15);
    border-radius: 0.5rem;
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.8rem;
    font-weight: 500;
    transition: all 0.2s;
  }

  .sidebar-footer-link:hover {
    background: rgba(139, 92, 246, 0.2);
    color: white;
  }

  /* Backdrop */
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 35;
    background: rgba(0, 0, 0, 0.5);
    border: none;
    cursor: default;
    backdrop-filter: blur(2px);
  }

  /* Animations */
  @keyframes glow-pulse {
    0%, 100% { opacity: 0.8; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.05); }
  }

  @keyframes float {
    0%, 100% { transform: translate(0, 0); }
    25% { transform: translate(20px, -20px); }
    50% { transform: translate(-10px, 20px); }
    75% { transform: translate(-20px, -10px); }
  }

  @keyframes gradient-shift {
    0% { background-position: 0% center; }
    100% { background-position: 200% center; }
  }

  @keyframes shine {
    0% { left: -100%; }
    20%, 100% { left: 100%; }
  }

  @keyframes fade-in-up {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Scrollbar */
  .sidebar-content::-webkit-scrollbar {
    width: 4px;
  }

  .sidebar-content::-webkit-scrollbar-track {
    background: transparent;
  }

  .sidebar-content::-webkit-scrollbar-thumb {
    background: rgba(139, 92, 246, 0.3);
    border-radius: 2px;
  }

  /* Footer */
  .footer {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 20;
    padding: 1.5rem;
    text-align: center;
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.4);
  }

  .footer a {
    color: rgba(167, 139, 250, 0.8);
    transition: color 0.2s;
  }

  .footer a:hover {
    color: #a78bfa;
    text-decoration: underline;
  }
</style>
