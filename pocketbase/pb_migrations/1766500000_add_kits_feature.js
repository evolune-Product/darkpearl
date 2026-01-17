/// <reference path="../pb_data/types.d.ts" />

// Adds kits feature:
// 1. Makes domain optional on _dp_projects (supports drafts)
// 2. Adds kit field to _dp_projects
// 3. Creates _dp_kits collection

migrate((app) => {
	// --- Update _dp_projects ---
	const projects = app.findCollectionByNameOrId("_dp_projects")

	// Make domain optional
	const domainField = projects.fields.find(f => f.name === "domain")
	if (domainField) {
		domainField.required = false
	}

	// Remove unique index on domain (if exists)
	projects.indexes = projects.indexes.filter(idx => !idx.includes("idx_domain"))

	// Add kit field (if not already present)
	const hasKitField = projects.fields.some(f => f.name === "kit")
	if (!hasKitField) {
		projects.fields.push(new Field({
			name: "kit",
			type: "text",
			required: true
		}))
	}

	app.save(projects)

	// Set existing projects to "custom" kit
	try {
		const existingProjects = app.findRecordsByFilter("_dp_projects", "kit = ''", "", 0, 0)
		for (const project of existingProjects) {
			project.set("kit", "custom")
			app.save(project)
		}
	} catch (e) {
		// No existing projects - ok
	}

	// --- Create _dp_kits collection (if not exists) ---
	let kits = null
	try {
		kits = app.findCollectionByNameOrId("_dp_kits")
	} catch (e) {
		// Collection doesn't exist
	}

	if (!kits) {
		kits = new Collection({
			name: "_dp_kits",
			type: "base",
			fields: [
				{ name: "name", type: "text", required: true },
				{ name: "icon", type: "text", required: false },
				{ name: "builder_theme_id", type: "text", required: false },
				{ name: "created", type: "autodate", onCreate: true, onUpdate: false },
				{ name: "updated", type: "autodate", onCreate: true, onUpdate: true }
			],
			listRule: "@request.auth.id != ''",
			viewRule: "@request.auth.id != ''",
			createRule: "@request.auth.id != ''",
			updateRule: "@request.auth.id != ''",
			deleteRule: "@request.auth.id != ''"
		})
		app.save(kits)
	}

	return
}, (app) => {
	// Rollback: delete kits collection
	const kits = app.findCollectionByNameOrId("_dp_kits")
	app.delete(kits)

	// Rollback: remove kit field, restore domain required + index
	const projects = app.findCollectionByNameOrId("_dp_projects")

	// Remove kit field
	const fields = projects.fields
	for (let i = 0; i < fields.length; i++) {
		if (fields[i].name === "kit") {
			fields.splice(i, 1)
			break
		}
	}

	// Restore domain required
	const domainField = projects.fields.find(f => f.name === "domain")
	if (domainField) {
		domainField.required = true
	}

	// Restore unique index
	projects.indexes.push("CREATE UNIQUE INDEX idx_domain ON _dp_projects (domain)")

	return app.save(projects)
})
