const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "build", ".next", "__pycache__", ".venv", "vendor", "coverage"]);
const CODE_EXTS = new Set([".md", ".ts", ".tsx", ".js", ".jsx", ".py", ".go", ".rs", ".java", ".rb", ".yml", ".yaml", ".json", ".toml", ".env.example"]);
const MAX_FILE_LINES = 500;
const MAX_TOTAL_CHARS = 80_000;

interface GHTreeItem { path: string; type: string; size?: number }

export async function fetchRepoContent(repoUrl: string, token?: string): Promise<string> {
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) return "";
  const [, owner, repo] = match;
  const headers: Record<string, string> = { Accept: "application/vnd.github.v3+json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  // Fetch repo tree recursively
  const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`, { headers });
  if (!treeRes.ok) return `[Failed to fetch repo: ${treeRes.status}]`;
  const tree: { tree: GHTreeItem[] } = await treeRes.json();

  const files = tree.tree.filter((item) => {
    if (item.type !== "blob") return false;
    const parts = item.path.split("/");
    if (parts.some((p) => SKIP_DIRS.has(p))) return false;
    const ext = "." + item.path.split(".").pop();
    return CODE_EXTS.has(ext);
  });

  let totalChars = 0;
  const contents: string[] = [`# Repository: ${owner}/${repo}\n## File tree:\n${files.map((f) => f.path).join("\n")}\n`];
  totalChars += contents[0].length;

  for (const file of files) {
    if (totalChars >= MAX_TOTAL_CHARS) break;
    try {
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${file.path}`, { headers });
      if (!res.ok) continue;
      const data = await res.json();
      const decoded = Buffer.from(data.content, "base64").toString("utf-8");
      const truncated = decoded.split("\n").slice(0, MAX_FILE_LINES).join("\n");
      const block = `\n## ${file.path}\n\`\`\`\n${truncated}\n\`\`\`\n`;
      if (totalChars + block.length > MAX_TOTAL_CHARS) break;
      contents.push(block);
      totalChars += block.length;
    } catch { continue; }
  }

  return contents.join("");
}
