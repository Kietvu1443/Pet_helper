const fs = require('fs');
let code = fs.readFileSync('public/pages/admin.html', 'utf8');

code = code.replace(
    "if (tab === 'dashboard') {\r\n                renderDashboardStats();\r\n                return;\r\n            }",
    "if (tab === 'dashboard') {\r\n                await loadDashboardStats(force);\r\n                return;\r\n            }"
);

code = code.replace(
    "if (tab === 'dashboard') {\n                renderDashboardStats();\n                return;\n            }",
    "if (tab === 'dashboard') {\n                await loadDashboardStats(force);\n                return;\n            }"
);

code = code.replace(
    "async function loadTabData(tab, force = false) {",
    "async function loadDashboardStats(force = false) {\n            if (refreshAllBtn) setButtonBusy(refreshAllBtn, true, 'Đang làm mới...');\n            try {\n                await Promise.all([\n                    loadAdoptionRequests(force),\n                    loadPets(force),\n                    loadReports(force),\n                    loadUsers(force)\n                ]);\n            } catch (err) {\n                console.error('Error loading dashboard stats:', err);\n            } finally {\n                if (refreshAllBtn) setButtonBusy(refreshAllBtn, false);\n                renderDashboardStats();\n            }\n        }\n\n        async function loadTabData(tab, force = false) {"
);

code = code.replace(
    "document.addEventListener('DOMContentLoaded', bootstrapAdminAccess);",
    "if (refreshAllBtn) {\n            refreshAllBtn.addEventListener('click', () => {\n                PAGINATED_TABS.forEach(invalidateTabCache);\n                loadTabData('dashboard', true);\n            });\n        }\n\n        document.addEventListener('DOMContentLoaded', bootstrapAdminAccess);"
);

fs.writeFileSync('public/pages/admin.html', code);
