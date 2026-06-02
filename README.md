# wolfe-starter

Install dependencies:
```bash
bun add "git+ssh://git@github.com/wolewd/wolfe.git"
```
```bash
bun install
```

---

If there wolfe dependencies stuck:
```bash
rm -rf node_modules bun.lock
```
```bash
bun pm cache rm
```

---

Dev mode:
```bash
bun run dev
```

Build the project:
```bash
bun run build
```
