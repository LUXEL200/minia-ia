#!/usr/bin/env python3
"""Fix the render-time redirect pattern in all affected pages."""
import re

files = [
    "client/src/pages/Avatars.tsx",
    "client/src/pages/EndCards.tsx",
    "client/src/pages/Favorites.tsx",
    "client/src/pages/Trash.tsx",
    "client/src/pages/Notifications.tsx",
    "client/src/pages/Account.tsx",
    "client/src/pages/ApiKeys.tsx",
    "client/src/pages/Billing.tsx",
    "client/src/pages/Settings.tsx",
    "client/src/pages/ThumbnailPreview.tsx",
]

for filepath in files:
    with open(filepath, 'r') as f:
        content = f.read()

    # 1. Add useEffect import if not present
    if 'useEffect' not in content:
        if 'import { useState' in content:
            content = content.replace('import { useState', 'import { useState, useEffect')
        elif 'import { trpc }' in content:
            content = content.replace('import { trpc }', 'import { useEffect } from "react";\nimport { trpc }')

    # 2. Replace `const { isAuthenticated } = useAuth();` with `const { isAuthenticated, loading } = useAuth();`
    if 'const { isAuthenticated } = useAuth();' in content:
        content = content.replace('const { isAuthenticated } = useAuth();', 'const { isAuthenticated, loading } = useAuth();')
    elif 'const { user, isAuthenticated } = useAuth();' in content:
        content = content.replace('const { user, isAuthenticated } = useAuth();', 'const { user, isAuthenticated, loading } = useAuth();')

    # 3. Add useEffect after navigate declaration
    if 'const [, navigate] = useLocation();' in content:
        content = content.replace(
            'const [, navigate] = useLocation();',
            'const [, navigate] = useLocation();\n\n  useEffect(() => {\n    if (!loading && !isAuthenticated) {\n      navigate("/dashboard");\n    }\n  }, [loading, isAuthenticated, navigate]);'
        )

    # 4. Replace the render-time redirect with loading gate
    old_pattern = '''  if (!isAuthenticated) {
    navigate("/dashboard");
    return null;
  }'''
    new_pattern = '''  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-pulse text-zinc-500 text-sm">Chargement...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }'''
    
    if old_pattern in content:
        content = content.replace(old_pattern, new_pattern)
        print(f"Fixed: {filepath}")
    else:
        print(f"SKIP (pattern not found): {filepath}")

    with open(filepath, 'w') as f:
        f.write(content)

print("\nDone!")
